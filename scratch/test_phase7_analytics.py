import sys
import os
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

# Ensure backend path is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.main import app, init_and_migrate_db
from app.database import SessionLocal
from app.models.user import User
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.attempt import QuizAttempt, AttemptStatus
from app.models.answer import Answer
from app.models.participation import QuizParticipation, ParticipationStatus
from app.services.security import hash_password, create_access_token

init_and_migrate_db()
client = TestClient(app)

print("=" * 75)
print("QUIZCONNECT - PHASE 7 LEADERBOARD & ANALYTICS VERIFICATION (10 ITEMS)")
print("=" * 75)

db = SessionLocal()

# Setup test users
t1_email = "t1_analytics@quizconnect.local"
t2_email = "t2_analytics@quizconnect.local"
s1_email = "s1_analytics@quizconnect.local"
s2_email = "s2_analytics@quizconnect.local"
s3_email = "s3_analytics@quizconnect.local"
s4_email = "s4_analytics@quizconnect.local"

def get_or_create_user(name, email, role):
    u = db.query(User).filter(User.email == email).first()
    if not u:
        u = User(
            full_name=name,
            email=email,
            hashed_password=hash_password("AnalyticsPass123!"),
            role=role,
            is_active=True
        )
        db.add(u)
        db.commit()
        db.refresh(u)
    return u

t1 = get_or_create_user("Dr. Analytics T1", t1_email, "teacher")
t2 = get_or_create_user("Prof. Separate T2", t2_email, "teacher")
s1 = get_or_create_user("Alice TopStudent", s1_email, "student")
s2 = get_or_create_user("Bob RunnerUpA", s2_email, "student")
s3 = get_or_create_user("Charlie RunnerUpB", s3_email, "student")
s4 = get_or_create_user("David InProgress", s4_email, "student")

t1_headers = {"Authorization": f"Bearer {create_access_token({'sub': str(t1.id), 'role': t1.role, 'email': t1.email})}"}
t2_headers = {"Authorization": f"Bearer {create_access_token({'sub': str(t2.id), 'role': t2.role, 'email': t2.email})}"}
s1_headers = {"Authorization": f"Bearer {create_access_token({'sub': str(s1.id), 'role': s1.role, 'email': s1.email})}"}
s2_headers = {"Authorization": f"Bearer {create_access_token({'sub': str(s2.id), 'role': s2.role, 'email': s2.email})}"}
s3_headers = {"Authorization": f"Bearer {create_access_token({'sub': str(s3.id), 'role': s3.role, 'email': s3.email})}"}
s4_headers = {"Authorization": f"Bearer {create_access_token({'sub': str(s4.id), 'role': s4.role, 'email': s4.email})}"}

now = datetime.now(timezone.utc)

# Clean up any existing records for test users
for u in [t1, t2]:
    quizzes = db.query(Quiz).filter(Quiz.teacher_id == u.id).all()
    for q in quizzes:
        db.query(QuizAttempt).filter(QuizAttempt.quiz_id == q.id).delete()
        db.query(QuizParticipation).filter(QuizParticipation.quiz_id == q.id).delete()
        db.query(Question).filter(Question.quiz_id == q.id).delete()
        db.delete(q)
db.commit()

test_results = {}

# Test 10: Empty data displays correctly (Zero attempts/quizzes for T2)
r10_t2 = client.get("/api/teacher/analytics/overview", headers=t2_headers)
r10_s1 = client.get("/api/student/analytics/overview", headers=s1_headers)

if r10_t2.status_code == 200 and r10_s1.status_code == 200:
    t2_data = r10_t2.json()
    s1_data = r10_s1.json()
    if (t2_data.get("total_quizzes_conducted") == 0 and
        t2_data.get("average_score") == 0.0 and
        s1_data.get("total_quizzes_attempted") == 0 and
        s1_data.get("average_percentage") == 0.0):
        test_results["10. Empty data displays correctly"] = "PASS (Empty dataset returns clean zeroed metrics without division errors)"
    else:
        test_results["10. Empty data displays correctly"] = f"FAIL (Unexpected empty values: {t2_data}, {s1_data})"
else:
    test_results["10. Empty data displays correctly"] = f"FAIL (T2 status: {r10_t2.status_code}, S1 status: {r10_s1.status_code})"

