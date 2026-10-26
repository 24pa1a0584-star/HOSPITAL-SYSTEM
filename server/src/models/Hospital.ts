import mongoose, { Schema, Document } from 'mongoose';

export interface IHospital extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  contactNumber: string;
  email: string;
  openingHours: string;
  services: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HospitalSchema = new Schema<IHospital>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    openingHours: { type: String, default: '24/7 Emergency & 8:00 AM - 8:00 PM OPD' },
    services: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Hospital = mongoose.model<IHospital>('Hospital', HospitalSchema);
