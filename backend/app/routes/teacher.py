import csv
from datetime import datetime, timezone
import io
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.quiz import Quiz, QuizStatus, generate_unique_quiz_code
from app.models.question import Question
from app.models.attempt import QuizAttempt, AttemptStatus
from app.models.answer import Answer
from app.models.user import User
from app.schemas.quiz import (
    QuizCreateRequest,
    QuizResponse,
    QuizUpdateRequest,
    TeacherDashboardData,
    TeacherDashboardStats,
)
from app.schemas.quiz_engine import QuestionCreateRequest, QuestionResponse
from app.schemas.analytics import (
    ScoreDistributionBucket,
    PassFailStats,
    ParticipationTrendItem,
    TeacherQuizPerformanceItem,
    TeacherAnalyticsOverviewResponse,
    QuestionPerformanceItem,
    QuizAnalyticsResponse,
    LeaderboardEntry,
    QuizLeaderboardResponse,
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

    # Generate unique quiz code
    unique_code = generate_unique_quiz_code()
    while db.query(Quiz).filter(Quiz.quiz_code == unique_code).first():
        unique_code = generate_unique_quiz_code()

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
        quiz_code=unique_code,
        total_questions=0,
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


# --- Teacher Question Management Endpoints ---


@router.get(
    "/quizzes/{quiz_id}/questions",
    response_model=List[QuestionResponse],
    status_code=status.HTTP_200_OK,
    summary="List all questions for a quiz",
    description="Returns all questions belonging to a quiz owned by the authenticated teacher.",
)
def get_quiz_questions(
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
    if quiz.teacher_id != current_teacher.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to view questions for quizzes created by other teachers.",
        )

    return db.query(Question).filter(Question.quiz_id == quiz_id).order_by(Question.order_index).all()


@router.post(
    "/quizzes/{quiz_id}/questions",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a question to a quiz",
    description="Adds a new multiple-choice question to a quiz owned by the authenticated teacher.",
)
def add_quiz_question(
    quiz_id: int,
    payload: QuestionCreateRequest,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz with ID {quiz_id} was not found.",
        )
    if quiz.teacher_id != current_teacher.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to add questions to quizzes created by other teachers.",
        )

    # Determine order index
    current_count = db.query(Question).filter(Question.quiz_id == quiz_id).count()
    next_order = payload.order_index if payload.order_index is not None else current_count + 1

    question = Question(
        quiz_id=quiz_id,
        question_text=payload.question_text.strip(),
        option_a=payload.option_a.strip(),
        option_b=payload.option_b.strip(),
        option_c=payload.option_c.strip(),
        option_d=payload.option_d.strip(),
        correct_option=payload.correct_option.strip().upper(),
        marks=payload.marks,
        order_index=next_order,
    )
    db.add(question)
    db.flush()

    # Update total_questions on quiz
    quiz.total_questions = db.query(Question).filter(Question.quiz_id == quiz_id).count()
    db.commit()
    db.refresh(question)

    return question


@router.delete(
    "/quizzes/{quiz_id}/questions/{question_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a question from a quiz",
    description="Deletes a question belonging to a quiz owned by the authenticated teacher.",
)
def delete_quiz_question(
    quiz_id: int,
    question_id: int,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz with ID {quiz_id} was not found.",
        )
    if quiz.teacher_id != current_teacher.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to modify quizzes created by other teachers.",
        )

    question = db.query(Question).filter(Question.id == question_id, Question.quiz_id == quiz_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with ID {question_id} was not found in this quiz.",
        )

    db.delete(question)
    db.flush()
    quiz.total_questions = db.query(Question).filter(Question.quiz_id == quiz_id).count()
    db.commit()

    return {"message": "Question deleted successfully", "id": question_id}


# --- Phase 7: Teacher Analytics, Reports, Leaderboards & CSV Export ---


