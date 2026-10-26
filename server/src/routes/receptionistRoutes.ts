import { Router } from 'express';
import { ReceptionistController } from '../controllers/receptionistController';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/roleGuard';

const router = Router();

router.use(authenticate, requireRoles('RECEPTIONIST', 'ADMIN'));

router.get('/patients/search', ReceptionistController.searchPatients);
router.post('/patients/walk-in', ReceptionistController.registerWalkInPatient);
router.get('/queue/:doctorId', ReceptionistController.getLiveQueue);

export default router;
