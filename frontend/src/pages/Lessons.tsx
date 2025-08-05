import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { lessonsAPI, teachersAPI } from '../services/api';
import { Lesson, Student } from '../types';

const Lessons: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'reschedule' | 'cancel' | 'approve-reschedule' | 'approve-cancel'>('confirm');
  const [actionData, setActionData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);

  // New lesson form data
  const [newLesson, setNewLesson] = useState({
    type: 'private' as 'private' | 'masterclass' | 'group',
    title: '',
    description: '',
    students: [] as string[],
    scheduledDate: new Date(),
    duration: 60,
    location: '',
    notes: '',
    recurringUntil: null as Date | null
  });

  useEffect(() => {
    loadLessons();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === '1') {
      setCreateDialogOpen(true);
    }
  }, [location.search]);

  useEffect(() => {
    const loadStudents = async () => {
      if (user?.role === 'teacher') {
        try {
          const data = await teachersAPI.getTeacherStudents(user._id);
          setAvailableStudents(data);
        } catch (err) {
          console.error('Failed to load students', err);
        }
      }
    };
    loadStudents();
  }, [user]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await lessonsAPI.getLessons();
      setLessons(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async () => {
    try {
      setSubmitting(true);
      await lessonsAPI.createLesson({
        ...newLesson,
        scheduledDate: newLesson.scheduledDate.toISOString(),
        recurringUntil: newLesson.recurringUntil?.toISOString(),
      });
      setCreateDialogOpen(false);
      setNewLesson({
        type: 'private',
        title: '',
        description: '',
        students: [] as string[],
        scheduledDate: new Date(),
        duration: 60,
        location: '',
        notes: '',
        recurringUntil: null
      });
      loadLessons();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create lesson');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLessonAction = async () => {
    if (!selectedLesson) return;

    try {
      setSubmitting(true);
      
      switch (actionType) {
        case 'confirm':
          await lessonsAPI.confirmAttendance(selectedLesson._id);
          break;
        case 'reschedule':
          await lessonsAPI.requestReschedule(selectedLesson._id, actionData);
          break;
        case 'cancel':
          await lessonsAPI.requestCancel(selectedLesson._id, actionData);
          break;
        case 'approve-reschedule':
          await lessonsAPI.approveReschedule(selectedLesson._id, actionData);
          break;
        case 'approve-cancel':
          await lessonsAPI.approveCancel(selectedLesson._id, actionData);
          break;
      }
      
      setActionDialogOpen(false);
      setActionData({});
      loadLessons();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to perform action');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'confirmed': return 'success';
      case 'rescheduling': return 'warning';
      case 'cancelling': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'primary';
      default: return 'default';
    }
  };

  const getFilteredLessons = () => {
    const now = new Date();
    switch (tabValue) {
      case 0: // All lessons
        return lessons;
      case 1: // Upcoming
        return lessons.filter(lesson => new Date(lesson.scheduledDate) > now);
      case 2: // Past
        return lessons.filter(lesson => new Date(lesson.scheduledDate) <= now);
      case 3: // Pending approval (for teachers)
        return lessons.filter(lesson => 
          lesson.status === 'rescheduling' || lesson.status === 'cancelling'
        );
      default:
        return lessons;
    }
  };

  const openActionDialog = (lesson: Lesson, type: any) => {
    setSelectedLesson(lesson);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const renderLessonCard = (lesson: Lesson) => (
    <Card key={lesson._id} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
          <Typography variant="h6" component="div">
            {lesson.title}
          </Typography>
          <Chip 
            label={lesson.status} 
            color={getStatusColor(lesson.status)}
            size="small"
          />
        </Box>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md:6}}>
            <Box display="flex" alignItems="center" mb={1}>
              <AccessTimeIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2">
                {format(new Date(lesson.scheduledDate), 'PPpp')}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2">
                Duration: {lesson.duration} minutes
              </Typography>
            </Box>
            {lesson.location && (
              <Box display="flex" alignItems="center" mb={1}>
                <LocationOnIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2">{lesson.location}</Typography>
              </Box>
            )}
          </Grid>
          
          <Grid size={{ xs: 12, md:6}}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Teacher:</strong> {lesson.teacher.firstName} {lesson.teacher.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Students:</strong> {lesson.students.map(s => `${s.firstName} ${s.lastName}`).join(', ')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Type:</strong> {lesson.type}
            </Typography>
          </Grid>
        </Grid>

        {lesson.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {lesson.description}
          </Typography>
        )}

        {lesson.notes && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Notes:</strong> {lesson.notes}
          </Alert>
        )}

        {(lesson.rescheduleReason || lesson.cancelReason) && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Reason:</strong> {lesson.rescheduleReason || lesson.cancelReason}
          </Alert>
        )}

        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {user?.role === 'student' && (
            <>
              {lesson.status === 'scheduled' && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => openActionDialog(lesson, 'confirm')}
                >
                  I am Here
                </Button>
              )}
              {lesson.status === 'scheduled' && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={() => openActionDialog(lesson, 'reschedule')}
                >
                  Request Reschedule
                </Button>
              )}
              {lesson.status === 'scheduled' && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => openActionDialog(lesson, 'cancel')}
                >
                  Request Cancel
                </Button>
              )}
            </>
          )}
          
          {user?.role === 'teacher' && (
            <>
              {lesson.status === 'rescheduling' && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => openActionDialog(lesson, 'approve-reschedule')}
                  >
                    Approve Reschedule
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => openActionDialog(lesson, 'approve-reschedule')}
                  >
                    Deny Reschedule
                  </Button>
                </>
              )}
              {lesson.status === 'cancelling' && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => openActionDialog(lesson, 'approve-cancel')}
                  >
                    Approve Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => openActionDialog(lesson, 'approve-cancel')}
                  >
                    Deny Cancel
                  </Button>
                </>
              )}
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            {user?.role === 'student' ? 'My Lessons' : 'Lessons'}
          </Typography>
          {user?.role === 'teacher' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Lesson
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Lessons" />
            <Tab label="Upcoming" />
            <Tab label="Past" />
            {user?.role === 'teacher' && <Tab label="Pending Approval" />}
          </Tabs>
        </Paper>

        <Box>
          {getFilteredLessons().length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No lessons found
              </Typography>
            </Paper>
          ) : (
            getFilteredLessons().map(renderLessonCard)
          )}
        </Box>

        {/* Create Lesson Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Lesson</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  label="Title"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12}}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newLesson.type}
                    onChange={(e) => setNewLesson({ ...newLesson, type: e.target.value as any })}
                  >
                    <MenuItem value="private">Private</MenuItem>
                    <MenuItem value="group">Group</MenuItem>
                    <MenuItem value="masterclass">Masterclass</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12}}>
              <DateTimePicker
                label="Scheduled Date & Time"
                value={newLesson.scheduledDate}
                onChange={(date) => setNewLesson({ ...newLesson, scheduledDate: date || new Date() })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12}}>
              <DatePicker
                label="Repeat Weekly Until"
                value={newLesson.recurringUntil}
                onChange={(date) => setNewLesson({ ...newLesson, recurringUntil: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
              {user?.role === 'teacher' && (
                <Grid size={{ xs: 12}}>
                  <FormControl fullWidth>
                    <InputLabel>Students</InputLabel>
                    <Select
                      multiple
                      label="Students"
                      value={newLesson.students}
                      onChange={(e) => setNewLesson({ ...newLesson, students: e.target.value as string[] })}
                      renderValue={(selected) => (selected as string[]).map(id => {
                        const s = availableStudents.find(stu => stu._id === id);
                        return s ? `${s.firstName} ${s.lastName}` : id;
                      }).join(', ')}
                    >
                      {availableStudents.map(stu => (
                        <MenuItem key={stu._id} value={stu._id}>
                          {stu.firstName} {stu.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (minutes)"
                  value={newLesson.duration}
                  onChange={(e) => setNewLesson({ ...newLesson, duration: parseInt(e.target.value) || 60 })}
                />
              </Grid>
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  label="Location"
                  value={newLesson.location}
                  onChange={(e) => setNewLesson({ ...newLesson, location: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={newLesson.description}
                  onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={newLesson.notes}
                  onChange={(e) => setNewLesson({ ...newLesson, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateLesson}
              variant="contained"
              disabled={submitting || !newLesson.title || newLesson.students.length === 0}
            >
              {submitting ? <CircularProgress size={20} /> : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {actionType === 'confirm' && 'I am Here'}
            {actionType === 'reschedule' && 'Request Reschedule'}
            {actionType === 'cancel' && 'Request Cancellation'}
            {actionType === 'approve-reschedule' && 'Approve Reschedule'}
            {actionType === 'approve-cancel' && 'Approve Cancellation'}
          </DialogTitle>
          <DialogContent>
            {(actionType === 'reschedule' || actionType === 'cancel') && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason"
                value={actionData.reason || ''}
                onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                sx={{ mt: 2 }}
              />
            )}
            {actionType === 'reschedule' && (
              <DateTimePicker
                label="New Date & Time (optional)"
                value={actionData.newDate || null}
                onChange={(date) => setActionData({ ...actionData, newDate: date })}
                slotProps={{ textField: { fullWidth: true, sx: { mt: 2 } } }}
              />
            )}
            {actionType === 'approve-reschedule' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Do you want to approve this reschedule request?
                </Typography>
                <DateTimePicker
                  label="New Date & Time (optional)"
                  value={actionData.newDate || null}
                  onChange={(date) => setActionData({ ...actionData, newDate: date })}
                  slotProps={{ textField: { fullWidth: true, sx: { mt: 2 } } }}
                />
              </Box>
            )}
            {actionType === 'approve-cancel' && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Do you want to approve this cancellation request?
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleLessonAction} 
              variant="contained" 
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={20} /> : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Lessons;