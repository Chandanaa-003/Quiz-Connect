from datetime import datetime, timezone
import json
import random
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.participation import ParticipationStatus, QuizParticipation
from app.models.quiz import Quiz, QuizStatus
from app.models.user import User
from app.models.question import Question
from app.models.attempt import QuizAttempt, AttemptStatus
from app.models.answer import Answer
from app.schemas.student import (
    QuizInstructionsResponse,
    StudentDashboardResponse,
    StudentDashboardStats,
    StudentHistoryItemResponse,
    StudentJoinQuizRequest,
    StudentJoinQuizResponse,
    StudentQuizItemResponse,
)
from app.schemas.quiz_engine import (
    QuizStartResponse,
    AttemptDetailResponse,
    StudentQuestionResponse,
    SaveAnswerRequest,
    SaveAnswerResponse,
    SubmitAttemptRequest,
    QuizResultResponse,
)
from app.schemas.analytics import (
    StudentPerformanceOverviewResponse,
    StudentPerformanceChartDataResponse,
    StudentPerformanceChartItem,
    StudentQuizScoreItem,
    AnswerBreakdown,
    QuizLeaderboardResponse,
    LeaderboardEntry,
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


# --- Phase 6: Quiz Engine Helpers & Endpoints ---


def _evaluate_and_submit_attempt(
    db: Session,
    attempt: QuizAttempt,
    is_auto: bool = False,
) -> None:
    """Evaluate submitted/expired quiz attempt and update score & participation."""
    if attempt.status in [AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]:
        return

    now = datetime.now(timezone.utc)
    quiz = attempt.quiz or db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    questions = db.query(Question).filter(Question.quiz_id == attempt.quiz_id).all()
    saved_answers = db.query(Answer).filter(Answer.attempt_id == attempt.id).all()
    ans_map = {a.question_id: a for a in saved_answers}

    total_marks = 0.0
    obtained_marks = 0.0

    for q in questions:
        total_marks += q.marks
        ans = ans_map.get(q.id)
        if ans and ans.selected_option:
            is_correct = ans.selected_option.strip().upper() == q.correct_option.strip().upper()
            ans.is_correct = is_correct
            ans.marks_obtained = q.marks if is_correct else 0.0
            if is_correct:
                obtained_marks += q.marks
        else:
            if not ans:
                ans = Answer(
                    attempt_id=attempt.id,
                    question_id=q.id,
                    selected_option=None,
                    is_correct=False,
                    marks_obtained=0.0,
                )
                db.add(ans)
            else:
                ans.is_correct = False
                ans.marks_obtained = 0.0

    attempt.total_marks = round(total_marks, 2)
    attempt.obtained_marks = round(obtained_marks, 2)
    attempt.submitted_at = now
    attempt.status = AttemptStatus.AUTO_SUBMITTED.value if is_auto else AttemptStatus.SUBMITTED.value

    # Synchronize QuizParticipation record
    part = (
        db.query(QuizParticipation)
        .filter(
            QuizParticipation.student_id == attempt.student_id,
            QuizParticipation.quiz_id == attempt.quiz_id,
        )
        .first()
    )
    if part:
        part.status = ParticipationStatus.COMPLETED.value
        part.score = attempt.obtained_marks
        part.total_marks = int(attempt.total_marks)
        part.completed_at = now
    else:
        part = QuizParticipation(
            student_id=attempt.student_id,
            quiz_id=attempt.quiz_id,
            status=ParticipationStatus.COMPLETED.value,
            score=attempt.obtained_marks,
            total_marks=int(attempt.total_marks),
            completed_at=now,
        )
        db.add(part)

    db.commit()
    db.refresh(attempt)


def _get_remaining_seconds(attempt: QuizAttempt, quiz: Quiz) -> int:
    """Calculate remaining seconds taking into account quiz duration and schedule window."""
    if attempt.status in [AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]:
        return 0

    now = datetime.now(timezone.utc)
    started = _normalize_dt(attempt.started_at)
    elapsed = int((now - started).total_seconds())
    dur_rem = max(0, quiz.duration_minutes * 60 - elapsed)

    end_time = _normalize_dt(quiz.end_time)
    win_rem = max(0, int((end_time - now).total_seconds()))

    return min(dur_rem, win_rem)


@router.post(
    "/quizzes/{quiz_id}/start",
    response_model=QuizStartResponse,
    status_code=status.HTTP_200_OK,
    summary="Start or Resume a Quiz Attempt",
    description="Validates eligibility, schedule, and questions, creates/resumes an attempt, and returns questions in stable order without answers.",
)
def start_quiz(
    quiz_id: int,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    sync_global_quiz_statuses(db)
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz with ID {quiz_id} was not found.",
        )

    # 1. Verify quiz is published
    if quiz.status == QuizStatus.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz is currently in draft mode and cannot be started.",
        )
    if quiz.status == QuizStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz has already concluded.",
        )

    # 2. Verify current time is within allowed quiz window
    now = datetime.now(timezone.utc)
    start_time = _normalize_dt(quiz.start_time)
    end_time = _normalize_dt(quiz.end_time)

    if now < start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This quiz is not open yet. It is scheduled to start at {start_time.isoformat()}.",
        )
    if now >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz has expired and can no longer be started.",
        )

    # 3. Verify quiz has questions
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).order_by(Question.order_index).all()
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz has no questions configured yet. Please contact your instructor.",
        )

    # 4. Check for existing attempts by this student
    existing_attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.student_id == current_student.id,
            QuizAttempt.quiz_id == quiz.id,
        )
        .first()
    )

    if existing_attempt:
        # Check if already submitted
        if existing_attempt.status in [AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already completed and submitted this quiz. Multiple attempts are not permitted.",
            )

        # Existing attempt is in_progress -> check timer
        remaining = _get_remaining_seconds(existing_attempt, quiz)
        if remaining <= 0:
            _evaluate_and_submit_attempt(db, existing_attempt, is_auto=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Time has expired for this quiz attempt. It has been automatically submitted.",
            )

        attempt = existing_attempt
    else:
        # Create fresh attempt
        # Handle Question Randomization if enabled
        q_ids = [q.id for q in questions]
        if quiz.randomize_questions:
            random.shuffle(q_ids)

        q_order_json = json.dumps(q_ids)

        attempt = QuizAttempt(
            student_id=current_student.id,
            quiz_id=quiz.id,
            started_at=now,
            status=AttemptStatus.IN_PROGRESS.value,
            question_order=q_order_json,
        )
        db.add(attempt)

        # Mark participation as in_progress
        part = (
            db.query(QuizParticipation)
            .filter(
                QuizParticipation.student_id == current_student.id,
                QuizParticipation.quiz_id == quiz.id,
            )
            .first()
        )
        if not part:
            part = QuizParticipation(
                student_id=current_student.id,
                quiz_id=quiz.id,
                status=ParticipationStatus.IN_PROGRESS.value,
                joined_at=now,
            )
            db.add(part)
        else:
            part.status = ParticipationStatus.IN_PROGRESS.value

        db.commit()
        db.refresh(attempt)
        remaining = _get_remaining_seconds(attempt, quiz)

    # Reorder questions according to attempt's stored question_order
    ordered_ids = json.loads(attempt.question_order) if attempt.question_order else [q.id for q in questions]
    q_dict = {q.id: q for q in questions}
    ordered_questions = [q_dict[qid] for qid in ordered_ids if qid in q_dict]

    # Load any previously saved answers
    saved_answers = db.query(Answer).filter(Answer.attempt_id == attempt.id).all()
    ans_dict = {a.question_id: a.selected_option for a in saved_answers}

    # Format sanitized questions (NEVER exposing correct_option!)
    sanitized_questions = [
        StudentQuestionResponse(
            id=q.id,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            marks=q.marks,
            order_index=idx + 1,
            selected_option=ans_dict.get(q.id),
        )
        for idx, q in enumerate(ordered_questions)
    ]

    return QuizStartResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        quiz_subject=quiz.subject,
        duration_minutes=quiz.duration_minutes,
        started_at=attempt.started_at,
        remaining_seconds=remaining,
        status=attempt.status,
        total_questions=len(ordered_questions),
        questions=sanitized_questions,
        answers=ans_dict,
    )


