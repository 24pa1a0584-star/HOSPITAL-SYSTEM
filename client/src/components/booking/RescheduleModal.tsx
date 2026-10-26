import React, { useState, useEffect } from 'react';
import { Appointment, BookableSlot } from '../../types';
import { doctorApi, appointmentApi } from '../../services/api';
import { X, Calendar, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RescheduleModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onRescheduled: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onRescheduled,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<BookableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

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
    if (isOpen && appointment) {
      setSelectedDate(availableDates[0].dateString);
      setSelectedSlot(null);
      setReason('');
      setErrorMsg('');
    }
  }, [isOpen, appointment]);

  useEffect(() => {
    if (!appointment || !selectedDate) return;

    const fetchSlots = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const docId = typeof appointment.doctorId === 'object' ? appointment.doctorId._id : appointment.doctorId;
        const res = await doctorApi.getDoctorAvailability(docId, selectedDate);
        if (res.data.success) {
          setAvailableSlots(res.data.slots || []);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to fetch slots.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [appointment, selectedDate]);

  if (!isOpen || !appointment) return null;

  const handleReschedule = async () => {
    if (!selectedSlot) {
      toast.error('Please pick a replacement appointment slot.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await appointmentApi.rescheduleAppointment(appointment._id, {
        newSlotId: selectedSlot._id,
        reason,
      });

      if (res.data.success) {
        toast.success('Appointment successfully rescheduled!');
        onRescheduled();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Rescheduling failed.');
      toast.error(err.message || 'Rescheduling failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const doctorName =
    typeof appointment.doctorId === 'object' && appointment.doctorId?.userId
      ? appointment.doctorId.userId.name
      : 'Physician';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-navy-deep/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 z-10 p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-royal-50 text-royal-blue">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-navy-deep">Reschedule Appointment</h3>
              <p className="text-xs text-slate-500">Ref: {appointment.appointmentReference} • {doctorName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-coral-50 border border-coral-200 text-coral-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-coral-warm" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Date Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select New Consultation Date
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {availableDates.map((item) => {
              const isSelected = selectedDate === item.dateString;
              return (
                <button
                  key={item.dateString}
                  onClick={() => setSelectedDate(item.dateString)}
                  className={`p-2.5 rounded-2xl text-center transition-all ${
                    isSelected
                      ? 'bg-royal-blue text-white shadow-md scale-105'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold block opacity-80">{item.dayName}</span>
                  <span className="text-base font-bold font-headline block">{item.dayNumber}</span>
                  <span className="text-[10px] block opacity-80">{item.month}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slot Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Available Slots ({selectedDate})
          </label>
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading open slots...</div>
          ) : availableSlots.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border">
              No slots available on this date.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto">
              {availableSlots.map((slot) => {
                const isSelected = selectedSlot?._id === slot._id;
                return (
                  <button
                    key={slot._id}
                    disabled={slot.isBooked}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      slot.isBooked
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                        : isSelected
                        ? 'bg-royal-blue text-white shadow-md'
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

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Reason for Rescheduling
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Work conflict, travel delay..."
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-royal-blue/30 focus:outline-none"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            disabled={!selectedSlot || submitting}
            onClick={handleReschedule}
            className="px-5 py-2.5 text-xs font-bold text-white bg-royal-blue hover:bg-royal-700 disabled:opacity-50 rounded-xl shadow transition-all"
          >
            {submitting ? 'Updating...' : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
};
