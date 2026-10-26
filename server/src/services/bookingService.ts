import mongoose from 'mongoose';
import { BookableSlot } from '../models/BookableSlot';
import { Appointment, IAppointment, ConsultationType } from '../models/Appointment';
import { DoctorProfile } from '../models/DoctorProfile';
import { generateAppointmentReference } from './idGenerator';
import { sendNotification } from './notificationService';
import { logAudit } from './auditService';

export interface BookAppointmentInput {
  patientId: string | mongoose.Types.ObjectId;
  doctorId: string | mongoose.Types.ObjectId;
  slotId: string | mongoose.Types.ObjectId;
  consultationType?: ConsultationType;
  visitReason?: string;
  bookedBy: string | mongoose.Types.ObjectId;
  ipAddress?: string;
}

export interface RescheduleAppointmentInput {
  appointmentId: string | mongoose.Types.ObjectId;
  newSlotId: string | mongoose.Types.ObjectId;
  userId: string | mongoose.Types.ObjectId;
  reason?: string;
  ipAddress?: string;
}

export class BookingService {
  /**
   * Concurrency-safe atomic appointment booking
   */
  static async bookAppointment(input: BookAppointmentInput): Promise<IAppointment> {
    const doctor = await DoctorProfile.findById(input.doctorId).populate('userId');
    if (!doctor) {
      const err = new Error('Doctor profile not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (doctor.verificationStatus !== 'ACTIVE') {
      const err = new Error('Doctor is not verified or currently unavailable for booking');
      (err as any).statusCode = 403;
      throw err;
    }

    // Atomic slot reservation: only succeeds if slot is not booked
    const reservedSlot = await BookableSlot.findOneAndUpdate(
      {
        _id: input.slotId,
        doctorId: doctor._id,
        isBooked: false,
      },
      {
        $set: {
          isBooked: true,
          bookedBy: input.patientId,
        },
      },
      { new: true }
    );

    if (!reservedSlot) {
      const err = new Error('This appointment slot has just been reserved by another patient or is no longer available.');
      (err as any).statusCode = 409;
      throw err;
    }

    try {
      // Check for duplicate booking by the same patient for the same doctor and time
      const existingPatientBooking = await Appointment.findOne({
        patientId: input.patientId,
        appointmentStart: reservedSlot.slotStart,
        status: { $in: ['BOOKED', 'CHECKED_IN', 'IN_PROGRESS'] },
      });

      if (existingPatientBooking) {
        // Rollback slot reservation
        await BookableSlot.findByIdAndUpdate(reservedSlot._id, {
          $set: { isBooked: false, bookedBy: null },
        });
        const err = new Error('You already have an active appointment scheduled at this time.');
        (err as any).statusCode = 400;
        throw err;
      }

      // Generate unique appointment reference (CARE-APT-2026-000128)
      const appointmentReference = await generateAppointmentReference();

      const appointment = await Appointment.create({
        appointmentReference,
        patientId: input.patientId,
        doctorId: doctor._id,
        hospitalId: doctor.hospitalId,
        departmentId: doctor.departmentId,
        slotId: reservedSlot._id,
        appointmentStart: reservedSlot.slotStart,
        appointmentEnd: reservedSlot.slotEnd,
        consultationType: input.consultationType || 'IN_PERSON',
        visitReason: input.visitReason || 'General Consultation',
        status: 'BOOKED',
        bookedBy: input.bookedBy,
        consultationFee: doctor.consultationFee,
        reschedulingHistory: [],
      });

      // Link appointment back to slot
      reservedSlot.appointmentId = appointment._id;
      await reservedSlot.save();

      // Send real-time in-app notifications
      await sendNotification({
        recipientId: input.patientId,
        title: 'Appointment Confirmed 🎉',
        message: `Your appointment with Dr. ${(doctor.userId as any)?.name || 'Doctor'} is confirmed for ${reservedSlot.displayTime} on ${reservedSlot.dateString}. Ref: ${appointmentReference}`,
        type: 'BOOKING',
        appointmentId: appointment._id,
      });

      if (doctor.userId) {
        await sendNotification({
          recipientId: (doctor.userId as any)._id || doctor.userId,
          title: 'New Appointment Booked 🩺',
          message: `A new patient consultation has been scheduled for ${reservedSlot.displayTime} on ${reservedSlot.dateString}. Ref: ${appointmentReference}`,
          type: 'BOOKING',
          appointmentId: appointment._id,
        });
      }

      // Audit log
      await logAudit({
        action: 'APPOINTMENT_BOOKED',
        performedBy: input.bookedBy,
        targetEntity: 'Appointment',
        targetId: appointment._id.toString(),
        details: { reference: appointmentReference, slotStart: reservedSlot.slotStart },
        ipAddress: input.ipAddress,
      });

      return appointment;
    } catch (err) {
      // Rollback slot reservation if appointment creation fails
      await BookableSlot.findByIdAndUpdate(reservedSlot._id, {
        $set: { isBooked: false, bookedBy: null, appointmentId: null },
      });
      throw err;
    }
  }

  /**
   * Safe appointment cancellation with atomic slot release
   */
  static async cancelAppointment({
    appointmentId,
    userId,
    userRole,
    reason,
    ipAddress,
  }: {
    appointmentId: string | mongoose.Types.ObjectId;
    userId: string | mongoose.Types.ObjectId;
    userRole: string;
    reason?: string;
    ipAddress?: string;
  }): Promise<IAppointment> {
    const appointment = await Appointment.findById(appointmentId).populate({
      path: 'doctorId',
      populate: { path: 'userId' },
    });

    if (!appointment) {
      const err = new Error('Appointment not found');
      (err as any).statusCode = 404;
      throw err;
    }

    // Role-based authorization: only the patient, assigned doctor, receptionist, or admin can cancel
    const doctorUserId = (appointment.doctorId as any)?.userId?._id?.toString();
    const isOwnerPatient = appointment.patientId.toString() === userId.toString();
    const isAssignedDoctor = doctorUserId === userId.toString();
    const isHospitalStaff = ['RECEPTIONIST', 'ADMIN'].includes(userRole);

    if (!isOwnerPatient && !isAssignedDoctor && !isHospitalStaff) {
      const err = new Error('Unauthorized to cancel this appointment');
      (err as any).statusCode = 403;
      throw err;
    }

    // Idempotent check
    if (appointment.status === 'CANCELLED') {
      return appointment;
    }

    if (appointment.status === 'COMPLETED') {
      const err = new Error('Cannot cancel a completed appointment');
      (err as any).statusCode = 400;
      throw err;
    }

    // Atomic update status
    appointment.status = 'CANCELLED';
    appointment.cancellationReason = reason || 'Cancelled by user';
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = new mongoose.Types.ObjectId(userId.toString());
    await appointment.save();

    // Release the bookable slot
    if (appointment.slotId) {
      await BookableSlot.findByIdAndUpdate(appointment.slotId, {
        $set: {
          isBooked: false,
          appointmentId: null,
          bookedBy: null,
        },
      });
    }

    // Notify patient
    await sendNotification({
      recipientId: appointment.patientId,
      title: 'Appointment Cancelled',
      message: `Your appointment (Ref: ${appointment.appointmentReference}) has been cancelled.`,
      type: 'CANCELLATION',
      appointmentId: appointment._id,
    });

    // Notify doctor
    if (doctorUserId) {
      await sendNotification({
        recipientId: doctorUserId,
        title: 'Appointment Cancelled',
        message: `Appointment Ref: ${appointment.appointmentReference} has been cancelled.`,
        type: 'CANCELLATION',
        appointmentId: appointment._id,
      });
    }

    // Audit log
    await logAudit({
      action: 'APPOINTMENT_CANCELLED',
      performedBy: userId,
      targetEntity: 'Appointment',
      targetId: appointment._id.toString(),
      details: { reason, reference: appointment.appointmentReference },
      ipAddress,
    });

    return appointment;
  }

  /**
   * Safe appointment rescheduling with atomic new slot reservation & rollback safety
   */
  static async rescheduleAppointment(input: RescheduleAppointmentInput): Promise<IAppointment> {
    const appointment = await Appointment.findById(input.appointmentId);
    if (!appointment) {
      const err = new Error('Appointment not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      const err = new Error(`Cannot reschedule an appointment in ${appointment.status} status`);
      (err as any).statusCode = 400;
      throw err;
    }

    // Atomically reserve NEW slot first!
    const newSlot = await BookableSlot.findOneAndUpdate(
      {
        _id: input.newSlotId,
        doctorId: appointment.doctorId,
        isBooked: false,
      },
      {
        $set: {
          isBooked: true,
          bookedBy: appointment.patientId,
          appointmentId: appointment._id,
        },
      },
      { new: true }
    );

    if (!newSlot) {
      const err = new Error('The selected new slot is no longer available. Your original appointment remains preserved.');
      (err as any).statusCode = 409;
      throw err;
    }

    const oldSlotId = appointment.slotId;
    const previousStart = appointment.appointmentStart;
    const previousEnd = appointment.appointmentEnd;

    // Update appointment
    appointment.reschedulingHistory.push({
      previousStart,
      previousEnd,
      rescheduledAt: new Date(),
      reason: input.reason || 'Rescheduled by patient',
    });
    appointment.slotId = newSlot._id;
    appointment.appointmentStart = newSlot.slotStart;
    appointment.appointmentEnd = newSlot.slotEnd;
    await appointment.save();

    // Release old slot safely
    if (oldSlotId) {
      await BookableSlot.findByIdAndUpdate(oldSlotId, {
        $set: {
          isBooked: false,
          appointmentId: null,
          bookedBy: null,
        },
      });
    }

    // Send notifications
    await sendNotification({
      recipientId: appointment.patientId,
      title: 'Appointment Rescheduled 📅',
      message: `Your appointment (Ref: ${appointment.appointmentReference}) has been rescheduled to ${newSlot.displayTime} on ${newSlot.dateString}.`,
      type: 'RESCHEDULE',
      appointmentId: appointment._id,
    });

    await logAudit({
      action: 'APPOINTMENT_RESCHEDULED',
      performedBy: input.userId,
      targetEntity: 'Appointment',
      targetId: appointment._id.toString(),
      details: {
        newStart: newSlot.slotStart,
        previousStart,
        reference: appointment.appointmentReference,
      },
      ipAddress: input.ipAddress,
    });

    return appointment;
  }
}
