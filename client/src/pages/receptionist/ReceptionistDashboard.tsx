import React, { useState, useEffect } from 'react';
import { receptionistApi, doctorApi, appointmentApi } from '../../services/api';
import { Doctor, BookableSlot } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Users,
  Search,
  UserPlus,
  Clock,
  Calendar,
  CheckCircle2,
  Stethoscope,
  Building,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export const ReceptionistDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'WALKIN' | 'QUEUE'>('WALKIN');

  // Search & Patient
  const [patientQuery, setPatientQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Walk-in Registration Form
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinGender, setWalkinGender] = useState('MALE');

  // Doctor & Slot selection
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<BookableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);

  // Live Queue Monitor
  const [queueDoctorId, setQueueDoctorId] = useState('');
  const [queueList, setQueueList] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Submitting
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    doctorApi.searchDoctors({ limit: 20 }).then((res) => {
      if (res.data.success && res.data.doctors?.length > 0) {
        setDoctors(res.data.doctors);
        setSelectedDoctorId(res.data.doctors[0]._id);
        setQueueDoctorId(res.data.doctors[0]._id);
      }
    });
  }, []);

  // Fetch slots when doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;
    doctorApi.getDoctorAvailability(selectedDoctorId, selectedDate).then((res) => {
      if (res.data.success) {
        setSlots(res.data.slots || []);
      }
    });
  }, [selectedDoctorId, selectedDate]);

  // Load Queue for doctor
  const loadQueue = () => {
    if (!queueDoctorId) return;
    setLoadingQueue(true);
    receptionistApi
      .getLiveQueue(queueDoctorId)
      .then((res) => {
        if (res.data.success) {
          setQueueList(res.data.queue || []);
        }
      })
      .finally(() => setLoadingQueue(false));
  };

  useEffect(() => {
    loadQueue();
  }, [queueDoctorId]);

  const handlePatientSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientQuery) return;
    try {
      const res = await receptionistApi.searchPatients(patientQuery);
      if (res.data.success) {
        setSearchResults(res.data.patients || []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Patient search failed.');
    }
  };

  const handleRegisterWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName || !walkinPhone) {
      toast.error('Patient name and phone are required.');
      return;
    }
    try {
      const res = await receptionistApi.registerWalkIn({
        name: walkinName,
        phone: walkinPhone,
        gender: walkinGender,
      });
      if (res.data.success) {
        setSelectedPatient(res.data.patient);
        toast.success(`Patient registered: ${res.data.patient.name}`);
        setWalkinName('');
        setWalkinPhone('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
    }
  };

  const handleBookWalkIn = async () => {
    if (!selectedPatient) {
      toast.error('Please search or register a patient first.');
      return;
    }
    if (!selectedSlot) {
      toast.error('Please select an open time slot.');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await appointmentApi.bookAppointment({
        patientId: selectedPatient.id || selectedPatient._id,
        doctorId: selectedDoctorId,
        slotId: selectedSlot._id,
        consultationType: 'IN_PERSON',
        visitReason: 'Front-Desk Walk-In',
      });

      if (res.data.success) {
        toast.success(`Walk-in booked! Ref: ${res.data.appointment.appointmentReference}`);

        // Automatically check in
        await appointmentApi.updateStatus(res.data.appointment._id, 'CHECKED_IN');
        toast.success('Patient checked in and assigned to OPD Queue.');

        setSelectedSlot(null);
        setSelectedPatient(null);
        loadQueue();
      }
    } catch (err: any) {
      toast.error(err.message || 'Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCheckInExisting = async (appointmentId: string) => {
    try {
      const res = await appointmentApi.updateStatus(appointmentId, 'CHECKED_IN');
      if (res.data.success) {
        toast.success(`Checked in! Queue #${res.data.appointment.queueNumber}`);
        loadQueue();
      }
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-royal-blue to-navy-deep rounded-3xl p-6 sm:p-8 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-royal-200">
            Front Desk Operations
          </span>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl">Reception Workspace</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Coordinate walk-in registrations, physical check-ins, and live doctor OPD queues.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('WALKIN')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'WALKIN'
              ? 'bg-navy-deep text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-4 h-4" /> Book & Check-In Walk-In
        </button>
        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'QUEUE'
              ? 'bg-navy-deep text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" /> Live OPD Queue Monitor
        </button>
      </div>

      {/* TAB 1: WALK-IN BOOKING & REGISTRATION */}
      {activeTab === 'WALKIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Patient Search & Quick Register */}
          <div className="lg:col-span-5 space-y-6">
            {/* Search Patient */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-headline font-bold text-lg text-navy-deep flex items-center gap-2">
                <Search className="w-5 h-5 text-teal-healing" />
                1. Find Existing Patient
              </h3>
              <form onSubmit={handlePatientSearch} className="flex gap-2">
                <input
                  type="text"
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  placeholder="Patient name or phone..."
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Search
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {searchResults.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => setSelectedPatient(p)}
                      className={`p-2.5 rounded-xl border cursor-pointer text-xs flex justify-between items-center transition-colors ${
                        selectedPatient?._id === p._id
                          ? 'border-teal-healing bg-teal-50/70 font-bold text-teal-900'
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className="text-slate-400">{p.phone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Register New Walk-in */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-headline font-bold text-lg text-navy-deep flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-royal-blue" />
                Or Quick-Register New Patient
              </h3>
              <form onSubmit={handleRegisterWalkIn} className="space-y-3">
                <input
                  type="text"
                  required
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="Patient Full Name *"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-royal-blue/30 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    required
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    placeholder="Phone Number *"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-royal-blue/30 focus:outline-none"
                  />
                  <select
                    value={walkinGender}
                    onChange={(e) => setWalkinGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-royal-blue/30 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-royal-blue hover:bg-royal-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  Create & Select Patient
                </button>
              </form>
            </div>
          </div>

          {/* Doctor & Slot Selection */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-headline font-bold text-lg text-navy-deep flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-healing" />
              2. Assign Doctor & Time Slot
            </h3>

            {/* Selected Patient Banner */}
            {selectedPatient ? (
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-700 block">
                    Selected Patient:
                  </span>
                  <span className="font-bold text-navy-deep text-sm">{selectedPatient.name}</span>{' '}
                  <span className="text-slate-500">({selectedPatient.phone})</span>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs text-coral-600 font-bold hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                Please find or register a patient on the left first.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Specialist
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-healing/30"
                >
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.userId?.name} ({d.specialization}) - ₹{d.consultationFee}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Consultation Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-healing/30"
                />
              </div>
            </div>

            {/* Slots */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Available Consultation Slots
              </label>
              {slots.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border">
                  No slots open for selected physician on this date.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {slots.map((s) => (
                    <button
                      key={s._id}
                      disabled={s.isBooked}
                      onClick={() => setSelectedSlot(s)}
                      className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        s.isBooked
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                          : selectedSlot?._id === s._id
                          ? 'bg-teal-healing text-white shadow-sm'
                          : 'bg-white hover:bg-teal-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{s.displayTime}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              disabled={!selectedPatient || !selectedSlot || bookingLoading}
              onClick={handleBookWalkIn}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-teal-healing to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 shadow-soft-glow transition-all"
            >
              {bookingLoading ? 'Reserving & Checking In...' : 'Confirm Walk-In & Generate Queue Ticket'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE OPD QUEUE MONITOR */}
      {activeTab === 'QUEUE' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-headline font-bold text-xl text-navy-deep">
                Live Outpatient Queue Monitor
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time waiting, in-consultation, and completed patients for today.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={queueDoctorId}
                onChange={(e) => setQueueDoctorId(e.target.value)}
                className="p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.userId?.name} ({d.specialization})
                  </option>
                ))}
              </select>

              <button
                onClick={loadQueue}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                title="Refresh Queue"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loadingQueue ? (
            <div className="py-16 text-center text-xs text-slate-500">Loading queue...</div>
          ) : queueList.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border">
              No patients registered in queue for this specialist today.
            </div>
          ) : (
            <div className="space-y-3">
              {queueList.map((item) => (
                <div
                  key={item._id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-royal-50 text-royal-blue font-headline font-bold text-base flex items-center justify-center shrink-0">
                      #{item.queueNumber || '—'}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-navy-deep">{item.patientId?.name}</h4>
                      <p className="text-xs text-slate-500">
                        Ref: {item.appointmentReference} • Phone: {item.patientId?.phone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status} />

                    {item.status === 'BOOKED' && (
                      <button
                        onClick={() => handleCheckInExisting(item._id)}
                        className="py-1.5 px-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold"
                      >
                        Check In Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
