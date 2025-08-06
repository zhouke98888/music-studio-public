import { Response, Request } from 'express';
import { Teacher } from '../models/Teacher';
import { Student } from '../models/Student';
import { AuthRequest } from '../middleware/auth';

export const getTeachers = async (req: AuthRequest, res: Response) => {
  try {
    const teachers = await Teacher.find()
      .select('-password')
      .populate({ path: 'students', select: 'firstName lastName email', match: { isActive: true } });
    res.json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTeacherById = async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .select('-password')
      .populate({ path: 'students', select: 'firstName lastName email', match: { isActive: true } });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTeacherStudents = async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .select('_id')
      .populate({ path: 'students', select: 'firstName lastName email', match: { isActive: true } });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.json({
      success: true,
      data: teacher.students.filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await Teacher.find().select('firstName lastName email');
    res.json({ success: true, data: teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


