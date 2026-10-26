import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeRange {
  start: string; // HH:mm format e.g. "09:00"
  end: string;   // HH:mm format e.g. "13:00"
}

export interface IBreakTime extends ITimeRange {
  label: string;
}

export interface IDoctorSchedule extends Document {
  _id: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  shifts: ITimeRange[];
  breaks: IBreakTime[];
  slotDurationMinutes: number;
  bufferMinutes: number;
  maxDailyPatients: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorScheduleSchema = new Schema<IDoctorSchedule>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'DoctorProfile', required: true, index: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    shifts: [
      {
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
    ],
    breaks: [
      {
        start: { type: String, required: true },
        end: { type: String, required: true },
        label: { type: String, default: 'Break' },
      },
    ],
    slotDurationMinutes: { type: Number, required: true, default: 20 },
    bufferMinutes: { type: Number, required: true, default: 5 },
    maxDailyPatients: { type: Number, required: true, default: 25 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DoctorScheduleSchema.index({ doctorId: 1, hospitalId: 1, dayOfWeek: 1 }, { unique: true });

export const DoctorSchedule = mongoose.model<IDoctorSchedule>('DoctorSchedule', DoctorScheduleSchema);
