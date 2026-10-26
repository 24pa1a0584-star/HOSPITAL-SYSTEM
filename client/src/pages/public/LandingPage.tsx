import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorApi, hospitalApi } from '../../services/api';
import { Doctor } from '../../types';
import { DoctorCard } from '../../components/doctors/DoctorCard';
import { BookingModal } from '../../components/booking/BookingModal';
import {
  Search,
  Calendar,
  Clock,
  ShieldCheck,
  HeartPulse,
  Award,
  Users,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Stethoscope,
  Activity,
  Sparkles,
  Baby,
  Brain,
  Building,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Data states
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    // Load top verified doctors
    doctorApi
      .searchDoctors({ limit: 4 })
      .then((res) => {
        if (res.data.success) {
          setFeaturedDoctors(res.data.doctors || []);
        }
      })
      .catch(() => {});

    // Load specialties
    hospitalApi
      .getSpecialties()
      .then((res) => {
        if (res.data.success) {
          setSpecialties(res.data.specialties || []);
        }
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedSpecialty) params.set('specialization', selectedSpecialty);
    if (selectedCity) params.set('city', selectedCity);
    navigate(`/doctors?${params.toString()}`);
  };

  const specialtyIcons: Record<string, any> = {
    Cardiology: HeartPulse,
    Dermatology: Sparkles,
    Orthopedics: Activity,
    'General Medicine': Stethoscope,
    Pediatrics: Baby,
    Neurology: Brain,
  };

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* 1. HERO SECTION WITH VIBRANT HEALTHCARE ILLUSTRATION & ANIMATION */}
      <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-teal-50/60 via-cloud-white to-white">
        {/* Ambient Decorative Shapes */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-royal-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & Search */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-teal-100 text-xs font-bold text-teal-700">
                <span className="w-2 h-2 rounded-full bg-teal-healing animate-ping" />
                <ShieldCheck className="w-4 h-4 text-teal-healing" />
                Verified Doctor Schedules & Atomic OPD Reservations
              </div>

              {/* Major Editorial Headline */}
              <h1 className="font-headline font-bold text-4xl sm:text-5xl lg:text-6xl text-navy-deep tracking-tight leading-[1.15]">
                Your health.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-healing via-royal-blue to-lavender-soft">
                  Your doctor.
                </span>{' '}
                Your perfect time.
              </h1>

              {/* Supporting Description */}
              <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Discover trusted healthcare professionals, explore genuinely available appointment
                slots, and manage your hospital visits in one seamless, real-time experience.
              </p>

              {/* Interactive Search Box */}
              <div className="pt-2">
                <form
                  onSubmit={handleSearchSubmit}
                  className="bg-white p-3 sm:p-4 rounded-3xl shadow-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-3"
                >
                  <div className="sm:col-span-5 relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Doctor name or condition..."
                      className="w-full pl-11 pr-3 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-healing/30"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <select
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-healing/30"
                    >
                      <option value="">All Specialties</option>
                      {specialties.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      className="w-full h-full py-3 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-teal-healing to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-soft-glow hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>Find Doctors</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Quick Pill Specialties */}
              <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap pt-2">
                <span className="text-xs font-semibold text-slate-400">Popular:</span>
                {['Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics'].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setSelectedSpecialty(item);
                      navigate(`/doctors?specialization=${item}`);
                    }}
                    className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-healing text-slate-600 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Dynamic Healthcare Graphic & Floating Cards */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* Main Card with Medical Visual */}
                <div className="bg-gradient-to-br from-white via-white to-teal-50/50 rounded-3xl p-6 shadow-2xl border border-slate-200/80 relative overflow-hidden">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-healing flex items-center justify-center">
                        <HeartPulse className="w-7 h-7 animate-heart-pulse" />
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-navy-deep text-base">
                          CareNova OPD Center
                        </h4>
                        <p className="text-xs text-slate-500">Live Hospital Schedule</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                      OPEN NOW
                    </span>
                  </div>

                  <div className="my-5 space-y-3">
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80"
                          alt="Doctor"
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-navy-deep">Dr. Rajesh Sharma</p>
                          <p className="text-[11px] text-teal-healing font-semibold">Cardiology Specialist</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-royal-blue bg-royal-50 px-2 py-1 rounded-lg">
                        10:20 AM
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src="https://images.unsplash.com/photo-1594824813589-73e449f826aa?w=120&auto=format&fit=crop&q=80"
                          alt="Doctor"
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-navy-deep">Dr. Priya Sen</p>
                          <p className="text-[11px] text-teal-healing font-semibold">Dermatology Specialist</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-royal-blue bg-royal-50 px-2 py-1 rounded-lg">
                        11:40 AM
                      </span>
                    </div>
                  </div>

                  {/* Micro Timeline Indicator */}
                  <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5 text-teal-600">
                      <CheckCircle className="w-3.5 h-3.5" /> Slot Verified
                    </span>
                    <span>Zero Double-Booking</span>
                  </div>
                </div>

                {/* Floating Confirmed Appointment Badge */}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-float-slow hidden sm:flex">
                  <div className="w-10 h-10 rounded-xl bg-teal-healing text-white flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-teal-healing uppercase block">
                      Confirmed Booking
                    </span>
                    <span className="text-xs font-bold text-navy-deep">
                      Ref: CARE-APT-2026-000128
                    </span>
                  </div>
                </div>

                {/* Floating Verified Counter Badge */}
                <div className="absolute -top-6 -right-4 bg-navy-deep text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <div>
                    <span className="text-xs font-bold block">100% Genuine</span>
                    <span className="text-[10px] text-slate-300">Council Verified MDs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-navy-deep text-white rounded-3xl p-8 sm:p-10 grid grid-cols-2 lg:grid-cols-4 gap-8 shadow-xl">
          <div className="space-y-1 text-center sm:text-left border-r border-slate-800 pr-4">
            <span className="font-headline font-bold text-3xl sm:text-4xl text-teal-400">100%</span>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">Verified Physicians</p>
          </div>
          <div className="space-y-1 text-center sm:text-left border-r border-slate-800 pr-4">
            <span className="font-headline font-bold text-3xl sm:text-4xl text-royal-400">Zero</span>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">Double-Booked Slots</p>
          </div>
          <div className="space-y-1 text-center sm:text-left border-r border-slate-800 pr-4">
            <span className="font-headline font-bold text-3xl sm:text-4xl text-coral-warm">&lt; 30s</span>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">Instant Booking Confirmation</p>
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <span className="font-headline font-bold text-3xl sm:text-4xl text-lavender-400">2 Branches</span>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">Delhi & Bengaluru Facilities</p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED SPECIALTIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold text-teal-healing uppercase tracking-wider block mb-1">
              Clinical Excellence
            </span>
            <h2 className="font-headline font-bold text-3xl sm:text-4xl text-navy-deep">
              Specialized Medical Departments
            </h2>
          </div>
          <Link
            to="/specialties"
            className="text-xs sm:text-sm font-bold text-teal-healing hover:text-teal-700 flex items-center gap-1.5"
          >
            View All Departments <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {[
            { name: 'Cardiology', desc: 'Heart & Vascular', count: '4 Doctors' },
            { name: 'Dermatology', desc: 'Skin & Aesthetics', count: '3 Doctors' },
            { name: 'Orthopedics', desc: 'Bones & Joints', count: '5 Doctors' },
            { name: 'General Medicine', desc: 'Adult OPD Care', count: '6 Doctors' },
            { name: 'Pediatrics', desc: 'Child Healthcare', count: '3 Doctors' },
            { name: 'Neurology', desc: 'Brain & Spine', count: '2 Doctors' },
          ].map((item) => {
            const Icon = specialtyIcons[item.name] || Stethoscope;
            return (
              <div
                key={item.name}
                onClick={() => navigate(`/doctors?specialization=${item.name}`)}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-teal-400 hover:shadow-card-hover cursor-pointer transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-healing group-hover:bg-teal-healing group-hover:text-white flex items-center justify-center transition-colors mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm sm:text-base text-navy-deep group-hover:text-teal-healing transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <span className="text-[11px] font-semibold text-royal-blue mt-4 block">
                  {item.count} →
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. FEATURED VERIFIED DOCTORS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold text-royal-blue uppercase tracking-wider block mb-1">
              Top Practitioners
            </span>
            <h2 className="font-headline font-bold text-3xl sm:text-4xl text-navy-deep">
              Featured Verified Specialists
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Every doctor displayed has verified institutional registration and authentic available time slots.
            </p>
          </div>
          <Link
            to="/doctors"
            className="text-xs sm:text-sm font-bold text-teal-healing hover:text-teal-700 flex items-center gap-1.5 shrink-0"
          >
            Explore All Specialists <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredDoctors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-headline font-bold text-navy-deep text-lg">No Verified Doctors Listed</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Doctors will appear here once approved by the Hospital Administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDoctors.map((doc) => (
              <DoctorCard
                key={doc._id}
                doctor={doc}
                onBookClick={(d) => {
                  setSelectedDoctorForBooking(d);
                  setIsBookingModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="bg-slate-50 py-20 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-bold text-teal-healing uppercase tracking-wider">
              Simple 4-Step Process
            </span>
            <h2 className="font-headline font-bold text-3xl sm:text-4xl text-navy-deep">
              How CARENOVA Works
            </h2>
            <p className="text-slate-600 text-sm">
              We eliminate hospital waiting room ambiguity with guaranteed slot availability and instant digital booking confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Find Your Specialist',
                desc: 'Search by medical discipline, doctor qualifications, hospital location, or consultation fee.',
                icon: Search,
              },
              {
                step: '02',
                title: 'Choose Available Slot',
                desc: 'View genuine real-time open slots synced directly with physician OPD shifts and leaves.',
                icon: Calendar,
              },
              {
                step: '03',
                title: 'Atomic Reservation',
                desc: 'Our concurrency-protected scheduling engine locks your slot instantly without duplicate bookings.',
                icon: ShieldCheck,
              },
              {
                step: '04',
                title: 'Check In & Consult',
                desc: 'Present your CARE-APT reference at reception or view your digital queue number on mobile.',
                icon: CheckCircle,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-healing flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-headline font-bold text-2xl text-slate-200">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-lg text-navy-deep">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. WHY CARENOVA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold text-teal-healing uppercase tracking-wider block">
              Enterprise Healthcare Platform
            </span>
            <h2 className="font-headline font-bold text-3xl sm:text-4xl text-navy-deep leading-tight">
              Engineered for absolute reliability in patient appointment scheduling
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Unlike generic directory apps that merely capture booking requests and call you later,
              CARENOVA operates on an atomic scheduling inventory model. When you book a 10:20 AM slot,
              it is guaranteed in hospital database records.
            </p>

            <div className="space-y-3.5 pt-2">
              {[
                'Atomic concurrency reservation prevents any slot collision between concurrent users.',
                'Mandatory institutional verification ensures no unverified profiles offer public slots.',
                'Instant rescheduling with rollback safety preserves original bookings if replacements fail.',
                'Live digital queue updates inform receptionists and patients of real OPD consultation flow.',
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-healing flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="text-xs sm:text-sm text-slate-700 font-medium">{point}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-navy-deep hover:bg-slate-800 shadow-md transition-all"
              >
                <span>Get Started with CARENOVA</span>
                <ArrowRight className="w-4 h-4 text-teal-400" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-royal-blue rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <span className="text-xs font-bold tracking-wider uppercase text-teal-200">
                Hospital Network
              </span>
              <h3 className="font-headline font-bold text-2xl sm:text-3xl">
                Serving patients across premier medical branches
              </h3>
              <div className="space-y-4 text-sm text-teal-50">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                  <p className="font-bold text-white text-base">New Delhi Apex Branch</p>
                  <p className="text-xs text-teal-100 mt-1">
                    South Extension Part II • 24/7 Emergency & Multi-speciality OPD
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                  <p className="font-bold text-white text-base">Bengaluru SuperCare Center</p>
                  <p className="text-xs text-teal-100 mt-1">
                    HAL 2nd Stage, Indiranagar • Advanced Diagnostic & OPD Suites
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-bold text-teal-healing uppercase tracking-wider">
            Clear Answers
          </span>
          <h2 className="font-headline font-bold text-3xl text-navy-deep">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'How does CARENOVA prevent double-booking of doctors?',
              a: 'Our backend uses atomic conditional writes and unique compound indexes in MongoDB. When a patient confirms a slot, the system locks that specific slot before writing the appointment. If two patients attempt to book the exact same slot at the exact same millisecond, exactly one succeeds and the second is immediately notified with a 409 Conflict status to pick another slot.',
            },
            {
              q: 'Can I cancel or reschedule my hospital appointment?',
              a: 'Yes. From your Patient Dashboard, you can cancel or reschedule any upcoming appointment. Rescheduling atomically reserves the replacement slot first. If the replacement slot is unavailable, your original booking is safely preserved.',
            },
            {
              q: 'How are doctors verified on CARENOVA?',
              a: 'Doctors submit their state medical council registration number, qualifications, and years of experience. New accounts start as PENDING_VERIFICATION and cannot offer bookable slots until the Hospital Medical Director manually reviews and activates their credentials.',
            },
            {
              q: 'Are consultation fees charged online during booking?',
              a: 'Consultation fees are transparently displayed for each specialist in Indian Rupees (₹). OPD consultation fees can be settled at the hospital reception during physical check-in.',
            },
          ].map((faq, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
              <h4 className="font-headline font-bold text-base text-navy-deep flex items-start gap-2.5">
                <HelpCircle className="w-5 h-5 text-teal-healing shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        doctor={selectedDoctorForBooking}
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedDoctorForBooking(null);
        }}
      />
    </div>
  );
};
