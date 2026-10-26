import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { PatientProfile } from '../models/PatientProfile';
import { DoctorProfile } from '../models/DoctorProfile';
import { StaffProfile } from '../models/StaffProfile';
import { Hospital } from '../models/Hospital';
import { Department } from '../models/Department';
import { DoctorSchedule } from '../models/DoctorSchedule';
import { generateDoctorId } from '../services/idGenerator';
import { bootstrapAdmin } from './adminBootstrap';

export async function seedDemoData() {
  console.log('🌱 Starting non-destructive CARENOVA demonstration data initialization...');
  await connectDB();
  await bootstrapAdmin();

  // 1. Hospital Branches
  const hospitalsData = [
    {
      name: 'CareNova Apex Multispeciality Hospital',
      code: 'CARE-DEL-01',
      address: 'B-42 Ring Road, South Extension Part II',
      city: 'New Delhi',
      state: 'Delhi',
      contactNumber: '+91 11 4982 0000',
      email: 'delhi.apex@carenova.hospital',
      openingHours: '24/7 Emergency & 8:00 AM - 8:00 PM OPD',
      services: ['Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics', 'Neurology', 'General Medicine'],
      isActive: true,
    },
    {
      name: 'CareNova SuperCare Center',
      code: 'CARE-BLR-01',
      address: '100 Feet Road, HAL 2nd Stage, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      contactNumber: '+91 80 4125 0000',
      email: 'blr.supercare@carenova.hospital',
      openingHours: '24/7 Emergency & 8:30 AM - 7:30 PM OPD',
      services: ['Cardiology', 'Orthopedics', 'Dermatology', 'General Medicine'],
      isActive: true,
    },
  ];

  const hospitals: Record<string, any> = {};
  for (const h of hospitalsData) {
    let existing = await Hospital.findOne({ code: h.code });
    if (!existing) {
      existing = await Hospital.create(h);
      console.log(`🏥 Created Hospital Branch: ${h.name}`);
    }
    hospitals[h.code] = existing;
  }

  // 2. Departments
  const deptConfigs = [
    { name: 'Cardiology', code: 'CARD', iconName: 'HeartPulse', desc: 'Comprehensive cardiac care, angiography, and preventive heart health.' },
    { name: 'Dermatology', code: 'DERM', iconName: 'Sparkles', desc: 'Clinical dermatology, pediatric skin care, and medical aesthetics.' },
    { name: 'Orthopedics', code: 'ORTHO', iconName: 'Activity', desc: 'Joint reconstruction, spine care, and sports medicine rehabilitation.' },
    { name: 'General Medicine', code: 'GENMED', iconName: 'Stethoscope', desc: 'Primary diagnosis, lifestyle illness management, and adult preventive care.' },
    { name: 'Pediatrics', code: 'PEDIA', iconName: 'Baby', desc: 'Specialized healthcare for infants, children, and young adolescents.' },
    { name: 'Neurology', code: 'NEURO', iconName: 'Brain', desc: 'Advanced neurological disorders, stroke prevention, and cognitive health.' },
  ];

  const departments: Record<string, any> = {};
  for (const d of deptConfigs) {
    let existing = await Department.findOne({ hospitalId: hospitals['CARE-DEL-01']._id, code: d.code });
    if (!existing) {
      existing = await Department.create({
        name: d.name,
        code: d.code,
        description: d.desc,
        hospitalId: hospitals['CARE-DEL-01']._id,
        iconName: d.iconName,
        isActive: true,
      });
      console.log(`🏢 Created Department: ${d.name}`);
    }
    departments[d.code] = existing;
  }

  // 3. Receptionist User
  const receptionistEmail = 'receptionist.delhi@carenova.hospital';
  let receptionistUser = await User.findOne({ email: receptionistEmail });
  if (!receptionistUser) {
    const passwordHash = await bcrypt.hash('ReceptionSecure@2026!', 10);
    receptionistUser = await User.create({
      name: 'Sunita Mehra',
      email: receptionistEmail,
      passwordHash,
      role: 'RECEPTIONIST',
      accountStatus: 'ACTIVE',
      phone: '+91 98110 54321',
    });
    await StaffProfile.create({
      userId: receptionistUser._id,
      employeeId: 'CARE-REC-001',
      hospitalId: hospitals['CARE-DEL-01']._id,
      designation: 'Senior Front Desk Officer',
    });
    console.log(`👤 Created Receptionist: ${receptionistEmail}`);
  }

  // 4. Demonstration Doctors (Verified and Scheduled)
  const demoDoctors = [
    {
      name: 'Dr. Rajesh Sharma',
      email: 'dr.sharma.cardio@carenova.hospital',
      specialization: 'Cardiology',
      deptCode: 'CARD',
      qualifications: ['MBBS (AIIMS New Delhi)', 'MD - General Medicine', 'DM - Cardiology'],
      regNumber: 'DMC-58291',
      authority: 'Delhi Medical Council',
      experienceYears: 16,
      consultationFee: 800,
      bio: 'Senior Interventional Cardiologist with extensive clinical practice in preventive cardiology, complex angioplasty, and hypertension management.',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dr. Priya Sen',
      email: 'dr.priya.derm@carenova.hospital',
      specialization: 'Dermatology',
      deptCode: 'DERM',
      qualifications: ['MBBS (CMC Vellore)', 'MD - Dermatology, Venereology & Leprosy'],
      regNumber: 'KMC-42109',
      authority: 'Karnataka Medical Council',
      experienceYears: 11,
      consultationFee: 650,
      bio: 'Consultant Dermatologist recognized for evidence-based management of chronic eczema, psoriasis, acne therapy, and dermatopathology.',
      avatar: 'https://images.unsplash.com/photo-1594824813589-73e449f826aa?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dr. Arjun Nair',
      email: 'dr.arjun.ortho@carenova.hospital',
      specialization: 'Orthopedics',
      deptCode: 'ORTHO',
      qualifications: ['MBBS', 'MS - Orthopedics (KEM Mumbai)', 'Fellowship in Joint Replacement (UK)'],
      regNumber: 'MMC-89124',
      authority: 'Maharashtra Medical Council',
      experienceYears: 14,
      consultationFee: 750,
      bio: 'Chief Orthopedic Surgeon specializing in minimally invasive knee and hip arthroplasty, arthroscopic surgeries, and sports injuries.',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dr. Ananya Mukherjee',
      email: 'dr.ananya.pedia@carenova.hospital',
      specialization: 'Pediatrics',
      deptCode: 'PEDIA',
      qualifications: ['MBBS', 'MD - Pediatrics (PGIMER Chandigarh)'],
      regNumber: 'DMC-69412',
      authority: 'Delhi Medical Council',
      experienceYears: 9,
      consultationFee: 600,
      bio: 'Compassionate Pediatrician dedicated to neonatal development, immunizations, childhood infectious diseases, and pediatric nutrition guidance.',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dr. Vikram Malhotra',
      email: 'dr.vikram.genmed@carenova.hospital',
      specialization: 'General Medicine',
      deptCode: 'GENMED',
      qualifications: ['MBBS', 'MD - Internal Medicine'],
      regNumber: 'DMC-39184',
      authority: 'Delhi Medical Council',
      experienceYears: 18,
      consultationFee: 500,
      bio: 'Principal Consultant in Internal Medicine with comprehensive expertise in diabetes, metabolic syndrome, and geriatric health assessment.',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
    },
  ];

  for (const doc of demoDoctors) {
    let user = await User.findOne({ email: doc.email });
    let doctorProfile: any = null;

    if (!user) {
      const passwordHash = await bcrypt.hash('DoctorSecure@2026!', 10);
      user = await User.create({
        name: doc.name,
        email: doc.email,
        passwordHash,
        role: 'DOCTOR',
        accountStatus: 'ACTIVE',
        phone: '+91 98100 12345',
        avatar: doc.avatar,
      });

      const uniqueDoctorId = await generateDoctorId();
      doctorProfile = await DoctorProfile.create({
        userId: user._id,
        uniqueDoctorId,
        specialization: doc.specialization,
        qualifications: doc.qualifications,
        medicalRegistrationNumber: doc.regNumber,
        registrationAuthority: doc.authority,
        experienceYears: doc.experienceYears,
        departmentId: departments[doc.deptCode]._id,
        hospitalId: hospitals['CARE-DEL-01']._id,
        consultationFee: doc.consultationFee,
        bio: doc.bio,
        profilePhoto: doc.avatar,
        verificationStatus: 'ACTIVE',
        verifiedAt: new Date(),
      });
      console.log(`🩺 Created Doctor: ${doc.name} (${uniqueDoctorId})`);
    } else {
      doctorProfile = await DoctorProfile.findOne({ userId: user._id });
    }

    // Seed weekly schedules for Mon-Fri
    if (doctorProfile) {
      const existingScheduleCount = await DoctorSchedule.countDocuments({ doctorId: doctorProfile._id });
      if (existingScheduleCount === 0) {
        for (let day = 1; day <= 6; day++) {
          await DoctorSchedule.create({
            doctorId: doctorProfile._id,
            hospitalId: hospitals['CARE-DEL-01']._id,
            dayOfWeek: day,
            shifts: [
              { start: '09:00', end: '13:00' },
              { start: '14:00', end: '17:30' },
            ],
            breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
            slotDurationMinutes: 20,
            bufferMinutes: 5,
            maxDailyPatients: 30,
            isActive: true,
          });
        }
      }
    }
  }

  // 5. Sample Patient User
  const patientEmail = 'patient.rohit@gmail.com';
  let patientUser = await User.findOne({ email: patientEmail });
  if (!patientUser) {
    const passwordHash = await bcrypt.hash('PatientSecure@2026!', 10);
    patientUser = await User.create({
      name: 'Rohit Verma',
      email: patientEmail,
      passwordHash,
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
      phone: '+91 98765 43210',
    });

    await PatientProfile.create({
      userId: patientUser._id,
      dateOfBirth: new Date('1994-06-15'),
      gender: 'MALE',
      bloodGroup: 'B+',
      emergencyContact: {
        name: 'Neha Verma',
        phone: '+91 98765 43211',
        relation: 'Spouse',
      },
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110049',
    });
    console.log(`🧑‍⚕️ Created Demonstration Patient: ${patientEmail}`);
  }

  console.log('✅ Demonstration data initialized successfully!');
}

if (require.main === module) {
  seedDemoData()
    .then(() => {
      disconnectDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Demo data seed failed:', err);
      process.exit(1);
    });
}
