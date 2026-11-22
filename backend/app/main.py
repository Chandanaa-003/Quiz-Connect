from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.models import User, Quiz  # Ensures models are registered before create_all
from app.routes import api_router

# Initialize database schema and tables (e.g. users, quizzes)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Scheduled online quiz management platform API with complete Quiz Management & JWT Authentication.",
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
        "phase": "Phase 3: Teacher Dashboard & Quiz Management Active",
    }
