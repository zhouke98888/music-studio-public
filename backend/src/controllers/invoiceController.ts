import { Request, Response } from 'express';
import { Invoice } from '../models/Invoice';
import { Lesson } from '../models/Lesson';
import { User } from '../models/User';

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { status, month, year, student } = req.query;
    const filter: any = {};
    
    if (status) filter.status = status;
    if (month) filter.month = parseInt(month as string);
    if (year) filter.year = parseInt(year as string);
    if (student) filter.student = student;
    
    // For students, only show their own invoices
    if ((req as any).user?.role === 'student') {
      filter.student = (req as any).user._id;
    }
    
    const invoices = await Invoice.find(filter)
      .populate('student', 'firstName lastName email')
      .populate('lessons', 'title scheduledDate duration')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices'
    });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = await Invoice.findById(id)
      .populate('student', 'firstName lastName email phone')
      .populate('lessons', 'title scheduledDate duration type status');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Students can only view their own invoices
    if ((req as any).user?.role === 'student' && invoice.student._id.toString() !== (req as any).user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own invoices'
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice'
    });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { student, month, year, lessons, totalAmount, dueDate } = req.body;
    
    // Check if invoice already exists for this student/month/year
    const existingInvoice = await Invoice.findOne({ student, month, year });
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this student and month'
      });
    }
    
    // Validate student exists
    const studentUser = await User.findById(student);
    if (!studentUser) {
      return res.status(400).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Validate lessons exist
    if (lessons && lessons.length > 0) {
      const lessonDocs = await Lesson.find({ _id: { $in: lessons } });
      if (lessonDocs.length !== lessons.length) {
        return res.status(400).json({
          success: false,
          message: 'Some lessons not found'
        });
      }
    }
    
    const invoice = new Invoice({
      student,
      month,
      year,
      lessons: lessons || [],
      totalAmount,
      dueDate: new Date(dueDate)
    });
    
    await invoice.save();
    
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('student', 'firstName lastName email')
      .populate('lessons', 'title scheduledDate duration');
    
    res.status(201).json({
      success: true,
      data: populatedInvoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice'
    });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { totalAmount, dueDate, status, paidAmount, paidDate } = req.body;
    
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Update fields
    if (totalAmount !== undefined) invoice.totalAmount = totalAmount;
    if (dueDate !== undefined) invoice.dueDate = new Date(dueDate);
    if (status !== undefined) invoice.status = status;
    if (paidAmount !== undefined) invoice.paidAmount = paidAmount;
    if (paidDate !== undefined) invoice.paidDate = new Date(paidDate);
    
    await invoice.save();
    
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('student', 'firstName lastName email')
      .populate('lessons', 'title scheduledDate duration');
    
    res.json({
      success: true,
      data: populatedInvoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice'
    });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    await Invoice.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice'
    });
  }
};

export const markAsPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paidAmount, paidDate } = req.body;
    
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    invoice.paidAmount = paidAmount || invoice.totalAmount;
    invoice.paidDate = paidDate ? new Date(paidDate) : new Date();
    invoice.status = 'paid';
    
    await invoice.save();
    
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('student', 'firstName lastName email')
      .populate('lessons', 'title scheduledDate duration');
    
    res.json({
      success: true,
      data: populatedInvoice
    });
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark invoice as paid'
    });
  }
};

export const generateMonthlyInvoices = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }
    
    // Find all completed lessons for the given month/year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const lessons = await Lesson.find({
      scheduledDate: { $gte: startDate, $lte: endDate },
      status: 'completed'
    }).populate('students', 'firstName lastName email');
    
    const invoices = [];
    const studentLessons: { [key: string]: any[] } = {};
    
    // Group lessons by student
    lessons.forEach(lesson => {
      lesson.students.forEach(student => {
        const studentId = student._id.toString();
        if (!studentLessons[studentId]) {
          studentLessons[studentId] = [];
        }
        studentLessons[studentId].push(lesson);
      });
    });
    
    // Create invoices for each student
    for (const studentId in studentLessons) {
      const existingInvoice = await Invoice.findOne({
        student: studentId,
        month,
        year
      });
      
      if (existingInvoice) {
        continue; // Skip if invoice already exists
      }
      
      const studentLessonList = studentLessons[studentId];
      const totalAmount = studentLessonList.length * 50; // $50 per lesson (you can adjust this)
      
      const invoice = new Invoice({
        student: studentId,
        month,
        year,
        lessons: studentLessonList.map(l => l._id),
        totalAmount,
        dueDate: new Date(year, month, 15) // Due on 15th of next month
      });
      
      await invoice.save();
      invoices.push(invoice);
    }
    
    res.json({
      success: true,
      data: invoices,
      message: `Generated ${invoices.length} invoices for ${month}/${year}`
    });
  } catch (error) {
    console.error('Error generating monthly invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly invoices'
    });
  }
};