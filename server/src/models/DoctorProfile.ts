import mongoose, { Schema, Document } from 'mongoose';

export type DoctorVerificationStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export interface IDoctorProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  uniqueDoctorId: string; // e.g. CARE-DOC-000001
  specialization: string;
  qualifications: string[];
  medicalRegistrationNumber: string;
  registrationAuthority: string;
  experienceYears: number;
  departmentId: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  consultationFee: number;
  profilePhoto?: string;
  bio: string;
  verificationStatus: DoctorVerificationStatus;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorProfileSchema = new Schema<IDoctorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    uniqueDoctorId: { type: String, required: true, unique: true, index: true },
    specialization: { type: String, required: true, index: true },
    qualifications: [{ type: String, required: true }],
    medicalRegistrationNumber: { type: String, required: true },
    registrationAuthority: { type: String, required: true },
    experienceYears: { type: Number, required: true, default: 0 },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    consultationFee: { type: Number, required: true, min: 0 },
    profilePhoto: { type: String },
    bio: { type: String, default: '' },
    verificationStatus: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'REJECTED'],
      default: 'PENDING_VERIFICATION',
      required: true,
      index: true,
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const DoctorProfile = mongoose.model<IDoctorProfile>('DoctorProfile', DoctorProfileSchema);
