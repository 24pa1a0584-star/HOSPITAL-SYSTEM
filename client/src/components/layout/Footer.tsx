import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Heart, Shield, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-deep text-white pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Emergency Medical Warning Banner (Mandatory for Healthcare Systems) */}
        <div className="mb-12 p-4 sm:p-5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3.5 text-amber-200">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="text-amber-300 font-bold block mb-1">
              EMERGENCY MEDICAL NOTICE
            </strong>
            CARENOVA is an outpatient appointment booking and hospital schedule management platform.
            If you or someone around you is facing a life-threatening medical emergency, acute trauma,
            or chest pain, immediately dial <strong>112 (National Emergency)</strong> or{' '}
            <strong>102 (Ambulance)</strong>, or proceed directly to the nearest hospital emergency
            department. Do not rely on scheduled appointments for urgent medical crises.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-healing to-royal-blue flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-headline font-bold text-2xl tracking-tight">
                CARE<span className="text-teal-400">NOVA</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Care made simple. Every appointment matters. Connecting patients with verified medical
              specialists across state-of-the-art multi-department hospital facilities.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-teal-400">
                <Shield className="w-4 h-4" /> 100% Verified Physicians
              </span>
              <span>•</span>
              <span>Atomic Slot Reservations</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-headline font-bold text-base text-white mb-4">Patient Care</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/doctors" className="hover:text-teal-400 transition-colors">
                  Find Verified Doctors
                </Link>
              </li>
              <li>
                <Link to="/specialties" className="hover:text-teal-400 transition-colors">
                  Medical Specialties
                </Link>
              </li>
              <li>
                <Link to="/hospitals" className="hover:text-teal-400 transition-colors">
                  Hospital Locations
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-teal-400 transition-colors">
                  Booking Process
                </Link>
              </li>
            </ul>
          </div>

          {/* Hospital Staff */}
          <div>
            <h4 className="font-headline font-bold text-base text-white mb-4">Hospital Staff</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/staff-login" className="hover:text-royal-400 transition-colors">
                  Staff Login Portal
                </Link>
              </li>
              <li>
                <Link to="/doctor-registration" className="hover:text-royal-400 transition-colors">
                  Doctor Onboarding Request
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-royal-400 transition-colors">
                  Patient Portal Login
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-royal-400 transition-colors">
                  Privacy & Data Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Branches */}
          <div>
            <h4 className="font-headline font-bold text-base text-white mb-4">Contact Centers</h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>Apex Hospital: B-42 Ring Road, South Extension Part II, New Delhi</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-royal-400 shrink-0 mt-0.5" />
                <span>SuperCare: 100 Ft Rd, HAL 2nd Stage, Indiranagar, Bengaluru</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>+91 11 4982 0000 (Delhi Helpline)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-royal-400 shrink-0" />
                <span>support@carenova.hospital</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CARENOVA Hospital Systems. Built with MERN Stack & TypeScript.</p>
          <div className="flex items-center space-x-6">
            <Link to="/privacy-policy" className="hover:text-slate-400">
              DPDP Privacy Notice
            </Link>
            <Link to="/terms" className="hover:text-slate-400">
              Terms of Care
            </Link>
            <span>Timezone: Asia/Kolkata</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
