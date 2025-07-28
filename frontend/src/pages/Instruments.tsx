import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, Alert } from '@mui/material';
import { instrumentsAPI } from '../services/api';
import { Instrument } from '../types';

const InstrumentsPage: React.FC = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const data = await instrumentsAPI.getInstruments();
        setInstruments(data);
      } catch (err) {
        setError('Failed to load instruments');
      }
    };
    fetchInstruments();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Instruments
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <List>
        {instruments.map(inst => (
          <ListItem key={inst._id} divider>
            <ListItemText
              primary={`${inst.brand} ${inst.instrumentModel}`}
              secondary={inst.serialNumber}
            />
            <Chip label={inst.isAvailable ? 'Available' : 'Checked Out'} color={inst.isAvailable ? 'success' : 'warning'} size="small" />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default InstrumentsPage;
