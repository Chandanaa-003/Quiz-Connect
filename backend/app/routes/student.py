from fastapi import APIRouter, Depends, status

from app.models.user import User
from app.schemas.user import DashboardResponse
from app.services.auth import get_current_student

router = APIRouter(prefix="/student", tags=["Student Dashboard"])


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Student Dashboard Overview",
    description="Protected endpoint accessible only by authenticated users with the 'student' role.",
)
def get_student_dashboard(
    current_student: User = Depends(get_current_student),
):
    return DashboardResponse(
        message=f"Welcome to your student workspace, {current_student.full_name}!",
        role="student",
        user=current_student,
        stats={
            "quizzes_attended": 0,
            "upcoming_quizzes": 0,
            "average_score": "N/A",
            "attendance_rate": "100%",
        },
    )
