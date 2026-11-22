import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpenCheck,
  PlusCircle,
  Search,
  Calendar,
  Clock,
  Award,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  X,
  Filter,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getTeacherQuizzes, deleteTeacherQuiz } from '../services/api';

export default function MyQuizzes() {
  const location = useLocation();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flashMessage, setFlashMessage] = useState(location.state?.flash || '');

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [viewingQuiz, setViewingQuiz] = useState(null);
  const [deletingQuiz, setDeletingQuiz] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const data = await getTeacherQuizzes(params);
      setQuizzes(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to fetch your quizzes.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuizzes();
  };

  const confirmDelete = async () => {
    if (!deletingQuiz) return;
    setDeletingLoading(true);
    try {
      await deleteTeacherQuiz(deletingQuiz.id);
      setFlashMessage(`Quiz "${deletingQuiz.title}" deleted successfully.`);
      setDeletingQuiz(null);
      fetchQuizzes();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete quiz.');
    } finally {
      setDeletingLoading(false);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Quizzes</h1>
            <Badge variant="blue" size="sm">
              {quizzes.length} Total
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your created quizzes, review scheduled timelines, and adjust parameters
          </p>
        </div>

        <Link to="/teacher/quizzes/create">
          <Button variant="primary" size="md" icon={PlusCircle} iconPosition="left">
            Create Quiz
          </Button>
        </Link>
      </div>

      {/* Notifications */}
      {flashMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{flashMessage}</span>
          </div>
          <button onClick={() => setFlashMessage('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card hover={false} className="p-4 sm:p-5 border-slate-200">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
            {['all', 'draft', 'scheduled', 'published', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                  statusFilter === tab
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>
        </div>
      </Card>

      {/* Quizzes Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading your quizzes...</p>
          </div>
        ) : quizzes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3.5 px-6">Quiz Details</th>
                  <th className="py-3.5 px-6">Subject</th>
                  <th className="py-3.5 px-6">Schedule Window</th>
                  <th className="py-3.5 px-6">Duration & Marks</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 max-w-sm truncate">{quiz.title}</div>
                      {quiz.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-sm mt-0.5">
                          {quiz.description}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                        {quiz.subject}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(quiz.start_time).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(quiz.start_time).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(quiz.end_time).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{quiz.duration_minutes} mins</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Pass: {quiz.passing_marks} / {quiz.maximum_marks}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {getStatusBadge(quiz.status)}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* View Button */}
                        <button
                          onClick={() => setViewingQuiz(quiz)}
                          title="View Details"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <Link
                          to={`/teacher/quizzes/edit/${quiz.id}`}
                          title="Edit Quiz"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeletingQuiz(quiz)}
                          title="Delete Quiz"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <BookOpenCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">No quizzes found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              {search || statusFilter !== 'all'
                ? 'Try clearing your search query or changing the status filter.'
                : 'Create your first scheduled quiz to begin managing assessments.'}
            </p>
            <Link to="/teacher/quizzes/create">
              <Button variant="primary" size="sm" icon={PlusCircle} iconPosition="left">
                Create Quiz Now
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* View Quiz Details Modal */}
      {viewingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in duration-150">
            <button
              onClick={() => setViewingQuiz(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                {viewingQuiz.subject}
              </span>
              {getStatusBadge(viewingQuiz.status)}
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">{viewingQuiz.title}</h3>

            {viewingQuiz.description && (
              <p className="text-xs text-slate-600 mb-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {viewingQuiz.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-semibold uppercase">
                  Start Window
                </span>
                <span className="font-medium text-slate-800">
                  {new Date(viewingQuiz.start_time).toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-semibold uppercase">
                  End Window
                </span>
                <span className="font-medium text-slate-800">
                  {new Date(viewingQuiz.end_time).toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-semibold uppercase">
                  Duration Allowed
                </span>
                <span className="font-medium text-slate-800">{viewingQuiz.duration_minutes} Minutes</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-semibold uppercase">
                  Marks Requirement
                </span>
                <span className="font-medium text-slate-800">
                  Pass: {viewingQuiz.passing_marks} / Max: {viewingQuiz.maximum_marks}
                </span>
              </div>
            </div>

            {viewingQuiz.instructions && (
              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Student Instructions
                </span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                  {viewingQuiz.instructions}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Link to={`/teacher/quizzes/edit/${viewingQuiz.id}`}>
                <Button variant="outline" size="sm" icon={Edit} iconPosition="left">
                  Edit Quiz
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={() => setViewingQuiz(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Quiz?</h3>
            <p className="text-xs text-rose-600 font-semibold mb-3">This action cannot be undone.</p>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-slate-900">"{deletingQuiz.title}"</strong>?
              All associated schedules and settings for this quiz will be permanently removed.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDeletingQuiz(null)}
                disabled={deletingLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 focus:ring-rose-500"
                onClick={confirmDelete}
                disabled={deletingLoading}
                icon={deletingLoading ? Loader2 : Trash2}
                iconPosition="right"
              >
                {deletingLoading ? 'Deleting...' : 'Delete Quiz'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
