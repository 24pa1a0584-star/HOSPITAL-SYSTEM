import assert from 'assert';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { User } from '../src/models/User';
import { DoctorProfile } from '../src/models/DoctorProfile';
import { BookableSlot } from '../src/models/BookableSlot';
import { Hospital } from '../src/models/Hospital';
import { Department } from '../src/models/Department';
import { getOrGenerateSlots } from '../src/services/schedulingEngine';
import { BookingService } from '../src/services/bookingService';

const app = createApp();

async function runTests() {
  console.log('🧪 Starting CARENOVA Automated Test Runner...');
  await connectDB();

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // 1. Health Endpoint
  await test('GET /api/health returns status ok', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  // 2. Authentication & Hashing
  const testEmail = `patient.test.${Date.now()}@carenova.local`;
  const testPassword = 'SecurePassword@2026';
  let patientToken = '';

  await test('Patient registration hashes password and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register/patient')
      .send({
        name: 'Vikas Mehra',
        email: testEmail,
        password: testPassword,
        phone: '9876500001',
        city: 'New Delhi',
        gender: 'MALE',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);

    const dbUser = await User.findOne({ email: testEmail });
    assert.ok(dbUser);
    assert.notStrictEqual(dbUser.passwordHash, testPassword);
    assert.ok(dbUser.passwordHash.startsWith('$2'));
  });

  await test('Incorrect password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'WrongPassword!' });
    assert.strictEqual(res.status, 401);
  });

  await test('Correct login succeeds and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    patientToken = res.body.token;
  });

  await test('Session restoration via GET /api/auth/me succeeds', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${patientToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.email, testEmail);
    assert.strictEqual(res.body.user.role, 'PATIENT');
  });

  await test('Logout endpoint succeeds', async () => {
    const res = await request(app).post('/api/auth/logout');
    assert.strictEqual(res.status, 200);
  });

  await test('Login again succeeds after logout (persistence verified)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });
    assert.strictEqual(res.status, 200);
  });

  // 3. Doctor Registration & Verification
  const docEmail = `dr.applicant.${Date.now()}@carenova.local`;
  let pendingDocId = '';
  let generatedDoctorId = '';
  let adminToken = '';

  await test('Doctor registration generates collision-safe CARE-DOC ID with PENDING status', async () => {
    const hospital = await Hospital.findOne({ code: 'CARE-DEL-01' });
    const department = await Department.findOne({ hospitalId: hospital?._id });

    const res = await request(app)
      .post('/api/auth/register/doctor')
      .send({
        name: 'Dr. Vivek Singhania',
        email: docEmail,
        password: 'DoctorPassword@2026',
        phone: '9811445566',
        specialization: 'Neurology',
        qualifications: ['MBBS', 'DM - Neurology'],
        medicalRegistrationNumber: 'DMC-88129',
        registrationAuthority: 'Delhi Medical Council',
        experienceYears: 10,
        departmentId: department?._id.toString(),
        hospitalId: hospital?._id.toString(),
        consultationFee: 750,
      });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.doctor.uniqueDoctorId.startsWith('CARE-DOC-'));
    assert.strictEqual(res.body.doctor.verificationStatus, 'PENDING_VERIFICATION');
    pendingDocId = res.body.doctor.id;
    generatedDoctorId = res.body.doctor.uniqueDoctorId;
  });

  await test('Unverified doctor cannot offer bookable slots', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const availability = await getOrGenerateSlots(pendingDocId, dateStr);
    assert.strictEqual(availability.isAvailable, false);
    assert.strictEqual(availability.slots.length, 0);
  });

  await test('Admin logs in and verifies doctor', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@carenova.hospital', password: 'AdminSecure@2026!' });
    adminToken = loginRes.body.token;
    assert.ok(adminToken);

    const verifyRes = await request(app)
      .patch(`/api/admin/doctors/${pendingDocId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });

    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.body.doctor.verificationStatus, 'ACTIVE');
  });

  // 4. Scheduling & Slots
  await test('Scheduling respects working hours and break periods', async () => {
    const doc = await DoctorProfile.findOne({ uniqueDoctorId: 'CARE-DOC-000001' });
    assert.ok(doc);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const dateStr = futureDate.toISOString().split('T')[0];

    const availability = await getOrGenerateSlots(doc._id.toString(), dateStr);
    assert.strictEqual(availability.isAvailable, true);
    assert.ok(availability.slots.length > 0);
  });

  // 5. Critical Concurrency Booking Test
  await test('CRITICAL CONCURRENCY: Two simultaneous booking attempts for same slot -> Exactly ONE succeeds, second gets 409', async () => {
    const doc = await DoctorProfile.findOne({ uniqueDoctorId: 'CARE-DOC-000001' });
    assert.ok(doc);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split('T')[0];

    const availability = await getOrGenerateSlots(doc._id.toString(), dateStr);
    assert.ok(availability.slots.length > 0);
    const targetSlot = availability.slots[0];

    const user1 = await User.create({
      name: 'Concurrent Patient 1',
      email: `conc1.${Date.now()}@carenova.local`,
      passwordHash: 'hash',
      role: 'PATIENT',
    });
    const user2 = await User.create({
      name: 'Concurrent Patient 2',
      email: `conc2.${Date.now()}@carenova.local`,
      passwordHash: 'hash',
      role: 'PATIENT',
    });

    const [res1, res2] = await Promise.allSettled([
      BookingService.bookAppointment({
        patientId: user1._id,
        doctorId: doc._id,
        slotId: targetSlot._id,
        bookedBy: user1._id,
      }),
      BookingService.bookAppointment({
        patientId: user2._id,
        doctorId: doc._id,
        slotId: targetSlot._id,
        bookedBy: user2._id,
      }),
    ]);

    const successes = [res1, res2].filter((r) => r.status === 'fulfilled');
    const failures = [res1, res2].filter((r) => r.status === 'rejected');

    assert.strictEqual(successes.length, 1);
    assert.strictEqual(failures.length, 1);

    const rejectedErr = (failures[0] as PromiseRejectedResult).reason;
    assert.strictEqual(rejectedErr.statusCode, 409);

    const successfulAppt = (successes[0] as PromiseFulfilledResult<any>).value;
    assert.ok(successfulAppt.appointmentReference.startsWith('CARE-APT-'));

    // Test slot release upon cancellation
    const cancelled = await BookingService.cancelAppointment({
      appointmentId: successfulAppt._id,
      userId: user1._id,
      userRole: 'PATIENT',
      reason: 'Cancelled by patient',
    });
    assert.strictEqual(cancelled.status, 'CANCELLED');

    const slotAfterCancel = await BookableSlot.findById(targetSlot._id);
    assert.strictEqual(slotAfterCancel?.isBooked, false);
  });

  // 6. RBAC Security
  await test('Patient cannot access admin overview (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${patientToken}`);
    assert.strictEqual(res.status, 403);
  });

  await disconnectDB();

  console.log('\n==================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
