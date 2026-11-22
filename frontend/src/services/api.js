import axios from 'axios';

/**
 * QuizConnect Axios Client
 * Configured with automatic JWT Bearer token injection and error handling.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token from localStorage to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('quizconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentToken = localStorage.getItem('quizconnect_token');
      if (currentToken && !error.config.url.includes('/auth/login')) {
        localStorage.removeItem('quizconnect_token');
        localStorage.removeItem('quizconnect_user');
      }
    }
    return Promise.reject(error);
  }
);

// --- Authentication Endpoints ---

export const registerUser = async (payload) => {
  const response = await api.post('/api/auth/register', payload);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

// --- Teacher Dashboard & Quiz Management Endpoints ---

export const getTeacherDashboard = async () => {
  const response = await api.get('/api/teacher/dashboard');
  return response.data;
};

export const getTeacherQuizzes = async (params = {}) => {
  const response = await api.get('/api/teacher/quizzes', { params });
  return response.data;
};

export const getTeacherQuiz = async (quizId) => {
  const response = await api.get(`/api/teacher/quizzes/${quizId}`);
  return response.data;
};

export const createTeacherQuiz = async (payload) => {
  const response = await api.post('/api/teacher/quizzes', payload);
  return response.data;
};

export const updateTeacherQuiz = async (quizId, payload) => {
  const response = await api.put(`/api/teacher/quizzes/${quizId}`, payload);
  return response.data;
};

export const deleteTeacherQuiz = async (quizId) => {
  const response = await api.delete(`/api/teacher/quizzes/${quizId}`);
  return response.data;
};

// --- Student Endpoints (Phase 5) ---

export const getStudentDashboard = async () => {
  const response = await api.get('/api/student/dashboard');
  return response.data;
};

export const getStudentUpcomingQuizzes = async () => {
  const response = await api.get('/api/student/quizzes/upcoming');
  return response.data;
};

export const getStudentAvailableQuizzes = async () => {
  const response = await api.get('/api/student/quizzes/available');
  return response.data;
};

export const getStudentQuizHistory = async () => {
  const response = await api.get('/api/student/quizzes/history');
  return response.data;
};

export const joinStudentQuiz = async (payload) => {
  const response = await api.post('/api/student/quizzes/join', payload);
  return response.data;
};

export const getStudentQuizInstructions = async (quizId) => {
  const response = await api.get(`/api/student/quizzes/${quizId}/instructions`);
  return response.data;
};

// --- Phase 6: Quiz Engine Endpoints ---

export const startQuiz = async (quizId) => {
  const response = await api.post(`/api/student/quizzes/${quizId}/start`);
  return response.data;
};

export const getAttemptDetail = async (attemptId) => {
  const response = await api.get(`/api/student/attempts/${attemptId}`);
  return response.data;
};

export const saveAttemptAnswer = async (attemptId, questionId, payload) => {
  const response = await api.put(`/api/student/attempts/${attemptId}/answers/${questionId}`, payload);
  return response.data;
};

export const submitAttempt = async (attemptId, payload = {}) => {
  const response = await api.post(`/api/student/attempts/${attemptId}/submit`, payload);
  return response.data;
};

export const getAttemptResult = async (attemptId) => {
  const response = await api.get(`/api/student/attempts/${attemptId}/result`);
  return response.data;
};

// --- Teacher Questions API ---

export const getTeacherQuizQuestions = async (quizId) => {
  const response = await api.get(`/api/teacher/quizzes/${quizId}/questions`);
  return response.data;
};

export const addTeacherQuizQuestion = async (quizId, payload) => {
  const response = await api.post(`/api/teacher/quizzes/${quizId}/questions`, payload);
  return response.data;
};

export const deleteTeacherQuizQuestion = async (quizId, questionId) => {
  const response = await api.delete(`/api/teacher/quizzes/${quizId}/questions/${questionId}`);
  return response.data;
};

// --- Phase 7: Analytics, Reports & Leaderboards ---

export const getTeacherAnalyticsOverview = async () => {
  const response = await api.get('/api/teacher/analytics/overview');
  return response.data;
};

export const getTeacherQuizAnalytics = async (quizId) => {
  const response = await api.get(`/api/teacher/quizzes/${quizId}/analytics`);
  return response.data;
};

export const getTeacherQuizLeaderboard = async (quizId) => {
  const response = await api.get(`/api/teacher/quizzes/${quizId}/leaderboard`);
  return response.data;
};

export const downloadTeacherQuizReportCsv = async (quizId) => {
  const response = await api.get(`/api/teacher/quizzes/${quizId}/report/csv`, {
    responseType: 'blob',
  });
  return response.data;
};

export const getStudentAnalyticsOverview = async () => {
  const response = await api.get('/api/student/analytics/overview');
  return response.data;
};

export const getStudentAnalyticsPerformance = async () => {
  const response = await api.get('/api/student/analytics/performance');
  return response.data;
};

export const getStudentQuizLeaderboard = async (quizId) => {
  const response = await api.get(`/api/student/quizzes/${quizId}/leaderboard`);
  return response.data;
};

export const getStudentQuizResultByQuizId = async (quizId) => {
  const response = await api.get(`/api/student/quizzes/${quizId}/result`);
  return response.data;
};

// --- System Health Endpoint ---

export const checkHealth = async () => {
  try {
    const response = await api.get('/api/health');
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.message || error.message || 'Unable to connect to backend',
    };
  }
};

export default api;
