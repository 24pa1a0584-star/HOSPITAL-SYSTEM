import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { PatientProfile } from '../models/PatientProfile';
import { DoctorProfile } from '../models/DoctorProfile';
import { StaffProfile } from '../models/StaffProfile';
import { signToken } from '../utils/token';
import { generateDoctorId } from '../services/idGenerator';
import { logAudit } from '../services/auditService';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  registerPatientSchema,
  loginSchema,
  registerDoctorSchema,
} from '../validators/schemas';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  static async registerPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerPatientSchema.parse(req.body);

      const existingUser = await User.findOne({ email: parsed.email });
      if (existingUser) {
        res.status(409).json({ success: false, message: 'Email is already registered.' });
        return;
      }

      const passwordHash = await bcrypt.hash(parsed.password, 10);

      const user = await User.create({
        name: parsed.name,
        email: parsed.email,
        passwordHash,
        role: 'PATIENT',
        accountStatus: 'ACTIVE',
        phone: parsed.phone,
      });

      const profile = await PatientProfile.create({
        userId: user._id,
        dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : undefined,
        gender: parsed.gender,
        bloodGroup: parsed.bloodGroup,
        city: parsed.city,
      });

      const token = signToken({ id: user._id.toString(), role: user.role, email: user.email });

      res.cookie('token', token, COOKIE_OPTIONS);

      await logAudit({
        action: 'PATIENT_REGISTERED',
        performedBy: user._id,
        targetEntity: 'User',
        targetId: user._id.toString(),
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome to CARENOVA.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async registerDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerDoctorSchema.parse(req.body);

      const existingUser = await User.findOne({ email: parsed.email });
      if (existingUser) {
        res.status(409).json({ success: false, message: 'Email is already registered.' });
        return;
      }

      const passwordHash = await bcrypt.hash(parsed.password, 10);

      const user = await User.create({
        name: parsed.name,
        email: parsed.email,
        passwordHash,
        role: 'DOCTOR',
        accountStatus: 'PENDING',
        phone: parsed.phone,
      });

      const uniqueDoctorId = await generateDoctorId();

      const doctorProfile = await DoctorProfile.create({
        userId: user._id,
        uniqueDoctorId,
        specialization: parsed.specialization,
        qualifications: parsed.qualifications,
        medicalRegistrationNumber: parsed.medicalRegistrationNumber,
        registrationAuthority: parsed.registrationAuthority,
        experienceYears: parsed.experienceYears,
        departmentId: parsed.departmentId,
        hospitalId: parsed.hospitalId,
        consultationFee: parsed.consultationFee,
        bio: parsed.bio || '',
        verificationStatus: 'PENDING_VERIFICATION',
      });

      await logAudit({
        action: 'DOCTOR_REGISTRATION_SUBMITTED',
        performedBy: user._id,
        targetEntity: 'DoctorProfile',
        targetId: doctorProfile._id.toString(),
        details: { uniqueDoctorId },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: `Doctor account registration submitted successfully. Your assigned ID is ${uniqueDoctorId}. Your credentials will be verified by the Hospital Administrator before public appointment scheduling is enabled.`,
        doctor: {
          id: doctorProfile._id,
          uniqueDoctorId,
          name: user.name,
          email: user.email,
          verificationStatus: doctorProfile.verificationStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.parse(req.body);

      const user = await User.findOne({ email: parsed.email });
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(parsed.password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      if (user.accountStatus === 'SUSPENDED') {
        res.status(403).json({ success: false, message: 'This account has been suspended.' });
        return;
      }

      const token = signToken({ id: user._id.toString(), role: user.role, email: user.email });

      res.cookie('token', token, COOKIE_OPTIONS);

      // Attach relevant profile data
      let profileData = null;
      if (user.role === 'DOCTOR') {
        profileData = await DoctorProfile.findOne({ userId: user._id })
          .populate('departmentId', 'name')
          .populate('hospitalId', 'name city');
      } else if (user.role === 'PATIENT') {
        profileData = await PatientProfile.findOne({ userId: user._id });
      } else if (['RECEPTIONIST', 'ADMIN'].includes(user.role)) {
        profileData = await StaffProfile.findOne({ userId: user._id })
          .populate('hospitalId', 'name city');
      }

      await logAudit({
        action: 'USER_LOGIN',
        performedBy: user._id,
        targetEntity: 'User',
        targetId: user._id.toString(),
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'Login successful.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          accountStatus: user.accountStatus,
          profile: profileData,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await User.findById(req.user.id).select('-passwordHash');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      let profileData = null;
      if (user.role === 'DOCTOR') {
        profileData = await DoctorProfile.findOne({ userId: user._id })
          .populate('departmentId', 'name')
          .populate('hospitalId', 'name city');
      } else if (user.role === 'PATIENT') {
        profileData = await PatientProfile.findOne({ userId: user._id });
      } else if (['RECEPTIONIST', 'ADMIN'].includes(user.role)) {
        profileData = await StaffProfile.findOne({ userId: user._id })
          .populate('hospitalId', 'name city');
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          accountStatus: user.accountStatus,
          profile: profileData,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully.' });
  }
}
