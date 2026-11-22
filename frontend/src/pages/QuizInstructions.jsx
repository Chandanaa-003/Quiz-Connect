import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  Award,
  Calendar,
  Users,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getStudentQuizInstructions } from '../services/api';

export default function QuizInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const fetchInstructions = async () => {
      setLoading(true);
      try {
        const data = await getStudentQuizInstructions(id);
        setQuiz(data);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to load quiz instructions.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInstructions();
    }
  }, [id]);

  const handleStartQuiz = () => {
    if (!agreed) {
      alert('Please check and accept the quiz rules and instructions before proceeding.');
      return;
    }
    // Navigate to the Phase 5 placeholder page as required
    navigate(`/student/quizzes/${id}/placeholder`);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading quiz instructions and guidelines...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card className="border-rose-200 bg-rose-50/50 p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-rose-900">Unable to View Quiz</h2>
          <p className="text-xs text-rose-700">{error || 'Quiz not found or unauthorized.'}</p>
          <div className="pt-2">
            <Link to="/student/dashboard">
              <Button variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Breadcrumb / Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/quizzes/available"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </Link>
        <Badge variant="blue" size="sm">
          Assessment Briefing
        </Badge>
      </div>

      {/* Quiz Header Overview */}
      <Card className="border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
                {quiz.subject}
              </span>
              {quiz.quiz_code && (
                <span className="text-xs text-slate-400 font-mono">Code: {quiz.quiz_code}</span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{quiz.title}</h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Conducted by Instructor: <strong className="text-slate-700">{quiz.teacher_name}</strong></span>
            </p>
          </div>
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Duration</span>
            <span className="text-base font-bold text-slate-800 mt-1 block flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              {quiz.duration_minutes} mins
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Max Marks</span>
            <span className="text-base font-bold text-slate-800 mt-1 block flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              {quiz.maximum_marks} pts
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Passing Marks</span>
            <span className="text-base font-bold text-slate-800 mt-1 block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {quiz.passing_marks} pts
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Questions</span>
            <span className="text-base font-bold text-slate-800 mt-1 block flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              {quiz.number_of_questions || quiz.total_questions || 'Standard'} Qs
            </span>
          </div>
        </div>

        {/* Schedule Window Info */}
        <div className="py-4 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              <strong>Start Time:</strong> {new Date(quiz.start_time).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              <strong>Closing Time:</strong> {new Date(quiz.end_time).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Teacher's Specific Instructions */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Instructor's Instructions
          </h2>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
            {quiz.instructions || 'No special instructions provided by the instructor.'}
          </div>
        </div>

        {/* Important Examination Guidelines */}
        <div className="mt-5 p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Important Quiz Guidelines</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-amber-800 pl-1">
            <li>Ensure you have a reliable internet connection before starting.</li>
            <li>The timer begins immediately once the quiz begins and cannot be paused.</li>
            <li>Do not refresh or close your browser tab during the test session.</li>
            <li>Answers will be automatically submitted when the duration expires.</li>
          </ul>
        </div>

        {/* Acknowledgment Checkbox */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-700 leading-normal">
              I have read and agree to follow all instructions and examination rules mentioned above.
            </span>
          </label>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link to="/student/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full sm:w-auto justify-center">
              Back to Dashboard
            </Button>
          </Link>
          <Button
            onClick={handleStartQuiz}
            variant="primary"
            size="md"
            disabled={!agreed}
            className={`w-full sm:w-auto justify-center ${
              agreed
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Start Quiz <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
