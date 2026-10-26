import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hospitalApi } from '../../services/api';
import { Department } from '../../types';
import {
  HeartPulse,
  Sparkles,
  Activity,
  Stethoscope,
  Baby,
  Brain,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const SpecialtiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hospitalApi
      .listDepartments()
      .then((res) => {
        if (res.data.success) {
          setDepartments(res.data.departments || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const icons: Record<string, any> = {
    Cardiology: HeartPulse,
    Dermatology: Sparkles,
    Orthopedics: Activity,
    'General Medicine': Stethoscope,
    Pediatrics: Baby,
    Neurology: Brain,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="max-w-3xl">
        <span className="text-xs font-bold text-teal-healing uppercase tracking-wider block mb-1">
          Specialized Clinical Units
        </span>
        <h1 className="font-headline font-bold text-3xl sm:text-4xl text-navy-deep">
          Medical Disciplines & Departments
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          CARENOVA hospital network provides multi-disciplinary clinical consultation across dedicated
          speciality suites staffed by experienced physicians and senior consultants.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-teal-healing/20 border-t-teal-healing rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const Icon = icons[dept.name] || Stethoscope;
            return (
              <div
                key={dept._id}
                onClick={() => navigate(`/doctors?specialization=${dept.name}`)}
                className="bg-white p-7 rounded-3xl border border-slate-200/80 hover:border-teal-400 hover:shadow-card-hover cursor-pointer transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-healing group-hover:bg-teal-healing group-hover:text-white flex items-center justify-center transition-colors mb-5">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-headline font-bold text-xl text-navy-deep group-hover:text-teal-healing transition-colors">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {dept.description || 'Dedicated clinical consultation and treatment.'}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-royal-blue">
                  <span>Browse Specialists</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
