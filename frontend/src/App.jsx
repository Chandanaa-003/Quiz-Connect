import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import TeacherLayout from './layouts/TeacherLayout';
import LandingPage from './pages/LandingPage';
import TeacherLogin from './pages/TeacherLogin';
import TeacherRegister from './pages/TeacherRegister';
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import TeacherDashboard from './pages/TeacherDashboard';
import MyQuizzes from './pages/MyQuizzes';
import CreateQuiz from './pages/CreateQuiz';
import EditQuiz from './pages/EditQuiz';
import TeacherReports from './pages/TeacherReports';
import TeacherProfile from './pages/TeacherProfile';
import StudentDashboard from './pages/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & MainLayout Routes */}
          <Route
            path="/"
            element={
              <MainLayout>
                <LandingPage />
              </MainLayout>
            }
          />
          <Route
            path="/teacher/login"
            element={
              <MainLayout>
                <TeacherLogin />
              </MainLayout>
            }
          />
          <Route
            path="/teacher/register"
            element={
              <MainLayout>
                <TeacherRegister />
              </MainLayout>
            }
          />
          <Route
            path="/student/login"
            element={
              <MainLayout>
                <StudentLogin />
              </MainLayout>
            }
          />
          <Route
            path="/student/register"
            element={
              <MainLayout>
                <StudentRegister />
              </MainLayout>
            }
          />

          {/* Protected Teacher Routes with TeacherLayout */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout>
                  <TeacherDashboard />
                </TeacherLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/quizzes"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout>
                  <MyQuizzes />
                </TeacherLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/quizzes/create"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout>
                  <CreateQuiz />
                </TeacherLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/quizzes/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout>
                  <EditQuiz />
                </TeacherLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/reports"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout>
                  <TeacherReports />
                </TeacherLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout>
                  <TeacherProfile />
                </TeacherLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Student Routes with MainLayout */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <StudentDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
