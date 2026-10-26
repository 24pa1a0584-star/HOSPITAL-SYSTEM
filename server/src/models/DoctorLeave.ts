import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctorLeave extends Document {
  _id: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const DoctorLeaveSchema = new Schema<IDoctorLeave>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'DoctorProfile', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['APPROVED', 'PENDING', 'REJECTED'],
      default: 'APPROVED',
      required: true,
    },
  },
  { timestamps: true }
);

DoctorLeaveSchema.index({ doctorId: 1, startDate: 1, endDate: 1 });

export const DoctorLeave = mongoose.model<IDoctorLeave>('DoctorLeave', DoctorLeaveSchema);
