import { Request, Response, NextFunction } from 'express';
import { DoctorProfile } from '../models/DoctorProfile';
import { DoctorSchedule } from '../models/DoctorSchedule';
import { DoctorLeave } from '../models/DoctorLeave';
import { Appointment } from '../models/Appointment';
import { getOrGenerateSlots } from '../services/schedulingEngine';
import { AuthenticatedRequest } from '../middleware/auth';
import { updateScheduleSchema, createLeaveSchema } from '../validators/schemas';

export class DoctorController {
  /**
   * Search doctors with specialization, hospital, city, fee filters
   */
  static async searchDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        search,
        specialization,
        departmentId,
        hospitalId,
        city,
        maxFee,
        sortBy = 'experience',
        page = '1',
        limit = '12',
      } = req.query;

      const filter: any = { verificationStatus: 'ACTIVE' };

      if (specialization) {
        filter.specialization = { $regex: new RegExp(String(specialization), 'i') };
      }

      if (departmentId) {
        filter.departmentId = departmentId;
      }

      if (hospitalId) {
        filter.hospitalId = hospitalId;
      }

      if (maxFee) {
        filter.consultationFee = { $lte: Number(maxFee) };
      }

      let sortOption: any = { experienceYears: -1 };
      if (sortBy === 'fee_asc') sortOption = { consultationFee: 1 };
      if (sortBy === 'fee_desc') sortOption = { consultationFee: -1 };
      if (sortBy === 'experience') sortOption = { experienceYears: -1 };

      const pageNum = Math.max(1, parseInt(String(page), 10));
      const limitNum = Math.max(1, parseInt(String(limit), 10));
      const skip = (pageNum - 1) * limitNum;

      // Query doctors
      let query = DoctorProfile.find(filter)
        .populate('userId', 'name email phone avatar')
        .populate('departmentId', 'name iconName')
        .populate('hospitalId', 'name city state address contactNumber')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum);

      let doctors = await query.exec();

      // Filter by city or doctor name in user populated record if provided
      if (city || search) {
        doctors = doctors.filter((doc: any) => {
          let matches = true;
          if (city) {
            matches = matches && doc.hospitalId?.city?.toLowerCase().includes(String(city).toLowerCase());
          }
          if (search) {
            const s = String(search).toLowerCase();
            const matchesName = doc.userId?.name?.toLowerCase().includes(s);
            const matchesSpec = doc.specialization?.toLowerCase().includes(s);
            const matchesHosp = doc.hospitalId?.name?.toLowerCase().includes(s);
            matches = matches && (matchesName || matchesSpec || matchesHosp);
          }
          return matches;
        });
      }

      const total = await DoctorProfile.countDocuments(filter);

      res.json({
        success: true,
        doctors,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single doctor public profile
   */
  static async getDoctorProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const doctor = await DoctorProfile.findById(id)
        .populate('userId', 'name email phone avatar')
        .populate('departmentId', 'name code description')
        .populate('hospitalId', 'name code city state address contactNumber openingHours');

      if (!doctor) {
        res.status(404).json({ success: false, message: 'Doctor not found' });
        return;
      }

      // Fetch weekly schedule
      const schedules = await DoctorSchedule.find({ doctorId: doctor._id, isActive: true }).sort({ dayOfWeek: 1 });

      res.json({
        success: true,
        doctor,
        schedules,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available appointment slots for a specific date
   */
  static async getDoctorAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { date } = req.query; // YYYY-MM-DD

      if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({ success: false, message: 'Please provide a valid date format: YYYY-MM-DD' });
        return;
      }

      const result = await getOrGenerateSlots(id, date);

      res.json({
        success: true,
        date,
        isAvailable: result.isAvailable,
        message: result.message,
        slots: result.slots,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Doctor updates their own schedule
   */
  static async updateMySchedule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateScheduleSchema.parse(req.body);
      const doctor = await DoctorProfile.findOne({ userId: req.user?.id });

      if (!doctor) {
        res.status(404).json({ success: false, message: 'Doctor profile not found' });
        return;
      }

      const schedule = await DoctorSchedule.findOneAndUpdate(
        {
          doctorId: doctor._id,
          hospitalId: doctor.hospitalId,
          dayOfWeek: parsed.dayOfWeek,
        },
        {
          $set: {
            shifts: parsed.shifts,
            breaks: parsed.breaks,
            slotDurationMinutes: parsed.slotDurationMinutes,
            bufferMinutes: parsed.bufferMinutes,
            maxDailyPatients: parsed.maxDailyPatients,
            isActive: parsed.isActive,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      res.json({
        success: true,
        message: 'Consultation schedule updated successfully.',
        schedule,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Doctor requests / marks leave
   */
  static async addLeave(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createLeaveSchema.parse(req.body);
      const doctor = await DoctorProfile.findOne({ userId: req.user?.id });

      if (!doctor) {
        res.status(404).json({ success: false, message: 'Doctor profile not found' });
        return;
      }

      const leave = await DoctorLeave.create({
        doctorId: doctor._id,
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
        reason: parsed.reason,
        status: 'APPROVED',
      });

      res.status(201).json({
        success: true,
        message: 'Leave dates registered. Online bookings will be automatically blocked for this interval.',
        leave,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Doctor dashboard statistics
   */
  static async getDoctorDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await DoctorProfile.findOne({ userId: req.user?.id });
      if (!doctor) {
        res.status(404).json({ success: false, message: 'Doctor profile not found' });
        return;
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const [total, todayCount, completed, cancelled, upcoming] = await Promise.all([
        Appointment.countDocuments({ doctorId: doctor._id }),
        Appointment.countDocuments({
          doctorId: doctor._id,
          appointmentStart: { $gte: startOfDay, $lte: endOfDay },
        }),
        Appointment.countDocuments({ doctorId: doctor._id, status: 'COMPLETED' }),
        Appointment.countDocuments({ doctorId: doctor._id, status: 'CANCELLED' }),
        Appointment.find({
          doctorId: doctor._id,
          appointmentStart: { $gte: now },
          status: { $in: ['BOOKED', 'CHECKED_IN'] },
        })
          .populate('patientId', 'name email phone avatar')
          .sort({ appointmentStart: 1 })
          .limit(10),
      ]);

      const todayAppointments = await Appointment.find({
        doctorId: doctor._id,
        appointmentStart: { $gte: startOfDay, $lte: endOfDay },
      })
        .populate('patientId', 'name email phone avatar')
        .sort({ appointmentStart: 1 });

      const schedules = await DoctorSchedule.find({ doctorId: doctor._id });

      res.json({
        success: true,
        doctor,
        stats: {
          totalAppointments: total,
          todayAppointmentsCount: todayCount,
          completedCount: completed,
          cancelledCount: cancelled,
        },
        todayAppointments,
        upcomingAppointments: upcoming,
        schedules,
      });
    } catch (error) {
      next(error);
    }
  }
}
