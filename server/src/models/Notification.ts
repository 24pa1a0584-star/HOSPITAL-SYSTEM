import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'BOOKING'
  | 'REMINDER'
  | 'CANCELLATION'
  | 'RESCHEDULE'
  | 'CHECKIN'
  | 'COMPLETION'
  | 'VERIFICATION'
  | 'SYSTEM';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  appointmentId?: mongoose.Types.ObjectId;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'BOOKING',
        'REMINDER',
        'CANCELLATION',
        'RESCHEDULE',
        'CHECKIN',
        'COMPLETION',
        'VERIFICATION',
        'SYSTEM',
      ],
      default: 'SYSTEM',
      required: true,
    },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
