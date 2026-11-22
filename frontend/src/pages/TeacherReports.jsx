import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import {
  getTeacherAnalyticsOverview,
  getTeacherQuizAnalytics,
  getTeacherQuizLeaderboard,
  downloadTeacherQuizReportCsv,
} from '../services/api';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
const PASS_FAIL_COLORS = ['#10b981', '#ef4444'];

export default function TeacherReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuizId = searchParams.get('quizId') || 'all';

  const [selectedQuizId, setSelectedQuizId] = useState(initialQuizId);
  const [overviewData, setOverviewData] = useState(null);
  const [quizAnalytics, setQuizAnalytics] = useState(null);
  const [quizLeaderboard, setQuizLeaderboard] = useState(null);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingQuizData, setLoadingQuizData] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [error, setError] = useState('');

  // Active Tab: 'overview' | 'item_analysis' | 'leaderboard'
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Global Teacher Analytics Overview
  useEffect(() => {
    const fetchOverview = async () => {
      setLoadingOverview(true);
      try {
        const data = await getTeacherAnalyticsOverview();
        setOverviewData(data);
        setError('');
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to load teacher analytics.'
        );
      } finally {
        setLoadingOverview(false);
      }
    };

    fetchOverview();
  }, []);

  // 2. Fetch specific quiz analytics & leaderboard when a quiz is selected
  useEffect(() => {
    if (selectedQuizId === 'all') {
      setQuizAnalytics(null);
      setQuizLeaderboard(null);
      return;
    }

    const fetchSpecificQuiz = async () => {
      setLoadingQuizData(true);
      try {
        const [analyticsRes, leaderboardRes] = await Promise.all([
          getTeacherQuizAnalytics(selectedQuizId),
          getTeacherQuizLeaderboard(selectedQuizId),
        ]);
        setQuizAnalytics(analyticsRes);
        setQuizLeaderboard(leaderboardRes);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to load specific quiz analytics.'
        );
      } finally {
        setLoadingQuizData(false);
      }
    };

    fetchSpecificQuiz();
  }, [selectedQuizId]);

  const handleQuizChange = (e) => {
    const newId = e.target.value;
    setSelectedQuizId(newId);
    if (newId === 'all') {
      searchParams.delete('quizId');
      setSearchParams(searchParams);
      setActiveTab('overview');
    } else {
      setSearchParams({ quizId: newId });
    }
  };

  const handleDownloadCsv = async () => {
    if (selectedQuizId === 'all') return;
    setDownloadingCsv(true);
    try {
      const blob = await downloadTeacherQuizReportCsv(selectedQuizId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      const quizName = quizAnalytics?.quiz_title || `quiz_${selectedQuizId}`;
      link.setAttribute('download', `${quizName.replace(/\s+/g, '_')}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to download CSV report.');
    } finally {
      setDownloadingCsv(false);
    }
  };

  if (loadingOverview) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Gathering assessment statistics & charts...</p>
        <p className="text-xs text-slate-400 mt-1">Aggregating real student participation records</p>
      </div>
    );
  }

  const passFailChartData = overviewData ? [
    { name: 'Passed', value: overviewData.pass_fail_stats.passed },
    { name: 'Failed', value: overviewData.pass_fail_stats.failed },
  ] : [];

  const quizzesList = overviewData?.quiz_performance || [];

  // Filtered leaderboard for selected quiz
  const filteredLeaderboard = (quizLeaderboard?.leaderboard || []).filter((entry) => {
    const q = searchQuery.toLowerCase();
    return (
      entry.student_name.toLowerCase().includes(q) ||
      (entry.student_email && entry.student_email.toLowerCase().includes(q))
    );
  });

  // Filtered questions for item analysis
  const filteredQuestions = (quizAnalytics?.question_performance || []).filter((q) => {
    return q.question_text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Page Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Reports & Performance Analytics
            </h1>
            <Badge variant="blue" size="sm">
              Live Data
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time assessment gradebooks, score distributions, and question difficulty analysis
          </p>
        </div>

        {/* Quiz Filter Dropdown & Export Button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedQuizId}
              onChange={handleQuizChange}
              className="appearance-none bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs cursor-pointer"
            >
              <option value="all">📊 All Quizzes (Overview)</option>
              {quizzesList.map((q) => (
                <option key={q.quiz_id} value={q.quiz_id}>
                  {q.quiz_title} ({q.subject})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {selectedQuizId !== 'all' && (
            <Button
              onClick={handleDownloadCsv}
              variant="outline"
              size="sm"
              disabled={downloadingCsv}
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 shrink-0 font-medium"
            >
              {downloadingCsv ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Download CSV
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs navigation if a specific quiz is chosen */}
      {selectedQuizId !== 'all' && (
        <div className="flex border-b border-slate-200 text-xs font-medium space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 font-bold border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Quiz Summary & Charts
          </button>
          <button
            onClick={() => setActiveTab('item_analysis')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'item_analysis'
                ? 'text-blue-600 font-bold border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Question Item Analysis ({quizAnalytics?.question_performance?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'leaderboard'
                ? 'text-blue-600 font-bold border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Leaderboard & Roster ({quizLeaderboard?.total_participants || 0})
          </button>
        </div>
      )}

      {/* VIEW 1: GLOBAL TEACHER OVERVIEW (When selectedQuizId === 'all') */}
      {selectedQuizId === 'all' && overviewData && (
        <div className="space-y-6">
          {/* Top 6 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <Card className="border-slate-200 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Quizzes Conducted
              </span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {overviewData.total_quizzes_conducted}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Active or finished</span>
            </Card>

            <Card className="border-slate-200 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Students Participated
              </span>
              <span className="text-2xl font-extrabold text-blue-600 mt-1 block">
                {overviewData.total_students_participated}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Unique candidates</span>
            </Card>

            <Card className="border-slate-200 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Attempts
              </span>
              <span className="text-2xl font-extrabold text-indigo-600 mt-1 block">
                {overviewData.total_quiz_attempts}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Submitted test runs</span>
            </Card>

            <Card className="border-slate-200 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Average Score
              </span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {overviewData.average_score}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Mean points scored</span>
            </Card>

            <Card className="border-slate-200 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Highest Score
              </span>
              <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                {overviewData.highest_score}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Top marks recorded</span>
            </Card>

            <Card className="border-slate-200 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Pass Rate
              </span>
              <span className="text-2xl font-extrabold text-teal-600 mt-1 block">
                {overviewData.pass_percentage}%
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Meets passing criteria</span>
            </Card>
          </div>

          {/* Charts Row: Quiz-wise Averages + Pass/Fail Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Quiz-Wise Average Marks (2 cols) */}
            <Card className="border-slate-200 p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Quiz-Wise Average Marks</h3>
                  <p className="text-xs text-slate-500">Comparison of average obtained marks per quiz</p>
                </div>
                <Badge variant="blue" size="sm">
                  {overviewData.quiz_performance.length} Quizzes
                </Badge>
              </div>

              {overviewData.quiz_performance.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overviewData.quiz_performance} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="quiz_title" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px' }}
                        formatter={(val) => [`${val} pts`, 'Average Score']}
                      />
                      <Bar dataKey="average_score" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No quiz attempt data available yet.
                </div>
              )}
            </Card>

            {/* Chart 2: Pass vs Fail Statistics (1 col) */}
            <Card className="border-slate-200 p-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Pass vs Fail Outcome</h3>
                <p className="text-xs text-slate-500">Overall qualification breakdown</p>
              </div>

              {overviewData.total_quiz_attempts > 0 ? (
                <div className="h-64 w-full flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="75%">
                    <PieChart>
                      <Pie
                        data={passFailChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={5}
                      >
                        {passFailChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PASS_FAIL_COLORS[index % PASS_FAIL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '0.5rem', fontSize: '12px' }} />
                      <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-around w-full text-xs font-semibold text-slate-700 pt-2 border-t border-slate-100">
                    <span className="text-emerald-600">Passed: {overviewData.pass_fail_stats.passed} ({overviewData.pass_fail_stats.pass_percentage}%)</span>
                    <span className="text-rose-600">Failed: {overviewData.pass_fail_stats.failed} ({overviewData.pass_fail_stats.fail_percentage}%)</span>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No submissions yet to evaluate.
                </div>
              )}
            </Card>
          </div>

          {/* Charts Row 2: Score Distribution + Participation Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Score Distribution */}
            <Card className="border-slate-200 p-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Student Score Distribution</h3>
                <p className="text-xs text-slate-500">Number of student attempts in each percentile tier</p>
              </div>

              {overviewData.total_quiz_attempts > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overviewData.score_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} formatter={(val) => [`${val} students`, 'Attempts']} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No distribution data available yet.
                </div>
              )}
            </Card>

            {/* Chart 4: Participation Trends */}
            <Card className="border-slate-200 p-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Quiz Participation Trends</h3>
                <p className="text-xs text-slate-500">Chronological attendance across scheduled tests</p>
              </div>

              {overviewData.participation_trends.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overviewData.participation_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }}
                        formatter={(val, name, item) => [`${val} students`, item.payload.quiz_title]}
                      />
                      <Line type="monotone" dataKey="participants_count" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No participation records yet.
                </div>
              )}
            </Card>
          </div>

          {/* Quick Quiz Selector Table */}
          <Card className="border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">All Managed Quizzes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Quiz Title</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Attempts</th>
                    <th className="px-4 py-3">Average</th>
                    <th className="px-4 py-3">Top Score</th>
                    <th className="px-4 py-3">Pass Rate</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quizzesList.map((q) => (
                    <tr key={q.quiz_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{q.quiz_title}</td>
                      <td className="px-4 py-3.5">{q.subject}</td>
                      <td className="px-4 py-3.5 font-semibold">{q.total_attempts}</td>
                      <td className="px-4 py-3.5">{q.average_score} / {q.maximum_marks}</td>
                      <td className="px-4 py-3.5 font-semibold text-emerald-600">{q.highest_score}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={q.pass_rate >= 50 ? 'emerald' : 'amber'} size="sm">
                          {q.pass_rate}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedQuizId(String(q.quiz_id));
                            setSearchParams({ quizId: String(q.quiz_id) });
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          View Analytics
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* VIEW 2: SPECIFIC QUIZ REPORT (When selectedQuizId !== 'all') */}
      {selectedQuizId !== 'all' && (
        <div className="space-y-6">
          {loadingQuizData ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading specific quiz metrics & leaderboard...</p>
            </div>
          ) : quizAnalytics ? (
            <>
              {/* Specific Quiz KPI Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <Card className="border-slate-200 p-4">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Participants
                  </span>
                  <span className="text-2xl font-extrabold text-blue-600 mt-1 block">
                    {quizAnalytics.total_participants}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Completed exams</span>
                </Card>

                <Card className="border-slate-200 p-4">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Average Marks
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                    {quizAnalytics.average_marks}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Out of {quizAnalytics.maximum_marks} pts</span>
                </Card>

                <Card className="border-slate-200 p-4">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Highest Marks
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                    {quizAnalytics.highest_marks}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Max marks attained</span>
                </Card>

                <Card className="border-slate-200 p-4">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Lowest Marks
                  </span>
                  <span className="text-2xl font-extrabold text-slate-600 mt-1 block">
                    {quizAnalytics.lowest_marks}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Min marks recorded</span>
                </Card>

                <Card className="border-slate-200 p-4">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Pass Rate
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                    {quizAnalytics.pass_percentage}%
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">{quizAnalytics.passed_count} passed</span>
                </Card>

                <Card className="border-slate-200 p-4">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Fail Rate
                  </span>
                  <span className="text-2xl font-extrabold text-rose-600 mt-1 block">
                    {quizAnalytics.fail_percentage}%
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">{quizAnalytics.failed_count} failed</span>
                </Card>
              </div>

              {/* TAB 1: OVERVIEW & CHARTS */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Score Distribution */}
                  <Card className="border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Score Distribution</h3>
                    <p className="text-xs text-slate-500 mb-4">Student percentage distribution for {quizAnalytics.quiz_title}</p>
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quizAnalytics.score_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                          <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                          <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Pass/Fail Ratio */}
                  <Card className="border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Qualification Proportion</h3>
                    <p className="text-xs text-slate-500 mb-4">Passed (score ≥ {quizAnalytics.passing_marks}) vs Failed</p>
                    <div className="h-60 w-full flex flex-col items-center justify-center">
                      <ResponsiveContainer width="100%" height="80%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Passed', value: quizAnalytics.passed_count },
                              { name: 'Failed', value: quizAnalytics.failed_count },
                            ]}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={5}
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '0.5rem', fontSize: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              )}

              {/* TAB 2: QUESTION ITEM ANALYSIS (Which questions were hard/easy?) */}
              {activeTab === 'item_analysis' && (
                <Card className="border-slate-200 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Question Item Performance</h3>
                      <p className="text-xs text-slate-500">Actual accuracy and difficulty rating based on student responses</p>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search question text..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-56"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">Question Text</th>
                          <th className="px-4 py-3">Difficulty</th>
                          <th className="px-4 py-3">Accuracy</th>
                          <th className="px-4 py-3">Responses</th>
                          <th className="px-4 py-3">Choice Breakdown</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredQuestions.map((q) => (
                          <tr key={q.question_id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-slate-800">Q{q.order_index}</td>
                            <td className="px-4 py-3.5 max-w-sm">
                              <p className="font-medium text-slate-900 line-clamp-2">{q.question_text}</p>
                              <span className="text-[11px] text-slate-400">{q.marks} pts</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <Badge
                                variant={
                                  q.difficulty_label === 'Easy'
                                    ? 'emerald'
                                    : q.difficulty_label === 'Medium'
                                    ? 'amber'
                                    : 'rose'
                                }
                                size="sm"
                              >
                                {q.difficulty_label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 font-bold text-slate-800">
                              {q.correct_percentage}%
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
                                <div className="h-full bg-emerald-500" style={{ width: `${q.correct_percentage}%` }} />
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-emerald-600 font-semibold">{q.correct_count} correct</span>
                              <span className="text-slate-400 block text-[10px]">
                                {q.incorrect_count} wrong • {q.unanswered_count} skipped
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[11px]">
                              A:{q.option_distribution.A} B:{q.option_distribution.B} C:{q.option_distribution.C} D:{q.option_distribution.D}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* TAB 3: LEADERBOARD & ROSTER */}
              {activeTab === 'leaderboard' && (
                <Card className="border-slate-200 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Quiz Leaderboard & Roster</h3>
                      <p className="text-xs text-slate-500">Student rankings with tied score handling and submission timestamps</p>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Filter by student name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-56"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Rank</th>
                          <th className="px-4 py-3">Student Name</th>
                          <th className="px-4 py-3">Student Email</th>
                          <th className="px-4 py-3">Score / Total</th>
                          <th className="px-4 py-3">Percentage</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Submitted At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLeaderboard.length > 0 ? (
                          filteredLeaderboard.map((entry) => (
                            <tr key={`${entry.rank}-${entry.student_id}`} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3.5 font-bold">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                    entry.rank === 1
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : entry.rank === 2
                                      ? 'bg-slate-200 text-slate-700'
                                      : entry.rank === 3
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {entry.rank}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-bold text-slate-900">{entry.student_name}</td>
                              <td className="px-4 py-3.5 text-slate-500">{entry.student_email || '—'}</td>
                              <td className="px-4 py-3.5 font-semibold text-slate-800">
                                {entry.obtained_marks} / {entry.total_marks}
                              </td>
                              <td className="px-4 py-3.5 font-bold text-blue-600">{entry.percentage}%</td>
                              <td className="px-4 py-3.5">
                                <Badge variant={entry.passed ? 'emerald' : 'rose'} size="sm">
                                  {entry.passed ? 'Passed' : 'Failed'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3.5 text-slate-400">
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
                            <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                              No submissions found matching your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-12 text-center text-slate-400 text-xs">
              No analytics data could be loaded for this quiz.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
