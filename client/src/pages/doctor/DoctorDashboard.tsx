import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorApi, appointmentApi } from '../../services/api';
import { Appointment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Stethoscope,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  UserX,
  Settings,
  CalendarOff,
  AlertCircle,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'TODAY' | 'SCHEDULE' | 'LEAVE'>('TODAY');

  // Leave Form State
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('Personal leave');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const loadDashboard = () => {
    setLoading(true);
    doctorApi
      .getDoctorDashboard()
      .then((res) => {
        if (res.data.success) {
          setStats(res.data.stats);
          setTodayAppointments(res.data.todayAppointments || []);
          setUpcomingAppointments(res.data.upcomingAppointments || []);
          setDoctorProfile(res.data.doctor);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load doctor dashboard.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const res = await appointmentApi.updateStatus(appointmentId, newStatus);
      if (res.data.success) {
        toast.success(`Appointment marked as ${newStatus}.`);
        loadDashboard();
      }
    } catch (err: any) {
      toast.error(err.message || 'Status update failed.');
    }
  };

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd) {
      toast.error('Please enter start and end dates.');
      return;
    }

    setSubmittingLeave(true);
    try {
      const res = await doctorApi.addLeave({
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: leaveReason,
      });

      if (res.data.success) {
        toast.success('Leave dates recorded. Online slots blocked for this interval.');
        setLeaveStart('');
        setLeaveEnd('');
        loadDashboard();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit leave.');
    } finally {
      setSubmittingLeave(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-navy-deep to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-teal-healing text-white flex items-center justify-center font-bold shadow-lg shrink-0">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                Doctor Workspace
              </span>
              {doctorProfile?.verificationStatus === 'ACTIVE' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Institutional Verified
                </span>
              )}
            </div>
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-white">
              {user?.name}
            </h1>
            <p className="text-xs text-slate-300 font-mono">
              ID: {doctorProfile?.uniqueDoctorId || 'CARE-DOC-PENDING'} • {doctorProfile?.specialization}
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-right">
          <span className="text-[10px] text-teal-200 block uppercase font-bold">Standard Consultation Fee</span>
          <span className="text-xl font-bold font-headline">₹{doctorProfile?.consultationFee || 500}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Today's OPD Patients
          </span>
          <span className="font-headline font-bold text-3xl text-royal-blue">
            {stats?.todayAppointmentsCount || 0}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Completed Consultations
          </span>
          <span className="font-headline font-bold text-3xl text-teal-healing">
            {stats?.completedCount || 0}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Upcoming Bookings
          </span>
          <span className="font-headline font-bold text-3xl text-navy-deep">
            {upcomingAppointments.length}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Cancelled Bookings
          </span>
          <span className="font-headline font-bold text-3xl text-coral-warm">
            {stats?.cancelledCount || 0}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('TODAY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'TODAY'
                ? 'bg-navy-deep text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" /> Today's Patients ({todayAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'SCHEDULE'
                ? 'bg-navy-deep text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" /> Schedule Configuration
          </button>
          <button
            onClick={() => setActiveTab('LEAVE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'LEAVE'
                ? 'bg-navy-deep text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarOff className="w-4 h-4" /> Block Dates / Leave
          </button>
        </div>

        {/* TAB 1: TODAY'S APPOINTMENTS */}
        {activeTab === 'TODAY' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-3 border-teal-healing/20 border-t-teal-healing rounded-full animate-spin mx-auto" />
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
                <Clock className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-headline font-bold text-lg text-navy-deep">
                  No Consultations Scheduled for Today
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  As patients book appointment slots online or receptionists register walk-ins, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt) => {
                  const startDt = new Date(apt.appointmentStart);
                  const timeStr = new Intl.DateTimeFormat('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  }).format(startDt);

                  return (
                    <div
                      key={apt._id}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={apt.status} />
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {apt.appointmentReference}
                          </span>
                          {apt.queueNumber && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                              Queue #{apt.queueNumber}
                            </span>
                          )}
                        </div>

                        <h4 className="font-headline font-bold text-base text-navy-deep">
                          {apt.patientId?.name || 'Walk-In Patient'}
                        </h4>

                        <p className="text-xs text-slate-500">
                          Scheduled: <strong>{timeStr}</strong> • Phone: {apt.patientId?.phone || 'Not given'}
                        </p>
                        <p className="text-xs text-slate-600 italic">
                          "{apt.visitReason || 'General Consultation'}"
                        </p>
                      </div>

                      {/* Doctor Consultation Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto">
                        {apt.status === 'BOOKED' && (
                          <button
                            onClick={() => handleUpdateStatus(apt._id, 'CHECKED_IN')}
                            className="py-2 px-3 text-xs font-bold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                          >
                            Check In
                          </button>
                        )}

                        {['BOOKED', 'CHECKED_IN'].includes(apt.status) && (
                          <button
                            onClick={() => handleUpdateStatus(apt._id, 'IN_PROGRESS')}
                            className="py-2 px-3.5 text-xs font-bold rounded-xl bg-royal-blue text-white hover:bg-royal-700 shadow-sm transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5" /> Start Consultation
                          </button>
                        )}

                        {apt.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleUpdateStatus(apt._id, 'COMPLETED')}
                            className="py-2 px-4 text-xs font-bold rounded-xl bg-teal-healing text-white hover:bg-teal-700 shadow-sm transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Mark Completed
                          </button>
                        )}

                        {['BOOKED', 'CHECKED_IN'].includes(apt.status) && (
                          <button
                            onClick={() => handleUpdateStatus(apt._id, 'NO_SHOW')}
                            className="py-2 px-2.5 text-xs font-bold rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            No Show
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SCHEDULE CONFIGURATION */}
        {activeTab === 'SCHEDULE' && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6">
            <div>
              <h3 className="font-headline font-bold text-xl text-navy-deep">
                Active Weekly Consultation Hours
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your standard OPD shifts configured in the hospital scheduling database.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                <div key={day} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-navy-deep">{day}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-100 text-teal-800">
                      Active OPD
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>Shift 1: <strong>09:00 AM – 01:00 PM</strong></p>
                    <p className="text-amber-700">Lunch Break: 01:00 PM – 02:00 PM</p>
                    <p>Shift 2: <strong>02:00 PM – 05:30 PM</strong></p>
                    <p className="text-slate-400 text-[11px] pt-1">Slot: 20 mins • Buffer: 5 mins</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LEAVE MANAGEMENT */}
        {activeTab === 'LEAVE' && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6 max-w-xl">
            <div>
              <h3 className="font-headline font-bold text-xl text-navy-deep">
                Register Physician Leave / Block Dates
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Online bookings will be automatically blocked for any dates entered below.
              </p>
            </div>

            <form onSubmit={handleAddLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-healing/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-healing/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Leave
                </label>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Medical conference, annual leave..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-healing/30"
                />
              </div>

              <button
                type="submit"
                disabled={submittingLeave}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-royal-blue hover:bg-royal-700 disabled:opacity-50 shadow transition-all"
              >
                {submittingLeave ? 'Saving...' : 'Block Dates in Schedule'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