@router.get(
    "/attempts/{attempt_id}",
    response_model=AttemptDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Attempt State and Questions",
    description="Returns current questions, answers, and remaining timer for an in-progress quiz attempt.",
)
def get_attempt_detail(
    attempt_id: int,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attempt with ID {attempt_id} was not found.",
        )

    # Security check: Students can only access their own attempt
    if attempt.student_id != current_student.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot access another student's quiz attempt.",
        )

    quiz = attempt.quiz or db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    remaining = _get_remaining_seconds(attempt, quiz)

    # Auto-submit if time expired while in progress
    if attempt.status == AttemptStatus.IN_PROGRESS.value and remaining <= 0:
        _evaluate_and_submit_attempt(db, attempt, is_auto=True)
        remaining = 0

    questions = db.query(Question).filter(Question.quiz_id == attempt.quiz_id).all()
    q_dict = {q.id: q for q in questions}
    ordered_ids = json.loads(attempt.question_order) if attempt.question_order else [q.id for q in questions]
    ordered_questions = [q_dict[qid] for qid in ordered_ids if qid in q_dict]

    saved_answers = db.query(Answer).filter(Answer.attempt_id == attempt.id).all()
    ans_dict = {a.question_id: a.selected_option for a in saved_answers}

    sanitized_questions = [
        StudentQuestionResponse(
            id=q.id,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            marks=q.marks,
            order_index=idx + 1,
            selected_option=ans_dict.get(q.id),
        )
        for idx, q in enumerate(ordered_questions)
    ]

    return AttemptDetailResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        quiz_subject=quiz.subject,
        duration_minutes=quiz.duration_minutes,
        started_at=attempt.started_at,
        remaining_seconds=remaining,
        status=attempt.status,
        total_questions=len(ordered_questions),
        questions=sanitized_questions,
        answers=ans_dict,
    )


