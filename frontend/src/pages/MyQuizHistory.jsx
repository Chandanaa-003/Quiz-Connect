import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Award,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileQuestion,
  Users,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getStudentQuizHistory } from '../services/api';

export default function MyQuizHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await getStudentQuizHistory();
        setHistory(res);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to load quiz history.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Quiz History</h1>
            <Badge variant="purple" size="sm">
              {history.length} Record{history.length === 1 ? '' : 's'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete record of all quizzes you have participated in, submitted, or attended
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
          <p className="text-xs text-slate-500">Loading your participation records...</p>
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Quiz & Subject</th>
                    <th className="px-5 py-3.5">Instructor</th>
                    <th className="px-5 py-3.5">Joined Date</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Score / Max</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((record) => {
                    const status = record.participation_status || record.status || 'in_progress';
                    const score = record.score !== null && record.score !== undefined ? record.score : '—';
                    const totalMarks = record.total_marks || record.maximum_marks || '—';

                    return (
                      <tr key={record.participation_id || record.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-900 block text-sm">
                            {record.title || record.quiz_title}
                          </span>
                          <span className="text-[11px] text-slate-400">{record.subject}</span>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {record.teacher_name}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {record.joined_at ? new Date(record.joined_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }) : '—'}
                        </td>

                        <td className="px-5 py-4">
                          <Badge
                            variant={
                              status === 'completed'
                                ? 'emerald'
                                : status === 'in_progress'
                                ? 'amber'
                                : 'slate'
                            }
                            size="sm"
                          >
                            {status}
                          </Badge>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-900">
                            {score}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {' '}
                            / {totalMarks} pts
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            to={`/student/quizzes/${record.quiz_id}/instructions`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            Details <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <Card className="border-slate-200 py-16 text-center">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Quiz History Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            You haven't participated in any quizzes yet. Explore upcoming and live tests to get started.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link to="/student/quizzes/available">
              <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Find Live Quizzes
              </Button>
            </Link>
            <Link to="/student/quizzes/join">
              <Button variant="outline" size="sm">
                Enter Quiz Code
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
