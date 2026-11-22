from datetime import datetime, timezone
import enum
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class ParticipationStatus(str, enum.Enum):
    REGISTERED = "registered"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class QuizParticipation(Base):
    __tablename__ = "quiz_participations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default=ParticipationStatus.REGISTERED.value)
    joined_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)
    score = Column(Float, nullable=True)
    total_marks = Column(Integer, nullable=True)

    # Strictly prevent duplicate participation per student per quiz
    __table_args__ = (
        UniqueConstraint("student_id", "quiz_id", name="uq_student_quiz_participation"),
    )

    # Relationships
    student = relationship("User", back_populates="participations")
    quiz = relationship("Quiz", back_populates="participations")

    def __repr__(self):
        return f"<QuizParticipation id={self.id} student_id={self.student_id} quiz_id={self.quiz_id} status='{self.status}'>"
