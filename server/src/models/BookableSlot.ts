import mongoose, { Schema, Document } from 'mongoose';

export interface IBookableSlot extends Document {
  _id: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  dateString: string; // YYYY-MM-DD in Asia/Kolkata
  slotStart: Date;
  slotEnd: Date;
  displayTime: string; // e.g. "09:20 AM"
  isBooked: boolean;
  appointmentId?: mongoose.Types.ObjectId;
  bookedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookableSlotSchema = new Schema<IBookableSlot>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'DoctorProfile', required: true, index: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    dateString: { type: String, required: true, index: true },
    slotStart: { type: Date, required: true },
    slotEnd: { type: Date, required: true },
    displayTime: { type: String, required: true },
    isBooked: { type: Boolean, default: false, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    bookedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Concurrency protection: one doctor can only have one bookable slot at a specific start time
BookableSlotSchema.index({ doctorId: 1, slotStart: 1 }, { unique: true });
BookableSlotSchema.index({ doctorId: 1, dateString: 1, isBooked: 1 });

export const BookableSlot = mongoose.model<IBookableSlot>('BookableSlot', BookableSlotSchema);
