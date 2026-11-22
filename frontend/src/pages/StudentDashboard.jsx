import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  History,
  KeyRound,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  Loader2,
  AlertCircle,
  Users,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { getStudentDashboard, joinStudentQuiz } from '../services/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quick Join Form State
  const [quickCode, setQuickCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await getStudentDashboard();
      setDashboardData(data);
      setError('');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to load student dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleQuickJoin = async (e) => {
    e.preventDefault();
    if (!quickCode.trim()) {
      setJoinError('Please enter a valid quiz code.');
      return;
    }

    setJoining(true);
    setJoinError('');

    try {
      const res = await joinStudentQuiz({ quiz_code: quickCode.trim().toUpperCase() });
      const targetId = res.quiz_id || res.quiz?.id;
      navigate(`/student/quizzes/${targetId}/instructions`);
    } catch (err) {
      setJoinError(
        err.response?.data?.detail ||
        err.message ||
        'Could not join quiz with this code.'
      );
    } finally {
      setJoining(false);
    }
  };

  const rawStats = dashboardData?.stats || {};
  const stats = {
    total_attended: rawStats.total_quizzes_attended ?? rawStats.total_attended ?? 0,
    upcoming_quizzes_count: rawStats.upcoming_quizzes ?? rawStats.upcoming_quizzes_count ?? 0,
    available_quizzes_count: rawStats.available_quizzes ?? rawStats.available_quizzes_count ?? 0,
    completed_quizzes_count: rawStats.completed_quizzes ?? rawStats.completed_quizzes_count ?? 0,
  };

  const recentActivities = dashboardData?.recent_activity || dashboardData?.recent_activities || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Student Learning Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name || 'Student'}! 👋
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-50">
            Discover scheduled quizzes, join live test sessions with your quiz code, and keep track of your academic progress.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/student/quizzes/available"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-800 text-xs sm:text-sm font-semibold hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              View Live Quizzes
            </Link>
            <Link
              to="/student/quizzes/upcoming"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700/50 hover:bg-emerald-700/70 text-white text-xs sm:text-sm font-medium transition-colors border border-white/20"
            >
              <Calendar className="w-4 h-4 text-emerald-200" />
              Upcoming Schedule
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Attended */}
        <Card className="border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Attended
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? '...' : stats.total_attended}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Quizzes participated</p>
        </Card>

        {/* Upcoming Quizzes */}
        <Card className="border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Upcoming Quizzes
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? '...' : stats.upcoming_quizzes_count}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <Link
            to="/student/quizzes/upcoming"
            className="text-[11px] text-blue-600 hover:text-blue-700 font-medium mt-3 inline-flex items-center gap-1"
          >
            Check schedule <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Live Available */}
        <Card className="border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Available Now
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? '...' : stats.available_quizzes_count}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <Link
            to="/student/quizzes/available"
            className="text-[11px] text-amber-600 hover:text-amber-700 font-medium mt-3 inline-flex items-center gap-1"
          >
            Take test now <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Completed Quizzes */}
        <Card className="border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Completed
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? '...' : stats.completed_quizzes_count}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <Link
            to="/student/quizzes/history"
            className="text-[11px] text-purple-600 hover:text-purple-700 font-medium mt-3 inline-flex items-center gap-1"
          >
            View score history <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>
      </div>

      {/* Main Grid: Quick Code Join + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Join Card (1 col) */}
        <Card className="border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Join With Quiz Code</h2>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Have a 6-character access code from your instructor? Enter it here to access your quiz instructions instantly.
            </p>

            <form onSubmit={handleQuickJoin} className="space-y-4">
              <div>
                <label htmlFor="quickCode" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Quiz Code
                </label>
                <div className="relative">
                  <input
                    id="quickCode"
                    type="text"
                    value={quickCode}
                    onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                    placeholder="e.g. QC789A"
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 text-sm uppercase font-mono tracking-widest text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {joinError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{joinError}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={joining || !quickCode.trim()}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Validating Code...
                  </>
                ) : (
                  <>
                    Join Quiz Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Tip: Your instructor generates quiz codes when a quiz is published.
          </div>
        </Card>

        {/* Recent Quiz Activity (2 cols) */}
        <Card className="border-slate-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-bold text-slate-900">Recent Quiz Activity</h2>
            </div>
            <Link
              to="/student/quizzes/history"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View Full History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading your recent activities...</p>
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentActivities.map((act) => (
                <div key={act.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {act.title || act.quiz_title}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{act.subject}</span>
                      <span>•</span>
                      <span>
                        Instructor: {act.teacher_name}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant={
                        act.quiz_status === 'published'
                          ? 'emerald'
                          : act.quiz_status === 'scheduled'
                          ? 'blue'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {act.quiz_status || 'available'}
                    </Badge>
                    <Link
                      to={`/student/quizzes/${act.id}/instructions`}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium text-slate-600">No recent quiz activity</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Once you join or complete quizzes, your participation record and scores will appear here.
              </p>
              <div className="mt-4">
                <Link
                  to="/student/quizzes/available"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Browse available live quizzes <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
