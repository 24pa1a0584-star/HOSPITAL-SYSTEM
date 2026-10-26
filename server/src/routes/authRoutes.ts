import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register/patient', AuthController.registerPatient);
router.post('/register/doctor', AuthController.registerDoctor);
router.post('/login', AuthController.login);
router.get('/me', authenticate, AuthController.getCurrentUser);
router.post('/logout', AuthController.logout);

export default router;