def _build_leaderboard_entries(attempts: List[QuizAttempt], include_email: bool = False) -> List[LeaderboardEntry]:
    """Sort attempts and calculate ranks with consistent handling of equal scores."""
    # Order by obtained_marks DESC, submitted_at ASC (or created_at)
    sorted_attempts = sorted(
        attempts,
        key=lambda a: (-a.obtained_marks, a.submitted_at or a.created_at)
    )

    entries = []
    current_rank = 0
    previous_marks = None

    for idx, att in enumerate(sorted_attempts):
        if previous_marks is None or att.obtained_marks != previous_marks:
            current_rank = idx + 1
            previous_marks = att.obtained_marks

        pct = round((att.obtained_marks / att.total_marks * 100), 2) if att.total_marks > 0 else 0.0
        quiz_passing = att.quiz.passing_marks if att.quiz else 0
        passed = att.obtained_marks >= quiz_passing

        entries.append(
            LeaderboardEntry(
                rank=current_rank,
                student_id=att.student_id,
                student_name=att.student.full_name if att.student else "Student",
                student_email=att.student.email if (include_email and att.student) else None,
                obtained_marks=att.obtained_marks,
                total_marks=att.total_marks,
                percentage=pct,
                passed=passed,
                submitted_at=att.submitted_at or att.created_at,
                status=att.status,
            )
        )

    return entries


def _build_score_distribution(attempts: List[QuizAttempt]) -> List[ScoreDistributionBucket]:
    """Group attempt percentages into 5 standard distribution buckets."""
    buckets = [
        {"range": "0-20%", "min": 0.0, "max": 20.0, "count": 0},
        {"range": "21-40%", "min": 20.001, "max": 40.0, "count": 0},
        {"range": "41-60%", "min": 40.001, "max": 60.0, "count": 0},
        {"range": "61-80%", "min": 60.001, "max": 80.0, "count": 0},
        {"range": "81-100%", "min": 80.001, "max": 100.0, "count": 0},
    ]

    total = len(attempts)
    for a in attempts:
        pct = (a.obtained_marks / a.total_marks * 100) if a.total_marks > 0 else 0.0
        for b in buckets:
            if b["min"] <= pct <= b["max"] or (b["range"] == "0-20%" and pct <= 20.0):
                b["count"] += 1
                break

    return [
        ScoreDistributionBucket(
            range=b["range"],
            count=b["count"],
            percentage=round((b["count"] / total * 100), 2) if total > 0 else 0.0,
        )
        for b in buckets
    ]


