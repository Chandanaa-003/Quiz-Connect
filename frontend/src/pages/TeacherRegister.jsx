import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Mail, Lock, User, UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { registerUser, loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TeacherRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim() || formData.full_name.trim().length < 2) {
      errs.full_name = 'Full name must be at least 2 characters.';
    }
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }
    if (formData.password !== formData.confirm_password) {
      errs.confirm_password = 'Passwords do not match.';
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
      // 1. Register with role: teacher
      await registerUser({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: 'teacher',
      });

      // 2. Automatically log in to issue JWT token
      const authData = await loginUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      login(authData.access_token, authData.user);
      navigate('/teacher/dashboard', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Registration failed. Please check your information and try again.';
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
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-4 shadow-sm">
            <Users className="w-7 h-7" />
          </div>
          <Badge variant="blue" size="sm" className="mb-2">
            Educator Registration
          </Badge>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Teacher Account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize, schedule, and grade assessments effortlessly
          </p>
        </div>

        {/* API Error Notification */}
        {apiError && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{apiError}</div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Dr. Eleanor Vance"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-white border ${
                  errors.full_name ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                } rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition`}
              />
            </div>
            {errors.full_name && <p className="text-xs text-rose-600 mt-1">{errors.full_name}</p>}
          </div>

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
                placeholder="teacher@institution.edu"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-white border ${
                  errors.email ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                } rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition`}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                className={`w-full pl-10 pr-10 py-2.5 bg-white border ${
                  errors.password ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                } rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition`}
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-white border ${
                  errors.confirm_password ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                } rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition`}
                autoComplete="new-password"
              />
            </div>
            {errors.confirm_password && (
              <p className="text-xs text-rose-600 mt-1">{errors.confirm_password}</p>
            )}
          </div>

          {/* Role Confirmation Pill */}
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">Account Type:</span>
            <Badge variant="blue" size="sm">
              Role: Teacher
            </Badge>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
              icon={loading ? Loader2 : UserPlus}
              iconPosition="right"
            >
              {loading ? 'Registering Account...' : 'Create Teacher Account'}
            </Button>
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Already have a teacher account?{' '}
            <Link to="/teacher/login" className="font-semibold text-blue-600 hover:text-blue-700 underline">
              Login as Teacher
            </Link>
          </p>

          <p className="text-xs text-slate-500">
            Looking for student registration?{' '}
            <Link to="/student/register" className="font-medium text-slate-700 hover:text-blue-600 underline">
              Register as Student
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
