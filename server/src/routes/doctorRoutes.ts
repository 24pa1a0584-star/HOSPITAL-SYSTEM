import { Router } from 'express';
import { DoctorController } from '../controllers/doctorController';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/roleGuard';

const router = Router();

// Public doctor discovery
router.get('/', DoctorController.searchDoctors);
router.get('/:id', DoctorController.getDoctorProfile);
router.get('/:id/availability', DoctorController.getDoctorAvailability);

// Doctor protected routes
router.put('/me/schedule', authenticate, requireRoles('DOCTOR'), DoctorController.updateMySchedule);
router.post('/me/leave', authenticate, requireRoles('DOCTOR'), DoctorController.addLeave);
router.get('/me/dashboard', authenticate, requireRoles('DOCTOR'), DoctorController.getDoctorDashboard);

export default router;
