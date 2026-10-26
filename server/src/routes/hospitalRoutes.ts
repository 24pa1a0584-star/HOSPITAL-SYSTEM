import { Router } from 'express';
import { HospitalController } from '../controllers/hospitalController';

const router = Router();

router.get('/', HospitalController.listHospitals);
router.get('/departments', HospitalController.listDepartments);
router.get('/specialties', HospitalController.getSpecialties);

export default router;
