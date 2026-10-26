import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { ShieldCheck, Mail, Lock, Stethoscope, Users, Key, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const StaffLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        const user = res.data.user;
        login(user, res.data.token);
        toast.success(`Welcome, ${user.name} (${user.role})!`);

        // Route strictly according to verified backend permissions
        switch (user.role) {
          case 'ADMIN':
            navigate('/admin');
            break;
          case 'DOCTOR':
            navigate('/doctor');
            break;
          case 'RECEPTIONIST':
            navigate('/receptionist');
            break;
          default:
            navigate('/patient/dashboard');
            break;
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Staff authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDoctor = () => {
    setEmail('dr.sharma.cardio@carenova.hospital');
    setPassword('DoctorSecure@2026!');
  };

  const fillReceptionist = () => {
    setEmail('receptionist.delhi@carenova.hospital');
    setPassword('ReceptionSecure@2026!');
  };

  const fillAdmin = () => {
    setEmail('admin@carenova.hospital');
    setPassword('AdminSecure@2026!');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-royal-50 text-royal-blue mx-auto flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-headline font-bold text-2xl text-navy-deep">
            Hospital Staff Portal
          </h2>
          <p className="text-xs text-slate-500">
            Secure entry for Verified Physicians, Front Desk Officers, and Hospital Administrators.
          </p>
        </div>

        {/* Demo Faculty Fast-Fill Badges */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            ⚡ Quick-Fill Demonstration Credentials:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={fillDoctor}
              className="p-2.5 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 group-hover:text-teal-800">
                <Stethoscope className="w-3.5 h-3.5" /> Doctor
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Dr. Sharma</span>
            </button>

            <button
              type="button"
              onClick={fillReceptionist}
              className="p-2.5 rounded-xl bg-white hover:bg-royal-50 border border-slate-200 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-royal-blue group-hover:text-royal-800">
                <Users className="w-3.5 h-3.5" /> Front Desk
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Receptionist</span>
            </button>

            <button
              type="button"
              onClick={fillAdmin}
              className="p-2.5 rounded-xl bg-white hover:bg-purple-50 border border-slate-200 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-lavender-soft group-hover:text-purple-800">
                <Key className="w-3.5 h-3.5" /> Admin
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Dr. Anita Roy</span>
            </button>
          </div>
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
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@carenova.hospital"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-royal-blue/30"
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
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-royal-blue/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-royal-blue to-navy-deep hover:from-royal-700 hover:to-navy-950 disabled:opacity-50 shadow-md transition-all"
          >
            {loading ? 'Authenticating...' : 'Sign In to Staff Workspace'}
          </button>
        </form>

        <div className="pt-2 text-center space-y-3">
          <p className="text-xs text-slate-500">
            Are you a medical doctor looking to practice with CARENOVA?{' '}
            <Link to="/doctor-registration" className="font-bold text-teal-healing hover:underline">
              Submit Credential Request
            </Link>
          </p>

          <div className="pt-3 border-t border-slate-100">
            <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-slate-800">
              ← Switch to Patient Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
