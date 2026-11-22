import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  LayoutDashboard,
  User,
} from 'lucide-react';
import { checkHealth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';
import Button from './Button';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [healthStatus, setHealthStatus] = useState({
    status: 'checking',
    message: 'Checking API...',
  });

  useEffect(() => {
    let mounted = true;

    const verifyBackend = async () => {
      const { data, error } = await checkHealth();
      if (!mounted) return;

      if (data && data.status === 'healthy') {
        setHealthStatus({
          status: 'online',
          message: `API Online (v${data.version})`,
        });
      } else {
        setHealthStatus({
          status: 'offline',
          message: error || 'API Offline',
        });
      }
    };

    verifyBackend();
    const interval = setInterval(verifyBackend, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardPath = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-95 transition">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Quiz<span className="text-blue-600">Connect</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block -mt-0.5">
              Scheduled Online Quiz Management
            </p>
          </div>
        </Link>

        {/* Status Indicator & User Navigation */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Real-time Backend Health Badge */}
          <div className="hidden md:flex items-center">
            {healthStatus.status === 'online' && (
              <Badge variant="emerald" icon={CheckCircle2} size="sm">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-0.5"></span>
                Backend Live
              </Badge>
            )}
            {healthStatus.status === 'checking' && (
              <Badge variant="amber" icon={Activity} size="sm">
                Connecting...
              </Badge>
            )}
            {healthStatus.status === 'offline' && (
              <Badge variant="rose" icon={AlertCircle} size="sm">
                Backend Offline
              </Badge>
            )}
          </div>

          {/* User Session Actions */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-3 pl-3 border-l border-slate-200">
              <Link to={dashboardPath}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={LayoutDashboard}
                  iconPosition="left"
                >
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>

              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-700 font-medium">
                <span className="max-w-[120px] truncate">{user.full_name}</span>
                <Badge variant={user.role === 'teacher' ? 'blue' : 'emerald'} size="sm">
                  {user.role}
                </Badge>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <Link to="/student/login">
                <Button variant="ghost" size="sm">
                  Student Login
                </Button>
              </Link>
              <Link to="/teacher/login">
                <Button variant="primary" size="sm">
                  Teacher Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
