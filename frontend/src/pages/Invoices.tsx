import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, Alert } from '@mui/material';
import { invoicesAPI } from '../services/api';
import { Invoice } from '../types';
import { format } from 'date-fns';

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await invoicesAPI.getInvoices();
        setInvoices(data);
      } catch (err) {
        setError('Failed to load invoices');
      }
    };
    fetchInvoices();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'overdue':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Invoices
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <List>
        {invoices.map(inv => (
          <ListItem key={inv._id} divider>
            <ListItemText
              primary={`${inv.month}/${inv.year}`}
              secondary={`Total: $${inv.totalAmount} | Due: ${format(new Date(inv.dueDate), 'MMM d, yyyy')}`}
            />
            <Chip label={inv.status} color={getStatusColor(inv.status) as any} size="small" />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default InvoicesPage;
