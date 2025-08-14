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
  MusicNote as MusicNoteIcon,
  Assignment as AssignmentIcon,
  AssignmentReturn as AssignmentReturnIcon,
  FilterList as FilterIcon,
  Build as BuildIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { instrumentsAPI } from '../services/api';
import { Instrument } from '../types';

type Condition = 'excellent' | 'good' | 'fair' | 'poor' | 'broken' | 'lost';

interface InstrumentFormData {
  name: string;
  brand: string;
  instrumentModel?: string;
  serialNumber?: string;
  category: string;
  condition: Condition;
  isAvailable: boolean;
  notes: string;
}

const InstrumentsPage: React.FC = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const [openCheckinDialog, setOpenCheckinDialog] = useState(false);
  const [checkoutInstrument, setCheckoutInstrument] = useState<Instrument | null>(null);
  const [checkinInstrument, setCheckinInstrument] = useState<Instrument | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState<InstrumentFormData>({
    name: '',
    brand: '',
    instrumentModel: '',
    serialNumber: '',
    category: '',
    condition: 'excellent' as const,
    isAvailable: true,
    notes: ''
  });
  const [checkoutData, setCheckoutData] = useState({
    expectedReturnDate: null as Date | null
  });
  const [checkinData, setCheckinData] = useState({
    condition: 'excellent' as const,
    notes: ''
  });

  const categories = ['String', 'Wind', 'Brass', 'Percussion', 'Keyboard', 'Electronic', 'Other'];
  const conditions = ['excellent', 'good', 'fair', 'poor', 'broken', 'lost'];

  useEffect(() => {
    fetchInstruments();
  }, [searchTerm, categoryFilter, availabilityFilter, conditionFilter]);

  const fetchInstruments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (availabilityFilter) params.available = availabilityFilter === 'true';
      
      const data = await instrumentsAPI.getInstruments(params);
      setInstruments(data);
    } catch (err) {
      setError('Failed to fetch instruments');
      console.error('Error fetching instruments:', err);
    } finally {
      setLoading(false);
    }
  };  

  const handleOpenDialog = (instrument?: Instrument) => {
    if (instrument) {
      setEditingInstrument(instrument);
      setFormData({
        name: instrument.name,
        brand: instrument.brand,
        instrumentModel: instrument.instrumentModel || '',
        serialNumber: instrument.serialNumber || '',
        category: instrument.category,
        condition: instrument.condition,
        isAvailable: instrument.isAvailable,
        notes: instrument.notes || ''
      });
    } else {
      setEditingInstrument(null);
      setFormData({
        name: '',
        brand: '',
        instrumentModel: '',
        serialNumber: '',
        category: '',
        condition: 'excellent',
        isAvailable: true,
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingInstrument(null);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingInstrument) {
        await instrumentsAPI.updateInstrument(editingInstrument._id, formData);
      } else {
        await instrumentsAPI.createInstrument(formData);
      }
      
      handleCloseDialog();
      fetchInstruments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save instrument');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this instrument?')) {
      try {
        await instrumentsAPI.deleteInstrument(id);
        fetchInstruments();
      } catch (err) {
        setError('Failed to delete instrument');
      }
    }
  };

  const handleCheckout = async () => {
    if (!checkoutInstrument) return;
    
    try {
      const data = {
        expectedReturnDate: checkoutData.expectedReturnDate?.toISOString()
      };
      await instrumentsAPI.checkOutInstrument(checkoutInstrument._id, data);
      setOpenCheckoutDialog(false);
      setCheckoutInstrument(null);
      setCheckoutData({ expectedReturnDate: null });
      fetchInstruments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to checkout instrument');
    }
  };

  const handleCheckin = async () => {
    if (!checkinInstrument) return;
    
    try {
      await instrumentsAPI.checkInInstrument(checkinInstrument._id, checkinData);
      setOpenCheckinDialog(false);
      setCheckinInstrument(null);
      setCheckinData({ condition: 'excellent', notes: '' });
      fetchInstruments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to checkin instrument');
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      case 'broken': return 'error';
      case 'lost': return 'error';
      default: return 'default';
    }
  };

  const filteredInstruments = (instruments ?? [])
    .filter(instrument => 
      !conditionFilter || instrument.condition === conditionFilter
    )
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const stats = {
    total: instruments.length,
    available: instruments.filter(i => i.isAvailable).length,
    checkedOut: instruments.filter(i => !i.isAvailable).length,
    needsRepair: instruments.filter(i => ['poor', 'broken'].includes(i.condition)).length
  };

  if (loading && instruments.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Instruments Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md:3}}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Instruments
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md:3}}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Available
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.available}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md:3}}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Checked Out
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.checkedOut}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md:3}}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Needs Repair
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.needsRepair}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <TextField
            label="Search instruments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          
          <Box sx={{ ml: 'auto' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Instrument
            </Button>
          </Box>
        </Box>

        {showFilters && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Availability</InputLabel>
              <Select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                label="Availability"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Available</MenuItem>
                <MenuItem value="false">Checked Out</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Condition</InputLabel>
              <Select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                label="Condition"
              >
                <MenuItem value="">All Conditions</MenuItem>
                {conditions.map((condition) => (
                  <MenuItem key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setAvailabilityFilter('');
                setConditionFilter('');
              }}
            >
              Clear Filters
            </Button>
          </Box>
        )}
      </Paper>

      {/* Instruments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Instrument</TableCell>
              <TableCell>Brand & Model</TableCell>
              <TableCell>Serial Number</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Condition</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Current Borrower</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInstruments.map((instrument) => (
              <TableRow key={instrument._id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <MusicNoteIcon sx={{ mr: 1, color: 'primary.main' }} />
                    {instrument.name}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {instrument.brand}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {instrument.instrumentModel || '-'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {instrument.serialNumber || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={instrument.category}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={instrument.condition.charAt(0).toUpperCase() + instrument.condition.slice(1)}
                    size="small"
                    color={getConditionColor(instrument.condition) as any}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={instrument.isAvailable ? 'Available' : 'Checked Out'}
                    size="small"
                    color={instrument.isAvailable ? 'success' : 'warning'}
                  />
                </TableCell>
                <TableCell>
                  {instrument.currentBorrower && (
                    <Box display="flex" alignItems="center">
                      <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2">
                          {instrument.currentBorrower.firstName} {instrument.currentBorrower.lastName}
                        </Typography>
                        {instrument.expectedReturnDate && (
                          <Typography variant="caption" color="text.secondary">
                            Due: {format(new Date(instrument.expectedReturnDate), 'MMM d, yyyy')}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Edit">
                      <IconButton
                        onClick={() => handleOpenDialog(instrument)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {instrument.isAvailable ? (
                      <Tooltip title="Check Out">
                        <IconButton
                          onClick={() => {
                            setCheckoutInstrument(instrument);
                            setOpenCheckoutDialog(true);
                          }}
                          color="warning"
                          size="small"
                        >
                          <AssignmentIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Check In">
                        <IconButton
                          onClick={() => {
                            setCheckinInstrument(instrument);
                            setOpenCheckinDialog(true);
                          }}
                          color="success"
                          size="small"
                        >
                          <AssignmentReturnIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => handleDelete(instrument._id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={instruments.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Add/Edit Instrument Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingInstrument ? 'Edit Instrument' : 'Add New Instrument'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6}}>
              <TextField
                fullWidth
                label="Instrument Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6}}>
              <TextField
                fullWidth
                label="Brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6}}>
              <TextField
                fullWidth
                label="Model"
                value={formData.instrumentModel || ''}
                onChange={(e) => setFormData({ ...formData, instrumentModel: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6}}>
              <TextField
                fullWidth
                label="Serial Number"
                value={formData.serialNumber || ''}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6}}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6}}>
              <FormControl fullWidth required>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                  label="Condition"
                >
                  {conditions.map((condition) => (
                    <MenuItem key={condition} value={condition}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12}}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingInstrument ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={openCheckoutDialog} onClose={() => setOpenCheckoutDialog(false)}>
        <DialogTitle>Check Out Instrument</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Checking out: <strong>{checkoutInstrument?.name}</strong>
              </Typography>
              <DatePicker
                label="Expected Return Date"
                value={checkoutData.expectedReturnDate}
                onChange={(date) => setCheckoutData({ ...checkoutData, expectedReturnDate: date })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal'
                  }
                }}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckoutDialog(false)}>Cancel</Button>
          <Button onClick={handleCheckout} variant="contained">
            Check Out
          </Button>
        </DialogActions>
      </Dialog>

      {/* Checkin Dialog */}
      <Dialog open={openCheckinDialog} onClose={() => setOpenCheckinDialog(false)}>
        <DialogTitle>Check In Instrument</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Checking in: <strong>{checkinInstrument?.name}</strong>
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Condition</InputLabel>
              <Select
                value={checkinData.condition}
                onChange={(e) => setCheckinData({ ...checkinData, condition: e.target.value as any })}
                label="Condition"
              >
                {conditions.map((condition) => (
                  <MenuItem key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Notes"
              value={checkinData.notes}
              onChange={(e) => setCheckinData({ ...checkinData, notes: e.target.value })}
              multiline
              rows={3}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckinDialog(false)}>Cancel</Button>
          <Button onClick={handleCheckin} variant="contained">
            Check In
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstrumentsPage;