import { Request, Response } from 'express';
import { User } from '../models/User';
import { Teacher } from '../models/Teacher';
import { Student, IStudent } from '../models/Student';
import { AuthRequest } from '../middleware/auth';

// Get all students
export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { search, grade, school, isGraduated } = req.query;
    
    // Build query
    const query: any = { role: 'student' };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (grade) {
      query.grade = grade;
    }
    
    if (school) {
      query.school = { $regex: school, $options: 'i' };
    }
    
    if (isGraduated !== undefined) {
      query.isGraduated = isGraduated === 'true';
    }
    
    const students = await Student.find(query)
      .select('-password')
      .populate('teacher', 'firstName lastName email')
      .sort({ firstName: 1, lastName: 1 });
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student by ID
export const getStudentById = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findById(req.params.id)
      .select('-password')
      .populate('teacher', 'firstName lastName email');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new student
export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      email,
      username,
      password,
      firstName,
      lastName,
      birthDate,
      grade,
      school,
      phone,
      motherName,
      motherPhone,
      fatherName,
      fatherPhone,
      teacher: teacherId
    } = req.body;

    let assignedTeacherId = teacherId;
    if (req.user?.role === 'teacher') {
      assignedTeacherId = req.user._id;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Create new student
    const student = new Student({
      email,
      username,
      password,
      firstName,
      lastName,
      role: 'student',
      birthDate,
      grade,
      school,
      phone,
      motherName,
      motherPhone,
      fatherName,
      fatherPhone,
      isGraduated: false,
      teacher: assignedTeacherId
    });

    await student.save();

    if (assignedTeacherId) {
      await Teacher.findByIdAndUpdate(assignedTeacherId, { $addToSet: { students: student._id } });
    }

    // Return student without password
    const studentResponse = await Student.findById(student._id)
      .select('-password')
      .populate('teacher', 'firstName lastName email');
      
    res.status(201).json(studentResponse);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update student
export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      username,
      birthDate,
      grade,
      school,
      phone,
      motherName,
      motherPhone,
      fatherName,
      fatherPhone,
      isGraduated
    } = req.body;

    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if email or username is being changed and already exists
    if (email && email !== student.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    if (username && username !== student.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already in use' });
      }
    }

    // Update student fields
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        email,
        username,
        birthDate,
        grade,
        school,
        phone,
        motherName,
        motherPhone,
        fatherName,
        fatherPhone,
        isGraduated
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete student
export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId } = req.body;
    const studentId = req.params.id;

    const student = await Student.findById(studentId);
    const teacher = await Teacher.findById(teacherId);

    if (!student || !teacher) {
      return res.status(404).json({ message: 'Student or teacher not found' });
    }

    if (student.teacher && student.teacher.toString() !== teacherId) {
      await Teacher.findByIdAndUpdate(student.teacher, {
        $pull: { students: student._id }
      });
    }

    student.teacher = teacher._id;
    await student.save();

    if (!teacher.students.some(id => id.toString() === student._id.toString())) {
      teacher.students.push(student._id);
      await teacher.save();
    }

    const populated = await Student.findById(student._id)
      .select('-password')
      .populate('teacher', 'firstName lastName email');

    res.json(populated);
  } catch (error) {
    console.error('Error assigning teacher:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student stats
export const getStudentStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalStudents = await Student.countDocuments({ role: 'student' });
    const graduatedStudents = await Student.countDocuments({ 
      role: 'student', 
      isGraduated: true 
    });
    const activeStudents = totalStudents - graduatedStudents;

    // Get grade distribution
    const gradeDistribution = await Student.aggregate([
      { $match: { role: 'student', isGraduated: false } },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get school distribution
    const schoolDistribution = await Student.aggregate([
      { $match: { role: 'student', isGraduated: false } },
      {
        $group: {
          _id: '$school',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalStudents,
      activeStudents,
      graduatedStudents,
      gradeDistribution,
      schoolDistribution
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
