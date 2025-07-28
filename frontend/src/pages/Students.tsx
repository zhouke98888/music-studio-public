import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Alert } from '@mui/material';
import { studentsAPI } from '../services/api';
import { Student } from '../types';

const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await studentsAPI.getStudents();
        setStudents(data);
      } catch (err) {
        setError('Failed to load students');
      }
    };
    fetchStudents();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Students
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <List>
        {students.map(student => (
          <ListItem key={student._id} divider>
            <ListItemText primary={`${student.firstName} ${student.lastName}`} secondary={student.email} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default StudentsPage;
