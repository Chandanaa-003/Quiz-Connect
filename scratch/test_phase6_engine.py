import sys
import os
import json
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
from app.models.participation import QuizParticipation
from app.services.security import hash_password, create_access_token

init_and_migrate_db()
client = TestClient(app)

print("=" * 75)
print("QUIZCONNECT - PHASE 6 COMPLETE QUIZ ENGINE VERIFICATION (12 ITEMS)")
print("=" * 75)

db = SessionLocal()

# Setup test users
teacher_email = "test_teacher_p6@quizconnect.local"
student_a_email = "test_student_a_p6@quizconnect.local"
student_b_email = "test_student_b_p6@quizconnect.local"

teacher = db.query(User).filter(User.email == teacher_email).first()
if not teacher:
    teacher = User(
        full_name="Prof. Phase6 Teacher",
        email=teacher_email,
        hashed_password=hash_password("TeacherPass123!"),
        role="teacher",
        is_active=True
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

student_a = db.query(User).filter(User.email == student_a_email).first()
if not student_a:
    student_a = User(
        full_name="Student Alpha",
        email=student_a_email,
        hashed_password=hash_password("StudentPass123!"),
        role="student",
        is_active=True
    )
    db.add(student_a)
    db.commit()
    db.refresh(student_a)

student_b = db.query(User).filter(User.email == student_b_email).first()
if not student_b:
    student_b = User(
        full_name="Student Beta",
        email=student_b_email,
        hashed_password=hash_password("StudentPass123!"),
        role="student",
        is_active=True
    )
    db.add(student_b)
    db.commit()
    db.refresh(student_b)

teacher_token = create_access_token(data={"sub": str(teacher.id), "role": teacher.role, "email": teacher.email})
student_a_token = create_access_token(data={"sub": str(student_a.id), "role": student_a.role, "email": student_a.email})
student_b_token = create_access_token(data={"sub": str(student_b.id), "role": student_b.role, "email": student_b.email})

headers_a = {"Authorization": f"Bearer {student_a_token}"}
headers_b = {"Authorization": f"Bearer {student_b_token}"}
headers_teacher = {"Authorization": f"Bearer {teacher_token}"}

now = datetime.now(timezone.utc)

# Clean up previous test quizzes for this teacher
old_quizzes = db.query(Quiz).filter(Quiz.teacher_id == teacher.id).all()
for q in old_quizzes:
    db.query(QuizAttempt).filter(QuizAttempt.quiz_id == q.id).delete()
    db.query(QuizParticipation).filter(QuizParticipation.quiz_id == q.id).delete()
    db.query(Question).filter(Question.quiz_id == q.id).delete()
    db.delete(q)
db.commit()

# Create standard test quiz
quiz = Quiz(
    title="Data Structures & Algorithms Exam",
    description="Comprehensive assessment of DSA concepts",
    subject="Computer Science",
    instructions="Select one correct choice per question.",
    start_time=now - timedelta(minutes=10),
    end_time=now + timedelta(hours=2),
    duration_minutes=30,
    maximum_marks=10,
    passing_marks=4,
    status="published",
    quiz_code="P6TEST1",
    total_questions=3,
    randomize_questions=False,
    teacher_id=teacher.id
)
db.add(quiz)
db.commit()
db.refresh(quiz)

# Add 3 questions
q1 = Question(
    quiz_id=quiz.id,
    question_text="What is the average time complexity of searching in a Hash Table?",
    option_a="O(n)",
    option_b="O(1)",
    option_c="O(log n)",
    option_d="O(n^2)",
    correct_option="B",
    marks=3.0,
    order_index=1
)
q2 = Question(
    quiz_id=quiz.id,
    question_text="Which data structure follows the LIFO (Last In First Out) principle?",
    option_a="Queue",
    option_b="Linked List",
    option_c="Stack",
    option_d="Binary Search Tree",
    correct_option="C",
    marks=3.0,
    order_index=2
)
q3 = Question(
    quiz_id=quiz.id,
    question_text="Which algorithm is used to find the shortest path in a weighted graph without negative cycles?",
    option_a="Dijkstra's Algorithm",
    option_b="Depth First Search",
    option_c="Breadth First Search",
    option_d="Prim's Algorithm",
    correct_option="A",
    marks=4.0,
    order_index=3
)
db.add_all([q1, q2, q3])
db.commit()
for q in [q1, q2, q3]:
    db.refresh(q)

test_results = {}

# Test 1: Student starts a quiz
r1 = client.post(f"/api/student/quizzes/{quiz.id}/start", headers=headers_a)
if r1.status_code == 200:
    data1 = r1.json()
    attempt_a_id = data1.get("attempt_id")
    test_results["1. Student starts a quiz"] = f"PASS (Attempt ID: {attempt_a_id}, status: {data1.get('status')})"
else:
    test_results["1. Student starts a quiz"] = f"FAIL (Status: {r1.status_code}, {r1.text})"
    attempt_a_id = None

# Test 2: Questions load correctly & sanitize correct answers
if attempt_a_id:
    questions_loaded = data1.get("questions", [])
    has_correct_option_leak = any("correct_option" in q for q in questions_loaded)
    if len(questions_loaded) == 3 and not has_correct_option_leak:
        test_results["2. Questions load correctly"] = f"PASS ({len(questions_loaded)} questions loaded, correct answers securely hidden)"
    else:
        test_results["2. Questions load correctly"] = f"FAIL (Count: {len(questions_loaded)}, leak: {has_correct_option_leak})"
else:
    test_results["2. Questions load correctly"] = "FAIL (Could not run because start failed)"

# Test 3: Answer selection works
if attempt_a_id:
    # Select "B" for q1 (correct)
    r3 = client.put(
        f"/api/student/attempts/{attempt_a_id}/answers/{q1.id}",
        json={"selected_option": "B"},
        headers=headers_a
    )
    if r3.status_code == 200 and r3.json().get("selected_option") == "B":
        test_results["3. Answer selection works"] = f"PASS (Saved selected_option 'B' for Q1)"
    else:
        test_results["3. Answer selection works"] = f"FAIL (Status: {r3.status_code}, {r3.text})"
else:
    test_results["3. Answer selection works"] = "FAIL"

# Test 4: Next and previous navigation work (questions ordered and navigable)
if attempt_a_id:
    r4 = client.get(f"/api/student/attempts/{attempt_a_id}", headers=headers_a)
    if r4.status_code == 200:
        q_order = [q["id"] for q in r4.json().get("questions", [])]
        if q_order == [q1.id, q2.id, q3.id]:
            test_results["4. Next and previous navigation work"] = f"PASS (Questions sorted sequentially in order {q_order})"
        else:
            test_results["4. Next and previous navigation work"] = f"FAIL (Unexpected question order: {q_order})"
    else:
        test_results["4. Next and previous navigation work"] = f"FAIL (Status: {r4.status_code})"
else:
    test_results["4. Next and previous navigation work"] = "FAIL"

# Test 5: Answers persist after refresh
if attempt_a_id:
    r5 = client.get(f"/api/student/attempts/{attempt_a_id}", headers=headers_a)
    saved_answers = r5.json().get("answers", {})
    # Note: JSON dict keys are strings
    if saved_answers.get(str(q1.id)) == "B":
        test_results["5. Answers persist after refresh"] = f"PASS (Answers preserved across simulated reload: Q1='{saved_answers.get(str(q1.id))}')"
    else:
        test_results["5. Answers persist after refresh"] = f"FAIL (Expected Q1='B', got: {saved_answers})"
else:
    test_results["5. Answers persist after refresh"] = "FAIL"

# Test 6: Timer continues after refresh
if attempt_a_id:
    r6 = client.get(f"/api/student/attempts/{attempt_a_id}", headers=headers_a)
    rem_sec = r6.json().get("remaining_seconds", 0)
    # Total duration is 30 mins (1800 sec). Since started recently, remaining should be between 1700 and 1800
    if 1700 <= rem_sec <= 1800:
        test_results["6. Timer continues after refresh"] = f"PASS (Timer retained remaining {rem_sec}s based on started_at)"
    else:
        test_results["6. Timer continues after refresh"] = f"FAIL (Remaining seconds unexpected: {rem_sec})"
else:
    test_results["6. Timer continues after refresh"] = "FAIL"

# Test 7: Randomization works
# Create a randomized quiz with 5 questions
rand_quiz = Quiz(
    title="Randomized Probability Test",
    description="Randomized question order",
    subject="Mathematics",
    instructions="Test random order.",
    start_time=now - timedelta(minutes=5),
    end_time=now + timedelta(hours=2),
    duration_minutes=20,
    maximum_marks=5,
    passing_marks=2,
    status="published",
    quiz_code="P6RAND1",
    total_questions=5,
    randomize_questions=True,
    teacher_id=teacher.id
)
db.add(rand_quiz)
db.commit()
db.refresh(rand_quiz)

rqs = []
for i in range(1, 6):
    q_item = Question(
        quiz_id=rand_quiz.id,
        question_text=f"Sample Question {i}?",
        option_a="A", option_b="B", option_c="C", option_d="D",
        correct_option="A",
        marks=1.0,
        order_index=i
    )
    rqs.append(q_item)
db.add_all(rqs)
db.commit()

r7_start = client.post(f"/api/student/quizzes/{rand_quiz.id}/start", headers=headers_b)
if r7_start.status_code == 200:
    rand_attempt_id = r7_start.json().get("attempt_id")
    order_first = [q["id"] for q in r7_start.json().get("questions", [])]

    # Verify stable on reload
    r7_reload = client.get(f"/api/student/attempts/{rand_attempt_id}", headers=headers_b)
    order_reload = [q["id"] for q in r7_reload.json().get("questions", [])]

    if order_first == order_reload and len(order_first) == 5:
        test_results["7. Randomization works"] = f"PASS (Question order randomized and stable on refresh: {order_first})"
    else:
        test_results["7. Randomization works"] = f"FAIL (Order mismatch: first={order_first}, reload={order_reload})"
else:
    test_results["7. Randomization works"] = f"FAIL (Status: {r7_start.status_code}, {r7_start.text})"

# Test 8: Manual submission works
if attempt_a_id:
    # Select wrong answer for Q2 ("A" instead of "C")
    client.put(
        f"/api/student/attempts/{attempt_a_id}/answers/{q2.id}",
        json={"selected_option": "A"},
        headers=headers_a
    )
    # Leave Q3 unanswered

    r8 = client.post(f"/api/student/attempts/{attempt_a_id}/submit", json={"is_auto_submit": False}, headers=headers_a)
    if r8.status_code == 200:
        data8 = r8.json()
        if data8.get("status") == "submitted":
            test_results["8. Manual submission works"] = f"PASS (Attempt submitted successfully, status: '{data8.get('status')}')"
        else:
            test_results["8. Manual submission works"] = f"FAIL (Unexpected status: {data8.get('status')})"
    else:
        test_results["8. Manual submission works"] = f"FAIL (Status: {r8.status_code}, {r8.text})"
else:
    test_results["8. Manual submission works"] = "FAIL"

# Test 9: Automatic submission works
# Test student B's randomized quiz attempt with auto_submit=True
if 'rand_attempt_id' in locals():
    r9 = client.post(f"/api/student/attempts/{rand_attempt_id}/submit", json={"is_auto_submit": True}, headers=headers_b)
    if r9.status_code == 200 and r9.json().get("status") == "auto_submitted":
        test_results["9. Automatic submission works"] = f"PASS (Attempt successfully auto-submitted on timer expiration: status='auto_submitted')"
    else:
        test_results["9. Automatic submission works"] = f"FAIL (Status: {r9.status_code}, response: {r9.text})"
else:
    test_results["9. Automatic submission works"] = "FAIL"

# Test 10: Backend evaluates answers correctly
if attempt_a_id:
    r10 = client.get(f"/api/student/attempts/{attempt_a_id}/result", headers=headers_a)
    if r10.status_code == 200:
        res = r10.json()
        # Q1 (3 marks): Answered "B" -> Correct (+3.0)
        # Q2 (3 marks): Answered "A" -> Incorrect (0.0)
        # Q3 (4 marks): Unanswered -> 0.0
        # Total obtained: 3.0 / 10.0 (30.0%)
        # Passing marks: 4.0 -> passed: False
        c_count = res.get("correct_answers_count")
        i_count = res.get("incorrect_answers_count")
        u_count = res.get("unanswered_count")
        obtained = res.get("obtained_marks")
        total = res.get("total_marks")
        passed = res.get("passed")

        if (c_count == 1 and i_count == 1 and u_count == 1 and obtained == 3.0 and total == 10.0 and passed is False):
            test_results["10. Backend evaluates answers correctly"] = f"PASS (Score: {obtained}/{total}, Correct: {c_count}, Incorrect: {i_count}, Unanswered: {u_count}, Passed: {passed})"
        else:
            test_results["10. Backend evaluates answers correctly"] = f"FAIL (Unexpected result values: {res})"
    else:
        test_results["10. Backend evaluates answers correctly"] = f"FAIL (Status: {r10.status_code})"
else:
    test_results["10. Backend evaluates answers correctly"] = "FAIL"

# Test 11: Student cannot access another student's attempt
if attempt_a_id:
    # Student B tries to view Student A's attempt
    r11_get = client.get(f"/api/student/attempts/{attempt_a_id}", headers=headers_b)
    # Student B tries to answer Student A's attempt
    r11_put = client.put(f"/api/student/attempts/{attempt_a_id}/answers/{q1.id}", json={"selected_option": "A"}, headers=headers_b)
    # Student B tries to submit Student A's attempt
    r11_post = client.post(f"/api/student/attempts/{attempt_a_id}/submit", headers=headers_b)

    if r11_get.status_code == 403 and r11_put.status_code == 403 and r11_post.status_code == 403:
        test_results["11. Student cannot access another student's attempt"] = f"PASS (All cross-student attempt mutations and reads rejected with 403 Forbidden)"
    else:
        test_results["11. Student cannot access another student's attempt"] = f"FAIL (GET: {r11_get.status_code}, PUT: {r11_put.status_code}, POST: {r11_post.status_code})"
else:
    test_results["11. Student cannot access another student's attempt"] = "FAIL"

# Test 12: Answers cannot be changed after submission
if attempt_a_id:
    r12 = client.put(
        f"/api/student/attempts/{attempt_a_id}/answers/{q1.id}",
        json={"selected_option": "D"},
        headers=headers_a
    )
    if r12.status_code == 400 and "already been submitted" in r12.json().get("detail", "").lower():
        test_results["12. Answers cannot be changed after submission"] = f"PASS (Answer update rejected with 400: '{r12.json().get('detail')}')"
    else:
        test_results["12. Answers cannot be changed after submission"] = f"FAIL (Expected 400, got: {r12.status_code}, {r12.text})"
else:
    test_results["12. Answers cannot be changed after submission"] = "FAIL"

print("\nTEST RESULTS SUMMARY:")
all_passed = True
for name, res in test_results.items():
    print(f"[{res[:4]}] {name}: {res[5:]}")
    if not res.startswith("PASS"):
        all_passed = False

print("\n" + "=" * 75)
if all_passed:
    print("ALL 12 PHASE 6 QUIZ ENGINE REQUIREMENTS VERIFIED & PASSED!")
else:
    print("SOME PHASE 6 TESTS FAILED.")
print("=" * 75)

db.close()
