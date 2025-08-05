import { Request, Response } from 'express';
import { Invoice } from '../models/Invoice';
import { Lesson } from '../models/Lesson';
import { User } from '../models/User';

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { status, month, year, student, teacher } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (month) filter.month = parseInt(month as string);
    if (year) filter.year = parseInt(year as string);
    if (student) filter.student = student;
    if (teacher) filter.teacher = teacher;

    // Restrict invoices based on user role
    if ((req as any).user?.role === 'student') {
      filter.student = (req as any).user._id;
    } else if ((req as any).user?.role === 'teacher') {
      filter.teacher = (req as any).user._id;
    }

    const invoices = await Invoice.find(filter)
      .populate('student', 'firstName lastName email')
      .populate('teacher', 'firstName lastName email')
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
      .populate('teacher', 'firstName lastName email')
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
    // Teachers can only view their own invoices
    if ((req as any).user?.role === 'teacher' && invoice.teacher._id.toString() !== (req as any).user._id.toString()) {
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
    const { student, teacher, month, year, lessons, totalAmount, dueDate } = req.body;

    // Check if invoice already exists for this student/teacher/month/year
    const existingInvoice = await Invoice.findOne({ student, teacher, month, year });
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

    // Validate teacher exists
    const teacherUser = await User.findById(teacher);
    if (!teacherUser || teacherUser.role !== 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'Teacher not found'
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
      teacher,
      month,
      year,
      lessons: lessons || [],
      totalAmount,
      dueDate: new Date(dueDate)
    });

    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('student', 'firstName lastName email')
      .populate('teacher', 'firstName lastName email')
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
      .populate('teacher', 'firstName lastName email')
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
      .populate('teacher', 'firstName lastName email')
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

    // Find all scheduled or confirmed lessons for the given month/year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const lessons = await Lesson.find({
      scheduledDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['scheduled', 'confirmed'] }
    })
      .populate('students', 'firstName lastName email')
      .populate('teacher', 'lessonRate');

    const invoices = [];
    const lessonMap: { [key: string]: any[] } = {};

    // Group lessons by student and teacher
    lessons.forEach(lesson => {
      const teacherId = (lesson.teacher as any)._id.toString();
      lesson.students.forEach(student => {
        const studentId = student._id.toString();
        const key = `${studentId}_${teacherId}`;
        if (!lessonMap[key]) {
          lessonMap[key] = [];
        }
        lessonMap[key].push(lesson);
      });
    });

    // Create or update invoices for each student/teacher pair
    for (const key in lessonMap) {
      const [studentId, teacherId] = key.split('_');
      const studentLessonList = lessonMap[key];
      const rate = (studentLessonList[0].teacher as any).lessonRate || 0;
      const totalAmount = studentLessonList.length * rate;

      let invoice = await Invoice.findOne({
        student: studentId,
        teacher: teacherId,
        month,
        year
      });

      if (invoice) {
        invoice.lessons = studentLessonList.map(l => l._id);
        invoice.totalAmount = totalAmount;
        invoice.dueDate = new Date(year, month, 15);
        await invoice.save();
      } else {
        invoice = new Invoice({
          student: studentId,
          teacher: teacherId,
          month,
          year,
          lessons: studentLessonList.map(l => l._id),
          totalAmount,
          dueDate: new Date(year, month, 15) // Due on 15th of next month
        });
        await invoice.save();
      }

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