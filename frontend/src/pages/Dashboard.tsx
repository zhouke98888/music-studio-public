import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
} from '@mui/material';
import {
  School as SchoolIcon,
  MusicNote as MusicNoteIcon,
  Receipt as ReceiptIcon,
  EventAvailable as EventAvailableIcon,
} from '@mui/icons-material';
//import { useAuth } from '../../contexts/AuthContext';
//import { lessonsAPI, instrumentsAPI } from '../../services/api';
//import { Lesson, Instrument } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { lessonsAPI, instrumentsAPI } from '../services/api';
import { Lesson, Instrument } from '../types';
import { format, isToday, isTomorrow } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [myInstruments, setMyInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch upcoming lessons
        const lessons = await lessonsAPI.getLessons({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next 7 days
        });
        setUpcomingLessons(lessons.slice(0, 5)); // Show only next 5 lessons

        // If student, fetch checked out instruments
        if (user?.role === 'student') {
          const instruments = await instrumentsAPI.getMyInstruments();
          setMyInstruments(instruments);
        }
      } catch (err: any) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatLessonDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  if (loading) {
    return <Typography>Loading dashboard...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.firstName}!
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Quick Stats */}
        <Grid size={{ xs: 12, sm: 6, md:3}}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SchoolIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Upcoming Lessons
                  </Typography>
                  <Typography variant="h4">
                    {upcomingLessons.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {user?.role === 'student' && (
          <Grid size={{ xs: 12, sm: 6, md:3}}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <MusicNoteIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Checked Out Instruments
                    </Typography>
                    <Typography variant="h4">
                      {myInstruments.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 6, md:3}}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ReceiptIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Invoices
                  </Typography>
                  <Typography variant="h4">
                    0
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md:3}}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <EventAvailableIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    This Month's Lessons
                  </Typography>
                  <Typography variant="h4">
                    0
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Lessons */}
        <Grid size={{ xs: 12, md:8}}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Lessons
              </Typography>
              {upcomingLessons.length === 0 ? (
                <Typography color="textSecondary">
                  No upcoming lessons scheduled.
                </Typography>
              ) : (
                <List>
                  {upcomingLessons.map((lesson) => (
                    <ListItem key={lesson._id} divider>
                      <ListItemText
                        primary={lesson.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {formatLessonDate(lesson.scheduledDate)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {user?.role === 'student' 
                                ? `Teacher: ${lesson.teacher.firstName} ${lesson.teacher.lastName}`
                                : `Students: ${lesson.students.map(s => `${s.firstName} ${s.lastName}`).join(', ')}`
                              }
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        label={lesson.status}
                        color={getStatusColor(lesson.status) as any}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              <Box mt={2}>
                <Button variant="outlined" href="/lessons">
                  View All Lessons
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions / My Instruments */}
        <Grid size={{ xs: 12, md:4}}>
          {user?.role === 'student' ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  My Instruments
                </Typography>
                {myInstruments.length === 0 ? (
                  <Typography color="textSecondary">
                    No instruments checked out.
                  </Typography>
                ) : (
                  <List>
                    {myInstruments.map((instrument) => (
                      <ListItem key={instrument._id} divider>
                        <ListItemText
                          primary={`${instrument.brand} ${instrument.instrumentModel}`}
                          secondary={`Checked out: ${format(new Date(instrument.checkOutDate!), 'MMM d, yyyy')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
                <Box mt={2}>
                  <Button variant="outlined" href="/instruments">
                    Browse Instruments
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button variant="contained" href="/lessons/new">
                    Schedule New Lesson
                  </Button>
                  <Button variant="outlined" href="/students">
                    Manage Students
                  </Button>
                  <Button variant="outlined" href="/invoices">
                    View Invoices
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
