import { Request, Response, NextFunction } from 'express';
import { Hospital } from '../models/Hospital';
import { Department } from '../models/Department';
import { DoctorProfile } from '../models/DoctorProfile';

export class HospitalController {
  static async listHospitals(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitals = await Hospital.find({ isActive: true }).sort({ name: 1 });
      res.json({ success: true, hospitals });
    } catch (error) {
      next(error);
    }
  }

  static async listDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hospitalId } = req.query;
      const filter: any = { isActive: true };
      if (hospitalId) {
        filter.hospitalId = hospitalId;
      }

      const departments = await Department.find(filter)
        .populate('hospitalId', 'name city')
        .sort({ name: 1 });

      res.json({ success: true, departments });
    } catch (error) {
      next(error);
    }
  }

  static async getSpecialties(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const specialties = await DoctorProfile.distinct('specialization', {
        verificationStatus: 'ACTIVE',
      });
      res.json({ success: true, specialties });
    } catch (error) {
      next(error);
    }
  }
}
