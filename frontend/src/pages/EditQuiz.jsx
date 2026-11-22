import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getTeacherQuiz, updateTeacherQuiz } from '../services/api';

export default function EditQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    instructions: '',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    maximum_marks: 100,
    passing_marks: 40,
    status: 'draft',
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to format ISO date string for datetime-local input
  const formatForInput = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      setInitialLoading(true);
      try {
        const quiz = await getTeacherQuiz(id);
        setFormData({
          title: quiz.title || '',
          subject: quiz.subject || '',
          description: quiz.description || '',
          instructions: quiz.instructions || '',
          start_time: formatForInput(quiz.start_time),
          end_time: formatForInput(quiz.end_time),
          duration_minutes: quiz.duration_minutes || 60,
          maximum_marks: quiz.maximum_marks || 100,
          passing_marks: quiz.passing_marks || 40,
          status: quiz.status || 'draft',
        });
      } catch (err) {
        setApiError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to load quiz details or access is restricted.'
        );
      } finally {
        setInitialLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Quiz title is required.';
    }
    if (!formData.subject.trim()) {
      errs.subject = 'Subject is required.';
    }
    if (!formData.start_time) {
      errs.start_time = 'Start date and time are required.';
    }
    if (!formData.end_time) {
      errs.end_time = 'End date and time are required.';
    }

    const startDate = new Date(formData.start_time);
    const endDate = new Date(formData.end_time);

    if (formData.start_time && formData.end_time && endDate <= startDate) {
      errs.end_time = 'End date and time must be strictly after the start date and time.';
    }

    if (!formData.duration_minutes || Number(formData.duration_minutes) <= 0) {
      errs.duration_minutes = 'Duration must be greater than zero minutes.';
    }

    if (!formData.maximum_marks || Number(formData.maximum_marks) <= 0) {
      errs.maximum_marks = 'Maximum marks must be greater than zero.';
    }

    if (
      formData.passing_marks === '' ||
      Number(formData.passing_marks) < 0
    ) {
      errs.passing_marks = 'Passing marks must be zero or greater.';
    } else if (Number(formData.passing_marks) > Number(formData.maximum_marks)) {
      errs.passing_marks = 'Passing marks cannot exceed maximum marks.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    try {
      const payload = {
        title: formData.title.trim(),
        subject: formData.subject.trim(),
        description: formData.description.trim() || null,
        instructions: formData.instructions.trim() || null,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        duration_minutes: Number(formData.duration_minutes),
        maximum_marks: Number(formData.maximum_marks),
        passing_marks: Number(formData.passing_marks),
        status: formData.status,
      };

      await updateTeacherQuiz(id, payload);
      navigate('/teacher/quizzes', { state: { flash: 'Quiz updated successfully!' } });
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Failed to update quiz.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">Loading Quiz Information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/teacher/quizzes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Quizzes</span>
        </Link>

        <Badge variant="blue" size="sm">
          Editing Quiz #{id}
        </Badge>
      </div>

      <Card className="border-slate-200/90 shadow-sm">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Quiz</h1>
          <p className="text-xs text-slate-500 mt-1">
            Update quiz parameters, timing windows, and publication options
          </p>
        </div>

        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{apiError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* General Information Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              General Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quiz Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    errors.title ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                  } rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition`}
                />
                {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    errors.subject ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                  } rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition`}
                />
                {errors.subject && <p className="text-xs text-rose-600 mt-1">{errors.subject}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instructions for Students (Optional)
              </label>
              <textarea
                name="instructions"
                rows={3}
                value={formData.instructions}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Schedule & Timing Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Scheduling & Timing Window
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    errors.start_time ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                  } rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition`}
                />
                {errors.start_time && <p className="text-xs text-rose-600 mt-1">{errors.start_time}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    errors.end_time ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                  } rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition`}
                />
                {errors.end_time && <p className="text-xs text-rose-600 mt-1">{errors.end_time}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration (Minutes) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleChange}
                    className={`w-full px-3.5 py-2.5 bg-white border ${
                      errors.duration_minutes ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                    } rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition`}
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.duration_minutes && <p className="text-xs text-rose-600 mt-1">{errors.duration_minutes}</p>}
              </div>
            </div>
          </div>

          {/* Grading & Marks Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              Grading & Marks
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maximum Marks <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  name="maximum_marks"
                  value={formData.maximum_marks}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    errors.maximum_marks ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                  } rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition`}
                />
                {errors.maximum_marks && <p className="text-xs text-rose-600 mt-1">{errors.maximum_marks}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Passing Marks <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  name="passing_marks"
                  value={formData.passing_marks}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    errors.passing_marks ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                  } rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition`}
                />
                {errors.passing_marks && <p className="text-xs text-rose-600 mt-1">{errors.passing_marks}</p>}
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Quiz Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['draft', 'scheduled', 'completed'].map((st) => (
                <label
                  key={st}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                    formData.status === st
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={st}
                    checked={formData.status === st}
                    onChange={handleChange}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-800 capitalize">{st}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link to="/teacher/quizzes">
              <Button variant="secondary" size="md">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              icon={loading ? Loader2 : CheckCircle2}
              iconPosition="right"
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
