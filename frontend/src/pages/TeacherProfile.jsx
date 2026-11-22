import React from 'react';
import { User, Mail, ShieldCheck, Calendar, KeyRound, LogOut, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export default function TeacherProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teacher Profile</h1>
          <p className="text-xs text-slate-500 mt-1">Manage instructor account settings and security credentials</p>
        </div>

        <Badge variant="blue" size="sm">
          Role: Educator
        </Badge>
      </div>

      {/* Main Profile Card */}
      <Card className="border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'T'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="emerald" size="sm" icon={CheckCircle2}>
                Account Active
              </Badge>
              <Badge variant="slate" size="sm">
                ID #{user?.id}
              </Badge>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="py-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Specifications</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[11px] font-semibold uppercase">Full Name</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{user?.full_name}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[11px] font-semibold uppercase">Email Address</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{user?.email}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[11px] font-semibold uppercase">System Role</span>
              <span className="font-semibold text-blue-600 text-sm mt-0.5 block capitalize">{user?.role}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[11px] font-semibold uppercase">Security Mode</span>
              <span className="font-semibold text-emerald-600 text-sm mt-0.5 block">Argon2id + JWT Verified</span>
            </div>
          </div>
        </div>

        {/* Sign Out Card Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button
            variant="outlineSlate"
            size="md"
            icon={LogOut}
            iconPosition="left"
            onClick={handleLogout}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            Sign Out of QuizConnect
          </Button>
        </div>
      </Card>
    </div>
  );
}
