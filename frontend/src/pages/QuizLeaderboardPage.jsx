import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Trophy,
  Award,
  Medal,
  Clock,
  ArrowLeft,
  Search,
  Loader2,
  AlertCircle,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getStudentQuizLeaderboard } from '../services/api';

export default function QuizLeaderboardPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await getStudentQuizLeaderboard(id);
        setData(res);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to load quiz leaderboard.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLeaderboard();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading assessment leaderboard...</p>
        <p className="text-xs text-slate-400 mt-1">Calculating verified ranks and participant scores</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-16">
        <Card className="border-rose-200 p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Leaderboard Unavailable</h2>
          <p className="text-xs text-rose-600">{error || 'Could not load leaderboard for this quiz.'}</p>
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

  const entries = data.leaderboard || [];
  const filtered = entries.filter((e) =>
    e.student_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/quizzes/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to History
        </Link>
        <Badge variant="blue" size="sm">
          Verified Rankings
        </Badge>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>Official Leaderboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{data.quiz_title}</h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">
              {data.subject} • {data.total_participants} Participated • Highest Score: {data.highest_percentage}%
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80 block">
              Average Percentage
            </span>
            <span className="text-3xl font-extrabold tracking-tight block mt-0.5">
              {data.average_percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <Card className="border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Rankings & Results</h2>
            <p className="text-xs text-slate-500">Sorted by score obtained with consistent tied-score handling</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Score / Max</th>
                <th className="px-4 py-3">Percentage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((entry) => (
                  <tr key={`${entry.rank}-${entry.student_id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
                          entry.rank === 1
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs'
                            : entry.rank === 2
                            ? 'bg-slate-200 text-slate-700 border border-slate-300'
                            : entry.rank === 3
                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                            : 'text-slate-600'
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{entry.student_name}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {entry.obtained_marks} / {entry.total_marks}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">{entry.percentage}%</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={entry.passed ? 'emerald' : 'rose'} size="sm">
                        {entry.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-400">
                      {new Date(entry.submitted_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {entries.length === 0
                      ? 'No students have submitted this quiz yet. Leaderboard will update dynamically upon submissions.'
                      : 'No candidates found matching your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
