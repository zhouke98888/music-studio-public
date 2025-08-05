import React, { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
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
  const [newLesson, setNewLesson] = useState({
    title: '',
    scheduledDate: new Date(),
    duration: 60,
    students: [] as string[],
    recurringUntil: null as Date | null,
  });
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');

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
    try {
      await lessonsAPI.updateLesson(event.resource._id, {
        scheduledDate: start.toISOString(),
        duration: (end.getTime() - start.getTime()) / 60000,
      });
      loadLessons();
    } catch (e) {
      console.error(e);
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
    setNewLesson({
      ...newLesson,
      scheduledDate: slot.start,
      duration: (slot.end.getTime() - slot.start.getTime()) / 60000,
    });
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
      setNewLesson({ title: '', scheduledDate: new Date(), duration: 60, students: [], recurringUntil: null });
      loadLessons();
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
      loadLessons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLesson = async () => {
    if (!editingLesson) return;
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await lessonsAPI.deleteLesson(editingLesson._id);
      setEditDialog(false);
      setEditingLesson(null);
      loadLessons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectEvent = (event: LessonEvent) => {
    if (user?.role !== 'teacher') return;
    const l = event.resource;
    setEditingLesson(l);
    setEditData({
      title: l.title,
      scheduledDate: new Date(l.scheduledDate),
      duration: l.duration,
      students: l.students.map((s: any) => (typeof s === 'string' ? s : s._id)),
    });
    setEditDialog(true);
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
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button color="error" onClick={handleDeleteLesson}>Delete</Button>
            <Button variant="contained" onClick={handleUpdateLesson} disabled={!editData.title || editData.students.length === 0}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CalendarPage;
