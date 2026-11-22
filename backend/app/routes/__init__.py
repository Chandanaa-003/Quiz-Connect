from fastapi import APIRouter
from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.teacher import router as teacher_router
from app.routes.student import router as student_router

api_router = APIRouter()

# Register API routes
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(auth_router)
api_router.include_router(teacher_router)
api_router.include_router(student_router)
