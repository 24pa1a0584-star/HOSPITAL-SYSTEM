import mongoose from 'mongoose';
import { DoctorProfile } from '../models/DoctorProfile';
import { DoctorSchedule } from '../models/DoctorSchedule';
import { DoctorLeave } from '../models/DoctorLeave';
import { BookableSlot, IBookableSlot } from '../models/BookableSlot';

export interface SlotResult {
  slots: IBookableSlot[];
  message?: string;
  isAvailable: boolean;
}

// Convert "YYYY-MM-DD" and "HH:mm" into a UTC Date object assuming Asia/Kolkata (UTC+5:30)
export function parseKolkataDateTime(dateString: string, timeString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);

  // UTC equivalent = (hour * 60 + minute) - 330 minutes
  const totalMinutes = hour * 60 + minute - 330;
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  utcDate.setUTCMinutes(utcDate.getUTCMinutes() + totalMinutes);
  return utcDate;
}

// Format UTC Date into "hh:mm A" in Asia/Kolkata
export function formatKolkataTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

// Get day of week (0=Sun, 6=Sat) in Asia/Kolkata
export function getKolkataDayOfWeek(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  // Noon in Kolkata gives the unambiguous day
  const date = new Date(Date.UTC(year, month - 1, day, 6, 30, 0));
  return date.getUTCDay();
}

// Check if dateString is before today in Asia/Kolkata
export function isDateInPast(dateString: string): boolean {
  const todayKolkata = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date()); // Returns "YYYY-MM-DD"
  return dateString < todayKolkata;
}

export async function getOrGenerateSlots(
  doctorId: string | mongoose.Types.ObjectId,
  dateString: string
): Promise<SlotResult> {
  const doctor = await DoctorProfile.findById(doctorId);
  if (!doctor) {
    return { slots: [], message: 'Doctor not found', isAvailable: false };
  }

  // Doctor verification rule: Unverified doctors cannot have bookable slots
  if (doctor.verificationStatus !== 'ACTIVE') {
    return {
      slots: [],
      message: 'Doctor profile is pending institutional verification. Appointments not yet available.',
      isAvailable: false,
    };
  }

  // Past dates cannot be booked
  if (isDateInPast(dateString)) {
    return {
      slots: [],
      message: 'Cannot book appointments for past dates.',
      isAvailable: false,
    };
  }

  // Check approved leaves
  const targetDateStart = parseKolkataDateTime(dateString, '00:00');
  const targetDateEnd = parseKolkataDateTime(dateString, '23:59');

  const onLeave = await DoctorLeave.findOne({
    doctorId: doctor._id,
    status: 'APPROVED',
    startDate: { $lte: targetDateEnd },
    endDate: { $gte: targetDateStart },
  });

  if (onLeave) {
    return {
      slots: [],
      message: `Doctor is on leave: ${onLeave.reason}`,
      isAvailable: false,
    };
  }

  // Find schedule for this day of week
  const dayOfWeek = getKolkataDayOfWeek(dateString);
  const schedule = await DoctorSchedule.findOne({
    doctorId: doctor._id,
    dayOfWeek,
    isActive: true,
  });

  if (!schedule || !schedule.shifts || schedule.shifts.length === 0) {
    return {
      slots: [],
      message: 'Doctor has no scheduled consultation hours on this day.',
      isAvailable: false,
    };
  }

  const slotDuration = schedule.slotDurationMinutes || 20;
  const bufferDuration = schedule.bufferMinutes || 5;
  const stepMinutes = slotDuration + bufferDuration;
  const now = new Date();

  // Generate candidate slots for each shift
  for (const shift of schedule.shifts) {
    const [startH, startM] = shift.start.split(':').map(Number);
    const [endH, endM] = shift.end.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + slotDuration <= endMinutes) {
      const slotStartMinutes = currentMinutes;
      const slotEndMinutes = currentMinutes + slotDuration;

      const startHourStr = Math.floor(slotStartMinutes / 60).toString().padStart(2, '0');
      const startMinStr = (slotStartMinutes % 60).toString().padStart(2, '0');
      const endHourStr = Math.floor(slotEndMinutes / 60).toString().padStart(2, '0');
      const endMinStr = (slotEndMinutes % 60).toString().padStart(2, '0');

      const slotStartTimeStr = `${startHourStr}:${startMinStr}`;
      const slotEndTimeStr = `${endHourStr}:${endMinStr}`;

      // Check if slot falls into any break
      const isDuringBreak = schedule.breaks.some((brk) => {
        const [bStartH, bStartM] = brk.start.split(':').map(Number);
        const [bEndH, bEndM] = brk.end.split(':').map(Number);
        const bStart = bStartH * 60 + bStartM;
        const bEnd = bEndH * 60 + bEndM;
        // Overlaps if slot starts before break ends and slot ends after break starts
        return slotStartMinutes < bEnd && slotEndMinutes > bStart;
      });

      if (!isDuringBreak) {
        const slotStart = parseKolkataDateTime(dateString, slotStartTimeStr);
        const slotEnd = parseKolkataDateTime(dateString, slotEndTimeStr);

        // Don't create slots in the past for today's date
        if (slotStart > now) {
          const displayTime = formatKolkataTime(slotStart);

          // Atomic upsert with $setOnInsert preserves any existing booking!
          await BookableSlot.findOneAndUpdate(
            { doctorId: doctor._id, slotStart },
            {
              $setOnInsert: {
                doctorId: doctor._id,
                hospitalId: doctor.hospitalId,
                departmentId: doctor.departmentId,
                dateString,
                slotStart,
                slotEnd,
                displayTime,
                isBooked: false,
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      }

      currentMinutes += stepMinutes;
    }
  }

  // Fetch all slots for this doctor and dateString
  const slots = await BookableSlot.find({
    doctorId: doctor._id,
    dateString,
    slotStart: { $gt: now },
  }).sort({ slotStart: 1 });

  return {
    slots,
    isAvailable: slots.length > 0,
    message: slots.length > 0 ? undefined : 'No available slots remaining for this date.',
  };
}
