import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminBootstrapState extends Document {
  isBootstrapped: boolean;
  bootstrappedAt: Date;
  adminEmail: string;
}

const AdminBootstrapStateSchema = new Schema<IAdminBootstrapState>({
  isBootstrapped: { type: Boolean, default: false },
  bootstrappedAt: { type: Date },
  adminEmail: { type: String, required: true },
});

export const AdminBootstrapState = mongoose.model<IAdminBootstrapState>(
  'AdminBootstrapState',
  AdminBootstrapStateSchema
);
