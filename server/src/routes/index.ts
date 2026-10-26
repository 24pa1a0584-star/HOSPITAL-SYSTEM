import { Router } from 'express';
import authRoutes from './authRoutes';
import doctorRoutes from './doctorRoutes';
import appointmentRoutes from './appointmentRoutes';
import adminRoutes from './adminRoutes';
import receptionistRoutes from './receptionistRoutes';
import hospitalRoutes from './hospitalRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'CARENOVA API & Scheduling Engine',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
  });
});

router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/admin', adminRoutes);
router.use('/receptionist', receptionistRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/notifications', notificationRoutes);

export default router;
