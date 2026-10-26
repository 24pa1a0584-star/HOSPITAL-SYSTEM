import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { User } from '../src/models/User';
import { DoctorProfile } from '../src/models/DoctorProfile';
import { BookableSlot } from '../src/models/BookableSlot';
import { Appointment } from '../src/models/Appointment';
import { Hospital } from '../src/models/Hospital';
import { Department } from '../src/models/Department';
import { getOrGenerateSlots } from '../src/services/schedulingEngine';
import { BookingService } from '../src/services/bookingService';

const app = createApp();

describe('CARENOVA End-to-End Hospital System Test Suite', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Health & Infrastructure API', () => {
    it('GET /api/health should return status ok and uptime', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toContain('CARENOVA');
    });
  });

  describe('2. Authentication & Session Persistence', () => {
    const testEmail = `testpatient.${Date.now()}@carenova.local`;
    const testPassword = 'SecurePassword@2026';
    let authToken = '';

    it('Patient registration succeeds with hashed password', async () => {
      const res = await request(app)
        .post('/api/auth/register/patient')
        .send({
          name: 'Anil Gupta',
          email: testEmail,
          password: testPassword,
          phone: '9876543210',
          city: 'New Delhi',
          gender: 'MALE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.token).toBeDefined();

      // Check DB password is not plaintext
      const dbUser = await User.findOne({ email: testEmail });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.passwordHash).not.toBe(testPassword);
      expect(dbUser?.passwordHash.startsWith('$2')).toBe(true);
    });

    it('Login with incorrect password fails with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Login succeeds and returns valid token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      authToken = res.body.token;
    });

    it('Session restore via GET /api/auth/me succeeds with Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.role).toBe('PATIENT');
    });

    it('Logout succeeds', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Login again succeeds after logout (session persistence)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Doctor Registration & Institutional Verification Flow', () => {
    const docEmail = `dr.newapplicant.${Date.now()}@carenova.local`;
    let pendingDocId = '';
    let generatedDoctorId = '';
    let adminToken = '';

    beforeAll(async () => {
      // Login as bootstrap Admin
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@carenova.hospital',
          password: 'AdminSecure@2026!',
        });
      adminToken = res.body.token;
    });

    it('Doctor registration creates unique collision-safe CARE-DOC ID in PENDING_VERIFICATION state', async () => {
      const hospital = await Hospital.findOne({ code: 'CARE-DEL-01' });
      const department = await Department.findOne({ hospitalId: hospital?._id });

      const res = await request(app)
        .post('/api/auth/register/doctor')
        .send({
          name: 'Dr. Sameer Kapoor',
          email: docEmail,
          password: 'DoctorPassword@2026',
          phone: '9811223344',
          specialization: 'Neurology',
          qualifications: ['MBBS', 'DM - Neurology'],
          medicalRegistrationNumber: 'DMC-99214',
          registrationAuthority: 'Delhi Medical Council',
          experienceYears: 8,
          departmentId: department?._id.toString(),
          hospitalId: hospital?._id.toString(),
          consultationFee: 700,
          bio: 'Specialist in cognitive neurology.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.doctor.uniqueDoctorId).toMatch(/^CARE-DOC-\d{6}$/);
      expect(res.body.doctor.verificationStatus).toBe('PENDING_VERIFICATION');

      pendingDocId = res.body.doctor.id;
      generatedDoctorId = res.body.doctor.uniqueDoctorId;
    });

    it('Unverified doctor CANNOT offer bookable slots', async () => {
      // Pick a future date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const availability = await getOrGenerateSlots(pendingDocId, dateStr);
      expect(availability.isAvailable).toBe(false);
      expect(availability.slots.length).toBe(0);
      expect(availability.message).toContain('pending institutional verification');
    });

    it('Unverified doctor does NOT appear in public doctor search directory', async () => {
      const res = await request(app)
        .get('/api/doctors')
        .query({ search: 'Dr. Sameer Kapoor' });

      expect(res.status).toBe(200);
      const found = res.body.doctors.some((d: any) => d.uniqueDoctorId === generatedDoctorId);
      expect(found).toBe(false);
    });

    it('Admin can view pending doctors list', async () => {
      const res = await request(app)
        .get('/api/admin/doctors/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.pendingDoctors.some((d: any) => d._id === pendingDocId);
      expect(found).toBe(true);
    });

    it('Admin verifies and approves doctor account', async () => {
      const res = await request(app)
        .patch(`/api/admin/doctors/${pendingDocId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.doctor.verificationStatus).toBe('ACTIVE');

      // Now verified doctor appears in search!
      const searchRes = await request(app)
        .get('/api/doctors')
        .query({ search: 'Dr. Sameer Kapoor' });

      expect(searchRes.status).toBe(200);
      const found = searchRes.body.doctors.some((d: any) => d.uniqueDoctorId === generatedDoctorId);
      expect(found).toBe(true);
    });
  });

  describe('4. Scheduling Engine & Real Slot Generation', () => {
    it('Slots respect working hours, exclude breaks, and block past dates', async () => {
      const doc = await DoctorProfile.findOne({ uniqueDoctorId: 'CARE-DOC-000001' });
      expect(doc).not.toBeNull();

      // Past date test
      const pastResult = await getOrGenerateSlots(doc!._id.toString(), '2020-01-01');
      expect(pastResult.isAvailable).toBe(false);
      expect(pastResult.message).toContain('past');

      // Future date test (pick upcoming Wednesday)
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 3);
      const dateStr = nextDate.toISOString().split('T')[0];

      const result = await getOrGenerateSlots(doc!._id.toString(), dateStr);
      expect(result.isAvailable).toBe(true);
      expect(result.slots.length).toBeGreaterThan(0);

      // Verify no slot falls in 13:00 - 14:00 (Lunch Break)
      for (const slot of result.slots) {
        const slotKolkataHour = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
        }).format(slot.slotStart);

        const [h, m] = slotKolkataHour.split(':').map(Number);
        const mins = h * 60 + m;
        // Lunch is 13:00 (780 mins) to 14:00 (840 mins)
        const inLunch = mins >= 780 && mins < 840;
        expect(inLunch).toBe(false);
      }
    });
  });

  describe('5. Concurrency-Safe Booking & Double-Booking Prevention', () => {
    it('CRITICAL: Two simultaneous booking attempts for the same slot -> EXACTLY ONE succeeds, second receives 409 Conflict', async () => {
      const doc = await DoctorProfile.findOne({ uniqueDoctorId: 'CARE-DOC-000001' });
      expect(doc).not.toBeNull();

      // Future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 4);
      const dateStr = futureDate.toISOString().split('T')[0];

      const availability = await getOrGenerateSlots(doc!._id.toString(), dateStr);
      expect(availability.slots.length).toBeGreaterThan(1);

      // Pick the first available slot
      const targetSlot = availability.slots[0];

      // Create two test patients
      const patientA = await User.create({
        name: 'Patient A',
        email: `patientA.${Date.now()}@carenova.local`,
        passwordHash: 'hash',
        role: 'PATIENT',
      });
      const patientB = await User.create({
        name: 'Patient B',
        email: `patientB.${Date.now()}@carenova.local`,
        passwordHash: 'hash',
        role: 'PATIENT',
      });

      // Execute simultaneous concurrent bookings
      const [resA, resB] = await Promise.allSettled([
        BookingService.bookAppointment({
          patientId: patientA._id,
          doctorId: doc!._id,
          slotId: targetSlot._id,
          bookedBy: patientA._id,
          consultationType: 'IN_PERSON',
        }),
        BookingService.bookAppointment({
          patientId: patientB._id,
          doctorId: doc!._id,
          slotId: targetSlot._id,
          bookedBy: patientB._id,
          consultationType: 'IN_PERSON',
        }),
      ]);

      // Count successes and rejections
      const successes = [resA, resB].filter((r) => r.status === 'fulfilled');
      const rejections = [resA, resB].filter((r) => r.status === 'rejected');

      expect(successes.length).toBe(1);
      expect(rejections.length).toBe(1);

      const rejectedReason = (rejections[0] as PromiseRejectedResult).reason;
      expect(rejectedReason.statusCode).toBe(409);
      expect(rejectedReason.message).toContain('reserved by another patient');

      // Verify slot in DB is marked booked
      const slotInDb = await BookableSlot.findById(targetSlot._id);
      expect(slotInDb?.isBooked).toBe(true);

      // Verify appointment reference format
      const successfulAppt = (successes[0] as PromiseFulfilledResult<any>).value;
      expect(successfulAppt.appointmentReference).toMatch(/^CARE-APT-\d{4}-\d{6}$/);

      // Test cancellation releases slot
      const cancelledAppt = await BookingService.cancelAppointment({
        appointmentId: successfulAppt._id,
        userId: successfulAppt.patientId,
        userRole: 'PATIENT',
        reason: 'Patient plans changed',
      });

      expect(cancelledAppt.status).toBe('CANCELLED');

      // Slot should now be released back to isBooked: false
      const releasedSlot = await BookableSlot.findById(targetSlot._id);
      expect(releasedSlot?.isBooked).toBe(false);

      // Idempotency test: repeated cancellation does not corrupt or throw error
      const repeatCancel = await BookingService.cancelAppointment({
        appointmentId: successfulAppt._id,
        userId: successfulAppt.patientId,
        userRole: 'PATIENT',
      });
      expect(repeatCancel.status).toBe('CANCELLED');
    });
  });

  describe('6. Role-Based Access Control', () => {
    it('Patient is blocked from admin routes with 403 Forbidden', async () => {
      // Login as normal patient
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'patient.rohit@gmail.com',
          password: 'PatientSecure@2026!',
        });

      const patientToken = loginRes.body.token;

      const adminRes = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(adminRes.status).toBe(403);
      expect(adminRes.body.success).toBe(false);
      expect(adminRes.body.message).toContain('Access denied');
    });
  });
});
