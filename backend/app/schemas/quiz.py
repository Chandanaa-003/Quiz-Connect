from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class QuizStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    COMPLETED = "completed"


class QuizBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Quiz title")
    description: Optional[str] = Field(None, max_length=2000, description="Short summary/description")
    subject: str = Field(..., min_length=1, max_length=100, description="Academic subject")
    instructions: Optional[str] = Field(None, max_length=3000, description="Test taker instructions")
    start_time: datetime = Field(..., description="Scheduled start date and time")
    end_time: datetime = Field(..., description="Scheduled end date and time")
    duration_minutes: int = Field(..., gt=0, le=1440, description="Duration allowed in minutes (> 0)")
    maximum_marks: int = Field(..., gt=0, le=10000, description="Maximum possible marks (> 0)")
    passing_marks: int = Field(..., ge=0, le=10000, description="Passing marks (>= 0 and <= maximum_marks)")
    status: Optional[QuizStatus] = Field(default=QuizStatus.DRAFT, description="Quiz publication/scheduling status")

    @model_validator(mode="after")
    def validate_quiz_constraints(self):
        # 1. End time must be strictly after start time
        if self.end_time <= self.start_time:
            raise ValueError("End date and time must be strictly after the start date and time.")

        # 2. Passing marks cannot exceed maximum marks
        if self.passing_marks > self.maximum_marks:
            raise ValueError("Passing marks cannot exceed maximum marks.")

        # 3. Duration must be greater than zero
        if self.duration_minutes <= 0:
            raise ValueError("Duration must be greater than 0 minutes.")

        return self


class QuizCreateRequest(QuizBase):
    pass


class QuizUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    subject: Optional[str] = Field(None, min_length=1, max_length=100)
    instructions: Optional[str] = Field(None, max_length=3000)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, gt=0, le=1440)
    maximum_marks: Optional[int] = Field(None, gt=0, le=10000)
    passing_marks: Optional[int] = Field(None, ge=0, le=10000)
    status: Optional[QuizStatus] = None

    @model_validator(mode="after")
    def validate_update_constraints(self):
        if self.start_time is not None and self.end_time is not None:
            if self.end_time <= self.start_time:
                raise ValueError("End date and time must be strictly after the start date and time.")

        if self.maximum_marks is not None and self.passing_marks is not None:
            if self.passing_marks > self.maximum_marks:
                raise ValueError("Passing marks cannot exceed maximum marks.")

        return self


class QuizResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    subject: str
    instructions: Optional[str] = None
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    maximum_marks: int
    passing_marks: int
    status: str
    quiz_code: Optional[str] = None
    total_questions: int = 0
    teacher_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TeacherDashboardStats(BaseModel):
    total_quizzes: int
    published_quizzes: int
    scheduled_quizzes: int
    completed_quizzes: int
    draft_quizzes: int


class TeacherDashboardData(BaseModel):
    message: str
    role: str
    user: dict
    stats: TeacherDashboardStats
    recent_quizzes: List[QuizResponse]