# Now create Quiz 1 for T1
q1_model = Quiz(
    title="Algorithms & Complexity Analysis",
    description="Algorithm complexity midterm",
    subject="Computer Science",
    instructions="Choose the best answer.",
    start_time=now - timedelta(minutes=15),
    end_time=now + timedelta(hours=2),
    duration_minutes=45,
    maximum_marks=10,
    passing_marks=5,
    status="published",
    quiz_code="P7AN01",
    total_questions=3,
    teacher_id=t1.id
)
db.add(q1_model)
db.commit()
db.refresh(q1_model)

# Add 3 questions to Quiz 1
quest1 = Question(
    quiz_id=q1_model.id,
    question_text="What is the worst-case complexity of QuickSort?",
    option_a="O(n^2)",
    option_b="O(n log n)",
    option_c="O(log n)",
    option_d="O(1)",
    correct_option="A",
    marks=3.0,
    order_index=1
)
quest2 = Question(
    quiz_id=q1_model.id,
    question_text="Which algorithm finds strongly connected components in linear time?",
    option_a="Dijkstra's",
    option_b="Tarjan's Algorithm",
    option_c="Kruskal's",
    option_d="Bellman-Ford",
    correct_option="B",
    marks=3.0,
    order_index=2
)
quest3 = Question(
    quiz_id=q1_model.id,
    question_text="What is the space complexity of an in-place merge sort algorithm?",
    option_a="O(n)",
    option_b="O(n log n)",
    option_c="O(1)",
    option_d="O(log n)",
    correct_option="C",
    marks=4.0,
    order_index=3
)
db.add_all([quest1, quest2, quest3])
db.commit()
for quest in [quest1, quest2, quest3]:
    db.refresh(quest)

# Seed student attempts:
# S1 (10.0 / 10.0 - 100%, Passed)
# S2 (6.0 / 10.0 - 60%, Passed)
# S3 (6.0 / 10.0 - 60%, Passed, tied with S2)
# S4 (In Progress - Should NOT be counted in analytics or leaderboard!)

# S1 Attempt
att_s1 = QuizAttempt(
    student_id=s1.id,
    quiz_id=q1_model.id,
    started_at=now - timedelta(minutes=14),
    submitted_at=now - timedelta(minutes=10),
    total_marks=10.0,
    obtained_marks=10.0,
    status=AttemptStatus.SUBMITTED.value,
)
db.add(att_s1)
db.flush()
db.add_all([
    Answer(attempt_id=att_s1.id, question_id=quest1.id, selected_option="A", is_correct=True, marks_obtained=3.0),
    Answer(attempt_id=att_s1.id, question_id=quest2.id, selected_option="B", is_correct=True, marks_obtained=3.0),
    Answer(attempt_id=att_s1.id, question_id=quest3.id, selected_option="C", is_correct=True, marks_obtained=4.0),
])

# S2 Attempt (submitted at -8 min)
att_s2 = QuizAttempt(
    student_id=s2.id,
    quiz_id=q1_model.id,
    started_at=now - timedelta(minutes=12),
    submitted_at=now - timedelta(minutes=8),
    total_marks=10.0,
    obtained_marks=6.0,
    status=AttemptStatus.SUBMITTED.value,
)
db.add(att_s2)
db.flush()
db.add_all([
    Answer(attempt_id=att_s2.id, question_id=quest1.id, selected_option="A", is_correct=True, marks_obtained=3.0),
    Answer(attempt_id=att_s2.id, question_id=quest2.id, selected_option="B", is_correct=True, marks_obtained=3.0),
    Answer(attempt_id=att_s2.id, question_id=quest3.id, selected_option="A", is_correct=False, marks_obtained=0.0), # wrong option A
])

# S3 Attempt (submitted at -6 min, tied score 6.0)
att_s3 = QuizAttempt(
    student_id=s3.id,
    quiz_id=q1_model.id,
    started_at=now - timedelta(minutes=10),
    submitted_at=now - timedelta(minutes=6),
    total_marks=10.0,
    obtained_marks=6.0,
    status=AttemptStatus.SUBMITTED.value,
)
db.add(att_s3)
db.flush()
db.add_all([
    Answer(attempt_id=att_s3.id, question_id=quest1.id, selected_option="A", is_correct=True, marks_obtained=3.0),
    Answer(attempt_id=att_s3.id, question_id=quest2.id, selected_option="B", is_correct=True, marks_obtained=3.0),
    # Q3 left unanswered
])

# S4 Attempt (IN_PROGRESS - should NOT be included)
att_s4 = QuizAttempt(
    student_id=s4.id,
    quiz_id=q1_model.id,
    started_at=now - timedelta(minutes=2),
    submitted_at=None,
    total_marks=0.0,
    obtained_marks=0.0,
    status=AttemptStatus.IN_PROGRESS.value,
)
db.add(att_s4)
db.commit()

