import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  FormControl,
  InputLabel,
  Select,
  Grid,
  MenuItem,
  Link,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { RegisterData } from '../../types';

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student',
    // Student fields
    birthDate: '',
    grade: '',
    school: '',
    phone: '',
    motherName: '',
    motherPhone: '',
    fatherName: '',
    fatherPhone: '',
    // Teacher fields
    specializations: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = e.target.name as keyof RegisterData;
    const value = e.target.value;
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (e: SelectChangeEvent<"student" | "teacher">) => {
    const name = e.target.name as keyof RegisterData;
    const value = e.target.value;
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };  

  const handleDateChange = (date: Date | null) => {
    setBirthDate(date);
    setFormData({
      ...formData,
      birthDate: date ? date.toISOString().split('T')[0] : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container component="main" maxWidth="md">
        <Box
          sx={{
            marginTop: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
            <Typography component="h1" variant="h4" align="center" gutterBottom>
              Music Studio
            </Typography>
            <Typography component="h2" variant="h5" align="center" gutterBottom>
              Sign Up
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                {/* Basic Information */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    fullWidth
                    name="firstName"
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    fullWidth
                    name="lastName"
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    fullWidth
                    name="email"
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    fullWidth
                    name="username"
                    label="Username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role"
                      value={formData.role}
                      label="Role"
                      onChange={handleSelectChange}
                    >
                      <MenuItem value="student">Student</MenuItem>
                      <MenuItem value="teacher">Teacher</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Student-specific fields */}
                {formData.role === 'student' && (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DatePicker
                        label="Birth Date"
                        value={birthDate}
                        onChange={handleDateChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        required
                        fullWidth
                        name="grade"
                        label="Grade"
                        value={formData.grade}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        required
                        fullWidth
                        name="school"
                        label="School"
                        value={formData.school}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        required
                        fullWidth
                        name="phone"
                        label="Phone Number"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        name="motherName"
                        label="Mother's Name"
                        value={formData.motherName}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        name="motherPhone"
                        label="Mother's Phone"
                        value={formData.motherPhone}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        name="fatherName"
                        label="Father's Name"
                        value={formData.fatherName}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        name="fatherPhone"
                        label="Father's Phone"
                        value={formData.fatherPhone}
                        onChange={handleChange}
                      />
                    </Grid>
                  </>
                )}

                {/* Teacher-specific fields */}
                {formData.role === 'teacher' && (
                  <Grid size={{xs: 12}}>
                    <TextField
                      fullWidth
                      name="specializations"
                      label="Specializations (comma separated)"
                      placeholder="Piano, Guitar, Violin"
                      value={formData.specializations?.join(', ')}
                      onChange={(e) => {
                        const specs = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                        setFormData({ ...formData, specializations: specs });
                      }}
                    />
                  </Grid>
                )}
              </Grid>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>

              <Box textAlign="center">
                <Link component={RouterLink} to="/login" variant="body2">
                  Already have an account? Sign In
                </Link>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default Register;