import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markAsPaid,
  generateMonthlyInvoices
} from '../controllers/invoiceController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes for all authenticated users
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);

// Teacher/Admin only routes
router.post('/', requireRole(['teacher', 'admin']), createInvoice);
router.put('/:id', requireRole(['teacher', 'admin']), updateInvoice);
router.delete('/:id', requireRole(['teacher', 'admin']), deleteInvoice);
router.post('/:id/mark-paid', requireRole(['teacher', 'admin']), markAsPaid);
router.post('/generate-monthly', requireRole(['teacher', 'admin']), generateMonthlyInvoices);

export default router;