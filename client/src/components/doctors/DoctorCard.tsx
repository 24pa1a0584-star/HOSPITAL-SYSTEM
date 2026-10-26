import React from 'react';
import { Link } from 'react-router-dom';
import { Doctor } from '../../types';
import { ShieldCheck, MapPin, Calendar, Award, ArrowRight } from 'lucide-react';

interface DoctorCardProps {
  doctor: Doctor;
  onBookClick?: (doctor: Doctor) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBookClick }) => {
  const doctorName = doctor.userId?.name || 'Medical Specialist';
  const avatarUrl =
    doctor.profilePhoto ||
    doctor.userId?.avatar ||
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 hover:border-teal-300 shadow-sm hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      {/* Top Banner Accent */}
      <div className="h-2 w-full bg-gradient-to-r from-teal-healing via-royal-blue to-lavender-soft" />

      <div className="p-6 space-y-5">
        {/* Header: Photo + Info */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src={avatarUrl}
              alt={doctorName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300"
            />
            {doctor.verificationStatus === 'ACTIVE' && (
              <div
                className="absolute -bottom-1 -right-1 bg-teal-healing text-white p-1 rounded-full shadow-sm"
                title="Institutional Verification Completed"
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-healing border border-teal-100">
                {doctor.specialization}
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                {doctor.uniqueDoctorId}
              </span>
            </div>

            <h3 className="font-headline font-bold text-lg text-navy-deep truncate group-hover:text-teal-healing transition-colors">
              {doctorName}
            </h3>

            <p className="text-xs text-slate-500 truncate mb-1">
              {doctor.qualifications?.join(', ')}
            </p>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>{doctor.experienceYears} Years Clinical Experience</span>
            </div>
          </div>
        </div>

        {/* Bio preview */}
        {doctor.bio && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            {doctor.bio}
          </p>
        )}

        {/* Location & Hospital */}
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-royal-blue shrink-0" />
            <span className="truncate font-medium">
              {doctor.hospitalId?.name || 'CareNova Hospital Branch'} • {doctor.hospitalId?.city || 'Delhi'}
            </span>
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Consultation Fee</span>
            <span className="text-lg font-bold text-navy-deep font-headline">
              ₹{doctor.consultationFee}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-teal-600 font-semibold block">Available Online</span>
            <span className="text-xs text-slate-500">OPD Consultation</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
        <Link
          to={`/doctors/${doctor._id}`}
          className="flex-1 py-2.5 px-3 text-center text-xs font-bold text-slate-700 hover:text-navy-deep bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1"
        >
          View Profile
        </Link>

        {onBookClick ? (
          <button
            onClick={() => onBookClick(doctor)}
            className="flex-1 py-2.5 px-3 text-center text-xs font-bold text-white bg-gradient-to-r from-teal-healing to-teal-700 hover:from-teal-700 hover:to-teal-800 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            Book Slot
          </button>
        ) : (
          <Link
            to={`/doctors/${doctor._id}`}
            className="flex-1 py-2.5 px-3 text-center text-xs font-bold text-white bg-gradient-to-r from-teal-healing to-teal-700 hover:from-teal-700 hover:to-teal-800 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            Book Slot
          </Link>
        )}
      </div>
    </div>
  );
};
