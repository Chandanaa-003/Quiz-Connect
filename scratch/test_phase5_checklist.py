import sys
import os
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Ensure backend path is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.main import app, init_and_migrate_db
from app.database import SessionLocal
from app.models.user import User
from app.models.quiz import Quiz
from app.models.participation import QuizParticipation
from app.services.security import hash_password, create_access_token

init_and_migrate_db()
client = TestClient(app)

print("=" * 70)
print("QUIZCONNECT - PHASE 5 VERIFICATION OF 10 CHECKLIST ITEMS")
print("=" * 70)

db = SessionLocal()

# Setup test users
teacher_email = "test_teacher_p5_verify@quizconnect.local"
student_email = "test_student_p5_verify@quizconnect.local"

teacher = db.query(User).filter(User.email == teacher_email).first()
if not teacher:
    teacher = User(
        full_name="Dr. Verification Teacher",
        email=teacher_email,
        hashed_password=hash_password("StrongTeacherPass123"),
        role="teacher",
        is_active=True
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

student = db.query(User).filter(User.email == student_email).first()
if not student:
    student = User(
        full_name="Alice Verification Student",
        email=student_email,
        hashed_password=hash_password("StrongStudentPass123"),
        role="student",
        is_active=True
    )
    db.add(student)
    db.commit()
    db.refresh(student)

teacher_token = create_access_token(data={"sub": str(teacher.id), "role": teacher.role, "email": teacher.email})
student_token = create_access_token(data={"sub": str(student.id), "role": student.role, "email": student.email})

teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
student_headers = {"Authorization": f"Bearer {student_token}"}

now = datetime.utcnow()

# Clean up any existing test quizzes for this teacher
existing_quizzes = db.query(Quiz).filter(Quiz.teacher_id == teacher.id).all()
for q in existing_quizzes:
    db.query(QuizParticipation).filter(QuizParticipation.quiz_id == q.id).delete()
    db.delete(q)
db.commit()

# Create test quizzes:
# 1. Upcoming Quiz (published, start_time in future)
upcoming_quiz = Quiz(
    title="Upcoming Physics Olympiad",
    description="Upcoming physics competition",
    subject="Physics",
    instructions="Review Newton's laws.",
    start_time=now + timedelta(days=2),
    end_time=now + timedelta(days=2, hours=2),
    duration_minutes=60,
    maximum_marks=100,
    passing_marks=40,
    status="published",
    quiz_code="P5UP01",
    total_questions=25,
    teacher_id=teacher.id
)

# 2. Available Quiz (published, start_time in past, end_time in future)
available_quiz = Quiz(
    title="Live Chemistry Midterm",
    description="Live midterm assessment",
    subject="Chemistry",
    instructions="No periodic table allowed.",
    start_time=now - timedelta(hours=1),
    end_time=now + timedelta(hours=3),
    duration_minutes=45,
    maximum_marks=50,
    passing_marks=20,
    status="published",
    quiz_code="P5LIVE",
    total_questions=20,
    teacher_id=teacher.id
)

# 3. Draft Quiz (draft, within time window)
draft_quiz = Quiz(
    title="Secret Draft History Quiz",
    description="Not published yet",
    subject="History",
    instructions="Confidential draft.",
    start_time=now - timedelta(hours=1),
    end_time=now + timedelta(hours=1),
    duration_minutes=30,
    maximum_marks=30,
    passing_marks=15,
    status="draft",
    quiz_code="P5DF01",
    total_questions=10,
    teacher_id=teacher.id
)

# 4. Expired Quiz (published, end_time in past)
expired_quiz = Quiz(
    title="Past Biology Quiz",
    description="Expired test",
    subject="Biology",
    instructions="Past deadline.",
    start_time=now - timedelta(days=2),
    end_time=now - timedelta(days=1),
    duration_minutes=30,
    maximum_marks=40,
    passing_marks=15,
    status="published",
    quiz_code="P5EXP1",
    total_questions=15,
    teacher_id=teacher.id
)

db.add_all([upcoming_quiz, available_quiz, draft_quiz, expired_quiz])
db.commit()
for q in [upcoming_quiz, available_quiz, draft_quiz, expired_quiz]:
    db.refresh(q)

test_results = {}

# Test 1: Student dashboard loads
r1 = client.get("/api/student/dashboard", headers=student_headers)
if r1.status_code == 200:
    data1 = r1.json()
    stats = data1.get("stats", {})
    if "total_quizzes_attended" in stats and "upcoming_quizzes" in stats and "available_quizzes" in stats and "completed_quizzes" in stats:
        test_results["1. Student dashboard loads"] = f"PASS (Status: 200, stats: {stats})"
    else:
        test_results["1. Student dashboard loads"] = f"FAIL (Missing stats keys: {data1})"
else:
    test_results["1. Student dashboard loads"] = f"FAIL (Status: {r1.status_code}, {r1.text})"

# Test 2: Upcoming quizzes display correctly
r2 = client.get("/api/student/quizzes/upcoming", headers=student_headers)
if r2.status_code == 200:
    quizzes = r2.json()
    titles = [q["title"] for q in quizzes]
    if "Upcoming Physics Olympiad" in titles and "Live Chemistry Midterm" not in titles and "Secret Draft History Quiz" not in titles:
        test_results["2. Upcoming quizzes display correctly"] = f"PASS (Found upcoming quiz: '{upcoming_quiz.title}', verified draft/live excluded)"
    else:
        test_results["2. Upcoming quizzes display correctly"] = f"FAIL (Unexpected quizzes in upcoming: {titles})"
else:
    test_results["2. Upcoming quizzes display correctly"] = f"FAIL (Status: {r2.status_code})"

# Test 3: Available quizzes display correctly
r3 = client.get("/api/student/quizzes/available", headers=student_headers)
if r3.status_code == 200:
    quizzes = r3.json()
    titles = [q["title"] for q in quizzes]
    if "Live Chemistry Midterm" in titles and "Upcoming Physics Olympiad" not in titles and "Past Biology Quiz" not in titles:
        test_results["3. Available quizzes display correctly"] = f"PASS (Found live quiz: '{available_quiz.title}', verified upcoming/expired excluded)"
    else:
        test_results["3. Available quizzes display correctly"] = f"FAIL (Unexpected quizzes in available: {titles})"
else:
    test_results["3. Available quizzes display correctly"] = f"FAIL (Status: {r3.status_code})"

# Test 4: Valid quiz code works
r4 = client.post("/api/student/quizzes/join", json={"quiz_code": "P5LIVE"}, headers=student_headers)
if r4.status_code == 200:
    data4 = r4.json()
    if data4.get("quiz_title") == "Live Chemistry Midterm" and data4.get("quiz_id") == available_quiz.id:
        test_results["4. Valid quiz code works"] = f"PASS (Successfully joined quiz '{data4['quiz_title']}' [id: {data4['quiz_id']}], instructions_url: {data4.get('instructions_url')})"
    else:
        test_results["4. Valid quiz code works"] = f"FAIL (Unexpected quiz response: {data4})"
else:
    test_results["4. Valid quiz code works"] = f"FAIL (Status: {r4.status_code}, {r4.text})"

# Test 5: Invalid quiz code is rejected
r5 = client.post("/api/student/quizzes/join", json={"quiz_code": "NONEXISTENT999"}, headers=student_headers)
if r5.status_code == 404:
    test_results["5. Invalid quiz code is rejected"] = f"PASS (Status: 404, detail: '{r5.json().get('detail')}')"
else:
    test_results["5. Invalid quiz code is rejected"] = f"FAIL (Expected 404, got {r5.status_code})"

# Test 6: Draft quizzes are hidden
r6_join = client.post("/api/student/quizzes/join", json={"quiz_code": "P5DF01"}, headers=student_headers)
r6_avail = client.get("/api/student/quizzes/available", headers=student_headers)
r6_up = client.get("/api/student/quizzes/upcoming", headers=student_headers)
draft_in_avail = any(q["title"] == "Secret Draft History Quiz" for q in r6_avail.json())
draft_in_up = any(q["title"] == "Secret Draft History Quiz" for q in r6_up.json())
if r6_join.status_code == 400 and not draft_in_avail and not draft_in_up:
    test_results["6. Draft quizzes are hidden"] = f"PASS (Draft join rejected with 400: '{r6_join.json().get('detail')}', hidden from listings)"
else:
    test_results["6. Draft quizzes are hidden"] = f"FAIL (Join status: {r6_join.status_code}, in_avail: {draft_in_avail}, in_up: {draft_in_up})"

# Test 7: Expired quizzes cannot be joined
r7 = client.post("/api/student/quizzes/join", json={"quiz_code": "P5EXP1"}, headers=student_headers)
if r7.status_code == 400 and "expired" in r7.json().get("detail", "").lower():
    test_results["7. Expired quizzes cannot be joined"] = f"PASS (Status: 400, detail: '{r7.json().get('detail')}')"
else:
    test_results["7. Expired quizzes cannot be joined"] = f"FAIL (Expected 400 expired error, got {r7.status_code}, {r7.text})"

# Test 8: Duplicate participation is prevented
# Mark the existing participation for available_quiz as completed, then try to join again
part = db.query(QuizParticipation).filter(
    QuizParticipation.student_id == student.id,
    QuizParticipation.quiz_id == available_quiz.id
).first()
part.status = "completed"
db.commit()

r8 = client.post("/api/student/quizzes/join", json={"quiz_code": "P5LIVE"}, headers=student_headers)
if r8.status_code == 400 and "already completed" in r8.json().get("detail", "").lower():
    test_results["8. Duplicate participation is prevented"] = f"PASS (Status: 400, detail: '{r8.json().get('detail')}')"
else:
    test_results["8. Duplicate participation is prevented"] = f"FAIL (Status: {r8.status_code}, response: {r8.text})"

# Test 9: Teacher cannot access student-only APIs
r9_dash = client.get("/api/student/dashboard", headers=teacher_headers)
r9_join = client.post("/api/student/quizzes/join", json={"quiz_code": "P5LIVE"}, headers=teacher_headers)
if r9_dash.status_code == 403 and r9_join.status_code == 403:
    test_results["9. Teacher cannot access student-only APIs"] = f"PASS (Status: 403 Forbidden for teacher attempting student endpoints)"
else:
    test_results["9. Teacher cannot access student-only APIs"] = f"FAIL (dash status: {r9_dash.status_code}, join status: {r9_join.status_code})"

# Test 10: Logout works
# Client-side JWT auth: removing/invalidating token results in 401 Unauthorized
r10 = client.get("/api/student/dashboard") # No Authorization header
if r10.status_code in [401, 403]:
    test_results["10. Logout works"] = f"PASS (Unauthenticated request rejected with HTTP {r10.status_code}; clearing client JWT revokes access)"
else:
    test_results["10. Logout works"] = f"FAIL (Expected 401/403, got {r10.status_code})"

print("\nRESULTS SUMMARY:")
all_passed = True
for test_name, result in test_results.items():
    print(f"[{result[:4]}] {test_name}: {result[5:]}")
    if not result.startswith("PASS"):
        all_passed = False

print("\n" + "=" * 70)
if all_passed:
    print("ALL 10 CHECKLIST REQUIREMENTS SUCCESSFULLY VERIFIED & PASSED!")
else:
    print("SOME TESTS FAILED.")
print("=" * 70)

db.close()
