import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, hospitalApi } from '../../services/api';
import { Hospital, Department } from '../../types';
import {
  Stethoscope,
  ShieldCheck,
  Award,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

export const DoctorRegistrationRequestPage: React.FC = () => {
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('Cardiology');
  const [qualificationsStr, setQualificationsStr] = useState('MBBS, MD');
  const [regNumber, setRegNumber] = useState('');
  const [authority, setAuthority] = useState('Delhi Medical Council');
  const [experience, setExperience] = useState(5);
  const [hospitalId, setHospitalId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [consultationFee, setConsultationFee] = useState(600);
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successDoctor, setSuccessDoctor] = useState<any>(null);

  useEffect(() => {
    hospitalApi.listHospitals().then((res) => {
      if (res.data.success && res.data.hospitals?.length > 0) {
        setHospitals(res.data.hospitals);
        setHospitalId(res.data.hospitals[0]._id);
      }
    });

    hospitalApi.listDepartments().then((res) => {
      if (res.data.success && res.data.departments?.length > 0) {
        setDepartments(res.data.departments);
        setDepartmentId(res.data.departments[0]._id);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !regNumber || !hospitalId || !departmentId) {
      setErrorMsg('Please complete all required verification fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const qualifications = qualificationsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await authApi.registerDoctor({
        name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
        email,
        password,
        phone,
        specialization,
        qualifications,
        medicalRegistrationNumber: regNumber,
        registrationAuthority: authority,
        experienceYears: Number(experience),
        departmentId,
        hospitalId,
        consultationFee: Number(consultationFee),
        bio,
      });

      if (res.data.success) {
        setSuccessDoctor(res.data.doctor);
        toast.success('Registration submitted for administrator verification!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Doctor registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <Link
        to="/staff-login"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-deep"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Staff Portal
      </Link>

      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-6">
        <div className="text-center max-w-lg mx-auto space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-healing mx-auto flex items-center justify-center shadow-sm">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-navy-deep">
            Physician Credential Onboarding
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Submit your professional medical qualifications. A permanent CARENOVA doctor ID will be generated.
          </p>
        </div>

        {/* Verification Warning Notice */}
        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-healing shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block mb-0.5">Mandatory Institutional Verification:</strong>
            New doctor profiles start in <strong>PENDING_VERIFICATION</strong> status. Your profile will not
            be publicly discoverable nor bookable until verified by the Hospital Medical Director.
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-coral-50 border border-coral-200 text-coral-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-coral-warm" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successDoctor ? (
          <div className="text-center py-8 space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-healing mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-2xl text-navy-deep">
                Application Successfully Logged!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your medical registration has been recorded in the hospital registry.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Internal Doctor ID:</span>
                <span className="font-mono font-bold text-teal-800 text-sm">
                  {successDoctor.uniqueDoctorId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Physician Name:</span>
                <span className="font-bold text-slate-800">{successDoctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                  {successDoctor.verificationStatus}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/staff-login"
                className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-navy-deep hover:bg-slate-800 shadow"
              >
                Proceed to Staff Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name (with Dr. prefix) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Sameer Kapoor"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Professional Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dr.kapoor@hospital.org"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98110 00000"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Specialization *
                </label>
                <input
                  type="text"
                  required
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Cardiology / Neurology..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Degrees & Qualifications (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  value={qualificationsStr}
                  onChange={(e) => setQualificationsStr(e.target.value)}
                  placeholder="MBBS, MD, DM"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Medical Council Registration No. *
                </label>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="DMC-98124 / MCI-58291"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registration Authority *
                </label>
                <input
                  type="text"
                  required
                  value={authority}
                  onChange={(e) => setAuthority(e.target.value)}
                  placeholder="Delhi Medical Council / MCI"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  value={experience}
                  onChange={(e) => setExperience(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Affiliated Hospital *
                </label>
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
                >
                  {hospitals.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Department Assignment *
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinical Biography / Special Interests
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Summary of clinical training, fellowships, and areas of expertise..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-healing/30 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-teal-healing to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 shadow-soft-glow transition-all"
            >
              {loading ? 'Submitting Credentials...' : 'Submit Doctor Registration for Verification'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
