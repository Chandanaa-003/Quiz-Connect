import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Loader2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  LayoutDashboard,
  History,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getAttemptResult } from '../services/api';

export default function QuizResultPage() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      try {
        const data = await getAttemptResult(attemptId);
        setResult(data);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to retrieve quiz result.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchResult();
    }
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Evaluating your responses...</p>
        <p className="text-xs text-slate-400 mt-1">Calculating final score and grade metrics</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-rose-200 p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Result Not Available</h2>
          <p className="text-xs text-rose-600">{error || 'Could not find result for this attempt.'}</p>
          <div className="pt-2">
            <Link to="/student/dashboard">
              <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const passed = result.passed;
  const isAuto = result.status === 'auto_submitted';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Outcome Banner */}
        <div
          className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 text-white shadow-lg ${
            passed
              ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700'
              : 'bg-gradient-to-br from-slate-800 via-slate-700 to-zinc-900'
          }`}
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
                {passed ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Assessment Completed • Passed</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-slate-300" />
                    <span>Assessment Completed • Needs Improvement</span>
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {passed ? 'Congratulations! 🎉' : 'Quiz Completed'}
              </h1>

              <p className="text-sm sm:text-base text-white/90 max-w-md">
                {passed
                  ? `Great job! You achieved ${result.percentage}% on ${result.quiz_title}.`
                  : `You scored ${result.obtained_marks} out of ${result.total_marks} marks on ${result.quiz_title}. Review the subject material and try the next scheduled test.`}
              </p>

              {isAuto && (
                <p className="text-[11px] text-white/70 italic">
                  * Note: This attempt was automatically submitted upon timer expiration.
                </p>
              )}
            </div>

            {/* Score Ring / Pill */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0 min-w-[160px]">
              <span className="text-xs uppercase font-semibold tracking-wider text-white/80">
                Final Score
              </span>
              <span className="text-4xl font-extrabold tracking-tight my-1">
                {result.obtained_marks}
                <span className="text-lg font-normal text-white/70">/{result.total_marks}</span>
              </span>
              <Badge variant={passed ? 'emerald' : 'slate'} size="md" className="mt-1">
                {result.percentage}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Breakdown Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-slate-200 p-5 text-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-900 block">
              {result.correct_answers_count}
            </span>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Correct
            </span>
          </Card>

          <Card className="border-slate-200 p-5 text-center">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <XCircle className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-900 block">
              {result.incorrect_answers_count}
            </span>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Incorrect
            </span>
          </Card>

          <Card className="border-slate-200 p-5 text-center">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-900 block">
              {result.unanswered_count}
            </span>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Unanswered
            </span>
          </Card>

          <Card className="border-slate-200 p-5 text-center">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-900 block">
              {Math.max(1, Math.round(result.time_taken_seconds / 60))}m
            </span>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Time Taken
            </span>
          </Card>
        </div>

        {/* Detailed Assessment Parameters */}
        <Card className="border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Assessment Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Subject</span>
              <span className="font-semibold text-slate-800">{result.quiz_subject}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Passing Marks</span>
              <span className="font-semibold text-slate-800">{result.passing_marks} pts</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Total Questions</span>
              <span className="font-semibold text-slate-800">{result.total_questions} Questions</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Status</span>
              <span className="font-semibold text-slate-800 capitalize">
                {result.status.replace('_', ' ')}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Submitted At</span>
              <span className="font-semibold text-slate-800">
                {new Date(result.submitted_at).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Result Outcome</span>
              <span
                className={`font-bold ${
                  passed ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          </div>
        </Card>

        {/* Actions Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Link to="/student/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full sm:w-auto justify-center">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Student Dashboard
            </Button>
          </Link>
          <Link to="/student/quizzes/history" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <History className="w-4 h-4 mr-2" />
              View Full Quiz History
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
