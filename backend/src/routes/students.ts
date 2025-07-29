import express from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats
} from '../controllers/studentController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all students (teachers and admins only)
router.get('/', requireRole(['teacher', 'admin']), getStudents);

// Get student stats (teachers and admins only)
router.get('/stats', requireRole(['teacher', 'admin']), getStudentStats);

// Get student by ID (teachers and admins only)
router.get('/:id', requireRole(['teacher', 'admin']), getStudentById);

// Create new student (teachers and admins only)
router.post('/', requireRole(['teacher', 'admin']), createStudent);

// Update student (teachers and admins only)
router.put('/:id', requireRole(['teacher', 'admin']), updateStudent);

// Delete student (admins only)
router.delete('/:id', requireRole(['admin']), deleteStudent);

export default router;