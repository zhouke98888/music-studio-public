import express from 'express';
import {
  getInstruments,
  getInstrumentById,
  checkOutInstrument,
  checkInInstrument,
  getMyInstruments,
  createInstrument,
  updateInstrument,
  deleteInstrument
} from '../controllers/instrumentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes for all authenticated users
router.get('/', getInstruments);
router.get('/my-instruments', getMyInstruments);
router.get('/:id', getInstrumentById);
router.post('/:id/checkout', checkOutInstrument);
router.post('/:id/checkin', checkInInstrument);

// Teacher/Admin only routes
router.post('/', requireRole(['teacher', 'admin']), createInstrument);
router.put('/:id', requireRole(['teacher', 'admin']), updateInstrument);
router.delete('/:id', requireRole(['teacher', 'admin']), deleteInstrument);

export default router;