import express from 'express';
import {
  getLessons,
  getLessonById,
  confirmAttendance,
  requestReschedule,
  requestCancel,
  approveReschedule,
  approveCancel,
  createLesson,
  updateLesson,
  deleteLesson
} from '../controllers/lessonController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes for all authenticated users
router.get('/', getLessons);
router.get('/:id', getLessonById);

// Student-specific routes
router.post('/:id/confirm-attendance', confirmAttendance);
router.post('/:id/request-reschedule', requestReschedule);
router.post('/:id/request-cancel', requestCancel);

// Teacher-specific routes
router.post('/:id/approve-reschedule', requireRole(['teacher', 'admin']), approveReschedule);
router.post('/:id/approve-cancel', requireRole(['teacher', 'admin']), approveCancel);
router.post('/', requireRole(['teacher', 'admin']), createLesson);
router.put('/:id', requireRole(['teacher', 'admin']), updateLesson);
router.delete('/:id', requireRole(['teacher', 'admin']), deleteLesson);

export default router;