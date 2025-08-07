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
  PendingActions as PendingActionsIcon,
} from '@mui/icons-material';
//import { useAuth } from '../../contexts/AuthContext';
//import { lessonsAPI, instrumentsAPI } from '../../services/api';
//import { Lesson, Instrument } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { lessonsAPI, instrumentsAPI } from '../services/api';
import { Lesson, Instrument } from '../types';
import { Link } from 'react-router-dom';
import { format, isToday, isTomorrow } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [myInstruments, setMyInstruments] = useState<Instrument[]>([]);
  const [pendingLessons, setPendingLessons] = useState<Lesson[]>([]);
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
        const filteredLessons = user?.role === 'student'
          ? lessons.filter(l =>
              l.students.some(s => (typeof s === 'string' ? s : s._id) === user._id)
            )
          : lessons;
        setUpcomingLessons(filteredLessons.slice(0, 5)); // Show only next 5 lessons

        if (user?.role === 'student') {
          // Fetch checked out instruments for students
          const instruments = await instrumentsAPI.getMyInstruments();
          setMyInstruments(instruments);
        } else if (user?.role === 'teacher') {
          // Fetch lessons needing teacher approval
          const pending = await lessonsAPI.getLessons({
            status: 'cancelling,rescheduling',
            startDate: new Date().toISOString().split('T')[0],
          });
          setPendingLessons(pending);
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
        return 'error';
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

  const handlePendingAction = async (lesson: Lesson, approved: boolean) => {
    try {
      let updated: Lesson | undefined;
      if (approved) {
        if (lesson.status === 'rescheduling') {
          updated = await lessonsAPI.approveReschedule(lesson._id, {
            approved: true,
            newDate: new Date(lesson.scheduledDate).toISOString(),
            newDuration: lesson.duration,
          });
        } else if (lesson.status === 'cancelling') {
          updated = await lessonsAPI.approveCancel(lesson._id, { approved: true });
        }
      } else {
        if (!window.confirm('Cancel this lesson?')) return;
        updated = await lessonsAPI.approveCancel(lesson._id, { approved: true });
      }
      setPendingLessons(prev => prev.filter(l => l._id !== lesson._id));
      if (updated) {
        setUpcomingLessons(prev => {
          const mapped = prev.map(l => (l._id === updated!._id ? updated! : l));
          return mapped
            .filter(l => l.status !== 'cancelled')
            .sort(
              (a, b) =>
                new Date(a.scheduledDate).getTime() -
                new Date(b.scheduledDate).getTime()
            );
        });
      }
    } catch (err) {
      console.error('Pending action error:', err);
      setError('Failed to update lesson');
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

        {user?.role === 'teacher' && (
          <Grid size={{ xs: 12, sm: 6, md:3}}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PendingActionsIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Pending Actions
                    </Typography>
                    <Typography variant="h4">
                      {pendingLessons.length}
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

        {/* Upcoming Lessons / Pending Actions */}
        <Grid size={{ xs: 12, md:8}}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {user?.role === 'teacher'
                  ? 'Upcoming Lessons and Pending Actions'
                  : 'Upcoming Lessons'}
              </Typography>
            {user?.role === 'teacher' ? (
              (() => {
                const extraPending = pendingLessons.filter(
                  p => !upcomingLessons.some(u => u._id === p._id)
                );
                const combined = [...upcomingLessons, ...extraPending];
                if (combined.length === 0) {
                  return (
                    <Typography color="textSecondary">
                      No upcoming lessons or pending actions.
                    </Typography>
                  );
                }
                return (
                  <List>
                    {combined.map((lesson) => (
                      <ListItem key={lesson._id} divider>
                        <ListItemText
                          primary={lesson.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {formatLessonDate(lesson.scheduledDate)}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Students: {lesson.students.map(s => `${s.firstName} ${s.lastName}`).join(', ')}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box display="flex" flexDirection="column" alignItems="flex-end">
                          <Chip
                            label={lesson.status}
                            color={getStatusColor(lesson.status) as any}
                            size="small"
                          />
                          {(lesson.status === 'rescheduling' || lesson.status === 'cancelling') && (
                            <Box mt={1} display="flex" gap={1}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handlePendingAction(lesson, true)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={() => handlePendingAction(lesson, false)}
                              >
                                Deny
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                );
              })()
            ) : (
              upcomingLessons.length === 0 ? (
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
              )
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
                          primary={`${instrument.brand}${instrument.instrumentModel ? ` ${instrument.instrumentModel}` : ''}`}
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
                  <Button
                    variant="contained"
                    component={Link}
                    to="/lessons?new=1"
                  >
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
