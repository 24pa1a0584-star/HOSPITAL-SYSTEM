import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth';
import { Appointment } from '../models/Appointment';
import { User } from '../models/User';
import { PatientProfile } from '../models/PatientProfile';
import { generateQueueNumber } from '../services/idGenerator';
import { sendNotification } from '../services/notificationService';
import { logAudit } from '../services/auditService';

export class ReceptionistController {
  /**
   * Search patients for quick walk-in appointment booking
   */
  static async searchPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ success: false, message: 'Search query is required' });
        return;
      }

      const regex = new RegExp(query, 'i');
      const users = await User.find({
        role: 'PATIENT',
        $or: [{ name: regex }, { email: regex }, { phone: regex }],
      })
        .select('name email phone')
        .limit(10);

      res.json({
        success: true,
        patients: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quick-register a walk-in patient at the front desk
   */
  static async registerWalkInPatient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, phone, email, gender } = req.body;

      if (!name || !phone) {
        res.status(400).json({ success: false, message: 'Patient name and phone are required.' });
        return;
      }

      const safeEmail = email || `walkin.${Date.now()}@carenova.local`;

      // Check if email already used
      const existing = await User.findOne({ email: safeEmail });
      if (existing) {
        res.status(409).json({ success: false, message: 'A patient with this email already exists.' });
        return;
      }

      const defaultPasswordHash = await bcrypt.hash('Carenova@123', 10);

      const user = await User.create({
        name,
        email: safeEmail,
        passwordHash: defaultPasswordHash,
        role: 'PATIENT',
        accountStatus: 'ACTIVE',
        phone,
      });

      await PatientProfile.create({
        userId: user._id,
        gender,
      });

      await logAudit({
        action: 'WALKIN_PATIENT_REGISTERED',
        performedBy: req.user?.id,
        targetEntity: 'User',
        targetId: user._id.toString(),
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'Walk-in patient registered successfully.',
        patient: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get today's live queue for a doctor
   */
  static async getLiveQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const appointments = await Appointment.find({
        doctorId,
        appointmentStart: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['BOOKED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'] },
      })
        .populate('patientId', 'name phone')
        .sort({ queueNumber: 1, appointmentStart: 1 });

      res.json({
        success: true,
        queue: appointments,
      });
    } catch (error) {
      next(error);
    }
  }
}
