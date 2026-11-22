from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.participation import ParticipationStatus, QuizParticipation
from app.models.quiz import Quiz, QuizStatus
from app.models.user import User
from app.schemas.student import (
    QuizInstructionsResponse,
    StudentDashboardResponse,
    StudentDashboardStats,
    StudentHistoryItemResponse,
    StudentJoinQuizRequest,
    StudentJoinQuizResponse,
    StudentQuizItemResponse,
)
from app.services.auth import get_current_student

router = APIRouter(prefix="/student", tags=["Student Workspace"])


def _normalize_dt(dt: datetime) -> datetime:
    """Ensure datetime has UTC timezone."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def sync_global_quiz_statuses(db: Session):
    """Sync scheduled to published, and published to completed based on wall-clock time."""
    now = datetime.now(timezone.utc)
    quizzes = db.query(Quiz).filter(
        Quiz.status.in_([QuizStatus.SCHEDULED.value, QuizStatus.PUBLISHED.value])
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
    response_model=StudentDashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Student Dashboard Overview",
    description="Returns student welcome data, real-time counters, and recent quiz discovery activity.",
)
def get_student_dashboard(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    sync_global_quiz_statuses(db)
    now = datetime.now(timezone.utc)

    # 1. Quizzes attended (completed or registered)
    total_attended = (
        db.query(QuizParticipation)
        .filter(
            QuizParticipation.student_id == current_student.id,
            QuizParticipation.status.in_([
                ParticipationStatus.COMPLETED.value,
                ParticipationStatus.IN_PROGRESS.value,
            ]),
        )
        .count()
    )

    # 2. Completed quizzes
    completed_quizzes = (
        db.query(QuizParticipation)
        .filter(
            QuizParticipation.student_id == current_student.id,
            QuizParticipation.status == ParticipationStatus.COMPLETED.value,
        )
        .count()
    )

    # 3. Upcoming quizzes: non-draft, start_time in future
    upcoming_quizzes_count = (
        db.query(Quiz)
        .filter(
            Quiz.status.in_([QuizStatus.SCHEDULED.value, QuizStatus.PUBLISHED.value]),
            Quiz.start_time > now,
        )
        .count()
    )

    # 4. Available quizzes: currently within start_time and end_time, non-draft
    available_quizzes_count = (
        db.query(Quiz)
        .filter(
            Quiz.status.in_([QuizStatus.SCHEDULED.value, QuizStatus.PUBLISHED.value]),
            Quiz.start_time <= now,
            Quiz.end_time > now,
        )
        .count()
    )

    # Recent available/upcoming activity for quick discovery
    recent_quizzes = (
        db.query(Quiz)
        .filter(
            Quiz.status.in_([QuizStatus.SCHEDULED.value, QuizStatus.PUBLISHED.value]),
            Quiz.end_time > now,
        )
        .order_by(Quiz.start_time.asc())
        .limit(5)
        .all()
    )

    # Check which ones the student has already joined
    joined_quiz_ids = set(
        qid[0]
        for qid in db.query(QuizParticipation.quiz_id)
        .filter(QuizParticipation.student_id == current_student.id)
        .all()
    )

    recent_activity = [
        StudentQuizItemResponse(
            id=q.id,
            title=q.title,
            subject=q.subject,
            teacher_name=q.teacher.full_name if q.teacher else "Instructor",
            start_time=q.start_time,
            end_time=q.end_time,
            duration_minutes=q.duration_minutes,
            maximum_marks=q.maximum_marks,
            quiz_status=q.status,
            quiz_code=q.quiz_code,
            has_joined=q.id in joined_quiz_ids,
        )
        for q in recent_quizzes
    ]

    return StudentDashboardResponse(
        message=f"Welcome to your student workspace, {current_student.full_name}!",
        role="student",
        user={
            "id": current_student.id,
            "full_name": current_student.full_name,
            "email": current_student.email,
            "role": current_student.role,
            "is_active": current_student.is_active,
            "created_at": current_student.created_at,
        },
        stats=StudentDashboardStats(
            total_quizzes_attended=total_attended,
            upcoming_quizzes=upcoming_quizzes_count,
            available_quizzes=available_quizzes_count,
            completed_quizzes=completed_quizzes,
        ),
        recent_activity=recent_activity,
    )


@router.get(
    "/quizzes/upcoming",
    response_model=List[StudentQuizItemResponse],
    status_code=status.HTTP_200_OK,
    summary="List Upcoming Scheduled Quizzes",
    description="Retrieve all non-draft quizzes scheduled for a future start date. No answers or private data exposed.",
)
def get_upcoming_quizzes(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    sync_global_quiz_statuses(db)
    now = datetime.now(timezone.utc)

    # Quizzes scheduled for the future (never draft)
    quizzes = (
        db.query(Quiz)
        .filter(
            Quiz.status.in_([QuizStatus.SCHEDULED.value, QuizStatus.PUBLISHED.value]),
            Quiz.start_time > now,
        )
        .order_by(Quiz.start_time.asc())
        .all()
    )

    joined_quiz_ids = set(
        qid[0]
        for qid in db.query(QuizParticipation.quiz_id)
        .filter(QuizParticipation.student_id == current_student.id)
        .all()
    )

    return [
        StudentQuizItemResponse(
            id=q.id,
            title=q.title,
            subject=q.subject,
            teacher_name=q.teacher.full_name if q.teacher else "Instructor",
            start_time=q.start_time,
            end_time=q.end_time,
            duration_minutes=q.duration_minutes,
            maximum_marks=q.maximum_marks,
            quiz_status=q.status,
            quiz_code=q.quiz_code,
            has_joined=q.id in joined_quiz_ids,
        )
        for q in quizzes
    ]


@router.get(
    "/quizzes/available",
    response_model=List[StudentQuizItemResponse],
    status_code=status.HTTP_200_OK,
    summary="List Live / Available Quizzes",
    description="Retrieve non-draft quizzes currently in their active start and end time window.",
)
def get_available_quizzes(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    sync_global_quiz_statuses(db)
    now = datetime.now(timezone.utc)

    # Currently active window (never draft)
    quizzes = (
        db.query(Quiz)
        .filter(
            Quiz.status.in_([QuizStatus.SCHEDULED.value, QuizStatus.PUBLISHED.value]),
            Quiz.start_time <= now,
            Quiz.end_time > now,
        )
        .order_by(Quiz.end_time.asc())
        .all()
    )

    joined_quiz_ids = set(
        qid[0]
        for qid in db.query(QuizParticipation.quiz_id)
        .filter(QuizParticipation.student_id == current_student.id)
        .all()
    )

    return [
        StudentQuizItemResponse(
            id=q.id,
            title=q.title,
            subject=q.subject,
            teacher_name=q.teacher.full_name if q.teacher else "Instructor",
            start_time=q.start_time,
            end_time=q.end_time,
            duration_minutes=q.duration_minutes,
            maximum_marks=q.maximum_marks,
            quiz_status=q.status,
            quiz_code=q.quiz_code,
            has_joined=q.id in joined_quiz_ids,
        )
        for q in quizzes
    ]


@router.get(
    "/quizzes/history",
    response_model=List[StudentHistoryItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Student Quiz Attendance History",
    description="Retrieve historical participation records and past scores for the authenticated student.",
)
def get_quiz_history(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    participations = (
        db.query(QuizParticipation)
        .filter(QuizParticipation.student_id == current_student.id)
        .order_by(QuizParticipation.joined_at.desc())
        .all()
    )

    results = []
    for p in participations:
        quiz = p.quiz
        results.append(
            StudentHistoryItemResponse(
                participation_id=p.id,
                quiz_id=p.quiz_id,
                title=quiz.title if quiz else "Quiz",
                subject=quiz.subject if quiz else "General",
                teacher_name=quiz.teacher.full_name if (quiz and quiz.teacher) else "Instructor",
                joined_at=p.joined_at,
                completed_at=p.completed_at,
                score=p.score,
                total_marks=p.total_marks or (quiz.maximum_marks if quiz else None),
                participation_status=p.status,
            )
        )

    return results


@router.post(
    "/quizzes/join",
    response_model=StudentJoinQuizResponse,
    status_code=status.HTTP_200_OK,
    summary="Join Quiz Using Unique Quiz Code",
    description="Validate quiz code, check date/time window and status, and register student participation without revealing questions.",
)
def join_quiz(
    payload: StudentJoinQuizRequest,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    sync_global_quiz_statuses(db)
    now = datetime.now(timezone.utc)

    code = payload.quiz_code.strip().upper()
    quiz = db.query(Quiz).filter(Quiz.quiz_code == code).first()

    # 1. Validate quiz code
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid quiz code '{code}'. Please verify the access code provided by your instructor.",
        )

    # 2. Check quiz status: Students must not access draft quizzes
    if quiz.status == QuizStatus.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz is currently in draft mode and is not open for participation.",
        )

    # 3. Check start and end time: Expired quizzes cannot be joined
    end_dt = _normalize_dt(quiz.end_time)
    if now >= end_dt or quiz.status == QuizStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz has already concluded/expired and can no longer be attended.",
        )

    # 4. Check for existing participation (prevent duplicate participation records)
    existing_p = (
        db.query(QuizParticipation)
        .filter(
            QuizParticipation.student_id == current_student.id,
            QuizParticipation.quiz_id == quiz.id,
        )
        .first()
    )

    if existing_p:
        if existing_p.status == ParticipationStatus.COMPLETED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already completed this quiz. Multiple submissions are not allowed.",
            )
        # Already registered, return participation acknowledgment
        return StudentJoinQuizResponse(
            message="You are already registered for this quiz session. Proceed to instructions.",
            quiz_id=quiz.id,
            quiz_title=quiz.title,
            subject=quiz.subject,
            teacher_name=quiz.teacher.full_name if quiz.teacher else "Instructor",
            start_time=quiz.start_time,
            end_time=quiz.end_time,
            duration_minutes=quiz.duration_minutes,
            maximum_marks=quiz.maximum_marks,
            status=quiz.status,
            joined_at=existing_p.joined_at,
            instructions_url=f"/student/quizzes/{quiz.id}/instructions",
        )

    # Create new participation record
    new_participation = QuizParticipation(
        student_id=current_student.id,
        quiz_id=quiz.id,
        status=ParticipationStatus.REGISTERED.value,
        joined_at=now,
    )
    db.add(new_participation)
    db.commit()
    db.refresh(new_participation)

    return StudentJoinQuizResponse(
        message="Successfully registered for quiz session. Proceed to read the test instructions.",
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        subject=quiz.subject,
        teacher_name=quiz.teacher.full_name if quiz.teacher else "Instructor",
        start_time=quiz.start_time,
        end_time=quiz.end_time,
        duration_minutes=quiz.duration_minutes,
        maximum_marks=quiz.maximum_marks,
        status=quiz.status,
        joined_at=new_participation.joined_at,
        instructions_url=f"/student/quizzes/{quiz.id}/instructions",
    )


@router.get(
    "/quizzes/{quiz_id}/instructions",
    response_model=QuizInstructionsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Quiz Instructions Before Starting",
    description="Returns pre-test instructions, parameters, and timing without exposing questions or answers.",
)
def get_quiz_instructions(
    quiz_id: int,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz with ID {quiz_id} was not found.",
        )

    # Students must not access draft quizzes
    if quiz.status == QuizStatus.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Draft quizzes cannot be accessed by students.",
        )

    # Default instructions fallback if none provided
    instructions_text = (
        quiz.instructions.strip()
        if quiz.instructions and quiz.instructions.strip()
        else "1. Ensure you have a stable network connection before starting.\n2. The timer begins immediately when you start the quiz.\n3. Your answers are submitted automatically when the duration expires."
    )

    return QuizInstructionsResponse(
        quiz_id=quiz.id,
        title=quiz.title,
        subject=quiz.subject,
        teacher_name=quiz.teacher.full_name if quiz.teacher else "Instructor",
        duration_minutes=quiz.duration_minutes,
        maximum_marks=quiz.maximum_marks,
        passing_marks=quiz.passing_marks,
        number_of_questions=quiz.total_questions or 0,
        start_time=quiz.start_time,
        end_time=quiz.end_time,
        instructions=instructions_text,
        quiz_code=quiz.quiz_code,
        status=quiz.status,
    )
