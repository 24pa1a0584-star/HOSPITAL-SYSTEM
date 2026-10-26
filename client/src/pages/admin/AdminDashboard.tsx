import React, { useState, useEffect } from 'react';
import { adminApi, hospitalApi } from '../../services/api';
import { Doctor, AuditLogItem } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShieldCheck,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  FileText,
  AlertCircle,
  Building,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VERIFICATION' | 'STAFF' | 'LOGS'>('OVERVIEW');

  // Staff creation form
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('StaffSecure@2026!');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmpId, setStaffEmpId] = useState('');
  const [staffRole, setStaffRole] = useState<'RECEPTIONIST' | 'ADMIN'>('RECEPTIONIST');
  const [staffHospitalId, setStaffHospitalId] = useState('');
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [creatingStaff, setCreatingStaff] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      adminApi.getOverview(),
      adminApi.getPendingDoctors(),
      adminApi.getAllDoctors(),
      adminApi.getAuditLogs(),
      hospitalApi.listHospitals(),
    ])
      .then(([overRes, pendRes, docRes, logsRes, hospRes]) => {
        if (overRes.data.success) setMetrics(overRes.data.metrics);
        if (pendRes.data.success) setPendingDoctors(pendRes.data.pendingDoctors || []);
        if (docRes.data.success) setAllDoctors(docRes.data.doctors || []);
        if (logsRes.data.success) setAuditLogs(logsRes.data.logs || []);
        if (hospRes.data.success && hospRes.data.hospitals?.length > 0) {
          setHospitalsList(hospRes.data.hospitals);
          setStaffHospitalId(hospRes.data.hospitals[0]._id);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load administrative overview.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyDoctor = async (doctorId: string, status: 'ACTIVE' | 'REJECTED') => {
    try {
      const res = await adminApi.verifyDoctor(doctorId, { status });
      if (res.data.success) {
        toast.success(`Doctor status updated to ${status}.`);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification update failed.');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffEmpId || !staffHospitalId) {
      toast.error('Please fill in required fields.');
      return;
    }

    setCreatingStaff(true);
    try {
      const res = await adminApi.createStaff({
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        phone: staffPhone,
        employeeId: staffEmpId,
        hospitalId: staffHospitalId,
        role: staffRole,
        designation: staffRole === 'ADMIN' ? 'Hospital Operations Admin' : 'Front Desk Officer',
      });

      if (res.data.success) {
        toast.success(`Staff account created for ${staffName}!`);
        setStaffName('');
        setStaffEmail('');
        setStaffEmpId('');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Staff creation failed.');
    } finally {
      setCreatingStaff(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-deep via-slate-900 to-navy-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Hospital Operations Administration
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30">
              Role: System Administrator
            </span>
          </div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl">Institutional Governance Console</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Audit logs, physician credential approvals, multi-department oversight, and staff accounts.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Patients
          </span>
          <span className="font-headline font-bold text-3xl text-navy-deep">
            {metrics?.totalPatients || 0}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Verified Doctors
          </span>
          <span className="font-headline font-bold text-3xl text-teal-healing">
            {metrics?.verifiedDoctors || 0}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pending Approval
          </span>
          <span className="font-headline font-bold text-3xl text-amber-600">
            {metrics?.pendingDoctors || 0}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Today's Visits
          </span>
          <span className="font-headline font-bold text-3xl text-royal-blue">
            {metrics?.todayAppointments || 0}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Completed Visits
          </span>
          <span className="font-headline font-bold text-3xl text-emerald-600">
            {metrics?.completedAppointments || 0}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'OVERVIEW'
                ? 'bg-navy-deep text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Doctor Management ({allDoctors.length})
          </button>

          <button
            onClick={() => setActiveTab('VERIFICATION')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'VERIFICATION'
                ? 'bg-navy-deep text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" /> Pending Approvals ({pendingDoctors.length})
          </button>

          <button
            onClick={() => setActiveTab('STAFF')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'STAFF'
                ? 'bg-navy-deep text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Create Staff Account
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'LOGS'
                ? 'bg-navy-deep text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" /> Security Audit Trail ({auditLogs.length})
          </button>
        </div>

        {/* TAB 1: ALL DOCTORS OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="font-headline font-bold text-xl text-navy-deep">
                Registered Hospital Specialists
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of assigned departments, fee schedules, and council registration numbers.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-3">Physician</th>
                    <th className="py-3 px-3">Doctor ID</th>
                    <th className="py-3 px-3">Specialization</th>
                    <th className="py-3 px-3">Medical Reg No.</th>
                    <th className="py-3 px-3">Consultation Fee</th>
                    <th className="py-3 px-3">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {allDoctors.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-navy-deep">
                        {doc.userId?.name || 'Physician'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-teal-800">
                        {doc.uniqueDoctorId}
                      </td>
                      <td className="py-3 px-3">{doc.specialization}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {doc.medicalRegistrationNumber} ({doc.registrationAuthority})
                      </td>
                      <td className="py-3 px-3 font-bold">₹{doc.consultationFee}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={doc.verificationStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PENDING DOCTOR VERIFICATION QUEUE */}
        {activeTab === 'VERIFICATION' && (
          <div className="space-y-4">
            {pendingDoctors.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
                <h4 className="font-headline font-bold text-lg text-navy-deep">
                  No Pending Doctor Verification Requests
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When new physicians submit registration applications, they will be listed here for institutional vetting.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingDoctors.map((doc) => (
                  <div
                    key={doc._id}
                    className="bg-white p-6 rounded-3xl border-2 border-amber-200 shadow-md space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                          Pending Credential Review
                        </span>
                        <h4 className="font-headline font-bold text-xl text-navy-deep mt-2">
                          {doc.userId?.name}
                        </h4>
                        <span className="font-mono text-xs font-bold text-teal-700">
                          Assigned ID: {doc.uniqueDoctorId}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 text-xs text-slate-600 space-y-1.5 border border-slate-100">
                      <p>
                        Specialization: <strong>{doc.specialization}</strong>
                      </p>
                      <p>
                        Qualifications: <strong>{doc.qualifications?.join(', ')}</strong>
                      </p>
                      <p>
                        Registration: <strong>{doc.medicalRegistrationNumber}</strong> ({doc.registrationAuthority})
                      </p>
                      <p>
                        Experience: <strong>{doc.experienceYears} Years</strong> • Fee: ₹{doc.consultationFee}
                      </p>
                      <p>
                        Email: <strong>{doc.userId?.email}</strong>
                      </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleVerifyDoctor(doc._id, 'ACTIVE')}
                        className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-teal-healing hover:bg-teal-700 shadow transition-all"
                      >
                        Approve & Activate Schedule
                      </button>
                      <button
                        onClick={() => handleVerifyDoctor(doc._id, 'REJECTED')}
                        className="py-2.5 px-3 rounded-xl font-bold text-xs text-coral-600 bg-coral-50 hover:bg-coral-100 transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STAFF ACCOUNT CREATION */}
        {activeTab === 'STAFF' && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6 max-w-xl">
            <div>
              <h3 className="font-headline font-bold text-xl text-navy-deep">
                Create Hospital Staff Account
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Authorize front-desk officers or additional hospital administrators.
              </p>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Staff Member Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Sunita Mehra"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-royal-blue/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="reception.apex@carenova.hospital"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-royal-blue/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffEmpId}
                    onChange={(e) => setStaffEmpId(e.target.value)}
                    placeholder="CARE-REC-002"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-royal-blue/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Role *
                  </label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-royal-blue/30 focus:outline-none"
                  >
                    <option value="RECEPTIONIST">Front Desk Receptionist</option>
                    <option value="ADMIN">Hospital Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Branch *
                </label>
                <select
                  value={staffHospitalId}
                  onChange={(e) => setStaffHospitalId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-royal-blue/30 focus:outline-none"
                >
                  {hospitalsList.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Default Password *
                </label>
                <input
                  type="password"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-royal-blue/30 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={creatingStaff}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-royal-blue hover:bg-royal-700 disabled:opacity-50 shadow transition-all"
              >
                {creatingStaff ? 'Creating Staff Account...' : 'Create Authorized Staff Account'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'LOGS' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-headline font-bold text-xl text-navy-deep">
                Institutional Security & Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chronological record of sensitive appointment bookings, status updates, and doctor verifications.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-3">Target Entity</th>
                    <th className="py-3 px-3">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="py-3 px-3 font-bold text-teal-800">{log.action}</td>
                      <td className="py-3 px-3">
                        {log.targetEntity} {log.targetId ? `(${log.targetId.slice(-6)})` : ''}
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        {log.performedBy?.name || 'System / Guest'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
