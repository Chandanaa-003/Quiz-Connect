import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Award,
  ArrowRight,
  BookOpen,
  Loader2,
  AlertCircle,
  KeyRound,
  Users,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getStudentUpcomingQuizzes } from '../services/api';

export default function UpcomingQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUpcoming = async () => {
      setLoading(true);
      try {
        const res = await getStudentUpcomingQuizzes();
        setQuizzes(res);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to load upcoming quizzes.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Upcoming Quizzes</h1>
            <Badge variant="blue" size="sm">
              {quizzes.length} Scheduled
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assessments scheduled by your instructors to open in the future
          </p>
        </div>
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
          <p className="text-xs text-slate-500">Loading upcoming scheduled quizzes...</p>
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
                  <Badge variant="blue" size="sm">
                    Scheduled
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
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Start Date
                    </span>
                    <span className="font-medium text-slate-800">
                      {new Date(quiz.start_time).toLocaleString(undefined, {
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
                    <span className="font-medium text-slate-800">{quiz.duration_minutes} Mins</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" /> Max Marks
                    </span>
                    <span className="font-medium text-slate-800">{quiz.maximum_marks} pts</span>
                  </div>

                  {quiz.quiz_code && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Quiz Code
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {quiz.quiz_code}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link to={`/student/quizzes/${quiz.id}/instructions`} className="block w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    View Instructions
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-slate-200 text-center py-16 px-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No upcoming scheduled quizzes</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Check back later or enter a private quiz code from your instructor to enroll in an assessment session.
          </p>
        </Card>
      )}
    </div>
  );
}