@router.get(
    "/analytics/overview",
    response_model=TeacherAnalyticsOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Teacher Global Analytics Overview",
    description="Returns aggregate assessment analytics, pass/fail ratios, score distributions, and quiz performance metrics for the authenticated teacher.",
)
def get_teacher_analytics_overview(
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    teacher_quizzes = db.query(Quiz).filter(Quiz.teacher_id == current_teacher.id).order_by(Quiz.created_at.desc()).all()
    quiz_ids = [q.id for q in teacher_quizzes]

    if not quiz_ids:
        return TeacherAnalyticsOverviewResponse(
            total_quizzes_conducted=0,
            total_students_participated=0,
            average_score=0.0,
            highest_score=0.0,
            pass_percentage=0.0,
            total_quiz_attempts=0,
            quiz_performance=[],
            score_distribution=_build_score_distribution([]),
            pass_fail_stats=PassFailStats(passed=0, failed=0, pass_percentage=0.0, fail_percentage=0.0),
            participation_trends=[],
        )

    # Submitted attempts across all quizzes created by this teacher
    attempts = (
        db.query(QuizAttempt)
        .join(Quiz)
        .filter(
            Quiz.teacher_id == current_teacher.id,
            QuizAttempt.status.in_([AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]),
        )
        .all()
    )

    total_attempts = len(attempts)
    distinct_students = {a.student_id for a in attempts}
    conducted_quizzes = [q for q in teacher_quizzes if q.status == QuizStatus.COMPLETED.value or any(a.quiz_id == q.id for a in attempts)]

    passed_attempts = [a for a in attempts if a.obtained_marks >= (a.quiz.passing_marks if a.quiz else 0)]
    passed_count = len(passed_attempts)
    failed_count = total_attempts - passed_count
    pass_pct = round((passed_count / total_attempts * 100), 2) if total_attempts > 0 else 0.0
    fail_pct = round(100.0 - pass_pct, 2) if total_attempts > 0 else 0.0

    avg_score = round(sum(a.obtained_marks for a in attempts) / total_attempts, 2) if total_attempts > 0 else 0.0
    max_score = round(max((a.obtained_marks for a in attempts), default=0.0), 2)

    # Quiz-wise performance
    quiz_performance = []
    participation_trends = []

    for q in teacher_quizzes:
        q_attempts = [a for a in attempts if a.quiz_id == q.id]
        q_count = len(q_attempts)
        q_avg = round(sum(a.obtained_marks for a in q_attempts) / q_count, 2) if q_count > 0 else 0.0
        q_high = round(max((a.obtained_marks for a in q_attempts), default=0.0), 2)
        q_pass_count = sum(1 for a in q_attempts if a.obtained_marks >= q.passing_marks)
        q_pass_rate = round((q_pass_count / q_count * 100), 2) if q_count > 0 else 0.0

        quiz_performance.append(
            TeacherQuizPerformanceItem(
                quiz_id=q.id,
                quiz_title=q.title,
                subject=q.subject,
                total_attempts=q_count,
                average_score=q_avg,
                maximum_marks=q.maximum_marks,
                passing_marks=q.passing_marks,
                highest_score=q_high,
                pass_rate=q_pass_rate,
            )
        )

        participation_trends.append(
            ParticipationTrendItem(
                quiz_id=q.id,
                quiz_title=q.title,
                date=q.start_time.strftime("%b %d") if q.start_time else "N/A",
                participants_count=q_count,
            )
        )

    # Reverse participation trends so oldest to newest display in time order
    participation_trends.reverse()

    return TeacherAnalyticsOverviewResponse(
        total_quizzes_conducted=len(conducted_quizzes),
        total_students_participated=len(distinct_students),
        average_score=avg_score,
        highest_score=max_score,
        pass_percentage=pass_pct,
        total_quiz_attempts=total_attempts,
        quiz_performance=quiz_performance,
        score_distribution=_build_score_distribution(attempts),
        pass_fail_stats=PassFailStats(
            passed=passed_count,
            failed=failed_count,
            pass_percentage=pass_pct,
            fail_percentage=fail_pct,
        ),
        participation_trends=participation_trends,
    )


@router.get(
    "/quizzes/{quiz_id}/analytics",
    response_model=QuizAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Detailed Analytics for a Specific Quiz",
    description="Returns participation counts, score distributions, pass/fail rates, and item-by-item question difficulty analysis.",
)
def get_quiz_analytics(
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
    if quiz.teacher_id != current_teacher.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to view analytics for quizzes created by other teachers.",
        )

    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.status.in_([AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]),
        )
        .all()
    )

    total_participants = len(attempts)
    if total_participants > 0:
        scores = [a.obtained_marks for a in attempts]
        avg_marks = round(sum(scores) / total_participants, 2)
        highest_marks = round(max(scores), 2)
        lowest_marks = round(min(scores), 2)
        passed_count = sum(1 for a in attempts if a.obtained_marks >= quiz.passing_marks)
        failed_count = total_participants - passed_count
        pass_pct = round((passed_count / total_participants * 100), 2)
        fail_pct = round(100.0 - pass_pct, 2)
    else:
        avg_marks = 0.0
        highest_marks = 0.0
        lowest_marks = 0.0
        passed_count = 0
        failed_count = 0
        pass_pct = 0.0
        fail_pct = 0.0

    # Question-wise performance breakdown
    questions = db.query(Question).filter(Question.quiz_id == quiz_id).order_by(Question.order_index).all()
    question_performance = []

    for q in questions:
        answers = (
            db.query(Answer)
            .join(QuizAttempt)
            .filter(
                Answer.question_id == q.id,
                QuizAttempt.quiz_id == quiz_id,
                QuizAttempt.status.in_([AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]),
            )
            .all()
        )

        opt_dist = {"A": 0, "B": 0, "C": 0, "D": 0}
        correct_count = 0
        incorrect_count = 0

        for ans in answers:
            if ans.selected_option and ans.selected_option.upper() in opt_dist:
                opt_dist[ans.selected_option.upper()] += 1
            if ans.is_correct is True:
                correct_count += 1
            elif ans.selected_option is not None:
                incorrect_count += 1

        unanswered = total_participants - (correct_count + incorrect_count)
        correct_pct = round((correct_count / total_participants * 100), 2) if total_participants > 0 else 0.0

        if correct_pct >= 70.0:
            diff_label = "Easy"
        elif correct_pct >= 40.0:
            diff_label = "Medium"
        else:
            diff_label = "Hard"

        question_performance.append(
            QuestionPerformanceItem(
                question_id=q.id,
                order_index=q.order_index,
                question_text=q.question_text,
                marks=q.marks,
                total_responses=len(answers),
                correct_count=correct_count,
                incorrect_count=incorrect_count,
                unanswered_count=max(0, unanswered),
                correct_percentage=correct_pct,
                difficulty_label=diff_label,
                option_distribution=opt_dist,
            )
        )

    return QuizAnalyticsResponse(
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        subject=quiz.subject,
        maximum_marks=quiz.maximum_marks,
        passing_marks=quiz.passing_marks,
        total_participants=total_participants,
        average_marks=avg_marks,
        highest_marks=highest_marks,
        lowest_marks=lowest_marks,
        pass_percentage=pass_pct,
        fail_percentage=fail_pct,
        passed_count=passed_count,
        failed_count=failed_count,
        score_distribution=_build_score_distribution(attempts),
        question_performance=question_performance,
    )


