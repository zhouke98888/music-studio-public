import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, Alert } from '@mui/material';
import { lessonsAPI } from '../services/api';
import { Lesson } from '../types';
import { format } from 'date-fns';

const LessonsPage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const data = await lessonsAPI.getLessons();
        setLessons(data);
      } catch (err) {
        setError('Failed to load lessons');
      }
    };
    fetchLessons();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'scheduled':
        return 'primary';
      case 'rescheduling':
        return 'warning';
      case 'cancelling':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Lessons
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <List>
        {lessons.map(lesson => (
          <ListItem key={lesson._id} divider>
            <ListItemText
              primary={lesson.title}
              secondary={format(new Date(lesson.scheduledDate), 'MMM d, yyyy h:mm a')}
            />
            <Chip label={lesson.status} color={getStatusColor(lesson.status) as any} size="small" />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default LessonsPage;
