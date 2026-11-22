import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  ArrowRight,
  Loader2,
  AlertCircle,
  HelpCircle,
  Search,
  Sparkles,
  Trophy,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import {
  getStudentAnalyticsOverview,
  getStudentAnalyticsPerformance,
} from '../services/api';

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export default function StudentPerformance() {
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewRes, chartRes] = await Promise.all([
          getStudentAnalyticsOverview(),
          getStudentAnalyticsPerformance(),
        ]);
        setOverview(overviewRes);
        setChartData(chartRes);
        setError('');
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to load your performance analytics.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Gathering your academic growth & exam metrics...</p>
        <p className="text-xs text-slate-400 mt-1">Analyzing your submitted assessments</p>
      </div>
    );
  }

  const breakdownData = chartData?.answer_breakdown
    ? [
        { name: 'Correct', value: chartData.answer_breakdown.correct_count },
        { name: 'Incorrect', value: chartData.answer_breakdown.incorrect_count },
        { name: 'Unanswered', value: chartData.answer_breakdown.unanswered_count },
      ]
    : [];

  const recentFiltered = (overview?.recent_results || []).filter((r) => {
    return (
      r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.rank).includes(searchQuery)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              My Academic Performance
            </h1>
            <Badge variant="emerald" size="sm">
              Personalized Dashboard
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical trends, score trajectories, and question accuracy analysis
          </p>
        </div>

        <Link to="/student/quizzes/available">
          <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
            Attend Live Quizzes <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {overview && (
        <div className="space-y-6">
          {/* Top 5 KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="border-slate-200 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Attempted
              </span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {overview.total_quizzes_attempted}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Completed assessments</span>
            </Card>

            <Card className="border-slate-200 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Average Score
              </span>
              <span className="text-2xl font-extrabold text-blue-600 mt-1 block">
                {overview.average_percentage}%
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Mean score percentile</span>
            </Card>

            <Card className="border-slate-200 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Personal Best
              </span>
              <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                {overview.highest_score}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Highest marks attained</span>
            </Card>

            <Card className="border-slate-200 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Passed Quizzes
              </span>
              <span className="text-2xl font-extrabold text-teal-600 mt-1 block">
                {overview.total_passed}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Met passing score</span>
            </Card>

            <Card className="border-slate-200 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Needs Review
              </span>
              <span className="text-2xl font-extrabold text-rose-600 mt-1 block">
                {overview.total_failed}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Below passing mark</span>
            </Card>
          </div>

          {/* Charts Row: Performance Over Time + Question Accuracy */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Performance Over Time (2 cols) */}
            <Card className="border-slate-200 p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Performance Over Time</h3>
                  <p className="text-xs text-slate-500">Your score percentage trajectory across chronological attempts</p>
                </div>
                <Badge variant="emerald" size="sm">
                  Progression
                </Badge>
              </div>

              {chartData?.performance_over_time?.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.performance_over_time} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px' }}
                        formatter={(val, name, item) => [`${val}%`, item.payload.quiz_title]}
                      />
                      <Line type="monotone" dataKey="percentage" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No chronological quiz attempts recorded yet.
                </div>
              )}
            </Card>

            {/* Chart 2: Correct vs Incorrect (1 col) */}
            <Card className="border-slate-200 p-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Answer Accuracy</h3>
                <p className="text-xs text-slate-500">Breakdown of all questions attempted</p>
              </div>

              {chartData?.answer_breakdown?.total_questions > 0 ? (
                <div className="h-64 w-full flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="75%">
                    <PieChart>
                      <Pie
                        data={breakdownData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={5}
                      >
                        {breakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '0.5rem', fontSize: '12px' }} />
                      <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 text-center w-full">
                    {chartData.answer_breakdown.correct_count} Correct • {chartData.answer_breakdown.incorrect_count} Wrong • {chartData.answer_breakdown.unanswered_count} Skipped
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No question responses to evaluate yet.
                </div>
              )}
            </Card>
          </div>

          {/* Chart 3: Quiz-Wise Scores (BarChart) */}
          <Card className="border-slate-200 p-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">Quiz-Wise Scores & Passing Thresholds</h3>
              <p className="text-xs text-slate-500">Points earned vs total points per quiz</p>
            </div>

            {chartData?.quiz_scores?.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.quiz_scores} margin={{ top: 10, right: 10, left: -20, bottom: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="quiz_title" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="obtained_marks" name="Obtained Marks" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_marks" name="Total Marks" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                No scores available.
              </div>
            )}
          </Card>

          {/* Recent Quiz Results Table */}
          <Card className="border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Quiz Results</h3>
                <p className="text-xs text-slate-500">Your recent test submissions and final scores</p>
              </div>

              <Link to="/student/quizzes/history" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                View All History <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Rank In Quiz</th>
                    <th className="px-4 py-3">Marks Obtained</th>
                    <th className="px-4 py-3">Percentage</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Submission Time</th>
                    <th className="px-4 py-3 text-right">Leaderboard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentFiltered.length > 0 ? (
                    recentFiltered.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-bold flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          <span>Rank #{item.rank}</span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {item.obtained_marks} / {item.total_marks}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-emerald-600">{item.percentage}%</td>
                        <td className="px-4 py-3.5">
                          <Badge variant={item.passed ? 'emerald' : 'rose'} size="sm">
                            {item.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400">
                          {new Date(item.submitted_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            to={`/student/quizzes/history`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Details →
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No quiz submissions found. Join available quizzes to view your analytics!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
