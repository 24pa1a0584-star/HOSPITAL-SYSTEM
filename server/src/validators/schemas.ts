import { z } from 'zod';

export const registerPatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z.string().optional(),
  city: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const registerDoctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits').optional(),
  specialization: z.string().min(2, 'Specialization is required'),
  qualifications: z.array(z.string()).min(1, 'At least one qualification is required'),
  medicalRegistrationNumber: z.string().min(3, 'Medical registration number is required'),
  registrationAuthority: z.string().min(2, 'Registration authority is required'),
  experienceYears: z.coerce.number().min(0, 'Experience years must be positive'),
  departmentId: z.string().min(1, 'Department ID is required'),
  hospitalId: z.string().min(1, 'Hospital ID is required'),
  consultationFee: z.coerce.number().min(0, 'Consultation fee must be non-negative'),
  bio: z.string().optional(),
});

export const registerStaffSchema = z.object({
  name: z.string().min(2).trim(),
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(6),
  phone: z.string().optional(),
  employeeId: z.string().min(2),
  hospitalId: z.string().min(1),
  departmentId: z.string().optional(),
  designation: z.string().default('Front Desk Receptionist'),
  role: z.enum(['RECEPTIONIST', 'ADMIN']).default('RECEPTIONIST'),
});

export const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  slotId: z.string().min(1, 'Slot ID is required'),
  patientId: z.string().optional(), // Allowed for receptionists booking on behalf of walk-ins
  consultationType: z.enum(['IN_PERSON', 'VIDEO']).default('IN_PERSON'),
  visitReason: z.string().max(250).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  newSlotId: z.string().min(1, 'New Slot ID is required'),
  reason: z.string().max(250).optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(250).optional(),
});

export const doctorVerificationSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED', 'SUSPENDED']),
  rejectionReason: z.string().optional(),
});

export const updateScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  shifts: z.array(
    z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:mm'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:mm'),
    })
  ),
  breaks: z.array(
    z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      label: z.string().default('Break'),
    })
  ),
  slotDurationMinutes: z.number().min(5).max(120).default(20),
  bufferMinutes: z.number().min(0).max(60).default(5),
  maxDailyPatients: z.number().min(1).max(100).default(30),
  isActive: z.boolean().default(true),
});

export const createLeaveSchema = z.object({
  startDate: z.string().min(10),
  endDate: z.string().min(10),
  reason: z.string().min(3),
});
