import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Appointment } from '../models/Appointment';
import { DoctorProfile } from '../models/DoctorProfile';
import { BookingService } from '../services/bookingService';
import { generateQueueNumber } from '../services/idGenerator';
import { sendNotification } from '../services/notificationService';
import { logAudit } from '../services/auditService';
import {
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
} from '../validators/schemas';

export class AppointmentController {
  /**
   * Book appointment
   */
  static async bookAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = bookAppointmentSchema.parse(req.body);
      const userId = req.user?.id!;
      const userRole = req.user?.role!;

      // If receptionist is booking for a walk-in, patientId must be provided in body
      let targetPatientId = userId;
      if (['RECEPTIONIST', 'ADMIN'].includes(userRole) && parsed.patientId) {
        targetPatientId = parsed.patientId;
      }

      const appointment = await BookingService.bookAppointment({
        patientId: targetPatientId,
        doctorId: parsed.doctorId,
        slotId: parsed.slotId,
        consultationType: parsed.consultationType,
        visitReason: parsed.visitReason,
        bookedBy: userId,
        ipAddress: req.ip,
      });

      const populated = await Appointment.findById(appointment._id)
        .populate('patientId', 'name email phone')
        .populate({
          path: 'doctorId',
          populate: [
            { path: 'userId', select: 'name email phone avatar' },
            { path: 'departmentId', select: 'name' },
            { path: 'hospitalId', select: 'name city' },
          ],
        });

      res.status(201).json({
        success: true,
        message: `Appointment booked successfully! Reference: ${appointment.appointmentReference}`,
        appointment: populated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = cancelAppointmentSchema.parse(req.body);

      const appointment = await BookingService.cancelAppointment({
        appointmentId: id,
        userId: req.user?.id!,
        userRole: req.user?.role!,
        reason: parsed.reason,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'Appointment cancelled successfully. Slot has been freed.',
        appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reschedule appointment
   */
  static async rescheduleAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = rescheduleAppointmentSchema.parse(req.body);

      const appointment = await BookingService.rescheduleAppointment({
        appointmentId: id,
        newSlotId: parsed.newSlotId,
        userId: req.user?.id!,
        reason: parsed.reason,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'Appointment successfully rescheduled to new time.',
        appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Patient views their appointments
   */
  static async getMyAppointments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id!;
      const { status } = req.query;

      const filter: any = { patientId };
      if (status) {
        filter.status = status;
      }

      const appointments = await Appointment.find(filter)
        .populate({
          path: 'doctorId',
          populate: [
            { path: 'userId', select: 'name email phone avatar' },
            { path: 'departmentId', select: 'name iconName' },
            { path: 'hospitalId', select: 'name city state address contactNumber' },
          ],
        })
        .sort({ appointmentStart: -1 });

      res.json({
        success: true,
        appointments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single appointment details (with security check)
   */
  static async getAppointmentById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findById(id)
        .populate('patientId', 'name email phone avatar')
        .populate({
          path: 'doctorId',
          populate: [
            { path: 'userId', select: 'name email phone avatar' },
            { path: 'departmentId', select: 'name' },
            { path: 'hospitalId', select: 'name city state address' },
          ],
        });

      if (!appointment) {
        res.status(404).json({ success: false, message: 'Appointment not found' });
        return;
      }

      // Check authorization
      const userId = req.user?.id!;
      const userRole = req.user?.role!;
      const isPatient = appointment.patientId?._id?.toString() === userId;
      const doctorUserId = (appointment.doctorId as any)?.userId?._id?.toString();
      const isDoctor = doctorUserId === userId;
      const isStaff = ['RECEPTIONIST', 'ADMIN'].includes(userRole);

      if (!isPatient && !isDoctor && !isStaff) {
        res.status(403).json({ success: false, message: 'Unauthorized to view this appointment.' });
        return;
      }

      res.json({
        success: true,
        appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update appointment status (CHECKED_IN, IN_PROGRESS, COMPLETED, NO_SHOW)
   */
  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const validStatuses = ['CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW'];

      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        return;
      }

      const appointment = await Appointment.findById(id).populate({
        path: 'doctorId',
        populate: { path: 'userId' },
      });

      if (!appointment) {
        res.status(404).json({ success: false, message: 'Appointment not found' });
        return;
      }

      const userId = req.user?.id!;
      const userRole = req.user?.role!;
      const doctorUserId = (appointment.doctorId as any)?.userId?._id?.toString();
      const isAssignedDoctor = doctorUserId === userId;
      const isStaff = ['RECEPTIONIST', 'ADMIN'].includes(userRole);

      if (!isAssignedDoctor && !isStaff) {
        res.status(403).json({ success: false, message: 'Unauthorized to update this appointment status.' });
        return;
      }

      appointment.status = status;

      if (status === 'CHECKED_IN') {
        appointment.checkInTime = new Date();
        const dateStr = appointment.appointmentStart.toISOString().split('T')[0];
        appointment.queueNumber = await generateQueueNumber(appointment.doctorId._id.toString(), dateStr);

        await sendNotification({
          recipientId: appointment.patientId,
          title: 'Checked In Successfully 🏥',
          message: `You are checked in for your appointment. Your queue number is #${appointment.queueNumber}. Please wait in the OPD lounge.`,
          type: 'CHECKIN',
          appointmentId: appointment._id,
        });
      } else if (status === 'COMPLETED') {
        appointment.completedTime = new Date();
        await sendNotification({
          recipientId: appointment.patientId,
          title: 'Consultation Completed ✨',
          message: `Your consultation (Ref: ${appointment.appointmentReference}) has been marked completed. Thank you for choosing CARENOVA!`,
          type: 'COMPLETION',
          appointmentId: appointment._id,
        });
      }

      await appointment.save();

      await logAudit({
        action: `APPOINTMENT_STATUS_${status}`,
        performedBy: userId,
        targetEntity: 'Appointment',
        targetId: appointment._id.toString(),
        details: { newStatus: status, queueNumber: appointment.queueNumber },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: `Appointment status updated to ${status}.`,
        appointment,
      });
    } catch (error) {
      next(error);
    }
  }
}
