from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.quiz import Quiz, QuizStatus
from app.models.user import User
from app.schemas.quiz import (
    QuizCreateRequest,
    QuizResponse,
    QuizUpdateRequest,
    TeacherDashboardData,
    TeacherDashboardStats,
)
from app.services.auth import get_current_teacher

router = APIRouter(prefix="/teacher", tags=["Teacher Dashboard & Quizzes"])


def _normalize_dt(dt: datetime) -> datetime:
    """Ensure datetime has UTC timezone."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def sync_teacher_quiz_statuses(db: Session, teacher_id: int):
    """
    Sync dynamic status for quizzes based on scheduled start and end times.
    - If scheduled and start_time <= now < end_time -> published
    - If (scheduled or published) and now >= end_time -> completed
    - Drafts are never automatically published or changed.
    """
    now = datetime.now(timezone.utc)
    quizzes = db.query(Quiz).filter(
        Quiz.teacher_id == teacher_id,
        Quiz.status.in_([QuizStatus.SCHEDULED.value, QuizStatus.PUBLISHED.value]),
    ).all()

    updated = False
    for q in quizzes:
        start = _normalize_dt(q.start_time)
        end = _normalize_dt(q.end_time)

        if now >= end and q.status != QuizStatus.COMPLETED.value:
            q.status = QuizStatus.COMPLETED.value
            updated = True
        elif start <= now < end and q.status == QuizStatus.SCHEDULED.value:
            q.status = QuizStatus.PUBLISHED.value
            updated = True

    if updated:
        db.commit()


@router.get(
    "/dashboard",
    response_model=TeacherDashboardData,
    status_code=status.HTTP_200_OK,
    summary="Teacher Dashboard Overview & Live Metrics",
    description="Returns summary statistics and recent quiz activity for the authenticated teacher.",
)
def get_teacher_dashboard(
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    # Synchronize time-sensitive statuses
    sync_teacher_quiz_statuses(db, current_teacher.id)

    total_quizzes = db.query(Quiz).filter(Quiz.teacher_id == current_teacher.id).count()
    published_quizzes = (
        db.query(Quiz)
        .filter(
            Quiz.teacher_id == current_teacher.id,
            Quiz.status == QuizStatus.PUBLISHED.value,
        )
        .count()
    )
    scheduled_quizzes = (
        db.query(Quiz)
        .filter(
            Quiz.teacher_id == current_teacher.id,
            Quiz.status == QuizStatus.SCHEDULED.value,
        )
        .count()
    )
    completed_quizzes = (
        db.query(Quiz)
        .filter(
            Quiz.teacher_id == current_teacher.id,
            Quiz.status == QuizStatus.COMPLETED.value,
        )
        .count()
    )
    draft_quizzes = (
        db.query(Quiz)
        .filter(
            Quiz.teacher_id == current_teacher.id,
            Quiz.status == QuizStatus.DRAFT.value,
        )
        .count()
    )

    recent_quizzes = (
        db.query(Quiz)
        .filter(Quiz.teacher_id == current_teacher.id)
        .order_by(Quiz.created_at.desc())
        .limit(5)
        .all()
    )

    return TeacherDashboardData(
        message=f"Welcome back, Professor {current_teacher.full_name}!",
        role="teacher",
        user={
            "id": current_teacher.id,
            "full_name": current_teacher.full_name,
            "email": current_teacher.email,
            "role": current_teacher.role,
            "is_active": current_teacher.is_active,
            "created_at": current_teacher.created_at,
        },
        stats=TeacherDashboardStats(
            total_quizzes=total_quizzes,
            published_quizzes=published_quizzes,
            scheduled_quizzes=scheduled_quizzes,
            completed_quizzes=completed_quizzes,
            draft_quizzes=draft_quizzes,
        ),
        recent_quizzes=recent_quizzes,
    )


@router.post(
    "/quizzes",
    response_model=QuizResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Quiz",
    description="Allows authenticated teachers to draft or schedule a quiz.",
)
def create_quiz(
    payload: QuizCreateRequest,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    start = _normalize_dt(payload.start_time)
    end = _normalize_dt(payload.end_time)
    now = datetime.now(timezone.utc)

    # Validate end time is after start time
    if end <= start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date and time must be strictly after the start date and time.",
        )

    # Validate duration and marks
    if payload.duration_minutes <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duration must be greater than zero minutes.",
        )

    if payload.passing_marks > payload.maximum_marks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passing marks cannot exceed maximum marks.",
        )

    # Rule: Do not automatically publish a quiz before its scheduled start time
    status_val = payload.status.value if payload.status else QuizStatus.DRAFT.value
    if status_val == QuizStatus.PUBLISHED.value and now < start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot publish a quiz before its scheduled start time. Save as 'scheduled' or 'draft' instead.",
        )

    # Auto-adjust status if scheduled and currently within window
    if status_val == QuizStatus.SCHEDULED.value:
        if start <= now < end:
            status_val = QuizStatus.PUBLISHED.value
        elif now >= end:
            status_val = QuizStatus.COMPLETED.value

    new_quiz = Quiz(
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        subject=payload.subject.strip(),
        instructions=payload.instructions.strip() if payload.instructions else None,
        start_time=start,
        end_time=end,
        duration_minutes=payload.duration_minutes,
        maximum_marks=payload.maximum_marks,
        passing_marks=payload.passing_marks,
        status=status_val,
        teacher_id=current_teacher.id,
    )

    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    return new_quiz


@router.get(
    "/quizzes",
    response_model=List[QuizResponse],
    status_code=status.HTTP_200_OK,
    summary="List all quizzes created by current teacher",
    description="Retrieve all quizzes belonging to the authenticated teacher with search and status filters.",
)
def list_quizzes(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (draft, scheduled, published, completed)"),
    search: Optional[str] = Query(None, description="Search by title or subject"),
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    sync_teacher_quiz_statuses(db, current_teacher.id)

    query = db.query(Quiz).filter(Quiz.teacher_id == current_teacher.id)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Quiz.status == status_filter.lower())

    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Quiz.title.ilike(search_term),
                Quiz.subject.ilike(search_term),
            )
        )

    quizzes = query.order_by(Quiz.created_at.desc()).all()
    return quizzes


@router.get(
    "/quizzes/{quiz_id}",
    response_model=QuizResponse,
    status_code=status.HTTP_200_OK,
    summary="Get single quiz details",
    description="Retrieve full details for a specific quiz owned by the current teacher.",
)
def get_quiz(
    quiz_id: int,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz with ID {quiz_id} was not found.",
        )

    # Enforce strict ownership
    if quiz.teacher_id != current_teacher.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to access quizzes created by other teachers.",
        )

    return quiz


@router.put(
    "/quizzes/{quiz_id}",
    response_model=QuizResponse,
    status_code=status.HTTP_200_OK,
    summary="Update an existing quiz",
    description="Allows a teacher to edit a quiz they created.",
)
def update_quiz(
    quiz_id: int,
    payload: QuizUpdateRequest,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz with ID {quiz_id} was not found.",
        )

    # Enforce strict ownership
    if quiz.teacher_id != current_teacher.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to edit quizzes created by other teachers.",
        )

    # Determine start and end times
    start = _normalize_dt(payload.start_time) if payload.start_time is not None else _normalize_dt(quiz.start_time)
    end = _normalize_dt(payload.end_time) if payload.end_time is not None else _normalize_dt(quiz.end_time)
    now = datetime.now(timezone.utc)

    if end <= start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date and time must be strictly after the start date and time.",
        )

    # Determine marks
    max_marks = payload.maximum_marks if payload.maximum_marks is not None else quiz.maximum_marks
    pass_marks = payload.passing_marks if payload.passing_marks is not None else quiz.passing_marks

    if pass_marks > max_marks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passing marks cannot exceed maximum marks.",
        )

    # Update fields
    if payload.title is not None:
        quiz.title = payload.title.strip()
    if payload.description is not None:
        quiz.description = payload.description.strip() if payload.description else None
    if payload.subject is not None:
        quiz.subject = payload.subject.strip()
    if payload.instructions is not None:
        quiz.instructions = payload.instructions.strip() if payload.instructions else None
    if payload.duration_minutes is not None:
        if payload.duration_minutes <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duration must be greater than zero minutes.",
            )
        quiz.duration_minutes = payload.duration_minutes

    quiz.start_time = start
    quiz.end_time = end
    quiz.maximum_marks = max_marks
    quiz.passing_marks = pass_marks

    if payload.status is not None:
        status_val = payload.status.value
        # Rule check: cannot publish before start time
        if status_val == QuizStatus.PUBLISHED.value and now < start:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot publish a quiz before its scheduled start time. Save as 'scheduled' or 'draft' instead.",
            )
        quiz.status = status_val

    db.commit()
    db.refresh(quiz)

    return quiz


@router.delete(
    "/quizzes/{quiz_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a quiz",
    description="Allows a teacher to delete a quiz they created.",
)
def delete_quiz(
    quiz_id: int,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz with ID {quiz_id} was not found.",
        )

    # Enforce strict ownership
    if quiz.teacher_id != current_teacher.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to delete quizzes created by other teachers.",
        )

    db.delete(quiz)
    db.commit()

    return {
        "message": "Quiz deleted successfully",
        "id": quiz_id,
        "title": quiz.title,
    }
