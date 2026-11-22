import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Save,
  RotateCcw,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getAttemptDetail, saveAttemptAnswer, submitAttempt } from '../services/api';

export default function QuizTakingPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [savingQuestionId, setSavingQuestionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Confirmation Modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const timerRef = useRef(null);
  const hasAutoSubmittedRef = useRef(false);

  // Fetch attempt details
  const fetchAttempt = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAttemptDetail(attemptId);

      // If already submitted, redirect directly to result
      if (data.status === 'submitted' || data.status === 'auto_submitted') {
        navigate(`/student/attempts/${attemptId}/result`, { replace: true });
        return;
      }

      setAttempt(data);
      setQuestions(data.questions || []);
      setAnswers(data.answers || {});
      setSecondsRemaining(Math.max(0, data.remaining_seconds));
      setError('');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to load quiz attempt.'
      );
    } finally {
      setLoading(false);
    }
  }, [attemptId, navigate]);

  useEffect(() => {
    if (attemptId) {
      fetchAttempt();
    }
  }, [attemptId, fetchAttempt]);

  // Handle Automatic Submission when timer hits 0
  const handleAutoSubmit = useCallback(async () => {
    if (hasAutoSubmittedRef.current || submitting) return;
    hasAutoSubmittedRef.current = true;
    setAutoSubmitting(true);
    setSubmitting(true);

    try {
      await submitAttempt(attemptId, { is_auto_submit: true });
      navigate(`/student/attempts/${attemptId}/result`, { replace: true });
    } catch (err) {
      // Even if error, attempt likely got auto-submitted on backend
      navigate(`/student/attempts/${attemptId}/result`, { replace: true });
    }
  }, [attemptId, navigate, submitting]);

  // Timer Countdown Effect
  useEffect(() => {
    if (secondsRemaining === null) return;

    if (secondsRemaining <= 0) {
      handleAutoSubmit();
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsRemaining, handleAutoSubmit]);

  // Format seconds into MM:SS or HH:MM:SS
  const formatTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds < 0) return '00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Option Selection & Auto-Saving
  const handleSelectOption = async (optionKey) => {
    const currentQ = questions[currentIndex];
    if (!currentQ || submitting || autoSubmitting) return;

    // Allow toggling/deselecting if already selected
    const newSelected = answers[currentQ.id] === optionKey ? null : optionKey;

    // Optimistically update frontend state
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: newSelected,
    }));

    setSavingQuestionId(currentQ.id);

    try {
      await saveAttemptAnswer(attemptId, currentQ.id, {
        selected_option: newSelected,
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    } finally {
      setSavingQuestionId(null);
    }
  };

  // Manual Submission
  const handleManualSubmit = async () => {
    setShowSubmitModal(false);
    setSubmitting(true);

    try {
      await submitAttempt(attemptId, { is_auto_submit: false });
      navigate(`/student/attempts/${attemptId}/result`, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to submit quiz. Please try again.'
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading your exam session...</p>
        <p className="text-xs text-slate-400 mt-1">Synchronizing question bank and timer</p>
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-rose-200 p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Exam Session Unavailable</h2>
          <p className="text-xs text-rose-600">{error}</p>
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

  const currentQuestion = questions[currentIndex] || {};
  const answeredCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;
  const unansweredCount = questions.length - answeredCount;
  const isLastQuestion = currentIndex === questions.length - 1;

  // Visual timer alert thresholds
  const isTimeCritical = secondsRemaining !== null && secondsRemaining <= 60;
  const isTimeWarning = secondsRemaining !== null && secondsRemaining <= 300 && !isTimeCritical;

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col justify-between">
      {/* Top Header / Fixed Exam Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Quiz Title & Subject */}
          <div className="min-w-0 flex items-center gap-3">
            <div className="hidden sm:flex w-9 h-9 rounded-xl bg-emerald-600 text-white items-center justify-center font-bold text-sm">
              QC
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate max-w-xs sm:max-w-md">
                {attempt?.quiz_title || 'Online Assessment'}
              </h1>
              <p className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>{attempt?.quiz_subject}</span>
                <span>•</span>
                <span>
                  Question {currentIndex + 1} of {questions.length}
                </span>
              </p>
            </div>
          </div>

          {/* Right Controls: Timer & Submit Action */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-mono font-bold transition-all shadow-xs ${
                isTimeCritical
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse ring-2 ring-rose-400/40'
                  : isTimeWarning
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-600' : 'text-slate-500'}`} />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            {/* Submit Quiz Button */}
            <Button
              onClick={() => setShowSubmitModal(true)}
              variant="primary"
              size="sm"
              disabled={submitting || autoSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1.5" />
                  Submit Quiz
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Examination Body */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 flex-1">
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left / Center Area: Question Presentation (3 cols) */}
          <div className="lg:col-span-3 space-y-5">
            <Card className="border-slate-200 p-6 sm:p-8 bg-white shadow-xs">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase">
                    Question {currentIndex + 1}
                  </span>
                  <span className="text-xs text-slate-400">
                    of {questions.length} questions
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {savingQuestionId === currentQuestion.id && (
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                    </span>
                  )}
                  {answers[currentQuestion.id] && savingQuestionId !== currentQuestion.id && (
                    <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Saved
                    </span>
                  )}
                  <Badge variant="slate" size="sm">
                    {currentQuestion.marks} Mark{currentQuestion.marks > 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.question_text}
                </h2>
              </div>

              {/* 4 MCQ Options */}
              <div className="space-y-3">
                {[
                  { key: 'A', text: currentQuestion.option_a },
                  { key: 'B', text: currentQuestion.option_b },
                  { key: 'C', text: currentQuestion.option_c },
                  { key: 'D', text: currentQuestion.option_d },
                ].map((opt) => {
                  const isSelected = answers[currentQuestion.id] === opt.key;
                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3.5 select-none ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {opt.key}
                      </div>

                      <div className="text-sm font-medium text-slate-800 leading-relaxed flex-1">
                        {opt.text}
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  variant="outline"
                  size="md"
                  disabled={currentIndex === 0}
                  className="text-slate-700"
                >
                  <ChevronLeft className="w-4 h-4 mr-1.5" /> Previous
                </Button>

                <div className="text-xs text-slate-400 hidden sm:block">
                  Click an option to select or change answer
                </div>

                {isLastQuestion ? (
                  <Button
                    onClick={() => setShowSubmitModal(true)}
                    variant="primary"
                    size="md"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Review & Submit <Send className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    variant="primary"
                    size="md"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Right Area: Question Navigation Panel (1 col) */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-slate-200 p-5 bg-white shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Question Palette
              </h3>

              {/* Quick Status Legend */}
              <div className="flex items-center gap-4 text-[11px] text-slate-500 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />
                  <span>Remaining ({unansweredCount})</span>
                </div>
              </div>

              {/* Grid of Question Buttons */}
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = answers[q.id] !== null && answers[q.id] !== undefined;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                        isCurrent
                          ? 'ring-2 ring-emerald-500 ring-offset-1 bg-slate-900 text-white shadow-xs'
                          : isAnswered
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                      title={`Go to Question ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Progress Summary */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Progress</span>
                  <span>{Math.round((answeredCount / (questions.length || 1)) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{
                      width: `${(answeredCount / (questions.length || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* Exam Rules Helper */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] leading-relaxed space-y-1">
              <p className="font-semibold text-slate-700 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                Exam Security Active
              </p>
              <p>Your answers are continuously synced with the cloud. Refreshing will retain your responses.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Manual Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <Card className="max-w-md w-full border-slate-200 p-6 space-y-5 bg-white shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Confirm Quiz Submission</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to finish and submit your quiz now?
              </p>
            </div>

            {/* Answer Breakdown Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Total Questions:</span>
                <span className="font-bold text-slate-800">{questions.length}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Answered:</span>
                <span className="font-bold">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Unanswered:</span>
                <span className="font-bold">{unansweredCount}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-amber-600 text-center font-medium">
                ⚠️ You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}. Unanswered questions receive 0 marks.
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => setShowSubmitModal(false)}
                variant="outline"
                size="md"
                disabled={submitting}
                className="flex-1 justify-center"
              >
                Continue Quiz
              </Button>
              <Button
                onClick={handleManualSubmit}
                variant="primary"
                size="md"
                disabled={submitting}
                className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Submitting...
                  </>
                ) : (
                  'Yes, Submit'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Auto-Submit Overlay */}
      {autoSubmitting && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center space-y-4 bg-white shadow-2xl">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Time's Up!</h3>
            <p className="text-xs text-slate-500">
              The quiz duration has expired. We are evaluating and submitting your answers automatically...
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