@router.get(
    "/quizzes/{quiz_id}/leaderboard",
    response_model=QuizLeaderboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Teacher Quiz Leaderboard",
    description="Returns ranked participant scores for a specific quiz, handling ties fairly and including student contact info for the teacher.",
)
def get_teacher_quiz_leaderboard(
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
    if quiz.teacher_id != current_teacher.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to view leaderboards for quizzes created by other teachers.",
        )

    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.status.in_([AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]),
        )
        .all()
    )

    leaderboard = _build_leaderboard_entries(attempts, include_email=True)
    total = len(leaderboard)
    avg_pct = round(sum(e.percentage for e in leaderboard) / total, 2) if total > 0 else 0.0
    highest_pct = max((e.percentage for e in leaderboard), default=0.0)

    return QuizLeaderboardResponse(
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        subject=quiz.subject,
        total_participants=total,
        average_percentage=avg_pct,
        highest_percentage=highest_pct,
        leaderboard=leaderboard,
    )


@router.get(
    "/quizzes/{quiz_id}/report/csv",
    status_code=status.HTTP_200_OK,
    summary="Download Quiz Report as CSV",
    description="Exports detailed student performance records for a quiz as a downloadable CSV spreadsheet.",
)
def download_quiz_report_csv(
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
    if quiz.teacher_id != current_teacher.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to download reports for quizzes created by other teachers.",
        )

    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.status.in_([AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]),
        )
        .all()
    )

    leaderboard = _build_leaderboard_entries(attempts, include_email=True)

    output = io.StringIO()
    writer = csv.writer(output)

    # Write CSV Header
    writer.writerow([
        "Rank",
        "Student Name",
        "Student Email",
        "Obtained Marks",
        "Total Marks",
        "Percentage",
        "Pass/Fail Status",
        "Submission Time",
        "Status",
    ])

    for entry in leaderboard:
        writer.writerow([
            entry.rank,
            entry.student_name,
            entry.student_email or "",
            f"{entry.obtained_marks:.2f}",
            f"{entry.total_marks:.2f}",
            f"{entry.percentage:.2f}%",
            "PASS" if entry.passed else "FAIL",
            entry.submitted_at.strftime("%Y-%m-%d %H:%M:%S") if entry.submitted_at else "N/A",
            entry.status,
        ])

    csv_data = output.getvalue()
    filename = f"quiz_{quiz.id}_{quiz.title.replace(' ', '_')}_report.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


