import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog';

export async function logAudit({
  action,
  performedBy,
  targetEntity,
  targetId,
  details = {},
  ipAddress,
}: {
  action: string;
  performedBy?: string | mongoose.Types.ObjectId;
  targetEntity: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}) {
  try {
    await AuditLog.create({
      action,
      performedBy,
      targetEntity,
      targetId,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error('Audit log creation error:', error);
  }
}
