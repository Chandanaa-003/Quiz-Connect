from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    selected_option = Column(String(10), nullable=True)  # "A", "B", "C", "D" or None
    is_correct = Column(Boolean, nullable=True)
    marks_obtained = Column(Float, nullable=False, default=0.0)

    # Each question in an attempt has at most one answer record
    __table_args__ = (
        UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question_answer"),
    )

    # Relationships
    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("Question", back_populates="answers")

    def __repr__(self):
        return f"<Answer id={self.id} attempt_id={self.attempt_id} question_id={self.question_id} selected={self.selected_option} correct={self.is_correct}>"
