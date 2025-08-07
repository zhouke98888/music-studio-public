import React, { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Schedule as ScheduleIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Calendar,
  dateFnsLocalizer,
  Event,
} from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './Calendar.css';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { View } from 'react-big-calendar';
import { enUS } from 'date-fns/locale';
import { lessonsAPI, teachersAPI } from '../services/api';
import { Lesson, Student } from '../types';
import { useAuth } from '../contexts/AuthContext';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop<LessonEvent, object>(Calendar);

interface LessonEvent extends Event {
  resource: Lesson;
}

const CustomToolbar: React.FC<any> = ({ label, onNavigate, onView, view }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
    <Box>
      <Button size="small" onClick={() => onNavigate('TODAY')}>Today</Button>
      <Button size="small" onClick={() => onNavigate('PREV')}>Prev</Button>
      <Button size="small" onClick={() => onNavigate('NEXT')}>Next</Button>
    </Box>
    <Typography variant="h6" component="span">{label}</Typography>
    <ButtonGroup size="small">
      {['month', 'week', 'day', 'agenda'].map(v => (
        <Button key={v} variant={view === v ? 'contained' : 'outlined'} onClick={() => onView(v)}>
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </Button>
      ))}
    </ButtonGroup>
  </Box>
);

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [events, setEvents] = useState<LessonEvent[]>([]);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editData, setEditData] = useState({
    title: '',
    scheduledDate: new Date(),
    duration: 60,
    students: [] as string[],
  });
  const initialNewLesson = {
    type: 'private' as 'private' | 'masterclass' | 'group',
    title: '',
    description: '',
    scheduledDate: new Date(),
    duration: 60,
    location: '',
    notes: '',
    students: [] as string[],
    recurringUntil: null as Date | null,
  };
  const [newLesson, setNewLesson] = useState(initialNewLesson);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pendingSlot, setPendingSlot] = useState<{ start: Date; end: Date } | null>(null);

  const canModify = (lesson: Lesson) => {
    if (user?.role === 'teacher') return true;
    if (user?.role === 'student') {
      return lesson.students.some((s: any) => (
        typeof s === 'string' ? s : s._id
      ) === user._id);
    }
    return false;
  };

  const loadLessons = async (start?: Date, end?: Date) => {
    const params: any = {};
    if (start && end) {
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
    }
    const data = await lessonsAPI.getLessons(params);
    setLessons(data);
  };

  useEffect(() => {
    if (range) {
      loadLessons(range.start, range.end);
    } else {
      loadLessons();
    }
  }, [range]);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setRange({ start: startOfMonth(now), end: endOfMonth(now) });
  }, []);

  useEffect(() => {
    if (user?.role === 'teacher') {
      teachersAPI.getTeacherStudents(user._id).then(setAvailableStudents).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const evts = lessons.map(l => ({
      id: l._id,
      title: l.title,
      start: new Date(l.scheduledDate),
      end: new Date(new Date(l.scheduledDate).getTime() + l.duration * 60000),
      resource: l,
    }));
    setEvents(evts);
  }, [lessons]);

  const handleEventDrop = async ({ event, start, end }: any) => {
    if (!canModify(event.resource)) {
      loadLessons(range?.start, range?.end);
      return;
    }
    if (user?.role === 'teacher') {
      try {
        await lessonsAPI.updateLesson(event.resource._id, {
          scheduledDate: start.toISOString(),
          duration: (end.getTime() - start.getTime()) / 60000,
        });
        loadLessons(range?.start, range?.end);
      } catch (e) {
        console.error(e);
      }
    } else {
      setSelectedLesson(event.resource);
      setPendingSlot({ start, end });
      setReason('');
      setRescheduleDialogOpen(true);
      loadLessons(range?.start, range?.end);
    }
  };

  const handleRangeChange = (r: any) => {
    if (Array.isArray(r)) {
      setRange({ start: r[0], end: r[r.length - 1] });
    } else if (r.start && r.end) {
      setRange({ start: r.start, end: r.end });
    }
  };

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  const handleViewChange = (v: View) => {
    setView(v);
  };

  const handleSelectSlot = (slot: any) => {
    if (user?.role !== 'teacher') return;
    setSelectedSlot(slot);
    setNewLesson({ ...initialNewLesson, scheduledDate: slot.start });
    setCreateDialog(true);
  };

  const handleCreateLesson = async () => {
    try {
      await lessonsAPI.createLesson({
        ...newLesson,
        scheduledDate: newLesson.scheduledDate.toISOString(),
        recurringUntil: newLesson.recurringUntil?.toISOString(),
      });
      setCreateDialog(false);
      setNewLesson({ ...initialNewLesson });
      await loadLessons(range?.start, range?.end);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson) return;
    try {
      await lessonsAPI.updateLesson(editingLesson._id, {
        ...editData,
        scheduledDate: editData.scheduledDate.toISOString(),
      });
      setEditDialog(false);
      setEditingLesson(null);
      loadLessons(range?.start, range?.end);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelLesson = async () => {
    if (!editingLesson) return;
    if (!window.confirm('Cancel this lesson?')) return;
    try {
      await lessonsAPI.updateLesson(editingLesson._id, { status: 'cancelled' });
      setEditDialog(false);
      setEditingLesson(null);
      loadLessons(range?.start, range?.end);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveRequest = async (approved: boolean) => {
    if (!editingLesson) return;
    try {
      if (approved) {
        if (editingLesson.status === 'rescheduling') {
          await lessonsAPI.approveReschedule(editingLesson._id, { approved: true });
        } else if (editingLesson.status === 'cancelling') {
          await lessonsAPI.approveCancel(editingLesson._id, { approved: true });
        }
      } else {
        if (!window.confirm('Cancel this lesson?')) return;
        await lessonsAPI.approveCancel(editingLesson._id, { approved: true });
      }
      setReviewDialogOpen(false);
      setEditingLesson(null);
      loadLessons(range?.start, range?.end);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectEvent = (event: LessonEvent) => {
    const l = event.resource;
    if (user?.role === 'teacher') {
      setEditingLesson(l);
      if (l.status === 'rescheduling' || l.status === 'cancelling') {
        setReviewDialogOpen(true);
      } else {
        setEditData({
          title: l.title,
          scheduledDate: new Date(l.scheduledDate),
          duration: l.duration,
          students: l.students.map((s: any) => (typeof s === 'string' ? s : s._id)),
        });
        setEditDialog(true);
      }
    } else {
      setSelectedLesson(l);
      setLessonDialogOpen(true);
    }
  };

  const handleConfirmAttendance = async () => {
    if (!selectedLesson || !canModify(selectedLesson)) return;
    try {
      await lessonsAPI.confirmAttendance(selectedLesson._id);
      setLessonDialogOpen(false);
      setSelectedLesson(null);
      loadLessons(range?.start, range?.end);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitCancel = async () => {
    if (!selectedLesson || !canModify(selectedLesson)) return;
    try {
      await lessonsAPI.requestCancel(selectedLesson._id, { reason });
      setCancelDialogOpen(false);
      setSelectedLesson(null);
      setReason('');
      loadLessons(range?.start, range?.end);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitReschedule = async () => {
    if (!selectedLesson || !pendingSlot || !canModify(selectedLesson)) return;
    try {
      await lessonsAPI.requestReschedule(selectedLesson._id, {
        reason,
        newDate: pendingSlot.start.toISOString(),
      });
      setRescheduleDialogOpen(false);
      setSelectedLesson(null);
      setPendingSlot(null);
      setReason('');
      loadLessons(range?.start, range?.end);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <DnDCalendar
          localizer={localizer}
          events={events}
          components={{ toolbar: CustomToolbar }}
          date={currentDate}
          view={view}
          selectable={user?.role === 'teacher'}
          draggableAccessor={(event) => canModify(event.resource)}
          resizableAccessor={(event) => canModify(event.resource)}
          eventPropGetter={(event) => {
            const classes = [] as string[];
            if (event.resource.status === 'rescheduling') {
              classes.push('lesson-rescheduling');
            }
            if (event.resource.status === 'cancelling') {
              classes.push('lesson-cancelling');
            }
            if (event.resource.status === 'cancelled') {
              classes.push('lesson-cancelled');
            }
            if (user?.role === 'student' && !canModify(event.resource)) {
              classes.push('lesson-readonly');
            }
            return { className: classes.join(' ') };
          }}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventDrop}
          resizable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onRangeChange={handleRangeChange}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          style={{ height: 700 }}
        />

        <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Lesson</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  label="Title"
                  value={newLesson.title}
                  onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12}}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newLesson.type}
                    label="Type"
                    onChange={e => setNewLesson({ ...newLesson, type: e.target.value as any })}
                  >
                    <MenuItem value="private">Private</MenuItem>
                    <MenuItem value="group">Group</MenuItem>
                    <MenuItem value="masterclass">Masterclass</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12}}>
              <DateTimePicker
                label="Date & Time"
                value={newLesson.scheduledDate}
                onChange={date => setNewLesson({ ...newLesson, scheduledDate: date || new Date() })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12}}>
              <DatePicker
                label="Repeat Weekly Until"
                value={newLesson.recurringUntil}
                onChange={date => setNewLesson({ ...newLesson, recurringUntil: date })}
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
                      onChange={e => setNewLesson({ ...newLesson, students: e.target.value as string[] })}
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
                  onChange={e => setNewLesson({ ...newLesson, duration: parseInt(e.target.value) || 60 })}
                />
              </Grid>
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  label="Location"
                  value={newLesson.location}
                  onChange={e => setNewLesson({ ...newLesson, location: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={newLesson.description}
                  onChange={e => setNewLesson({ ...newLesson, description: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={newLesson.notes}
                  onChange={e => setNewLesson({ ...newLesson, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateLesson} disabled={!newLesson.title || newLesson.students.length === 0}>
              Create
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Lesson</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  label="Title"
                  value={editData.title}
                  onChange={e => setEditData({ ...editData, title: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12}}>
                <DateTimePicker
                  label="Date & Time"
                  value={editData.scheduledDate}
                  onChange={date => setEditData({ ...editData, scheduledDate: date || new Date() })}
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
                      value={editData.students}
                      onChange={e => setEditData({ ...editData, students: e.target.value as string[] })}
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
                  value={editData.duration}
                  onChange={e => setEditData({ ...editData, duration: parseInt(e.target.value) || 60 })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Close</Button>
            <Button color="error" onClick={handleCancelLesson}>Cancel Lesson</Button>
            <Button
              variant="contained"
              onClick={handleUpdateLesson}
              disabled={!editData.title || editData.students.length === 0}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingLesson?.status === 'rescheduling' ? 'Reschedule Request' : 'Cancellation Request'}
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1" gutterBottom>
              {editingLesson && format(new Date(editingLesson.scheduledDate), 'PPpp')} ({editingLesson?.duration} min)
            </Typography>
            {editingLesson?.status === 'rescheduling' ? (
              <Typography variant="body2" gutterBottom>
                Reason: {editingLesson?.rescheduleReason}
              </Typography>
            ) : (
              <Typography variant="body2" gutterBottom>
                Reason: {editingLesson?.cancelReason}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleApproveRequest(false)}>Deny</Button>
            <Button variant="contained" onClick={() => handleApproveRequest(true)}>Approve</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={lessonDialogOpen} onClose={() => setLessonDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedLesson?.title}</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1" gutterBottom>
              {selectedLesson && format(new Date(selectedLesson.scheduledDate), 'PPpp')} ({selectedLesson?.duration} min)
            </Typography>
            <Typography variant="body2" gutterBottom>
              Teacher: {selectedLesson?.teacher?.firstName} {selectedLesson?.teacher?.lastName}
            </Typography>
            {selectedLesson?.location && (
              <Typography variant="body2" gutterBottom>
                Location: {selectedLesson.location}
              </Typography>
            )}
            {selectedLesson?.description && (
              <Typography variant="body2" gutterBottom>
                {selectedLesson.description}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            {selectedLesson && user?.role === 'student' && (
              <>
                <Button
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleConfirmAttendance}
                  disabled={!canModify(selectedLesson)}
                >
                  I Am Here
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={() => {
                    if (!selectedLesson) return;
                    setLessonDialogOpen(false);
                    setPendingSlot({
                      start: new Date(selectedLesson.scheduledDate),
                      end: new Date(new Date(selectedLesson.scheduledDate).getTime() + selectedLesson.duration * 60000),
                    });
                    setReason('');
                    setRescheduleDialogOpen(true);
                  }}
                  disabled={!canModify(selectedLesson)}
                >
                  Request Reschedule
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    setLessonDialogOpen(false);
                    setReason('');
                    setCancelDialogOpen(true);
                  }}
                  disabled={!canModify(selectedLesson)}
                >
                  Request Cancel
                </Button>
              </>
            )}
            <Button onClick={() => setLessonDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Cancel Lesson</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              label="Reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>Back</Button>
            <Button variant="contained" onClick={handleSubmitCancel} disabled={!reason.trim()}>Submit</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={rescheduleDialogOpen} onClose={() => setRescheduleDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Request Reschedule</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <DateTimePicker
                  label="New Date & Time"
                  value={pendingSlot?.start || (selectedLesson ? new Date(selectedLesson.scheduledDate) : new Date())}
                  onChange={date =>
                    setPendingSlot({
                      start: date || new Date(),
                      end: new Date((date || new Date()).getTime() + (selectedLesson?.duration || 60) * 60000),
                    })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  label="Reason"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRescheduleDialogOpen(false)}>Back</Button>
            <Button variant="contained" onClick={handleSubmitReschedule} disabled={!reason.trim() || !pendingSlot}>Submit</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CalendarPage;
