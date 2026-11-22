import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  BookOpen,
  Loader2,
  AlertCircle,
  Users,
  FileQuestion,
  Calendar,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getStudentAvailableQuizzes } from '../services/api';

export default function AvailableQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAvailable = async () => {
      setLoading(true);
      try {
        const res = await getStudentAvailableQuizzes();
        setQuizzes(res);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to load available quizzes.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAvailable();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Available Quizzes</h1>
            <Badge variant="emerald" size="sm">
              {quizzes.length} Live
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quizzes that are currently active and open for you to attend
          </p>
        </div>

        <Link
          to="/student/quizzes/join"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
        >
          Have a Quiz Code? Join Here <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Checking for live quizzes...</p>
        </div>
      ) : quizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="border-slate-200 flex flex-col justify-between" hover={true}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                    {quiz.subject}
                  </span>
                  <Badge variant="emerald" size="sm" className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Now
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">{quiz.title}</h3>
                <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Instructor: {quiz.teacher_name}</span>
                </p>

                <div className="space-y-2 py-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Closes At
                    </span>
                    <span className="font-medium text-slate-800">
                      {new Date(quiz.end_time).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration
                    </span>
                    <span className="font-medium text-slate-800">{quiz.duration_minutes} mins</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" /> Max Marks
                    </span>
                    <span className="font-medium text-slate-800">{quiz.maximum_marks} pts</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <FileQuestion className="w-3.5 h-3.5 text-slate-400" /> Questions
                    </span>
                    <span className="font-medium text-slate-800">{quiz.total_questions || 'Standard'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                <Link to={`/student/quizzes/${quiz.id}/instructions`} className="w-full block">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    View Instructions & Join <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-slate-200 py-16 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Quizzes Live Right Now</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            There are currently no active quizzes within their open time window. You can check the upcoming schedule or enter a quiz code if your teacher shared one.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link to="/student/quizzes/upcoming">
              <Button variant="outline" size="sm">
                View Upcoming Quizzes
              </Button>
            </Link>
            <Link to="/student/quizzes/join">
              <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Enter Quiz Code
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
