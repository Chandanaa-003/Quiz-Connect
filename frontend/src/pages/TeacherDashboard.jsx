import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpenCheck,
  PlusCircle,
  Clock,
  Calendar,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
  ArrowRight,
  Eye,
  Edit,
  Sparkles,
  FileEdit,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getTeacherDashboard } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await getTeacherDashboard();
        setData(res);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to load dashboard metrics.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge variant="emerald" size="sm">Published</Badge>;
      case 'scheduled':
        return <Badge variant="blue" size="sm">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="slate" size="sm">Completed</Badge>;
      case 'draft':
      default:
        return <Badge variant="slate" size="sm">Draft</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">Loading Teacher Workspace...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    total_quizzes: 0,
    draft_quizzes: 0,
    scheduled_quizzes: 0,
    published_quizzes: 0,
    completed_quizzes: 0,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <Badge variant="blue" size="sm" icon={Sparkles}>
              Educator Portal
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
            Organize scheduled quizzes, monitor student attendance windows, and review assessment analytics.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/teacher/quizzes/create">
            <Button variant="primary" size="md" icon={PlusCircle} iconPosition="left">
              Create New Quiz
            </Button>
          </Link>
          <Link to="/teacher/quizzes">
            <Button variant="outline" size="md" icon={BookOpenCheck} iconPosition="left">
              View All Quizzes
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* 5 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Quizzes */}
        <Card hover={false} className="border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Quizzes
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.total_quizzes}</p>
          <p className="text-[11px] text-slate-500 mt-1">All assessments created</p>
        </Card>

        {/* Draft Quizzes */}
        <Card hover={false} className="border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Draft Quizzes
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileEdit className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.draft_quizzes}</p>
          <p className="text-[11px] text-slate-500 mt-1">Unscheduled drafts</p>
        </Card>

        {/* Scheduled Quizzes */}
        <Card hover={false} className="border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Scheduled Quizzes
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.scheduled_quizzes}</p>
          <p className="text-[11px] text-slate-500 mt-1">Upcoming session dates</p>
        </Card>

        {/* Published Quizzes */}
        <Card hover={false} className="border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Published Quizzes
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.published_quizzes}</p>
          <p className="text-[11px] text-slate-500 mt-1">Active test window</p>
        </Card>

        {/* Completed Quizzes */}
        <Card hover={false} className="border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Completed Quizzes
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.completed_quizzes}</p>
          <p className="text-[11px] text-slate-500 mt-1">Concluded sessions</p>
        </Card>
      </div>

      {/* Recent Quiz Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Quiz Activity</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest quizzes created and managed in your account</p>
          </div>

          <Link
            to="/teacher/quizzes"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data?.recent_quizzes && data.recent_quizzes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3 px-6">Quiz Title</th>
                  <th className="py-3 px-6">Subject</th>
                  <th className="py-3 px-6">Schedule Window</th>
                  <th className="py-3 px-6">Duration</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {data.recent_quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="max-w-xs truncate">{quiz.title}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                      <span className="px-2 py-1 bg-slate-100 rounded-md">{quiz.subject}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs">
                      {new Date(quiz.start_time).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs">
                      {quiz.duration_minutes} mins
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(quiz.status)}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        to={`/teacher/quizzes`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 px-6 text-center bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">No quizzes created yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Get started by drafting your first assessment or scheduling an upcoming quiz session.
            </p>
            <Link to="/teacher/quizzes/create">
              <Button variant="primary" size="sm" icon={PlusCircle} iconPosition="left">
                Create First Quiz
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
