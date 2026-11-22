# QuizConnect

**Tagline:** Learn. Attend. Achieve.

QuizConnect is a scheduled online quiz management platform designed for modern academic and organizational environments. Teachers organize and schedule quizzes, while students attend them securely using unique quiz codes.

---

## 🚀 Tech Stack

### Frontend
- **Framework:** React.js (v18+) with Vite
- **Styling:** Tailwind CSS (Modern Blue & White SaaS theme)
- **Routing:** React Router DOM (v6+)
- **HTTP Client:** Axios
- **Icons:** Lucide React

### Backend
- **Framework:** Python FastAPI
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
│   │   ├── components/      # Reusable UI components (Navbar, Footer, Card, Button, Badge)
│   │   ├── pages/           # View pages (LandingPage)
│   │   ├── layouts/         # Layout wrappers (MainLayout)
│   │   ├── services/        # API client & services (Axios baseURL setup)
│   │   ├── context/         # React Context providers (Prepared for Phase 2)
│   │   ├── App.jsx          # Root routing configuration
│   │   ├── main.jsx         # Application entry point
│   │   └── index.css        # Tailwind CSS imports & base styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── routes/          # API route controllers (health check)
│   │   ├── services/        # Business logic services
│   │   ├── config.py        # Centralized settings & CORS config
│   │   ├── database.py      # SQLite connection & session management
│   │   └── main.py          # FastAPI application factory
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── README.md
└── .gitignore
```

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

## 📋 Phase 1 Scope & Status
- [x] Monorepo folder structure initialized.
- [x] FastAPI server configured with CORS middleware.
- [x] SQLite database connection & session setup with SQLAlchemy.
- [x] Health check API (`/api/health`) testing server & database connectivity.
- [x] React + Vite configured with Tailwind CSS.
- [x] Clean SaaS Landing Page with Teacher and Student cards.
- [x] Live backend connectivity status indicator in frontend.
- [ ] Phase 2: Authentication & User Roles (Upcoming).
- [ ] Phase 3: Teacher Quiz Management (Upcoming).
- [ ] Phase 4: Student Quiz Taking & Results (Upcoming).
