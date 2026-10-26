import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Doctor, BookableSlot } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { doctorApi, appointmentApi } from '../../services/api';
import {
  X,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Video,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface BookingModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  doctor,
  isOpen,
  onClose,
  onBookingSuccess,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<BookableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [consultationType, setConsultationType] = useState<'IN_PERSON' | 'VIDEO'>('IN_PERSON');
  const [visitReason, setVisitReason] = useState<string>('General Consultation');
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Generate next 7 days in YYYY-MM-DD
  const availableDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + (i + 1)); // start tomorrow
    return {
      dateString: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  useEffect(() => {
    if (isOpen && doctor) {
      setStep(1);
      setSelectedDate(availableDates[0].dateString);
      setSelectedSlot(null);
      setBookingResult(null);
      setErrorMessage('');
    }
  }, [isOpen, doctor]);

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    if (!doctor || !selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setErrorMessage('');
      try {
        const res = await doctorApi.getDoctorAvailability(doctor._id, selectedDate);
        if (res.data.success) {
          setAvailableSlots(res.data.slots || []);
          if (!res.data.isAvailable && res.data.message) {
            setErrorMessage(res.data.message);
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load consultation slots.');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [doctor, selectedDate]);

  if (!isOpen || !doctor) return null;

  const handleConfirmBooking = async () => {
    if (!user) {
      toast.error('Please log in as a patient to confirm this booking.');
      navigate('/login');
      return;
    }

    if (!selectedSlot) {
      toast.error('Please select an appointment time slot.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await appointmentApi.bookAppointment({
        doctorId: doctor._id,
        slotId: selectedSlot._id,
        consultationType,
        visitReason,
      });

      if (res.data.success) {
        setBookingResult(res.data.appointment);
        setStep(4); // Success step
        toast.success('Appointment booked successfully!');
        if (onBookingSuccess) onBookingSuccess();
      }
    } catch (err: any) {
      const msg = err.message || 'Booking failed. Slot may have been reserved.';
      setErrorMessage(msg);
      toast.error(msg);
      // Re-fetch slots in case of 409 conflict
      const ref = await doctorApi.getDoctorAvailability(doctor._id, selectedDate);
      if (ref.data.success) {
        setAvailableSlots(ref.data.slots || []);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const doctorName = doctor.userId?.name || 'Doctor';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-navy-deep/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-50 via-white to-royal-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-healing text-white flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-navy-deep">
                Book Consultation
              </h3>
              <p className="text-xs text-slate-500">
                {doctorName} • {doctor.specialization}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker (Steps 1 to 3) */}
        {step < 4 && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className={step >= 1 ? 'text-teal-healing font-bold' : ''}>
              1. Date & Time
            </span>
            <span className="text-slate-300">→</span>
            <span className={step >= 2 ? 'text-teal-healing font-bold' : ''}>
              2. Visit Details
            </span>
            <span className="text-slate-300">→</span>
            <span className={step >= 3 ? 'text-teal-healing font-bold' : ''}>
              3. Review & Confirm
            </span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-coral-50 border border-coral-200 text-coral-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-coral-warm shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1: DATE & SLOT SELECTION */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Date Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Select Consultation Date
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {availableDates.map((item) => {
                    const isSelected = selectedDate === item.dateString;
                    return (
                      <button
                        key={item.dateString}
                        onClick={() => setSelectedDate(item.dateString)}
                        className={`p-3 rounded-2xl text-center transition-all ${
                          isSelected
                            ? 'bg-teal-healing text-white shadow-soft-glow scale-105'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold block opacity-80">
                          {item.dayName}
                        </span>
                        <span className="text-lg font-bold font-headline block my-0.5">
                          {item.dayNumber}
                        </span>
                        <span className="text-[10px] block opacity-80">{item.month}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots Section */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Available Time Slots ({selectedDate})
                  </label>
                  <span className="text-xs text-slate-500">Asia/Kolkata (IST)</span>
                </div>

                {loadingSlots ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="w-8 h-8 border-3 border-teal-healing/20 border-t-teal-healing rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-500">Checking doctor's real-time schedule...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No open slots on this date</p>
                    <p className="text-xs text-slate-400">
                      Please pick another day from the calendar above.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot?._id === slot._id;
                      const isBooked = slot.isBooked;

                      return (
                        <button
                          key={slot._id}
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isBooked
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-royal-blue text-white shadow-md scale-105'
                              : 'bg-white hover:bg-royal-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{slot.displayTime}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: CONSULTATION TYPE & DETAILS */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Consultation Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setConsultationType('IN_PERSON')}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      consultationType === 'IN_PERSON'
                        ? 'border-teal-healing bg-teal-50/60 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white shadow-sm text-teal-healing shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold block text-navy-deep">Hospital OPD Visit</span>
                      <span className="text-xs text-slate-500">In-person physical consultation at clinic</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setConsultationType('VIDEO')}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      consultationType === 'VIDEO'
                        ? 'border-royal-blue bg-royal-50/60 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white shadow-sm text-royal-blue shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold block text-navy-deep">Video Teleconsult</span>
                      <span className="text-xs text-slate-500">Encrypted virtual online consultation</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Brief Reason for Consultation (Optional)
                </label>
                <textarea
                  rows={3}
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  placeholder="e.g. Routine checkup, blood pressure review, chronic migraine..."
                  className="w-full p-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-healing/30"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Note: Sensitive health records are minimized and not stored for scheduling.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & CONFIRM */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-xs text-slate-500">Specialist</span>
                  <span className="text-sm font-bold text-navy-deep">{doctorName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-xs text-slate-500">Department</span>
                  <span className="text-sm font-bold text-teal-700">{doctor.specialization}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-xs text-slate-500">Date & Slot</span>
                  <span className="text-sm font-bold text-navy-deep">
                    {selectedDate} at {selectedSlot?.displayTime}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-xs text-slate-500">Consultation Mode</span>
                  <span className="text-sm font-bold text-slate-800">
                    {consultationType === 'IN_PERSON' ? 'In-Person Hospital OPD' : 'Video Teleconsult'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs font-bold text-slate-700">Consultation Fee</span>
                  <span className="text-lg font-bold font-headline text-navy-deep">
                    ₹{doctor.consultationFee}
                  </span>
                </div>
              </div>

              {!user && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  You are not logged in. Click confirm to proceed to patient sign-in.
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 4 && bookingResult && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-healing mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="font-headline font-bold text-2xl text-navy-deep">
                  Appointment Confirmed!
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Your appointment slot has been atomically reserved and persisted.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 max-w-md mx-auto text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Booking Reference:</span>
                  <span className="font-mono font-bold text-teal-800 text-sm">
                    {bookingResult.appointmentReference}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-bold text-slate-800">{doctorName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Scheduled Time:</span>
                  <span className="font-bold text-slate-800">
                    {selectedDate} • {selectedSlot?.displayTime}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/patient/dashboard');
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-healing hover:bg-teal-700 shadow"
                >
                  View My Appointments
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step < 4 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step === 1 && (
              <button
                disabled={!selectedSlot}
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-healing hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow flex items-center gap-1.5"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-healing hover:bg-teal-700 shadow flex items-center gap-1.5"
              >
                Review Booking <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                disabled={submitting}
                onClick={handleConfirmBooking}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-healing to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 shadow-soft-glow flex items-center gap-1.5"
              >
                {submitting ? 'Reserving Slot...' : 'Confirm Appointment'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
