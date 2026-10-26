import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { DoctorProfile } from '../models/DoctorProfile';
import { PatientProfile } from '../models/PatientProfile';
import { StaffProfile } from '../models/StaffProfile';
import { Appointment } from '../models/Appointment';
import { Department } from '../models/Department';
import { Hospital } from '../models/Hospital';
import { DoctorSchedule } from '../models/DoctorSchedule';
import { AuditLog } from '../models/AuditLog';
import { sendNotification } from '../services/notificationService';
import { logAudit } from '../services/auditService';
import { doctorVerificationSchema, registerStaffSchema } from '../validators/schemas';

export class AdminController {
  /**
   * System overview metrics
   */
  static async getOverview(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const [
        totalPatients,
        verifiedDoctors,
        pendingDoctors,
        todayAppointments,
        completedAppointments,
        cancelledAppointments,
        totalAppointments,
        departments,
        hospitals,
      ] = await Promise.all([
        User.countDocuments({ role: 'PATIENT' }),
        DoctorProfile.countDocuments({ verificationStatus: 'ACTIVE' }),
        DoctorProfile.countDocuments({ verificationStatus: 'PENDING_VERIFICATION' }),
        Appointment.countDocuments({
          appointmentStart: { $gte: startOfDay, $lte: endOfDay },
        }),
        Appointment.countDocuments({ status: 'COMPLETED' }),
        Appointment.countDocuments({ status: 'CANCELLED' }),
        Appointment.countDocuments(),
        Department.countDocuments({ isActive: true }),
        Hospital.countDocuments({ isActive: true }),
      ]);

      const recentAppointments = await Appointment.find()
        .populate('patientId', 'name email phone')
        .populate({
          path: 'doctorId',
          populate: [{ path: 'userId', select: 'name' }, { path: 'departmentId', select: 'name' }],
        })
        .sort({ createdAt: -1 })
        .limit(8);

      res.json({
        success: true,
        metrics: {
          totalPatients,
          verifiedDoctors,
          pendingDoctors,
          todayAppointments,
          completedAppointments,
          cancelledAppointments,
          totalAppointments,
          departments,
          hospitals,
        },
        recentAppointments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List pending doctor verification requests
   */
  static async getPendingDoctors(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pendingDoctors = await DoctorProfile.find({
        verificationStatus: 'PENDING_VERIFICATION',
      })
        .populate('userId', 'name email phone avatar createdAt')
        .populate('departmentId', 'name')
        .populate('hospitalId', 'name city')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        pendingDoctors,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify / Approve / Reject doctor registration
   */
  static async verifyDoctor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = doctorVerificationSchema.parse(req.body);
      const adminId = req.user?.id!;

      const doctor = await DoctorProfile.findById(id).populate('userId');
      if (!doctor) {
        res.status(404).json({ success: false, message: 'Doctor profile not found' });
        return;
      }

      doctor.verificationStatus = parsed.status;
      doctor.verifiedBy = adminId as any;
      doctor.verifiedAt = new Date();
      if (parsed.rejectionReason) {
        doctor.rejectionReason = parsed.rejectionReason;
      }
      await doctor.save();

      // Update user account status
      if (parsed.status === 'ACTIVE') {
        await User.findByIdAndUpdate(doctor.userId, { accountStatus: 'ACTIVE' });

        // Auto-seed default schedule for Monday to Friday (9 AM - 1 PM, 2 PM - 5 PM) if none exists
        const existingSchedules = await DoctorSchedule.countDocuments({ doctorId: doctor._id });
        if (existingSchedules === 0) {
          const defaultWeekDays = [1, 2, 3, 4, 5]; // Mon to Fri
          for (const day of defaultWeekDays) {
            await DoctorSchedule.create({
              doctorId: doctor._id,
              hospitalId: doctor.hospitalId,
              dayOfWeek: day,
              shifts: [
                { start: '09:00', end: '13:00' },
                { start: '14:00', end: '17:00' },
              ],
              breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
              slotDurationMinutes: 20,
              bufferMinutes: 5,
              maxDailyPatients: 25,
              isActive: true,
            });
          }
        }
      } else if (parsed.status === 'REJECTED' || parsed.status === 'SUSPENDED') {
        await User.findByIdAndUpdate(doctor.userId, { accountStatus: 'SUSPENDED' });
      }

      // Notify doctor
      await sendNotification({
        recipientId: (doctor.userId as any)._id,
        title: parsed.status === 'ACTIVE' ? 'Credentials Verified! 🎖️' : 'Verification Status Updated',
        message:
          parsed.status === 'ACTIVE'
            ? `Your medical credentials have been verified by the Hospital Administrator. Your ID ${doctor.uniqueDoctorId} is now active and public scheduling is live.`
            : `Your verification request has been updated to: ${parsed.status}. ${parsed.rejectionReason || ''}`,
        type: 'VERIFICATION',
      });

      await logAudit({
        action: `DOCTOR_VERIFICATION_${parsed.status}`,
        performedBy: adminId,
        targetEntity: 'DoctorProfile',
        targetId: doctor._id.toString(),
        details: { status: parsed.status, doctorId: doctor.uniqueDoctorId },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: `Doctor status updated to ${parsed.status}.`,
        doctor,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all doctors
   */
  static async getAllDoctors(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const filter: any = {};
      if (status) {
        filter.verificationStatus = status;
      }

      const doctors = await DoctorProfile.find(filter)
        .populate('userId', 'name email phone avatar accountStatus')
        .populate('departmentId', 'name')
        .populate('hospitalId', 'name city')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        doctors,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create staff or receptionist account
   */
  static async createStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerStaffSchema.parse(req.body);

      const existingUser = await User.findOne({ email: parsed.email });
      if (existingUser) {
        res.status(409).json({ success: false, message: 'Email already registered.' });
        return;
      }

      const passwordHash = await bcrypt.hash(parsed.password, 10);

      const user = await User.create({
        name: parsed.name,
        email: parsed.email,
        passwordHash,
        role: parsed.role,
        accountStatus: 'ACTIVE',
        phone: parsed.phone,
      });

      const profile = await StaffProfile.create({
        userId: user._id,
        employeeId: parsed.employeeId,
        hospitalId: parsed.hospitalId,
        departmentId: parsed.departmentId,
        designation: parsed.designation,
      });

      await logAudit({
        action: 'STAFF_ACCOUNT_CREATED',
        performedBy: req.user?.id,
        targetEntity: 'StaffProfile',
        targetId: profile._id.toString(),
        details: { role: parsed.role, email: parsed.email },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: `${parsed.role} account created successfully.`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await AuditLog.find()
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({
        success: true,
        logs,
      });
    } catch (error) {
      next(error);
    }
  }
}
