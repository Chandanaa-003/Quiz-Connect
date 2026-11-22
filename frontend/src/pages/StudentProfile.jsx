import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  GraduationCap,
  Shield,
  Calendar,
  LogOut,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export default function StudentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Personal account information and student credentials
        </p>
      </div>

      <Card className="border-slate-200 p-6 sm:p-8">
        {/* Profile Avatar Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-sm">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'S'}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user?.full_name || 'Student Name'}</h2>
              <Badge variant="emerald" size="sm">
                Active Candidate
              </Badge>
            </div>
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email || 'student@quizconnect.local'}</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Role: <strong className="text-slate-600 capitalize">{user?.role || 'student'}</strong>
            </p>
          </div>
        </div>

        {/* Account Details List */}
        <div className="py-6 space-y-4 text-xs">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Candidate ID</span>
            <span className="font-mono text-slate-800 font-semibold">
              QC-STU-#{user?.id ? String(user.id).padStart(4, '0') : '0001'}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Account Status</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active & Verified
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Registration Role</span>
            <span className="capitalize font-semibold text-slate-800">{user?.role || 'student'}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Access Tier</span>
            <span className="text-slate-800 font-semibold">General Examination</span>
          </div>
        </div>

        {/* Security & Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Protected by Argon2 & JWT Authentication
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
