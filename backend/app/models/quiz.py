from datetime import datetime, timezone
import enum
import secrets
import string
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class QuizStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    COMPLETED = "completed"


def generate_unique_quiz_code() -> str:
    """Generate a high-entropy 6-character alphanumeric uppercase quiz code (e.g. QC-74892)."""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(chars) for _ in range(6))
    return f"QC-{suffix}"


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String(100), nullable=False, index=True)
    instructions = Column(Text, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    maximum_marks = Column(Integer, nullable=False)
    passing_marks = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default=QuizStatus.DRAFT.value)
    quiz_code = Column(String(20), unique=True, index=True, nullable=True)
    total_questions = Column(Integer, nullable=False, default=0)
    randomize_questions = Column(Boolean, nullable=False, default=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    teacher = relationship("User", back_populates="quizzes")
    participations = relationship("QuizParticipation", back_populates="quiz", cascade="all, delete-orphan")
    questions = relationship(
        "Question",
        back_populates="quiz",
        cascade="all, delete-orphan",
        order_by="Question.order_index",
    )
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Quiz id={self.id} title='{self.title}' status='{self.status}' code='{self.quiz_code}'>"
