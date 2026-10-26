import React from 'react';
import { AppointmentStatus } from '../../types';

export const StatusBadge: React.FC<{ status: AppointmentStatus | string }> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'BOOKED':
        return 'bg-blue-50 text-royal-blue border-blue-200';
      case 'CHECKED_IN':
        return 'bg-purple-50 text-lavender-soft border-purple-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'NO_SHOW':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      case 'ACTIVE':
        return 'bg-teal-50 text-teal-healing border-teal-200';
      case 'PENDING_VERIFICATION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'BOOKED':
        return 'Confirmed';
      case 'CHECKED_IN':
        return 'Checked In';
      case 'IN_PROGRESS':
        return 'In Consultation';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'NO_SHOW':
        return 'No Show';
      case 'PENDING_VERIFICATION':
        return 'Pending Verification';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {getLabel()}
    </span>
  );
};
