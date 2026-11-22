from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class StudentQuizItemResponse(BaseModel):
    id: int
    title: str
    subject: str
    teacher_name: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    maximum_marks: int
    quiz_status: str
    quiz_code: Optional[str] = None
    has_joined: bool = False

    model_config = ConfigDict(from_attributes=True)


class StudentJoinQuizRequest(BaseModel):
    quiz_code: str = Field(..., min_length=3, max_length=20, description="Unique quiz access code")


class StudentJoinQuizResponse(BaseModel):
    message: str
    quiz_id: int
    quiz_title: str
    subject: str
    teacher_name: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    maximum_marks: int
    status: str
    joined_at: datetime
    instructions_url: str


class QuizInstructionsResponse(BaseModel):
    quiz_id: int
    title: str
    subject: str
    teacher_name: str
    duration_minutes: int
    maximum_marks: int
    passing_marks: int
    number_of_questions: int
    start_time: datetime
    end_time: datetime
    instructions: str
    quiz_code: Optional[str] = None
    status: str


class StudentHistoryItemResponse(BaseModel):
    participation_id: int
    quiz_id: int
    title: str
    subject: str
    teacher_name: str
    joined_at: datetime
    completed_at: Optional[datetime] = None
    score: Optional[float] = None
    total_marks: Optional[int] = None
    participation_status: str

    model_config = ConfigDict(from_attributes=True)


class StudentDashboardStats(BaseModel):
    total_quizzes_attended: int
    upcoming_quizzes: int
    available_quizzes: int
    completed_quizzes: int


class StudentDashboardResponse(BaseModel):
    message: str
    role: str
    user: dict
    stats: StudentDashboardStats
    recent_activity: List[StudentQuizItemResponse]
