import React from 'react';
import { ShieldCheck, Lock, AlertTriangle, FileText } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      <div className="space-y-3">
        <span className="text-xs font-bold text-teal-healing uppercase tracking-wider block">
          Healthcare Security & Data Governance
        </span>
        <h1 className="font-headline font-bold text-3xl sm:text-4xl text-navy-deep">
          Privacy Notice & Security Policy
        </h1>
        <p className="text-sm text-slate-500">
          Last updated: October 2026 • Compliant with Indian DPDP Act Principles & Clinical Data Minimization
        </p>
      </div>

      {/* Emergency Notice Alert */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5 text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <strong className="font-bold block mb-1">Medical Safety & Emergency Disclaimer:</strong>
          CARENOVA is an administrative outpatient scheduling platform, not a clinical diagnostic or
          emergency triage system. For acute medical emergencies, call 112 or visit the nearest
          emergency room immediately.
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-8 text-sm text-slate-700 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="font-headline font-bold text-lg text-navy-deep flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-healing" />
            1. Healthcare Data Minimization
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            We adhere strictly to the principle of purpose limitation and data minimization. For basic
            appointment booking, CARENOVA collects only:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600">
            <li>Patient full name and communication contact (email and telephone number).</li>
            <li>Chosen medical specialist, department, and appointment time.</li>
            <li>Optional short visit reason for OPD queue routing.</li>
          </ul>
          <p className="text-xs text-slate-500 pt-1">
            We do NOT collect detailed clinical diagnosis records, diagnostic imaging, prescriptions,
            Aadhaar numbers, or banking credentials for scheduling outpatient appointments.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2">
          <h2 className="font-headline font-bold text-lg text-navy-deep flex items-center gap-2">
            <Lock className="w-5 h-5 text-royal-blue" />
            2. Transport and Storage Security
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            All passwords are irreversibly salted and hashed using bcrypt. Sensitive sessions are
            restored using securely signed JSON Web Tokens transmitted over HTTPS in httpOnly cookies.
            Server communications use TLS 1.3 encryption.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-2">
          <h2 className="font-headline font-bold text-lg text-navy-deep flex items-center gap-2">
            <FileText className="w-5 h-5 text-lavender-soft" />
            3. Academic Demonstration & Synthetic Data Notice
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            This platform contains demonstration patient records and sample medical schedules prepared
            for evaluation and demonstration purposes. No real patient personal health information (PHI)
            has been extracted or utilized without consent.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-2">
          <h2 className="font-headline font-bold text-lg text-navy-deep">
            4. Access Control and Insecure Direct Object Reference (IDOR) Prevention
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Role-Based Access Control (RBAC) is strictly enforced on the server for all data queries.
            Patients can inspect only appointments booked under their own authenticated account. Doctors
            receive visibility exclusively into appointments scheduled at their specific practice.
          </p>
        </section>
      </div>
    </div>
  );
};