@router.put(
    "/attempts/{attempt_id}/answers/{question_id}",
    response_model=SaveAnswerResponse,
    status_code=status.HTTP_200_OK,
    summary="Save Answer for a Question",
    description="Saves or updates the student's selected option for a specific question during an active quiz attempt.",
)
def save_answer(
    attempt_id: int,
    question_id: int,
    payload: SaveAnswerRequest,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attempt with ID {attempt_id} was not found.",
        )

    # Security check: Ownership
    if attempt.student_id != current_student.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot modify answers for another student's attempt.",
        )

    # Check attempt status
    if attempt.status in [AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify answers. This quiz attempt has already been submitted.",
        )

    # Check timer
    quiz = attempt.quiz or db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    remaining = _get_remaining_seconds(attempt, quiz)
    if remaining <= 0:
        _evaluate_and_submit_attempt(db, attempt, is_auto=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Time has expired for this quiz attempt. It has been automatically submitted.",
        )

    # Verify question exists and belongs to this quiz
    question = db.query(Question).filter(Question.id == question_id, Question.quiz_id == attempt.quiz_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with ID {question_id} was not found in this quiz.",
        )

    # Normalize option
    opt = payload.selected_option.strip().upper() if payload.selected_option else None
    if opt and opt not in ["A", "B", "C", "D"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected option must be 'A', 'B', 'C', 'D', or null.",
        )

    answer = db.query(Answer).filter(Answer.attempt_id == attempt.id, Answer.question_id == question_id).first()
    if answer:
        answer.selected_option = opt
    else:
        answer = Answer(attempt_id=attempt.id, question_id=question_id, selected_option=opt)
        db.add(answer)

    db.commit()

    return SaveAnswerResponse(
        attempt_id=attempt.id,
        question_id=question_id,
        selected_option=opt,
        message="Answer saved successfully.",
    )


@router.post(
    "/attempts/{attempt_id}/submit",
    response_model=QuizResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit Quiz Attempt",
    description="Finalizes the quiz attempt, evaluates answers against correct solutions on the backend, and records scores.",
)
def submit_quiz_attempt(
    attempt_id: int,
    payload: SubmitAttemptRequest = SubmitAttemptRequest(),
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attempt with ID {attempt_id} was not found.",
        )

    # Security check: Ownership
    if attempt.student_id != current_student.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot submit another student's attempt.",
        )

    if attempt.status in [AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz attempt has already been submitted.",
        )

    _evaluate_and_submit_attempt(db, attempt, is_auto=payload.is_auto_submit)

    quiz = attempt.quiz or db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    questions = db.query(Question).filter(Question.quiz_id == attempt.quiz_id).all()
    answers = db.query(Answer).filter(Answer.attempt_id == attempt.id).all()

    correct_count = len([a for a in answers if a.is_correct is True])
    incorrect_count = len([a for a in answers if a.is_correct is False and a.selected_option is not None])
    unanswered_count = len(questions) - (correct_count + incorrect_count)

    percentage = round((attempt.obtained_marks / attempt.total_marks * 100), 2) if attempt.total_marks > 0 else 0.0
    passed = attempt.obtained_marks >= quiz.passing_marks
    time_taken = int((_normalize_dt(attempt.submitted_at) - _normalize_dt(attempt.started_at)).total_seconds())

    return QuizResultResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        quiz_subject=quiz.subject,
        total_marks=attempt.total_marks,
        obtained_marks=attempt.obtained_marks,
        passing_marks=quiz.passing_marks,
        percentage=percentage,
        total_questions=len(questions),
        correct_answers_count=correct_count,
        incorrect_answers_count=incorrect_count,
        unanswered_count=unanswered_count,
        passed=passed,
        status=attempt.status,
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        time_taken_seconds=time_taken,
        message="Quiz submitted and evaluated successfully.",
    )


