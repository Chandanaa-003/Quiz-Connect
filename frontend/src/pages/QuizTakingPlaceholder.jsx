import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Construction,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getStudentQuizInstructions } from '../services/api';

export default function QuizTakingPlaceholder() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    if (id) {
      getStudentQuizInstructions(id)
        .then((res) => setQuiz(res))
        .catch(() => {});
    }
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <Card className="border-emerald-200/80 p-8 text-center space-y-5 bg-gradient-to-b from-white to-slate-50">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
          <Construction className="w-8 h-8 text-emerald-600 animate-bounce" />
        </div>

        <div className="space-y-2">
          <Badge variant="emerald" size="md">
            Phase 5 Milestone Reached
          </Badge>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Quiz Ready to Begin!
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            You have successfully joined the quiz and completed instructions verification.
          </p>
        </div>

        {quiz && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-left max-w-md mx-auto space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900 text-sm">{quiz.title}</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                {quiz.subject}
              </span>
            </div>
            <div className="text-slate-500">Instructor: {quiz.teacher_name}</div>
            <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
              <span>Duration: {quiz.duration_minutes} minutes</span>
              <span>Max Marks: {quiz.maximum_marks} pts</span>
            </div>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 max-w-md mx-auto leading-relaxed text-left">
          <p className="font-bold flex items-center gap-1.5 text-amber-800 mb-1">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Phase 6 Preview:
          </p>
          <p>
            The interactive quiz-taking engine, live countdown timer, question navigation, multiple-choice options, and real-time result grading are scheduled for implementation in <strong>Phase 6</strong>.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/student/dashboard">
            <Button variant="primary" size="md" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
            </Button>
          </Link>
          <Link to="/student/quizzes/available">
            <Button variant="outline" size="md">
              View Other Quizzes
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
