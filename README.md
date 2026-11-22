# QuizConnect

**Tagline:** Learn. Attend. Achieve.

QuizConnect is a scheduled online quiz management platform designed for modern academic and organizational environments. Teachers organize, schedule, and oversee quizzes, while students attend them securely using unique quiz codes.

---

## 🚀 Tech Stack

### Frontend
- **Framework:** React.js (v18+) with Vite
- **Styling:** Tailwind CSS (Modern Blue, Emerald & Slate SaaS theme)
- **Routing:** React Router DOM (v6+) with Protected Role Guards
- **HTTP Client:** Axios (Configured with JWT Bearer Interceptors)
- **Icons:** Lucide React

### Backend
- **Framework:** Python FastAPI
- **Authentication:** JWT (JSON Web Tokens) with HS256 & claim verification
- **Password Hashing:** Argon2id (`argon2-cffi`)
- **ORM:** SQLAlchemy 2.0
- **Database:** SQLite (embedded, zero-configuration)
- **Validation:** Pydantic v2 & Pydantic-Settings
- **Server:** Uvicorn ASGI

---

## 📁 Project Structure

```
QuizConnect/
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Navbar, Footer, Card, Button, Badge, ProtectedRoute)
│   │   ├── pages/           # Pages:
│   │   │   ├── LandingPage.jsx
│   │   │   ├── TeacherLogin.jsx & TeacherRegister.jsx
│   │   │   ├── StudentLogin.jsx & StudentRegister.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── MyQuizzes.jsx
│   │   │   ├── CreateQuiz.jsx
│   │   │   ├── EditQuiz.jsx
│   │   │   ├── TeacherReports.jsx
│   │   │   ├── TeacherProfile.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── UpcomingQuizzes.jsx
│   │   │   ├── AvailableQuizzes.jsx
│   │   │   ├── JoinQuizPage.jsx
│   │   │   ├── QuizInstructions.jsx
│   │   │   ├── QuizTakingPlaceholder.jsx
│   │   │   ├── MyQuizHistory.jsx
│   │   │   └── StudentProfile.jsx
│   │   ├── layouts/         # MainLayout, TeacherLayout, StudentLayout (sidebar navigation)
│   │   ├── services/        # Axios API client (Auth, Teacher Quizzes, Student Quizzes, Health)
│   │   ├── context/         # AuthContext (JWT persistence, user state, auto-refresh)
│   │   ├── App.jsx          # Protected route mapping & role guards
│   │   ├── main.jsx         # React application entry point
│   │   └── index.css        # Tailwind CSS imports & styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── .env
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models (User, Quiz, QuizParticipation)
│   │   ├── schemas/         # Pydantic validation schemas (User, Quiz, Student, Auth, Dashboard, Health)
│   │   ├── routes/          # API controllers (health, auth, teacher, student)
│   │   ├── services/        # Security & Auth dependencies (Argon2, JWT signing, role checking)
│   │   ├── config.py        # Centralized settings (CORS, JWT secret, expiry)
│   │   ├── database.py      # SQLite connection & session management
│   │   └── main.py          # FastAPI application factory & schema migrations
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── README.md
└── .gitignore
```

---

## 🛡️ Security & Role-Based Access Control (RBAC)

- **Student API Protection:** Endpoints under `/api/student/*` require an active authenticated user with the `student` role (`HTTP 403 Forbidden` for teachers).
- **Teacher API Protection:** Endpoints under `/api/teacher/*` require the `teacher` role (`HTTP 403 Forbidden` for students).
- **Sanitized Information Exposure:** Student quiz discovery endpoints never expose questions, draft quizzes, or teacher account credentials. Only public details (`title`, `subject`, `teacher_name`, `start_time`, `end_time`, `duration_minutes`, `maximum_marks`) are returned.
- **Participation Integrity:** Duplicate quiz registrations are prevented via the `uq_student_quiz_participation` database unique constraint. Expired or draft quizzes cannot be joined.

---

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://localhost:8000`
- Interactive API Docs (Swagger): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Frontend Web App: `http://localhost:5173`

---

## 📋 Project Roadmap
- [x] **Phase 1: Project Initialization** (Folder structure, FastAPI, SQLite, Tailwind, React, CORS, Health Check)
- [x] **Phase 2: Complete Authentication System** (Argon2 password hashing, JWT tokens, RBAC, Teacher/Student Login & Register, Protected Dashboards)
- [x] **Phase 3: Teacher Dashboard and Quiz Management** (Responsive sidebar, Create/Edit/Delete Quiz, Schedule validation, My Quizzes table, Search & Filters)
- [x] **Phase 5: Student Dashboard & Quiz Discovery** (Student Workspace, Upcoming Quizzes, Available Live Quizzes, Quiz Code Access, Briefing/Instructions Page, Quiz History, Duplicate Prevention)
- [ ] **Phase 6: Quiz-Taking Engine & Evaluation** (Timed Question Engine, Auto Submission, Real-time Scoring)
