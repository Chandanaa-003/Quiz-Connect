import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { createTeacherQuiz } from '../services/api';

export default function CreateQuiz() {
  const navigate = useNavigate();

  // Helper to format default datetime-local string (ISO format without trailing Z)
  const getDefaultDateTime = (offsetHours = 24) => {
    const d = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
  };

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    instructions: '',
    start_time: getDefaultDateTime(2),
    end_time: getDefaultDateTime(5),
    duration_minutes: 60,
    maximum_marks: 100,
    passing_marks: 40,
    status: 'draft', // 'draft' or 'scheduled'
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Scheduling date validation
    if (formData.status === 'scheduled' && startDate <= new Date()) {
      errs.start_time = 'Scheduled quizzes must have a start time in the future.';
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

      await createTeacherQuiz(payload);
      navigate('/teacher/quizzes', { state: { flash: 'Quiz created successfully!' } });
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Failed to create quiz. Please verify the provided details.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

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

        <Badge variant="blue" size="sm" icon={Sparkles}>
          Phase 3 Quiz Authoring
        </Badge>
      </div>

      <Card className="border-slate-200/90 shadow-sm">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Quiz</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure assessment timing, pass criteria, and scheduling parameters
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
                  placeholder="e.g. Distributed Systems Midterm Exam"
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    errors.title ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                  } rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition`}
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
                  placeholder="e.g. Computer Science"
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    errors.subject ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                  } rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition`}
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
                placeholder="Brief summary of syllabus or topics covered..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                placeholder="e.g. No calculator allowed. Ensure you have a stable network connection before starting."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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

          {/* Publishing Mode Radio */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Publication Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  formData.status === 'draft'
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={formData.status === 'draft'}
                  onChange={handleChange}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Save as Draft</span>
                  <span className="text-xs text-slate-500">
                    Keep quiz in draft status. You can edit questions and schedule it later.
                  </span>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  formData.status === 'scheduled'
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="scheduled"
                  checked={formData.status === 'scheduled'}
                  onChange={handleChange}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Schedule Quiz</span>
                  <span className="text-xs text-slate-500">
                    Automatically publishes when the scheduled start time arrives.
                  </span>
                </div>
              </label>
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
              {loading
                ? 'Saving Quiz...'
                : formData.status === 'scheduled'
                ? 'Schedule Quiz'
                : 'Save as Draft'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
