import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  KeyRound,
  Calendar,
  Clock,
  CheckCircle2,
  LogIn,
  Server,
  Database,
  Shield,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { checkHealth } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [backendHealth, setBackendHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoadingHealth(true);
      const { data, error } = await checkHealth();
      if (data) {
        setBackendHealth(data);
      } else {
        setBackendHealth({ status: 'offline', error: error });
      }
      setLoadingHealth(false);
    };

    fetchHealth();
  }, []);

  const dashboardPath = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';

  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-50/80 via-blue-50/20 to-transparent pointer-events-none -z-10" />

      {/* Authenticated User Quick Banner */}
      {isAuthenticated && user && (
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <div className="bg-blue-600 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-blue-200" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  You are signed in as {user.full_name} ({user.role})
                </p>
                <p className="text-xs text-blue-100">
                  Ready to access your {user.role === 'teacher' ? 'Educator' : 'Student'} Workspace.
                </p>
              </div>
            </div>

            <Link to={dashboardPath}>
              <button className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 whitespace-nowrap">
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center">
        <div className="inline-flex items-center mb-6">
          <Badge variant="blue" icon={Sparkles} size="md">
            Scheduled Online Assessment Platform
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
          Quiz<span className="text-blue-600">Connect</span>
        </h1>

        <p className="mt-3 text-xl sm:text-2xl font-semibold text-blue-600 tracking-wide">
          Learn. Attend. Achieve.
        </p>

        <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
          The streamlined platform for organized academic quizzes. Educators schedule timed
          quizzes with pinpoint control, while students attend smoothly using unique access codes.
        </p>
      </section>

      {/* Two Separate Role Cards: Teacher and Student */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Teacher Card */}
          <Card
            className="flex flex-col justify-between border-slate-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
            hover={true}
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                  <Users className="w-7 h-7" />
                </div>
                <Badge variant="blue" icon={Layers}>
                  Educators & Instructors
                </Badge>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">Teacher Portal</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Create scheduled quizzes, define precise time windows, monitor real-time submissions,
                and generate instant analytics for your classes.
              </p>

              {/* Feature Points */}
              <div className="space-y-3 mb-8 border-t border-slate-100 pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Schedule time-bound quiz sessions with customized durations
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Generate secure, unique quiz codes for student enrollment
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Live attendee tracking and automatic response submission
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Argon2-encrypted instructor authentication & JWT sessions
                  </span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-2 space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                icon={LogIn}
                iconPosition="right"
                onClick={() => navigate('/teacher/login')}
              >
                Teacher Login
              </Button>

              <div className="text-center">
                <Link
                  to="/teacher/register"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  New Educator? Register as Teacher &rarr;
                </Link>
              </div>
            </div>
          </Card>

          {/* Student Card */}
          <Card
            className="flex flex-col justify-between border-slate-200 hover:border-emerald-300 transition-all shadow-sm hover:shadow-md"
            hover={true}
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <Badge variant="emerald" icon={KeyRound}>
                  Learners & Candidates
                </Badge>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Portal</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Join your designated quiz session in seconds with the unique quiz code provided by
                your teacher. Experience a focused, distraction-free environment.
              </p>

              {/* Feature Points */}
              <div className="space-y-3 mb-8 border-t border-slate-100 pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Instant access using a unique 6-character quiz code
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Clean, distraction-free responsive testing interface
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Synchronized countdown timer with auto-submit on expiry
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Secure student account profile & historical score tracking
                  </span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-2 space-y-3">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500"
                icon={LogIn}
                iconPosition="right"
                onClick={() => navigate('/student/login')}
              >
                Student Login
              </Button>

              <div className="text-center">
                <Link
                  to="/student/register"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
                >
                  New Student? Create Student Account &rarr;
                </Link>
              </div>
            </div>
          </Card>

        </div>
      </section>

      {/* How QuizConnect Works */}
      <section className="bg-white border-y border-slate-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-2xl font-bold text-slate-900">How QuizConnect Works</h3>
            <p className="text-slate-600 text-sm mt-2">
              Three streamlined steps from scheduling to achievement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                1
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">Schedule & Prepare</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Teachers create questions, set quiz schedules, and define parameters.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                2
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">Share Quiz Code</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                A unique code is generated for students to attend during the scheduled time window.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                3
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">Attend & Achieve</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Students submit timed responses and obtain rapid, structured assessment outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Backend & Connectivity Status Card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-slate-900 text-sm">System & Security Status</h4>
            </div>
            {backendHealth?.status === 'healthy' ? (
              <Badge variant="emerald" icon={CheckCircle2} size="sm">
                System Healthy & Operational
              </Badge>
            ) : (
              <Badge variant="amber" icon={Clock} size="sm">
                {loadingHealth ? 'Verifying...' : 'Offline'}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">FastAPI Server</span>
              <span className="font-medium text-slate-800">
                {backendHealth?.status === 'healthy' ? 'Online (v1.0.0)' : 'Connecting...'}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Auth & Encryption</span>
              <span className="font-medium text-slate-800">Argon2id + JWT Active</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Role-Based Access</span>
              <span className="font-medium text-slate-800">Teacher & Student Guarded</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
