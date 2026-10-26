import React, { useState, useEffect } from 'react';
import { hospitalApi } from '../../services/api';
import { Hospital } from '../../types';
import { Building2, MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';

export const HospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hospitalApi
      .listHospitals()
      .then((res) => {
        if (res.data.success) {
          setHospitals(res.data.hospitals || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="max-w-3xl">
        <span className="text-xs font-bold text-royal-blue uppercase tracking-wider block mb-1">
          Hospital Network
        </span>
        <h1 className="font-headline font-bold text-3xl sm:text-4xl text-navy-deep">
          Hospital Branches & OPD Centers
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          CARENOVA facilities are equipped with digital diagnostic labs, multi-department outpatient
          suites, and dedicated front-desk reception coordination.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-royal-blue/20 border-t-royal-blue rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {hospitals.map((hosp) => (
            <div
              key={hosp._id}
              className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-card-hover transition-all space-y-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-royal-50 text-royal-blue flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-xl text-navy-deep">
                      {hosp.name}
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Code: {hosp.code}
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100">
                  Active Facility
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-royal-blue shrink-0 mt-0.5" />
                  <span>
                    {hosp.address}, {hosp.city}, {hosp.state}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-teal-healing shrink-0" />
                  <span>{hosp.contactNumber}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{hosp.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{hosp.openingHours}</span>
                </div>
              </div>

              {hosp.services && hosp.services.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Key Clinical Services Available
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {hosp.services.map((srv, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-medium text-slate-700"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
