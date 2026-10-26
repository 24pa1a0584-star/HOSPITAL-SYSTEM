import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Calendar, Clock, CheckCircle2, UserCheck, ArrowRight } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-teal-healing uppercase tracking-wider">
          Patient Guide
        </span>
        <h1 className="font-headline font-bold text-3xl sm:text-4xl text-navy-deep">
          How CARENOVA Coordinates Appointments
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          An engineering-driven scheduling architecture designed to eliminate duplicate bookings,
          protect patient privacy, and deliver transparent healthcare access.
        </p>
      </div>

      <div className="space-y-8">
        {[
          {
            step: 'Step 1: Discover Verified Medical Specialists',
            detail:
              'Browse by medical specialty (Cardiology, Dermatology, Orthopedics, etc.), doctor qualifications, hospital location, and consultation fee in Indian Rupees. Every doctor listed has undergone institutional credential validation by hospital administrators.',
            icon: UserCheck,
            color: 'teal',
          },
          {
            step: 'Step 2: Real-Time Dynamic Slot Inspection',
            detail:
              'Our backend scheduling engine calculates available time slots using the physician\'s active weekly working shifts, buffer minutes, and lunch/tea breaks. Days marked as doctor leave or past slots are strictly excluded.',
            icon: Clock,
            color: 'royal',
          },
          {
            step: 'Step 3: Atomic Concurrency-Safe Reservation',
            detail:
              'When you click "Confirm Booking", MongoDB executes an atomic conditional update on that specific slot inventory. Even if two patients submit simultaneously, only one reservation succeeds. The second receives an immediate prompt to choose another slot.',
            icon: ShieldCheck,
            color: 'lavender',
          },
          {
            step: 'Step 4: Real-Time Booking Reference & In-App Alerts',
            detail:
              'Upon confirmation, you receive a permanent reference number (e.g. CARE-APT-2026-000128). An in-app Socket.IO alert updates your dashboard and notifies the doctor schedule in real-time.',
            icon: CheckCircle2,
            color: 'mint',
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start gap-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-healing flex items-center justify-center shrink-0">
                <Icon className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="font-headline font-bold text-xl text-navy-deep">{item.step}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-teal-500 to-royal-blue rounded-3xl p-8 sm:p-10 text-white text-center space-y-4 shadow-xl">
        <h3 className="font-headline font-bold text-2xl sm:text-3xl">
          Ready to experience hassle-free hospital visits?
        </h3>
        <p className="text-xs sm:text-sm text-teal-50 max-w-xl mx-auto">
          Create a patient account in under 30 seconds or browse our doctor directory today.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-white text-navy-deep hover:bg-slate-100 shadow transition-all"
          >
            Register Patient Account
          </Link>
          <Link
            to="/doctors"
            className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-teal-700/60 hover:bg-teal-700 text-white border border-white/20 transition-all"
          >
            Find a Doctor
          </Link>
        </div>
      </div>
    </div>
  );
};
