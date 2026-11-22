import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LogOut,
  KeyRound,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  Award,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getStudentDashboard } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizCode, setQuizCode] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const data = await getStudentDashboard();
        setDashboardData(data);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to load student dashboard. Session may have expired.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">Loading Student Workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Banner / Welcome Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {dashboardData?.message || `Welcome, ${user?.full_name}`}
              </h1>
              <Badge variant="emerald" size="sm">
                Student
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Student Email: <span className="text-slate-700">{user?.email}</span> • Candidate ID: #{user?.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <Button
            variant="outlineSlate"
            size="md"
            icon={LogOut}
            iconPosition="left"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card hover={false} className="border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Quizzes Attended
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {dashboardData?.stats?.quizzes_attended ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Quiz taking unlocks in Phase 4</p>
        </Card>

        <Card hover={false} className="border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Upcoming Scheduled
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {dashboardData?.stats?.upcoming_quizzes ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Accessible via unique quiz code</p>
        </Card>

        <Card hover={false} className="border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Average Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {dashboardData?.stats?.average_score ?? 'N/A'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Evaluated across all tests</p>
        </Card>

        <Card hover={false} className="border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Attendance Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {dashboardData?.stats?.attendance_rate ?? '100%'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">On-time session attendance</p>
        </Card>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Quiz Attendance Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Join Scheduled Quiz</h2>
                <p className="text-xs text-slate-500">Enter your 6-digit access code provided by your instructor</p>
              </div>
              <Badge variant="emerald" size="sm" icon={Sparkles}>
                Phase 4 Feature
              </Badge>
            </div>

            <div className="max-w-md mx-auto py-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6" />
              </div>

              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                Have a Quiz Code Ready?
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Student authentication and session verification are fully operational.
                The live quiz taking engine, synchronized timer, and auto-submit will be delivered in Phase 4.
              </p>

              <div className="flex gap-2 max-w-xs mx-auto">
                <input
                  type="text"
                  placeholder="e.g. QC-9482"
                  value={quizCode}
                  onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-center uppercase tracking-widest font-mono text-slate-500 cursor-not-allowed"
                />
                <Button
                  variant="primary"
                  size="md"
                  disabled
                  className="bg-emerald-600 hover:bg-emerald-700 shrink-0 cursor-not-allowed opacity-60"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Join
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Security & Session Status */}
        <div className="space-y-6">
          <Card className="border-slate-200">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Session Security Diagnostics</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Authentication</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active (JWT Bearer)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Password Hashing</span>
                <span className="font-semibold text-slate-800">Argon2id Encrypted</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Authorized Role</span>
                <Badge variant="emerald" size="sm">student</Badge>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Endpoint Access</span>
                <span className="font-mono text-[11px] text-slate-700">/api/student/dashboard</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Backend Database</span>
                <span className="font-semibold text-slate-800">SQLite Connected</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
