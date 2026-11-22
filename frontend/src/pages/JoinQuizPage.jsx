import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  KeyRound,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Clock,
  BookOpen,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { joinStudentQuiz } from '../services/api';

export default function JoinQuizPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please provide a 6-character quiz code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessData(null);

    try {
      const response = await joinStudentQuiz({ quiz_code: cleanCode });
      setSuccessData(response);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to join quiz with this code.'
      );
    } finally {
      setLoading(false);
    }
  };

  const quizId = successData?.quiz_id || successData?.quiz?.id;
  const quizTitle = successData?.quiz_title || successData?.quiz?.title;
  const quizSubject = successData?.subject || successData?.quiz?.subject;
  const teacherName = successData?.teacher_name || successData?.quiz?.teacher_name;
  const duration = successData?.duration_minutes || successData?.quiz?.duration_minutes;
  const maxMarks = successData?.maximum_marks || successData?.quiz?.maximum_marks;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Join Quiz</h1>
        <p className="text-xs text-slate-500 mt-1">
          Enter the unique quiz code provided by your instructor to access quiz instructions.
        </p>
      </div>

      {/* Main Join Card */}
      <Card className="border-slate-200 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Enter Access Code</h2>
            <p className="text-xs text-slate-500">6-character code (e.g. P5LIVE or QC-1A2B)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="quizCode" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Quiz Code
            </label>
            <input
              id="quizCode"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="e.g. QC98AB"
              maxLength={12}
              className="w-full px-4 py-3.5 text-center text-xl sm:text-2xl font-mono uppercase tracking-[0.3em] text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to Join Quiz</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading || !code.trim()}
            className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white py-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Verifying Code...
              </>
            ) : (
              <>
                Validate & Join Quiz
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Verification Success Box */}
        {successData && (
          <div className="mt-6 p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{successData.message}</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900 text-sm">
                  {quizTitle}
                </span>
                <Badge variant="emerald" size="sm">
                  {quizSubject}
                </Badge>
              </div>
              <p className="text-slate-500">Instructor: {teacherName}</p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600">
                <span>Duration: {duration} mins</span>
                <span>Max Marks: {maxMarks}</span>
              </div>
            </div>

            <Button
              onClick={() => navigate(`/student/quizzes/${quizId}/instructions`)}
              variant="primary"
              size="md"
              className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Continue to Quiz Instructions <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </Card>

      {/* Instructions & Guidelines */}
      <Card className="border-slate-200 p-6 bg-slate-50/60">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Quiz Code Rules
        </h3>
        <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
          <li>Codes are valid only for quizzes that have been published by the instructor.</li>
          <li>Quizzes can only be accessed during their designated scheduled start and end window.</li>
          <li>Draft or expired quizzes will not be accepted.</li>
          <li>Each student can join a quiz once; duplicate registrations are prevented.</li>
        </ul>
      </Card>
    </div>
  );
}
