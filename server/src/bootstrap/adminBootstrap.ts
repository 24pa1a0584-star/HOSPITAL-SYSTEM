import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { StaffProfile } from '../models/StaffProfile';
import { AdminBootstrapState } from '../models/AdminBootstrapState';
import { Hospital } from '../models/Hospital';
import { env } from '../config/env';

export async function bootstrapAdmin(): Promise<void> {
  if (!env.INITIAL_SETUP_ENABLED) {
    return;
  }

  try {
    // Check if bootstrap state already recorded
    const existingBootstrap = await AdminBootstrapState.findOne({ isBootstrapped: true });
    const existingAdminUser = await User.findOne({ email: env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase() });

    if (existingBootstrap || existingAdminUser) {
      return;
    }

    // Ensure a default hospital branch exists for administrative affiliation
    let defaultHospital = await Hospital.findOne({ code: 'CARE-DEL-01' });
    if (!defaultHospital) {
      defaultHospital = await Hospital.create({
        name: 'CareNova Apex Multispeciality Hospital',
        code: 'CARE-DEL-01',
        address: 'B-42 Ring Road, South Extension Part II',
        city: 'New Delhi',
        state: 'Delhi',
        contactNumber: '+91 11 4982 0000',
        email: 'delhi.apex@carenova.hospital',
        openingHours: '24/7 Emergency & 8:00 AM - 8:00 PM OPD',
        services: [
          '24/7 Emergency & Trauma Care',
          'Interventional Cardiology',
          'Advanced Dermatology & Laser Clinic',
          'Joint Replacement & Orthopedics',
          'Comprehensive Pediatrics & Neonatal ICU',
          'Digital Radiology & Pathology',
        ],
        isActive: true,
      });
    }

    const passwordHash = await bcrypt.hash(env.BOOTSTRAP_ADMIN_PASSWORD, 10);

    const adminUser = await User.create({
      name: env.BOOTSTRAP_ADMIN_NAME,
      email: env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      phone: '+91 98110 00001',
    });

    await StaffProfile.create({
      userId: adminUser._id,
      employeeId: 'CARE-ADM-001',
      hospitalId: defaultHospital._id,
      designation: 'Hospital Medical Director & Chief Administrator',
    });

    await AdminBootstrapState.create({
      isBootstrapped: true,
      bootstrappedAt: new Date(),
      adminEmail: adminUser.email,
    });

    console.log(`🔐 Initial Secure Administrator Bootstrap completed: ${adminUser.email}`);
  } catch (error) {
    console.error('Admin bootstrap error (non-fatal):', error);
  }
}