@router.get(
    "/attempts/{attempt_id}/result",
    response_model=QuizResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Quiz Attempt Result",
    description="Returns marks, percentage, correct/incorrect/unanswered counts, and pass/fail outcome after submission.",
)
def get_quiz_attempt_result(
    attempt_id: int,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attempt with ID {attempt_id} was not found.",
        )

    # Security check: Ownership
    if attempt.student_id != current_student.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot view results for another student's attempt.",
        )

    if attempt.status not in [AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz attempt is still in progress and has not been submitted.",
        )

    quiz = attempt.quiz or db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    questions = db.query(Question).filter(Question.quiz_id == attempt.quiz_id).all()
    answers = db.query(Answer).filter(Answer.attempt_id == attempt.id).all()

    correct_count = len([a for a in answers if a.is_correct is True])
    incorrect_count = len([a for a in answers if a.is_correct is False and a.selected_option is not None])
    unanswered_count = len(questions) - (correct_count + incorrect_count)

    percentage = round((attempt.obtained_marks / attempt.total_marks * 100), 2) if attempt.total_marks > 0 else 0.0
    passed = attempt.obtained_marks >= quiz.passing_marks
    time_taken = int((_normalize_dt(attempt.submitted_at) - _normalize_dt(attempt.started_at)).total_seconds())

    return QuizResultResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        quiz_subject=quiz.subject,
        total_marks=attempt.total_marks,
        obtained_marks=attempt.obtained_marks,
        passing_marks=quiz.passing_marks,
        percentage=percentage,
        total_questions=len(questions),
        correct_answers_count=correct_count,
        incorrect_answers_count=incorrect_count,
        unanswered_count=unanswered_count,
        passed=passed,
        status=attempt.status,
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        time_taken_seconds=time_taken,
        message="Quiz evaluation results retrieved successfully.",
    )


# --- Phase 7: Student Analytics, Performance Charts & Leaderboards ---


def _build_student_leaderboard(attempts: List[QuizAttempt]) -> List[LeaderboardEntry]:
    """Build ranked leaderboard sanitized for student consumption (no emails or sensitive info)."""
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
                student_email=None,  # Never expose student email on public leaderboard
                obtained_marks=att.obtained_marks,
                total_marks=att.total_marks,
                percentage=pct,
                passed=passed,
                submitted_at=att.submitted_at or att.created_at,
                status=att.status,
            )
        )

    return entries


@router.get(
    "/analytics/overview",
    response_model=StudentPerformanceOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Student Performance Overview",
    description="Returns aggregate performance metrics, average scores, pass/fail counts, and recent results strictly for the authenticated student.",
)
def get_student_performance_overview(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.student_id == current_student.id,
            QuizAttempt.status.in_([AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]),
        )
        .order_by(QuizAttempt.submitted_at.desc())
        .all()
    )

    total_attempts = len(attempts)
    if total_attempts > 0:
        percentages = [(a.obtained_marks / a.total_marks * 100) if a.total_marks > 0 else 0.0 for a in attempts]
        avg_pct = round(sum(percentages) / total_attempts, 2)
        highest_score = round(max((a.obtained_marks for a in attempts), default=0.0), 2)
        passed_count = sum(1 for a in attempts if a.obtained_marks >= (a.quiz.passing_marks if a.quiz else 0))
        failed_count = total_attempts - passed_count
    else:
        avg_pct = 0.0
        highest_score = 0.0
        passed_count = 0
        failed_count = 0

    recent_entries = _build_student_leaderboard(attempts[:10])

    return StudentPerformanceOverviewResponse(
        total_quizzes_attempted=total_attempts,
        average_percentage=avg_pct,
        highest_score=highest_score,
        total_passed=passed_count,
        total_failed=failed_count,
        recent_results=recent_entries,
    )


