import { Response } from 'express';
import { Student } from '../models/Student';
import { AuthRequest } from '../middleware/auth';

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const students = await Student.find().sort({ lastName: 1, firstName: 1 });
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'Server error getting students' });
  }
};

export const getStudentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ success: false, message: 'Server error getting student' });
  }
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json({ success: true, data: student });
  } catch (error: any) {
    console.error('Create student error:', error);
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Student with this email or username already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Server error creating student' });
    }
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const student = await Student.findByIdAndUpdate(id, updates, { new: true });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: 'Server error updating student' });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, message: 'Student deleted' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting student' });
  }
};
