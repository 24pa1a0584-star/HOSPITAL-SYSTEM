import { Router } from 'express';
import { AppointmentController } from '../controllers/appointmentController';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/roleGuard';

const router = Router();

router.use(authenticate);

router.post('/', requireRoles('PATIENT', 'RECEPTIONIST', 'ADMIN'), AppointmentController.bookAppointment);
router.get('/my', requireRoles('PATIENT'), AppointmentController.getMyAppointments);
router.get('/:id', AppointmentController.getAppointmentById);
router.post('/:id/cancel', AppointmentController.cancelAppointment);
router.post('/:id/reschedule', AppointmentController.rescheduleAppointment);
router.patch('/:id/status', requireRoles('DOCTOR', 'RECEPTIONIST', 'ADMIN'), AppointmentController.updateStatus);

export default router;