@router.get(
    "/analytics/performance",
    response_model=StudentPerformanceChartDataResponse,
    status_code=status.HTTP_200_OK,
    summary="Student Performance Chart Data",
    description="Returns time-series performance data, quiz-by-quiz scores, and correct/incorrect answer distributions for chart rendering.",
)
def get_student_performance_chart_data(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.student_id == current_student.id,
            QuizAttempt.status.in_([AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]),
        )
        .order_by(QuizAttempt.submitted_at.asc())
        .all()
    )

    perf_over_time = []
    quiz_scores = []
    total_correct = 0
    total_incorrect = 0
    total_questions_all = 0

    for a in attempts:
        q_title = a.quiz.title if a.quiz else f"Quiz #{a.quiz_id}"
        pass_marks = a.quiz.passing_marks if a.quiz else 0
        pct = round((a.obtained_marks / a.total_marks * 100), 2) if a.total_marks > 0 else 0.0
        date_str = a.submitted_at.strftime("%b %d") if a.submitted_at else "N/A"
        passed = a.obtained_marks >= pass_marks

        perf_over_time.append(
            StudentPerformanceChartItem(
                date=date_str,
                quiz_title=q_title,
                percentage=pct,
                obtained_marks=a.obtained_marks,
                total_marks=a.total_marks,
                passed=passed,
            )
        )

        quiz_scores.append(
            StudentQuizScoreItem(
                quiz_id=a.quiz_id,
                quiz_title=q_title,
                obtained_marks=a.obtained_marks,
                total_marks=a.total_marks,
                passing_marks=pass_marks,
                percentage=pct,
            )
        )

        # Count questions & answers for this attempt
        questions_count = len(a.quiz.questions) if a.quiz else 0
        total_questions_all += questions_count

        attempt_answers = db.query(Answer).filter(Answer.attempt_id == a.id).all()
        for ans in attempt_answers:
            if ans.is_correct is True:
                total_correct += 1
            elif ans.selected_option is not None:
                total_incorrect += 1

    unanswered = max(0, total_questions_all - (total_correct + total_incorrect))

    return StudentPerformanceChartDataResponse(
        performance_over_time=perf_over_time,
        quiz_scores=quiz_scores,
        answer_breakdown=AnswerBreakdown(
            correct_count=total_correct,
            incorrect_count=total_incorrect,
            unanswered_count=unanswered,
            total_questions=total_questions_all,
        ),
    )


@router.get(
    "/quizzes/{quiz_id}/leaderboard",
    response_model=QuizLeaderboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Student Quiz Leaderboard",
    description="Returns public ranked leaderboard for a published/completed quiz without exposing private student emails.",
)
def get_student_quiz_leaderboard(
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

    # Students cannot view leaderboards for draft quizzes
    if quiz.status == QuizStatus.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Leaderboards are not available for draft quizzes.",
        )

    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.status.in_([AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]),
        )
        .all()
    )

    leaderboard = _build_student_leaderboard(attempts)
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
    "/quizzes/{quiz_id}/result",
    response_model=QuizResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Student Quiz Result by Quiz ID",
    description="Returns individual test scores and evaluation breakdown for the authenticated student for a specific quiz.",
)
def get_student_quiz_result_by_quiz_id(
    quiz_id: int,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.student_id == current_student.id,
        )
        .order_by(QuizAttempt.submitted_at.desc())
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No quiz attempt found for Quiz ID {quiz_id}.",
        )

    if attempt.status not in [AttemptStatus.SUBMITTED.value, AttemptStatus.AUTO_SUBMITTED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your quiz attempt is still in progress and has not been submitted.",
        )

    quiz = attempt.quiz or db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    questions = db.query(Question).filter(Question.quiz_id == attempt.quiz_id).all()
    answers = db.query(Answer).filter(Answer.attempt_id == attempt.id).all()

    correct_count = len([a for a in answers if a.is_correct is True])
    incorrect_count = len([a for a in answers if a.is_correct is False and a.selected_option is not None])
    unanswered_count = len(questions) - (correct_count + incorrect_count)

    percentage = round((attempt.obtained_marks / attempt.total_marks * 100), 2) if attempt.total_marks > 0 else 0.0
    passed = attempt.obtained_marks >= quiz.passing_marks
    time_taken = int((_normalize_dt(attempt.submitted_at) - _normalize_dt(attempt.started_at)).total_seconds()) if attempt.submitted_at else 0

    return QuizResultResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        quiz_subject=quiz.subject,
        total_marks=attempt.total_marks,
        obtained_marks=attempt.obtained_marks,
        passing_marks=quiz.passing_marks,
        percentage=percentage,
        total_questions=len(questions),
        correct_answers_count=correct_count,
        incorrect_answers_count=incorrect_count,
        unanswered_count=unanswered_count,
        passed=passed,
        status=attempt.status,
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        time_taken_seconds=time_taken,
        message="Quiz result retrieved successfully.",
    )


