# QuizConnect

**Tagline:** Learn. Attend. Achieve.

QuizConnect is a scheduled online quiz management platform designed for modern academic and organizational environments. Teachers organize, schedule, and oversee quizzes, while students attend them securely using unique quiz codes.

---

## 🚀 Tech Stack

### Frontend
- **Framework:** React.js (v18+) with Vite
- **Styling:** Tailwind CSS (Modern Blue & White SaaS theme)
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
│   │   │   └── StudentDashboard.jsx
│   │   ├── layouts/         # MainLayout, TeacherLayout (sidebar navigation)
│   │   ├── services/        # Axios API client (Auth, Teacher Quizzes, Health)
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
│   │   ├── models/          # SQLAlchemy ORM models (User, Quiz, UserRole, QuizStatus)
│   │   ├── schemas/         # Pydantic validation schemas (User, Quiz, Auth, Dashboard, Health)
│   │   ├── routes/          # API controllers (health, auth, teacher, student)
│   │   ├── services/        # Security & Auth dependencies (Argon2, JWT signing, role checking)
│   │   ├── config.py        # Centralized settings (CORS, JWT secret, expiry)
│   │   ├── database.py      # SQLite connection & session management
│   │   └── main.py          # FastAPI application factory
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── README.md
└── .gitignore
```

---

## 🛡️ Security & Role-Based Access Control (RBAC)

- **Strict Multi-Tenant Isolation:** Teachers can only access, view, modify, and delete quizzes they created. Attempts to query or mutate another teacher's quiz return `HTTP 403 Forbidden`.
- **Role Permissions:** Endpoints under `/api/teacher/*` require the `teacher` role (`HTTP 403 Forbidden` for students). Unauthenticated requests return `HTTP 401 Unauthorized`.
- **Scheduling Rules:** End times must strictly follow start times. A quiz cannot be set to `published` before its scheduled start time has arrived.

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
- [ ] **Phase 4: Question Management & Student Quiz Taking** (Upcoming)
