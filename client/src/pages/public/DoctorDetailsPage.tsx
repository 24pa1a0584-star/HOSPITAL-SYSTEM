import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doctorApi, appointmentApi } from '../../services/api';
import { Doctor, BookableSlot } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Award,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building,
  Phone,
  Video,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export const DoctorDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Booking states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<BookableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [consultationType, setConsultationType] = useState<'IN_PERSON' | 'VIDEO'>('IN_PERSON');
  const [visitReason, setVisitReason] = useState<string>('General Consultation');
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [slotError, setSlotError] = useState<string>('');

  const availableDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + (i + 1));
    return {
      dateString: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    doctorApi
      .getDoctorProfile(id)
      .then((res) => {
        if (res.data.success) {
          setDoctor(res.data.doctor);
          setSchedules(res.data.schedules || []);
          setSelectedDate(availableDates[0].dateString);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load doctor profile.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!id || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    setSlotError('');

    doctorApi
      .getDoctorAvailability(id, selectedDate)
      .then((res) => {
        if (res.data.success) {
          setSlots(res.data.slots || []);
          if (!res.data.isAvailable && res.data.message) {
            setSlotError(res.data.message);
          }
        }
      })
      .catch((err) => {
        setSlotError(err.message || 'Error loading slots');
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [id, selectedDate]);

  const handleBookAppointment = async () => {
    if (!user) {
      toast.error('Please sign in as a patient to book an appointment.');
      navigate('/login');
      return;
    }

    if (!selectedSlot) {
      toast.error('Please pick an available time slot.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await appointmentApi.bookAppointment({
        doctorId: doctor!._id,
        slotId: selectedSlot._id,
        consultationType,
        visitReason,
      });

      if (res.data.success) {
        setBookingSuccess(res.data.appointment);
        toast.success('Appointment confirmed!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Booking failed. Slot may have been reserved.');
      // Refresh slots
      doctorApi.getDoctorAvailability(id!, selectedDate).then((res) => {
        if (res.data.success) setSlots(res.data.slots || []);
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-healing/20 border-t-teal-healing rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="font-headline font-bold text-2xl text-navy-deep">Doctor Profile Not Found</h2>
        <Link to="/doctors" className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-healing">
          <ArrowLeft className="w-4 h-4" /> Back to Doctor Directory
        </Link>
      </div>
    );
  }

  const doctorName = doctor.userId?.name || 'Medical Specialist';
  const avatarUrl =
    doctor.profilePhoto ||
    doctor.userId?.avatar ||
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <Link
        to="/doctors"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-teal-healing transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Doctor Directory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Doctor Details & Bio */}
        <div className="lg:col-span-7 space-y-6">
          {/* Doctor Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative shrink-0">
                <img
                  src={avatarUrl}
                  alt={doctorName}
                  className="w-28 h-28 rounded-3xl object-cover border-2 border-white shadow-lg"
                />
                {doctor.verificationStatus === 'ACTIVE' && (
                  <div
                    className="absolute -bottom-1 -right-1 bg-teal-healing text-white p-1.5 rounded-full shadow-md"
                    title="Hospital Council Verified"
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-healing border border-teal-100">
                    {doctor.specialization}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {doctor.uniqueDoctorId}
                  </span>
                </div>

                <h1 className="font-headline font-bold text-2xl sm:text-3xl text-navy-deep">
                  {doctorName}
                </h1>

                <p className="text-sm font-semibold text-slate-600">
                  {doctor.qualifications?.join(', ')}
                </p>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <Award className="w-4 h-4 text-amber-500" />
                    {doctor.experienceYears} Years Clinical Practice
                  </span>
                  <span>•</span>
                  <span>OPD Consultation</span>
                </div>
              </div>
            </div>

            {/* Verification Metadata Box */}
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 text-xs text-slate-700 space-y-1.5">
              <p className="font-bold text-teal-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-healing" />
                Institutional Verification Details
              </p>
              <p className="text-slate-600">
                Medical Registration No: <strong>{doctor.medicalRegistrationNumber}</strong> (
                {doctor.registrationAuthority})
              </p>
              <p className="text-slate-500 text-[11px]">
                Verified by Hospital Medical Directorate for clinical outpatient practice.
              </p>
            </div>

            {/* Clinical Bio */}
            <div>
              <h3 className="font-headline font-bold text-base text-navy-deep mb-2">
                About the Specialist
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {doctor.bio || 'Experienced medical practitioner providing high quality care.'}
              </p>
            </div>

            {/* Hospital Affiliation & Clinic Hours */}
            <div className="space-y-3">
              <h3 className="font-headline font-bold text-base text-navy-deep">
                Hospital Affiliation
              </h3>
              <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-start gap-3">
                <Building className="w-5 h-5 text-royal-blue shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm text-navy-deep">
                    {doctor.hospitalId?.name || 'CareNova Hospital Branch'}
                  </p>
                  <p className="text-slate-500">{doctor.hospitalId?.address}</p>
                  <p className="text-slate-500">
                    City: {doctor.hospitalId?.city}, {doctor.hospitalId?.state}
                  </p>
                  <p className="text-teal-700 font-semibold pt-1">
                    Hours: {doctor.hospitalId?.openingHours || '8:00 AM - 8:00 PM'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Sticky Booking Panel */}
        <div className="lg:col-span-5 sticky top-28">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Outpatient OPD Fee
                </span>
                <span className="font-headline font-bold text-2xl text-navy-deep">
                  ₹{doctor.consultationFee}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                Live Availability
              </span>
            </div>

            {bookingSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-healing mx-auto flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-xl text-navy-deep">
                    Appointment Confirmed!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Your appointment has been registered in the hospital management database.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200 text-left text-xs space-y-1.5">
                  <p className="text-slate-500">
                    Reference: <strong className="text-teal-800 font-mono text-sm">{bookingSuccess.appointmentReference}</strong>
                  </p>
                  <p className="text-slate-600">
                    Scheduled: <strong>{selectedDate} • {selectedSlot?.displayTime}</strong>
                  </p>
                </div>
                <button
                  onClick={() => navigate('/patient/dashboard')}
                  className="w-full py-3 rounded-xl font-bold text-xs text-white bg-teal-healing hover:bg-teal-700 shadow"
                >
                  View in My Appointments
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    1. Select Date
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {availableDates.map((d) => {
                      const isSelected = selectedDate === d.dateString;
                      return (
                        <button
                          key={d.dateString}
                          onClick={() => setSelectedDate(d.dateString)}
                          className={`p-2 rounded-xl text-center transition-all ${
                            isSelected
                              ? 'bg-teal-healing text-white shadow-soft-glow'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                          }`}
                        >
                          <span className="text-[9px] uppercase font-bold block opacity-80">{d.dayName}</span>
                          <span className="text-sm font-bold font-headline block">{d.dayNumber}</span>
                          <span className="text-[9px] block opacity-80">{d.month}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slots */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      2. Select Time Slot
                    </label>
                    <span className="text-[11px] text-slate-400">{selectedDate}</span>
                  </div>

                  {loadingSlots ? (
                    <div className="py-8 text-center text-xs text-slate-500">Checking open slots...</div>
                  ) : slotError ? (
                    <div className="p-4 rounded-xl bg-slate-50 border text-center text-xs text-slate-500">
                      {slotError}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border text-center text-xs text-slate-400">
                      No consultation slots remaining today.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {slots.map((slot) => {
                        const isSelected = selectedSlot?._id === slot._id;
                        return (
                          <button
                            key={slot._id}
                            disabled={slot.isBooked}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                              slot.isBooked
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-royal-blue text-white shadow'
                                : 'bg-white hover:bg-royal-50 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{slot.displayTime}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Consultation Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    3. Mode of Consultation
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setConsultationType('IN_PERSON')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 ${
                        consultationType === 'IN_PERSON'
                          ? 'border-teal-healing bg-teal-50 text-teal-800'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" /> Hospital OPD
                    </button>
                    <button
                      onClick={() => setConsultationType('VIDEO')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 ${
                        consultationType === 'VIDEO'
                          ? 'border-royal-blue bg-royal-50 text-royal-blue'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <Video className="w-4 h-4" /> Teleconsult
                    </button>
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  disabled={!selectedSlot || submitting}
                  onClick={handleBookAppointment}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-teal-healing to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 shadow-soft-glow transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? 'Reserving Slot...' : `Confirm Booking • ₹${doctor.consultationFee}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
