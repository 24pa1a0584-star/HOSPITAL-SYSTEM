import mongoose from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';
import { emitToUser } from '../sockets/socketManager';

export interface CreateNotificationParams {
  recipientId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  appointmentId?: string | mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
}

export async function sendNotification(params: CreateNotificationParams) {
  try {
    const notification = await Notification.create({
      recipientId: params.recipientId,
      title: params.title,
      message: params.message,
      type: params.type,
      appointmentId: params.appointmentId,
      metadata: params.metadata,
      isRead: false,
    });

    // Push real-time alert via socket
    emitToUser(params.recipientId.toString(), 'new_notification', {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      appointmentId: notification.appointmentId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (error) {
    console.error('Failed to create/send notification:', error);
    return null;
  }
}
