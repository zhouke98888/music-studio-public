import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  TablePagination,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { studentsAPI } from '../services/api';
import { Student } from '../types';
import { useAuth } from '../contexts/AuthContext';

const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [graduatedFilter, setGraduatedFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    birthDate: null as Date | null,
    grade: '',
    school: '',
    phone: '',
    motherName: '',
    motherPhone: '',
    fatherName: '',
    fatherPhone: '',
    isGraduated: false
  });

  const grades = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'College'];

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, [searchTerm, gradeFilter, schoolFilter, graduatedFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (gradeFilter) params.grade = gradeFilter;
      if (schoolFilter) params.school = schoolFilter;
      if (graduatedFilter) params.isGraduated = graduatedFilter === 'true';
      
      params.isActive = true;
      const data = await studentsAPI.getStudents(params);
      setStudents(data);
    } catch (err) {
      setError('Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await studentsAPI.getStudentStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleOpenDialog = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        email: student.email,
        username: student.username,
        password: '',
        firstName: student.firstName,
        lastName: student.lastName,
        birthDate: new Date(student.birthDate),
        grade: student.grade,
        school: student.school,
        phone: student.phone,
        motherName: student.motherName || '',
        motherPhone: student.motherPhone || '',
        fatherName: student.fatherName || '',
        fatherPhone: student.fatherPhone || '',
        isGraduated: student.isGraduated
      });
    } else {
      setEditingStudent(null);
      setFormData({
        email: '',
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        birthDate: null,
        grade: '',
        school: '',
        phone: '',
        motherName: '',
        motherPhone: '',
        fatherName: '',
        fatherPhone: '',
        isGraduated: false
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStudent(null);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      const studentData = {
        ...formData,
        birthDate: formData.birthDate?.toISOString()
      };

      if (editingStudent) {
        await studentsAPI.updateStudent(editingStudent._id, studentData);
      } else {
        await studentsAPI.createStudent(studentData);
      }
      
      handleCloseDialog();
      fetchStudents();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save student');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentsAPI.deleteStudent(id);
        fetchStudents();
        fetchStats();
      } catch (err) {
        setError('Failed to delete student');
      }
    }
  };
  console.log('students value at render:', students);
  const filteredStudents = students?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)??[];

  if (loading && (students?.length?? 0) === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Students Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md:3}}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Students
                </Typography>
                <Typography variant="h4">
                  {stats.totalStudents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md:3}}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Students
                </Typography>
                <Typography variant="h4">
                  {stats.activeStudents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md:3}}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Graduated Students
                </Typography>
                <Typography variant="h4">
                  {stats.graduatedStudents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md:3}}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Schools
                </Typography>
                <Typography variant="h4">
                  {stats.schoolDistribution?.length || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <TextField
            label="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          
          <Box sx={{ ml: 'auto' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Student
            </Button>
          </Box>
        </Box>

        {showFilters && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Grade</InputLabel>
              <Select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                label="Grade"
              >
                <MenuItem value="">All Grades</MenuItem>
                {grades.map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    {grade}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="School"
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 150 }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={graduatedFilter}
                onChange={(e) => setGraduatedFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="false">Active</MenuItem>
                <MenuItem value="true">Graduated</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setGradeFilter('');
                setSchoolFilter('');
                setGraduatedFilter('');
              }}
            >
              Clear Filters
            </Button>
          </Box>
        )}
      </Paper>

      {/* Students Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell>School</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student._id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                    {student.firstName} {student.lastName}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    {student.email}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={student.grade}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    {student.school}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    {student.phone}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={student.isGraduated ? 'Graduated' : 'Active'}
                    size="small"
                    color={student.isGraduated ? 'default' : 'success'}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton
                      onClick={() => handleOpenDialog(student)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                    {(user?.role === 'admin' || user?.role === 'teacher') && (
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDelete(student._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={students?.length ?? 0}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Add/Edit Student Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </Grid>
              {!editingStudent && (
                <Grid size={{ xs: 12, sm: 6}}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6}}>
                <DatePicker
                  label="Birth Date"
                  value={formData.birthDate}
                  onChange={(date) => setFormData({ ...formData, birthDate: date })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6}}>
                <FormControl fullWidth required>
                  <InputLabel>Grade</InputLabel>
                  <Select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    label="Grade"
                  >
                    {grades.map((grade) => (
                      <MenuItem key={grade} value={grade}>
                        {grade}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="School"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Mother's Name"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Mother's Phone"
                  value={formData.motherPhone}
                  onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Father's Name"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Father's Phone"
                  value={formData.fatherPhone}
                  onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12}}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.isGraduated ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isGraduated: e.target.value === 'true' })}
                    label="Status"
                  >
                    <MenuItem value="false">Active</MenuItem>
                    <MenuItem value="true">Graduated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingStudent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentsPage;