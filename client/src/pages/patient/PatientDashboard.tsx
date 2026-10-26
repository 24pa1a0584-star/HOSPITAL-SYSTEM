import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentApi } from '../../services/api';
import { Appointment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RescheduleModal } from '../../components/booking/RescheduleModal';
import {
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  XCircle,
  Plus,
  Stethoscope,
  Video,
  UserCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'ALL'>('UPCOMING');

  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = useState<Appointment | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState<boolean>(false);

  const loadAppointments = () => {
    setLoading(true);
    appointmentApi
      .getMyAppointments()
      .then((res) => {
        if (res.data.success) {
          setAppointments(res.data.appointments || []);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load appointments.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (apt: Appointment) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel appointment ${apt.appointmentReference}? The reserved slot will be freed.`
    );
    if (!confirmCancel) return;

    try {
      const res = await appointmentApi.cancelAppointment(apt._id, {
        reason: 'Cancelled by patient from dashboard',
      });
      if (res.data.success) {
        toast.success('Appointment cancelled. Slot has been freed.');
        loadAppointments();
      }
    } catch (err: any) {
      toast.error(err.message || 'Cancellation failed.');
    }
  };

  const upcomingAppointments = appointments.filter((a) =>
    ['BOOKED', 'CHECKED_IN', 'IN_PROGRESS'].includes(a.status)
  );
  const nextAppointment = upcomingAppointments[0] || null;

  const filteredAppointments = appointments.filter((a) => {
    if (activeTab === 'UPCOMING') return ['BOOKED', 'CHECKED_IN', 'IN_PROGRESS'].includes(a.status);
    if (activeTab === 'COMPLETED') return a.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return a.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-royal-blue rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
            Patient Portal
          </span>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-teal-50">
            Manage your hospital consultations, check real-time queue states, and reschedule bookings.
          </p>
        </div>

        <Link
          to="/doctors"
          className="px-5 py-3 rounded-2xl bg-white text-navy-deep hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-teal-healing" /> Book New Appointment
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Upcoming Visits
            </span>
            <span className="font-headline font-bold text-3xl text-royal-blue">
              {upcomingAppointments.length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-royal-50 text-royal-blue flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Completed Visits
            </span>
            <span className="font-headline font-bold text-3xl text-teal-healing">
              {appointments.filter((a) => a.status === 'COMPLETED').length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-healing flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Cancelled Visits
            </span>
            <span className="font-headline font-bold text-3xl text-coral-warm">
              {appointments.filter((a) => a.status === 'CANCELLED').length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-coral-50 text-coral-warm flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Next Upcoming Appointment Highlight */}
      {nextAppointment && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-200 shadow-md space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-healing animate-ping" />
              Next Scheduled Consultation
            </span>
            <StatusBadge status={nextAppointment.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <div className="flex items-start gap-4">
                <img
                  src={
                    nextAppointment.doctorId?.profilePhoto ||
                    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80'
                  }
                  alt="Doctor"
                  className="w-16 h-16 rounded-2xl object-cover shrink-0"
                />
                <div>
                  <h3 className="font-headline font-bold text-xl text-navy-deep">
                    {nextAppointment.doctorId?.userId?.name || 'Physician'}
                  </h3>
                  <p className="text-xs font-semibold text-teal-healing">
                    {nextAppointment.doctorId?.specialization} • Ref: {nextAppointment.appointmentReference}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-royal-blue shrink-0" />
                    {nextAppointment.hospitalId?.name || 'CareNova Hospital Branch'}
                  </p>
                </div>
              </div>

              {nextAppointment.status === 'CHECKED_IN' && nextAppointment.queueNumber && (
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900 font-bold">
                    Queue #{nextAppointment.queueNumber}
                  </span>
                  <span>Patient checked in. Please wait in the OPD lounge for your turn.</span>
                </div>
              )}
            </div>

            <div className="md:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 text-center sm:text-left">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Date & Time
                </span>
                <span className="font-bold text-sm text-navy-deep block">
                  {new Date(nextAppointment.appointmentStart).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-xs font-semibold text-royal-blue flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Intl.DateTimeFormat('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  }).format(new Date(nextAppointment.appointmentStart))}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setSelectedAppointmentForReschedule(nextAppointment);
                    setIsRescheduleOpen(true);
                  }}
                  className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3 text-royal-blue" /> Reschedule
                </button>
                <button
                  onClick={() => handleCancel(nextAppointment)}
                  className="py-2 px-3 rounded-xl text-xs font-bold bg-coral-50 hover:bg-coral-100 text-coral-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointments List Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div className="flex items-center space-x-1 sm:space-x-2">
            {(['UPCOMING', 'COMPLETED', 'CANCELLED', 'ALL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-navy-deep text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab === 'UPCOMING'
                  ? 'Upcoming'
                  : tab === 'COMPLETED'
                  ? 'Completed'
                  : tab === 'CANCELLED'
                  ? 'Cancelled'
                  : 'All Bookings'}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-semibold">
            {filteredAppointments.length} record{filteredAppointments.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-teal-healing/20 border-t-teal-healing rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-headline font-bold text-lg text-navy-deep">No Appointments Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any appointments under the "{activeTab.toLowerCase()}" category.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((apt) => {
              const startDt = new Date(apt.appointmentStart);
              const dateStr = startDt.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const timeStr = new Intl.DateTimeFormat('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }).format(startDt);

              const canModify = ['BOOKED', 'CHECKED_IN'].includes(apt.status);

              return (
                <div
                  key={apt._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-teal-50 text-teal-healing shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <StatusBadge status={apt.status} />
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {apt.appointmentReference}
                        </span>
                        {apt.consultationType === 'VIDEO' ? (
                          <span className="text-[10px] font-bold text-royal-blue bg-royal-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Video className="w-3 h-3" /> Video
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> OPD
                          </span>
                        )}
                      </div>

                      <h4 className="font-headline font-bold text-base text-navy-deep">
                        {apt.doctorId?.userId?.name || 'Physician'}
                      </h4>

                      <p className="text-xs text-slate-500">
                        {apt.doctorId?.specialization} • {apt.hospitalId?.name}
                      </p>

                      <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-2">
                        <span>📅 {dateStr}</span>
                        <span>⏰ {timeStr}</span>
                      </p>
                    </div>
                  </div>

                  {canModify && (
                    <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedAppointmentForReschedule(apt);
                          setIsRescheduleOpen(true);
                        }}
                        className="flex-1 sm:flex-none py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-royal-blue" /> Reschedule
                      </button>
                      <button
                        onClick={() => handleCancel(apt)}
                        className="py-2 px-3 text-xs font-bold text-coral-600 hover:bg-coral-50 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <RescheduleModal
        appointment={selectedAppointmentForReschedule}
        isOpen={isRescheduleOpen}
        onClose={() => {
          setIsRescheduleOpen(false);
          setSelectedAppointmentForReschedule(null);
        }}
        onRescheduled={loadAppointments}
      />
    </div>
  );
};
