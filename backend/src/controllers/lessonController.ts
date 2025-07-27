import { Response } from 'express';
import { Lesson } from '../models/Lesson';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export const getLessons = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, status } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Build query based on user role
    let query: any = {};
    
    if (userRole === 'student') {
      query.students = userId;
    } else if (userRole === 'teacher') {
      query.teacher = userId;
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      query.scheduledDate = {
        $gte: startOfDay(parseISO(startDate as string)),
        $lte: endOfDay(parseISO(endDate as string))
      };
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const lessons = await Lesson.find(query)
      .populate('teacher', 'firstName lastName email')
      .populate('students', 'firstName lastName email')
      .sort({ scheduledDate: 1 });

    res.json({
      success: true,
      data: lessons
    });
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting lessons'
    });
  }
};

export const getLessonById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const lesson = await Lesson.findById(id)
      .populate('teacher', 'firstName lastName email')
      .populate('students', 'firstName lastName email');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user has access to this lesson
    const hasAccess = userRole === 'admin' ||
      (userRole === 'teacher' && lesson.teacher._id.toString() === userId.toString()) ||
      (userRole === 'student' && lesson.students.some((student: any) => student._id.toString() === userId.toString()));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting lesson'
    });
  }
};

export const confirmAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is a student in this lesson
    const isStudent = lesson.students.some(studentId => studentId.toString() === userId.toString());
    
    if (!isStudent) {
      return res.status(403).json({
        success: false,
        message: 'Only enrolled students can confirm attendance'
      });
    }

    // Update lesson status
    lesson.attendanceConfirmed = true;
    lesson.status = 'confirmed';
    await lesson.save();

    res.json({
      success: true,
      data: lesson,
      message: 'Attendance confirmed successfully'
    });
  } catch (error) {
    console.error('Confirm attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error confirming attendance'
    });
  }
};

export const requestReschedule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, newDate } = req.body;
    const userId = req.user._id;

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is a student in this lesson
    const isStudent = lesson.students.some(studentId => studentId.toString() === userId.toString());
    
    if (!isStudent) {
      return res.status(403).json({
        success: false,
        message: 'Only enrolled students can request reschedule'
      });
    }

    // Update lesson
    lesson.status = 'rescheduling';
    lesson.rescheduleReason = reason;
    
    // If new date is provided, update it (pending teacher approval)
    if (newDate) {
      lesson.scheduledDate = new Date(newDate);
    }

    await lesson.save();

    res.json({
      success: true,
      data: lesson,
      message: 'Reschedule request submitted successfully'
    });
  } catch (error) {
    console.error('Request reschedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error requesting reschedule'
    });
  }
};

export const requestCancel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is a student in this lesson
    const isStudent = lesson.students.some(studentId => studentId.toString() === userId.toString());
    
    if (!isStudent) {
      return res.status(403).json({
        success: false,
        message: 'Only enrolled students can request cancellation'
      });
    }

    // Update lesson
    lesson.status = 'cancelling';
    lesson.cancelReason = reason;
    await lesson.save();

    res.json({
      success: true,
      data: lesson,
      message: 'Cancellation request submitted successfully'
    });
  } catch (error) {
    console.error('Request cancel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error requesting cancellation'
    });
  }
};

// Teacher-only endpoints
export const approveReschedule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approved, newDate } = req.body;
    const userId = req.user._id;

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is the teacher for this lesson
    if (lesson.teacher.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned teacher can approve reschedule'
      });
    }

    if (approved) {
      lesson.status = 'scheduled';
      if (newDate) {
        lesson.scheduledDate = new Date(newDate);
      }
    } else {
      lesson.status = 'scheduled'; // Revert to original status
    }

    await lesson.save();

    res.json({
      success: true,
      data: lesson,
      message: approved ? 'Reschedule approved' : 'Reschedule denied'
    });
  } catch (error) {
    console.error('Approve reschedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error approving reschedule'
    });
  }
};

export const approveCancel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    const userId = req.user._id;

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is the teacher for this lesson
    if (lesson.teacher.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned teacher can approve cancellation'
      });
    }

    lesson.status = approved ? 'cancelled' : 'scheduled';
    await lesson.save();

    res.json({
      success: true,
      data: lesson,
      message: approved ? 'Cancellation approved' : 'Cancellation denied'
    });
  } catch (error) {
    console.error('Approve cancel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error approving cancellation'
    });
  }
};

export const createLesson = async (req: AuthRequest, res: Response) => {
  try {
    const {
      type,
      title,
      description,
      students,
      scheduledDate,
      duration,
      location,
      notes
    } = req.body;

    const teacherId = req.user._id;

    const lesson = new Lesson({
      type,
      title,
      description,
      teacher: teacherId,
      students,
      scheduledDate: new Date(scheduledDate),
      duration,
      location,
      notes
    });

    await lesson.save();

    const populatedLesson = await lesson.populate([
      { path: 'teacher', select: 'firstName lastName email' },
      { path: 'students', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      success: true,
      data: populatedLesson,
      message: 'Lesson created successfully'
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating lesson'
    });
  }
};