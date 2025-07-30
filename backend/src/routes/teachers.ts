import express from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getTeachers,
  getTeacherById,
  getTeacherStudents
} from '../controllers/teacherController';

const router = express.Router();

router.use(authenticate);

router.get('/', requireRole(['admin']), getTeachers);
router.get('/:id', requireRole(['teacher', 'admin']), getTeacherById);
router.get('/:id/students', requireRole(['teacher', 'admin']), getTeacherStudents);

export default router;

