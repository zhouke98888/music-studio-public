import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/studentController';

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole(['teacher', 'admin']), getStudents);
router.get('/:id', requireRole(['teacher', 'admin']), getStudentById);
router.post('/', requireRole(['teacher', 'admin']), createStudent);
router.put('/:id', requireRole(['teacher', 'admin']), updateStudent);
router.delete('/:id', requireRole(['teacher', 'admin']), deleteStudent);

export default router;
