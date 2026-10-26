import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/roleGuard';

const router = Router();

router.use(authenticate, requireRoles('ADMIN'));

router.get('/overview', AdminController.getOverview);
router.get('/doctors/pending', AdminController.getPendingDoctors);
router.patch('/doctors/:id/verify', AdminController.verifyDoctor);
router.get('/doctors', AdminController.getAllDoctors);
router.post('/staff', AdminController.createStaff);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
