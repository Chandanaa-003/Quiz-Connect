from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class AttemptStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    AUTO_SUBMITTED = "auto_submitted"


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    total_marks = Column(Float, nullable=False, default=0.0)
    obtained_marks = Column(Float, nullable=False, default=0.0)
    status = Column(String(20), nullable=False, default=AttemptStatus.IN_PROGRESS.value)
    question_order = Column(Text, nullable=True)  # JSON-encoded list of question IDs for stable order
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Prevent duplicate attempts where the quiz rules require a single attempt
    __table_args__ = (
        UniqueConstraint("student_id", "quiz_id", name="uq_student_quiz_attempt"),
    )

    # Relationships
    student = relationship("User", back_populates="attempts")
    quiz = relationship("Quiz", back_populates="attempts")
    answers = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<QuizAttempt id={self.id} student_id={self.student_id} quiz_id={self.quiz_id} status={self.status}>"
