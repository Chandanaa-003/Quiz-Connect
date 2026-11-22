from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ScoreDistributionBucket(BaseModel):
    range: str
    count: int
    percentage: float


class PassFailStats(BaseModel):
    passed: int
    failed: int
    pass_percentage: float
    fail_percentage: float


class ParticipationTrendItem(BaseModel):
    quiz_id: int
    quiz_title: str
    date: str
    participants_count: int


class TeacherQuizPerformanceItem(BaseModel):
    quiz_id: int
    quiz_title: str
    subject: str
    total_attempts: int
    average_score: float
    maximum_marks: float
    passing_marks: float
    highest_score: float
    pass_rate: float


class TeacherAnalyticsOverviewResponse(BaseModel):
    total_quizzes_conducted: int
    total_students_participated: int
    average_score: float
    highest_score: float
    pass_percentage: float
    total_quiz_attempts: int
    quiz_performance: List[TeacherQuizPerformanceItem]
    score_distribution: List[ScoreDistributionBucket]
    pass_fail_stats: PassFailStats
    participation_trends: List[ParticipationTrendItem]


class QuestionPerformanceItem(BaseModel):
    question_id: int
    order_index: int
    question_text: str
    marks: float
    total_responses: int
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    correct_percentage: float
    difficulty_label: str  # "Easy", "Medium", "Hard"
    option_distribution: Dict[str, int]  # {"A": count, "B": count, "C": count, "D": count}


class QuizAnalyticsResponse(BaseModel):
    quiz_id: int
    quiz_title: str
    subject: str
    maximum_marks: float
    passing_marks: float
    total_participants: int
    average_marks: float
    highest_marks: float
    lowest_marks: float
    pass_percentage: float
    fail_percentage: float
    passed_count: int
    failed_count: int
    score_distribution: List[ScoreDistributionBucket]
    question_performance: List[QuestionPerformanceItem]


class LeaderboardEntry(BaseModel):
    rank: int
    student_id: int
    student_name: str
    student_email: Optional[str] = None  # Included only for teacher view
    obtained_marks: float
    total_marks: float
    percentage: float
    passed: bool
    submitted_at: datetime
    status: str


class QuizLeaderboardResponse(BaseModel):
    quiz_id: int
    quiz_title: str
    subject: str
    total_participants: int
    average_percentage: float
    highest_percentage: float
    leaderboard: List[LeaderboardEntry]


class StudentPerformanceOverviewResponse(BaseModel):
    total_quizzes_attempted: int
    average_percentage: float
    highest_score: float
    total_passed: int
    total_failed: int
    recent_results: List[LeaderboardEntry]


class StudentPerformanceChartItem(BaseModel):
    date: str
    quiz_title: str
    percentage: float
    obtained_marks: float
    total_marks: float
    passed: bool


class StudentQuizScoreItem(BaseModel):
    quiz_id: int
    quiz_title: str
    obtained_marks: float
    total_marks: float
    passing_marks: float
    percentage: float


class AnswerBreakdown(BaseModel):
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    total_questions: int


class StudentPerformanceChartDataResponse(BaseModel):
    performance_over_time: List[StudentPerformanceChartItem]
    quiz_scores: List[StudentQuizScoreItem]
    answer_breakdown: AnswerBreakdown