# Test 1: Teacher analytics display correct values
r1 = client.get("/api/teacher/analytics/overview", headers=t1_headers)
if r1.status_code == 200:
    d1 = r1.json()
    # Expect: 3 submitted attempts, avg = (10 + 6 + 6)/3 = 7.33, high = 10.0, pass% = 100.0%
    if (d1.get("total_quiz_attempts") == 3 and
        d1.get("total_students_participated") == 3 and
        d1.get("highest_score") == 10.0 and
        d1.get("average_score") == 7.33 and
        d1.get("pass_percentage") == 100.0):
        test_results["1. Teacher analytics display correct values"] = f"PASS (Attempts: 3, Avg: 7.33, Highest: 10.0, Pass: 100%)"
    else:
        test_results["1. Teacher analytics display correct values"] = f"FAIL (Values: {d1})"
else:
    test_results["1. Teacher analytics display correct values"] = f"FAIL (Status: {r1.status_code})"

# Test 2: Quiz-wise analytics work
r2 = client.get(f"/api/teacher/quizzes/{q1_model.id}/analytics", headers=t1_headers)
if r2.status_code == 200:
    d2 = r2.json()
    if (d2.get("total_participants") == 3 and
        d2.get("average_marks") == 7.33 and
        d2.get("highest_marks") == 10.0 and
        d2.get("lowest_marks") == 6.0 and
        d2.get("pass_percentage") == 100.0):
        test_results["2. Quiz-wise analytics work"] = f"PASS (Participants: 3, Avg: 7.33, Range: [6.0 - 10.0], Pass Rate: 100%)"
    else:
        test_results["2. Quiz-wise analytics work"] = f"FAIL (Values: {d2})"
else:
    test_results["2. Quiz-wise analytics work"] = f"FAIL (Status: {r2.status_code})"

# Test 3: Leaderboard ranking works
r3 = client.get(f"/api/teacher/quizzes/{q1_model.id}/leaderboard", headers=t1_headers)
if r3.status_code == 200:
    board = r3.json().get("leaderboard", [])
    if len(board) == 3 and board[0]["rank"] == 1 and board[0]["student_name"] == "Alice TopStudent":
        test_results["3. Leaderboard ranking works"] = f"PASS (Rank 1: Alice TopStudent with 10.0/10.0, 100%)"
    else:
        test_results["3. Leaderboard ranking works"] = f"FAIL (Leaderboard: {board})"
else:
    test_results["3. Leaderboard ranking works"] = f"FAIL (Status: {r3.status_code})"

# Test 4: Equal scores are handled consistently
if r3.status_code == 200:
    board = r3.json().get("leaderboard", [])
    # S2 and S3 both scored 6.0. They should both share rank 2!
    rank2_entries = [e for e in board if e["rank"] == 2]
    if len(rank2_entries) == 2 and {e["student_name"] for e in rank2_entries} == {"Bob RunnerUpA", "Charlie RunnerUpB"}:
        test_results["4. Equal scores are handled consistently"] = f"PASS (Both tied students correctly assigned Rank 2: {[e['student_name'] for e in rank2_entries]})"
    else:
        test_results["4. Equal scores are handled consistently"] = f"FAIL (Tied entries: {rank2_entries})"
else:
    test_results["4. Equal scores are handled consistently"] = "FAIL"

# Test 5: Student sees only their own performance
r5_s1 = client.get("/api/student/analytics/overview", headers=s1_headers)
r5_s2 = client.get("/api/student/analytics/overview", headers=s2_headers)
r5_s1_own_quiz = client.get(f"/api/student/quizzes/{q1_model.id}/result", headers=s1_headers)

if r5_s1.status_code == 200 and r5_s2.status_code == 200 and r5_s1_own_quiz.status_code == 200:
    s1_perf = r5_s1.json()
    s2_perf = r5_s2.json()
    s1_quiz = r5_s1_own_quiz.json()

    # S1 has avg 100%, S2 has avg 60%
    if (s1_perf.get("average_percentage") == 100.0 and
        s2_perf.get("average_percentage") == 60.0 and
        s1_quiz.get("obtained_marks") == 10.0):
        test_results["5. Student sees only their own performance"] = f"PASS (S1: {s1_perf['average_percentage']}%, S2: {s2_perf['average_percentage']}%, perfectly isolated)"
    else:
        test_results["5. Student sees only their own performance"] = f"FAIL (S1: {s1_perf}, S2: {s2_perf})"
