from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class QuestionCreateRequest(BaseModel):
    question_text: str = Field(..., min_length=1, description="Question prompt text")
    option_a: str = Field(..., min_length=1, description="Choice A")
    option_b: str = Field(..., min_length=1, description="Choice B")
    option_c: str = Field(..., min_length=1, description="Choice C")
    option_d: str = Field(..., min_length=1, description="Choice D")
    correct_option: str = Field(..., pattern="^[A-Da-d]$", description="Correct option key: A, B, C, or D")
    marks: float = Field(1.0, gt=0, description="Marks allocated for correct answer")
    order_index: Optional[int] = Field(None, description="Display order sequence index")


class QuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    marks: float
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class StudentQuestionResponse(BaseModel):
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    marks: float
    order_index: int
    selected_option: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class QuizStartResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    quiz_title: str
    quiz_subject: str
    duration_minutes: int
    started_at: datetime
    remaining_seconds: int
    status: str
    total_questions: int
    questions: List[StudentQuestionResponse]
    answers: Dict[int, Optional[str]] = {}


class AttemptDetailResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    quiz_title: str
    quiz_subject: str
    duration_minutes: int
    started_at: datetime
    remaining_seconds: int
    status: str
    total_questions: int
    questions: List[StudentQuestionResponse]
    answers: Dict[int, Optional[str]] = {}


class SaveAnswerRequest(BaseModel):
    selected_option: Optional[str] = Field(None, description="Option letter: A, B, C, or D (or null to clear)")


class SaveAnswerResponse(BaseModel):
    attempt_id: int
    question_id: int
    selected_option: Optional[str]
    message: str


class SubmitAttemptRequest(BaseModel):
    is_auto_submit: bool = False


class QuizResultResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    quiz_title: str
    quiz_subject: str
    total_marks: float
    obtained_marks: float
    passing_marks: float
    percentage: float
    total_questions: int
    correct_answers_count: int
    incorrect_answers_count: int
    unanswered_count: int
    passed: bool
    status: str
    started_at: datetime
    submitted_at: datetime
    time_taken_seconds: int
    message: str
