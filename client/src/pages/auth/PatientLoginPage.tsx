import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { Mail, Lock, LogIn, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const PatientLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = (location.state as any)?.from?.pathname || '/patient/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.login({ email, password });
      if (res.data.success) {
        login(res.data.user, res.data.token);
        toast.success(`Welcome back, ${res.data.user.name}!`);

        if (res.data.user.role === 'DOCTOR') {
          navigate('/doctor');
        } else if (res.data.user.role === 'RECEPTIONIST') {
          navigate('/receptionist');
        } else if (res.data.user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemoPatient = () => {
    setEmail('patient.rohit@gmail.com');
    setPassword('PatientSecure@2026!');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-healing mx-auto flex items-center justify-center shadow-sm">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="font-headline font-bold text-2xl text-navy-deep">Patient Sign In</h2>
          <p className="text-xs text-slate-500">
            Access your appointments, booking history, and medical consultations.
          </p>
        </div>

        {/* Demo Fast-Fill Button for Evaluation */}
        <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-bold text-teal-900 block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Demo Patient Account
            </span>
            <span className="text-[11px] text-teal-700">patient.rohit@gmail.com</span>
          </div>
          <button
            type="button"
            onClick={autofillDemoPatient}
            className="px-3 py-1.5 rounded-xl bg-teal-healing hover:bg-teal-700 text-white font-bold text-[11px] shadow-sm transition-all"
          >
            Auto Fill
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-coral-50 border border-coral-200 text-coral-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-coral-warm" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-healing/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-healing/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-teal-healing to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 shadow-soft-glow transition-all"
          >
            {loading ? 'Signing in...' : 'Sign In as Patient'}
          </button>
        </form>

        <div className="pt-2 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-teal-healing hover:underline">
              Create an account
            </Link>
          </p>

          <div className="pt-3 border-t border-slate-100">
            <Link
              to="/staff-login"
              className="text-xs font-bold text-royal-blue hover:text-royal-700 flex items-center justify-center gap-1"
            >
              Hospital Staff Portal (Doctors, Staff & Admins) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
