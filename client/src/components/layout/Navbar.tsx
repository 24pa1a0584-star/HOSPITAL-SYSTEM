import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  User as UserIcon,
  Bell,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Stethoscope,
  Building2,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenNotifications: () => void }> = ({ onOpenNotifications }) => {
  const { user, logout, unreadCount } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN':
        return '/admin';
      case 'DOCTOR':
        return '/doctor';
      case 'RECEPTIONIST':
        return '/receptionist';
      default:
        return '/patient/dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-healing via-royal-blue to-lavender-soft flex items-center justify-center shadow-soft-glow group-hover:scale-105 transition-transform duration-300">
              <div className="relative flex items-center justify-center">
                <span className="w-4 h-4 rounded-full bg-white/20 animate-ping absolute" />
                <svg
                  className="w-7 h-7 text-white animate-heart-pulse"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
            </div>
            <div>
              <span className="font-headline font-bold text-2xl tracking-tight text-navy-deep flex items-center">
                CARE<span className="text-teal-healing">NOVA</span>
              </span>
              <span className="block text-[10px] font-semibold text-royal-blue tracking-wider uppercase -mt-1">
                Smart Hospital System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
            <Link
              to="/"
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-teal-healing transition-colors rounded-lg hover:bg-slate-50"
            >
              Home
            </Link>
            <Link
              to="/doctors"
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-teal-healing transition-colors rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Stethoscope className="w-4 h-4 text-teal-healing" />
              Find Doctors
            </Link>
            <Link
              to="/specialties"
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-teal-healing transition-colors rounded-lg hover:bg-slate-50"
            >
              Specialties
            </Link>
            <Link
              to="/hospitals"
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-teal-healing transition-colors rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4 text-royal-blue" />
              Hospitals
            </Link>
            <Link
              to="/how-it-works"
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-teal-healing transition-colors rounded-lg hover:bg-slate-50"
            >
              How It Works
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Notification Bell */}
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2.5 rounded-xl text-slate-600 hover:text-teal-healing hover:bg-teal-50 transition-colors border border-slate-200"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-coral-warm text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dashboard Shortcut */}
                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-teal-healing hover:bg-teal-700 rounded-xl shadow-sm hover:shadow transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  {user.role === 'PATIENT' ? 'My Appointments' : 'Dashboard'}
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pl-3 pr-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-800 text-sm font-semibold"
                  >
                    <span>{user.name.split(' ')[0]}</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-royal-blue/10 text-royal-blue font-bold">
                      {user.role}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>

                      <Link
                        to={getDashboardPath()}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-healing"
                      >
                        <Calendar className="w-4 h-4" />
                        My Dashboard
                      </Link>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-coral-600 hover:bg-coral-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/staff-login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-royal-blue hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Staff Portal
                </Link>

                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-teal-healing transition-colors"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-teal-healing to-teal-700 hover:from-teal-700 hover:to-teal-800 rounded-xl shadow-soft-glow hover:shadow-lg transition-all"
                >
                  Book Appointment
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            {user && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-coral-warm text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            Home
          </Link>
          <Link
            to="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            Find Doctors
          </Link>
          <Link
            to="/specialties"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            Specialties
          </Link>
          <Link
            to="/hospitals"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            Hospitals
          </Link>

          <div className="pt-4 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 text-center font-bold text-white bg-teal-healing rounded-xl shadow"
                >
                  Go to {user.role === 'PATIENT' ? 'Patient Portal' : `${user.role} Portal`}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/');
                  }}
                  className="block w-full py-2.5 text-center font-semibold text-coral-600 bg-coral-50 rounded-xl"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center font-semibold text-slate-800 bg-slate-100 rounded-xl"
                >
                  Patient Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 text-center font-bold text-white bg-teal-healing rounded-xl shadow"
                >
                  Register & Book
                </Link>
                <Link
                  to="/staff-login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center text-xs font-bold text-royal-blue bg-royal-50 rounded-xl"
                >
                  Hospital Staff Portal (Doctors, Staff & Admins)
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
