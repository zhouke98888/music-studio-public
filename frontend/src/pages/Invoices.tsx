import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  TablePagination,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  DateRange as DateIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { invoicesAPI } from '../services/api';
import { Invoice } from '../types';

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [stats, setStats] = useState<any>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [searchTerm, statusFilter, monthFilter, yearFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (monthFilter) params.month = parseInt(monthFilter);
      if (yearFilter) params.year = parseInt(yearFilter);
      
      const data = await invoicesAPI.getInvoices(params);
      setInvoices(data);
    } catch (err) {
      setError('Failed to fetch invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from invoices
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const paidAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      
      setStats({
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalAmount,
        paidAmount
      });
    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      await invoicesAPI.markInvoicePaid(invoiceId);
      fetchInvoices();
      fetchStats();
    } catch (err) {
      setError('Failed to mark invoice as paid');
      console.error('Error marking invoice as paid:', err);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoicesAPI.deleteInvoice(invoiceId);
        fetchInvoices();
        fetchStats();
      } catch (err) {
        setError('Failed to delete invoice');
        console.error('Error deleting invoice:', err);
      }
    }
  };

  const handleOpenDialog = (invoice?: Invoice) => {
    setEditingInvoice(invoice || null);
    setOpenDialog(true);
  };

  const handleGenerateMonthly = async (month: number, year: number) => {
    try {
      await invoicesAPI.generateMonthlyInvoices({ month, year });
      setOpenGenerateDialog(false);
      fetchInvoices();
      fetchStats();
    } catch (err) {
      setError('Failed to generate monthly invoices');
      console.error('Error generating monthly invoices:', err);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2' }}>
          Invoice Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md:3}}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Invoices
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats?.totalInvoices || 0}
                    </Typography>
                  </Box>
                  <ReceiptIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md:3}}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Paid Invoices
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats?.paidInvoices || 0}
                    </Typography>
                  </Box>
                  <CheckIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md:3}}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Amount
                    </Typography>
                    <Typography variant="h4" component="div">
                      ${stats?.totalAmount || 0}
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md:3}}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Paid Amount
                    </Typography>
                    <Typography variant="h4" component="div">
                      ${stats?.paidAmount || 0}
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md:3}}>
              <TextField
                fullWidth
                label="Search Student"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md:2}}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md:2}}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={monthFilter}
                  label="Month"
                  onChange={(e) => setMonthFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {months.map((month, index) => (
                    <MenuItem key={month} value={index + 1}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md:2}}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={yearFilter}
                  label="Year"
                  onChange={(e) => setYearFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {years.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md:3}}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenGenerateDialog(true)}
                sx={{ mr: 1 }}
              >
                Generate Monthly
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Invoices Table */}
        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Month/Year</TableCell>
                    <TableCell>Lessons</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Paid Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((invoice) => (
                      <TableRow key={invoice._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                            {invoice.student.firstName} {invoice.student.lastName}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {months[invoice.month - 1]} {invoice.year}
                        </TableCell>
                        <TableCell>{invoice.lessons.length}</TableCell>
                        <TableCell>${invoice.totalAmount}</TableCell>
                        <TableCell>${invoice.paidAmount}</TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.status}
                            color={
                              invoice.status === 'paid'
                                ? 'success'
                                : invoice.status === 'overdue'
                                ? 'error'
                                : 'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {invoice.status !== 'paid' && (
                            <Tooltip title="Mark as Paid">
                              <IconButton
                                onClick={() => handleMarkPaid(invoice._id)}
                                color="success"
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => handleOpenDialog(invoice)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDeleteInvoice(invoice._id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={invoices.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </TableContainer>

        {/* Generate Monthly Invoices Dialog */}
        <Dialog open={openGenerateDialog} onClose={() => setOpenGenerateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Generate Monthly Invoices</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 6}}>
                <FormControl fullWidth>
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={monthFilter}
                    label="Month"
                    onChange={(e) => setMonthFilter(e.target.value)}
                  >
                    {months.map((month, index) => (
                      <MenuItem key={month} value={index + 1}>{month}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6}}>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={yearFilter}
                    label="Year"
                    onChange={(e) => setYearFilter(e.target.value)}
                  >
                    {years.map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenGenerateDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => handleGenerateMonthly(
                parseInt(monthFilter) || new Date().getMonth() + 1,
                parseInt(yearFilter) || new Date().getFullYear()
              )}
              disabled={!monthFilter || !yearFilter}
            >
              Generate
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default InvoicesPage;