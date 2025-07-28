import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
} from '../controllers/invoiceController';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/', requireRole(['teacher', 'admin']), createInvoice);
router.put('/:id', requireRole(['teacher', 'admin']), updateInvoice);
router.delete('/:id', requireRole(['teacher', 'admin']), deleteInvoice);

export default router;
