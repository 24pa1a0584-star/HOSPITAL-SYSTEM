import mongoose, { Schema, Document } from 'mongoose';

export type AppointmentStatus =
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type ConsultationType = 'IN_PERSON' | 'VIDEO';

export interface IRescheduleRecord {
  previousStart: Date;
  previousEnd: Date;
  rescheduledAt: Date;
  reason?: string;
}

export interface IAppointment extends Document {
  _id: mongoose.Types.ObjectId;
  appointmentReference: string; // e.g. CARE-APT-2026-000128
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  slotId: mongoose.Types.ObjectId;
  appointmentStart: Date;
  appointmentEnd: Date;
  consultationType: ConsultationType;
  visitReason: string;
  status: AppointmentStatus;
  bookedBy: mongoose.Types.ObjectId;
  consultationFee: number;
  checkInTime?: Date;
  completedTime?: Date;
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  queueNumber?: number;
  reschedulingHistory: IRescheduleRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    appointmentReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'DoctorProfile', required: true, index: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    slotId: { type: Schema.Types.ObjectId, ref: 'BookableSlot', required: true },
    appointmentStart: { type: Date, required: true, index: true },
    appointmentEnd: { type: Date, required: true },
    consultationType: {
      type: String,
      enum: ['IN_PERSON', 'VIDEO'],
      default: 'IN_PERSON',
      required: true,
    },
    visitReason: { type: String, default: 'General Consultation' },
    status: {
      type: String,
      enum: ['BOOKED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'BOOKED',
      required: true,
      index: true,
    },
    bookedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    consultationFee: { type: Number, required: true, default: 500 },
    checkInTime: { type: Date },
    completedTime: { type: Date },
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    queueNumber: { type: Number },
    reschedulingHistory: [
      {
        previousStart: { type: Date, required: true },
        previousEnd: { type: Date, required: true },
        rescheduledAt: { type: Date, default: Date.now },
        reason: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Indexes for fast querying
AppointmentSchema.index({ patientId: 1, status: 1 });
AppointmentSchema.index({ doctorId: 1, appointmentStart: 1 });
AppointmentSchema.index({ hospitalId: 1, appointmentStart: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
