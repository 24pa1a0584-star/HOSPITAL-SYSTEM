import mongoose, { Schema, Document } from 'mongoose';

export interface IHospitalSettings extends Document {
  _id: mongoose.Types.ObjectId;
  key: string;
  value: any;
  description?: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const HospitalSettingsSchema = new Schema<IHospitalSettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const HospitalSettings = mongoose.model<IHospitalSettings>('HospitalSettings', HospitalSettingsSchema);
