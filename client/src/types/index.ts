export type UserRole = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  accountStatus?: AccountStatus;
  profile?: any;
}

export interface Hospital {
  _id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  contactNumber: string;
  email: string;
  openingHours: string;
  services: string[];
  isActive: boolean;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description: string;
  hospitalId: string | Hospital;
  iconName?: string;
  isActive: boolean;
}

export interface Doctor {
  _id: string;
  userId: User;
  uniqueDoctorId: string;
  specialization: string;
  qualifications: string[];
  medicalRegistrationNumber: string;
  registrationAuthority: string;
  experienceYears: number;
  departmentId: Department;
  hospitalId: Hospital;
  consultationFee: number;
  profilePhoto?: string;
  bio: string;
  verificationStatus: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  verifiedAt?: string;
}

export interface BookableSlot {
  _id: string;
  doctorId: string;
  hospitalId: string;
  departmentId: string;
  dateString: string;
  slotStart: string;
  slotEnd: string;
  displayTime: string;
  isBooked: boolean;
  appointmentId?: string;
}

export type AppointmentStatus =
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface RescheduleRecord {
  previousStart: string;
  previousEnd: string;
  rescheduledAt: string;
  reason?: string;
}

export interface Appointment {
  _id: string;
  appointmentReference: string;
  patientId: User;
  doctorId: Doctor;
  hospitalId: Hospital;
  departmentId: Department;
  slotId: string | BookableSlot;
  appointmentStart: string;
  appointmentEnd: string;
  consultationType: 'IN_PERSON' | 'VIDEO';
  visitReason: string;
  status: AppointmentStatus;
  bookedBy: User | string;
  consultationFee: number;
  checkInTime?: string;
  completedTime?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  queueNumber?: number;
  reschedulingHistory: RescheduleRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  appointmentId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  action: string;
  performedBy?: { name: string; email: string; role: string };
  targetEntity: string;
  targetId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}
