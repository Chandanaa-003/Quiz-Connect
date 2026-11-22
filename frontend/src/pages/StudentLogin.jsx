import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function StudentLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      errs.password = 'Password is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    try {
      const data = await loginUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // Verify that this user is a student
      if (data.user.role !== 'student') {
        login(data.access_token, data.user);
        navigate('/teacher/dashboard', { replace: true });
        return;
      }

      login(data.access_token, data.user);
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Unable to sign in. Please verify your email and password.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card className="border-slate-200 shadow-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4 shadow-sm">
            <GraduationCap className="w-7 h-7" />
          </div>
          <Badge variant="emerald" size="sm" className="mb-2">
            Learner & Candidate Portal
          </Badge>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Login</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to attend scheduled quizzes and view assessment results
          </p>
        </div>

        {/* API Error Notification */}
        {apiError && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{apiError}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@institution.edu"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-white border ${
                  errors.email ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-emerald-500'
                } rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition`}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`w-full pl-10 pr-10 py-2.5 bg-white border ${
                  errors.password ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-emerald-500'
                } rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password}</p>}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 focus:ring-emerald-500"
              disabled={loading}
              icon={loading ? Loader2 : LogIn}
              iconPosition="right"
            >
              {loading ? 'Authenticating...' : 'Sign In as Student'}
            </Button>
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Don't have a student account?{' '}
            <Link to="/student/register" className="font-semibold text-emerald-600 hover:text-emerald-700 underline">
              Register as Student
            </Link>
          </p>

          <p className="text-xs text-slate-500">
            Are you a teacher?{' '}
            <Link to="/teacher/login" className="font-medium text-slate-700 hover:text-blue-600 underline">
              Switch to Teacher Login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
