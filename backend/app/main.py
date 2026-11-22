from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import Base, engine
from app.models import (
    Quiz,
    QuizParticipation,
    User,
    Question,
    QuizAttempt,
    Answer,
    generate_unique_quiz_code,
)
from app.routes import api_router


def init_and_migrate_db():
    """Ensure all tables and columns exist smoothly on startup."""
    Base.metadata.create_all(bind=engine)

    # SQLite schema upgrade for Quiz columns (quiz_code, total_questions, randomize_questions)
    with engine.begin() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(quizzes)")).fetchall()
            existing_cols = [r[1] for r in res]

            if "quiz_code" not in existing_cols:
                conn.execute(text("ALTER TABLE quizzes ADD COLUMN quiz_code VARCHAR(20)"))
                conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_quizzes_quiz_code ON quizzes(quiz_code)"))

            if "total_questions" not in existing_cols:
                conn.execute(text("ALTER TABLE quizzes ADD COLUMN total_questions INTEGER DEFAULT 0"))

            if "randomize_questions" not in existing_cols:
                conn.execute(text("ALTER TABLE quizzes ADD COLUMN randomize_questions BOOLEAN DEFAULT 0"))

            # Populate any existing quizzes that might lack a quiz_code
            unassigned_quizzes = conn.execute(text("SELECT id FROM quizzes WHERE quiz_code IS NULL")).fetchall()
            for (qid,) in unassigned_quizzes:
                code = generate_unique_quiz_code()
                conn.execute(text("UPDATE quizzes SET quiz_code = :code WHERE id = :qid"), {"code": code, "qid": qid})
        except Exception:
            pass


init_and_migrate_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Scheduled online quiz management platform API with Complete Quiz Engine & JWT Authentication.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def read_root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": "Learn. Attend. Achieve.",
        "message": "Welcome to QuizConnect API. Visit /docs for interactive Swagger UI.",
        "status": "online",
        "phase": "Phase 6: Complete Quiz Engine Active",
    }
