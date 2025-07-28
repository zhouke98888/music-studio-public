import { Response } from 'express';
import { Invoice } from '../models/Invoice';
import { AuthRequest } from '../middleware/auth';

export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const query: any = {};
    if (user.role === 'student') {
      query.student = user._id;
    }
    const invoices = await Invoice.find(query)
      .populate('student', 'firstName lastName email')
      .sort({ year: -1, month: -1 });
    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ success: false, message: 'Server error getting invoices' });
  }
};

export const getInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id).populate('student', 'firstName lastName email');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    // Students can only access their own invoices
    if (req.user.role === 'student' && invoice.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ success: false, message: 'Server error getting invoice' });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { student, month, year, lessons, totalAmount, paidAmount, status, dueDate, paidDate } = req.body;
    const invoice = new Invoice({ student, month, year, lessons, totalAmount, paidAmount, status, dueDate, paidDate });
    await invoice.save();
    const populated = await invoice.populate('student', 'firstName lastName email');
    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Invoice for this month already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Server error creating invoice' });
    }
  }
};

export const updateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const invoice = await Invoice.findByIdAndUpdate(id, updates, { new: true }).populate('student', 'firstName lastName email');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ success: false, message: 'Server error updating invoice' });
  }
};

export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting invoice' });
  }
};
