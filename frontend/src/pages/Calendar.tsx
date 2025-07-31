import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
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
import { format, parse, startOfWeek, getDay } from 'date-fns';
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

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [events, setEvents] = useState<LessonEvent[]>([]);
  const [createDialog, setCreateDialog] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    scheduledDate: new Date(),
    duration: 60,
    students: [] as string[],
  });
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const loadLessons = async () => {
    const data = await lessonsAPI.getLessons();
    setLessons(data);
  };

  useEffect(() => {
    loadLessons();
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
      });
      setCreateDialog(false);
      setNewLesson({ title: '', scheduledDate: new Date(), duration: 60, students: [] });
      loadLessons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectEvent =  async(event: LessonEvent, e: React.SyntheticEvent) => {
    if (user?.role !== 'teacher') return;
    if (window.confirm('Delete this lesson?')) {
      // void (async () => {
      await lessonsAPI.deleteLesson(event.resource._id);
      // })();      
      loadLessons();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <DnDCalendar
          localizer={localizer}
          events={events}
          selectable={user?.role === 'teacher'}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventDrop}
          resizable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
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
            <Button variant="contained" onClick={handleCreateLesson} disabled={!newLesson.title}>
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CalendarPage;