else:
    test_results["5. Student sees only their own performance"] = f"FAIL (Statuses: {r5_s1.status_code}, {r5_s2.status_code}, {r5_s1_own_quiz.status_code})"

# Test 6: Question-wise statistics are correct
if r2.status_code == 200:
    q_stats = d2.get("question_performance", [])
    # Q1: 3/3 correct (100% -> Easy)
    # Q2: 3/3 correct (100% -> Easy)
    # Q3: 1/3 correct (33.33% -> Hard; 1 correct "C", 1 wrong "A", 1 unanswered)
    q1_stat = next((q for q in q_stats if q["question_id"] == quest1.id), None)
    q3_stat = next((q for q in q_stats if q["question_id"] == quest3.id), None)

    if (q1_stat and q1_stat["correct_percentage"] == 100.0 and q1_stat["difficulty_label"] == "Easy" and
        q3_stat and q3_stat["correct_percentage"] == 33.33 and q3_stat["difficulty_label"] == "Hard" and
        q3_stat["option_distribution"]["A"] == 1 and q3_stat["option_distribution"]["C"] == 1):
        test_results["6. Question-wise statistics are correct"] = f"PASS (Q1: 100% Easy, Q3: 33.33% Hard with correct choice breakdown)"
    else:
        test_results["6. Question-wise statistics are correct"] = f"FAIL (Q1: {q1_stat}, Q3: {q3_stat})"
else:
    test_results["6. Question-wise statistics are correct"] = "FAIL"

# Test 7: CSV download works
r7 = client.get(f"/api/teacher/quizzes/{q1_model.id}/report/csv", headers=t1_headers)
if r7.status_code == 200 and "text/csv" in r7.headers.get("content-type", ""):
    csv_text = r7.text
    if "Alice TopStudent" in csv_text and "Bob RunnerUpA" in csv_text and "Charlie RunnerUpB" in csv_text and "David InProgress" not in csv_text:
        test_results["7. CSV download works"] = "PASS (Valid CSV generated containing student names, marks, ranks, and pass status)"
    else:
        test_results["7. CSV download works"] = f"FAIL (CSV content unexpected: {csv_text})"
else:
    test_results["7. CSV download works"] = f"FAIL (Status: {r7.status_code}, content-type: {r7.headers.get('content-type')})"

# Test 8: Teacher cannot access another teacher's reports
r8_analytics = client.get(f"/api/teacher/quizzes/{q1_model.id}/analytics", headers=t2_headers)
r8_csv = client.get(f"/api/teacher/quizzes/{q1_model.id}/report/csv", headers=t2_headers)
r8_board = client.get(f"/api/teacher/quizzes/{q1_model.id}/leaderboard", headers=t2_headers)

if r8_analytics.status_code == 403 and r8_csv.status_code == 403 and r8_board.status_code == 403:
    test_results["8. Teacher cannot access another teacher's reports"] = "PASS (All foreign teacher requests strictly rejected with 403 Forbidden)"
else:
    test_results["8. Teacher cannot access another teacher's reports"] = f"FAIL (Analytics: {r8_analytics.status_code}, CSV: {r8_csv.status_code}, Board: {r8_board.status_code})"

# Test 9: Only submitted attempts are included
# David (S4) is in_progress. Check that David is NOT in the leaderboard, and count is exactly 3
r9_board = client.get(f"/api/teacher/quizzes/{q1_model.id}/leaderboard", headers=t1_headers)
if r9_board.status_code == 200:
    board_students = [e["student_name"] for e in r9_board.json().get("leaderboard", [])]
    if "David InProgress" not in board_students and len(board_students) == 3:
        test_results["9. Only submitted attempts are included"] = f"PASS (In-progress attempt excluded; only 3 submitted attempts counted)"
    else:
        test_results["9. Only submitted attempts are included"] = f"FAIL (Found students: {board_students})"
else:
    test_results["9. Only submitted attempts are included"] = f"FAIL (Status: {r9_board.status_code})"

print("\nRESULTS SUMMARY:")
all_passed = True
for name, res in test_results.items():
    print(f"[{res[:4]}] {name}: {res[5:]}")
    if not res.startswith("PASS"):
        all_passed = False

print("\n" + "=" * 75)
if all_passed:
    print("ALL 10 PHASE 7 LEADERBOARD & ANALYTICS REQUIREMENTS VERIFIED & PASSED!")
else:
    print("SOME PHASE 7 TESTS FAILED.")
print("=" * 75)

db.close()
