import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';

import type { LogEntry } from '../../services/IndexedDBService';
import loggerService from '../../services/LoggerService';

// Define log level type
type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'critical';
export const LogViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filter, setFilter] = useState<LogLevel | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const theme = useTheme();

  // Load logs from IndexedDB
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedLogs = await loggerService.getLogs(
        filter || undefined,
        rowsPerPage * (page + 1)
      );

      // Apply search filter if needed
      const filteredLogs = searchTerm
        ? fetchedLogs.filter(
            log =>
              log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
              JSON.stringify(log.context || {})
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
          )
        : fetchedLogs;

      setLogs(filteredLogs);
      setTotalLogs(filteredLogs.length);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, page, rowsPerPage, searchTerm]);

  // Load logs on mount and when filter changes
  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter change
  const handleFilterChange = (event: SelectChangeEvent<LogLevel | ''>, _child: React.ReactNode) => {
    setFilter(event.target.value as LogLevel | '');
    setPage(0);
  };

  // Handle search
  const handleSearch = () => {
    setPage(0);
    void loadLogs();
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0);
    void loadLogs();
  };

  // Handle log deletion
  const handleDeleteLogs = async () => {
    try {
      await loggerService.clearLogs();
      setLogs([]);
      setTotalLogs(0);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete logs:', error);
    }
  };

  // Handle log details view
  const handleViewDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  };

  // Get icon for log level
  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'info':
        return <InfoIcon color="info" />;
      case 'warn':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'debug':
        return <InfoIcon color="action" />;
      case 'critical':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon />;
    }
  };

  // Get color for log level
  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'info':
        return 'info';
      case 'warn':
        return 'warning';
      case 'error':
      case 'critical':
        return 'error';
      case 'debug':
        return 'default';
      default:
        return 'default';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Application Logs</Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void loadLogs()}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            disabled={logs.length === 0}
          >
            Clear Logs
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="log-level-filter-label">Level</InputLabel>
          <Select
            labelId="log-level-filter-label"
            value={filter}
            label="Level"
            onChange={handleFilterChange}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="debug">Debug</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="warn">Warning</MenuItem>
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Search"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
          sx={{ flexGrow: 1 }}
          InputProps={{
            endAdornment: (
              <Box sx={{ display: 'flex' }}>
                {searchTerm && (
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton size="small" onClick={handleSearch}>
                  <SearchIcon fontSize="small" />
                </IconButton>
              </Box>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="10%">Level</TableCell>
              <TableCell width="20%">Timestamp</TableCell>
              <TableCell width="60%">Message</TableCell>
              <TableCell width="10%" align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No logs found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(log => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Chip
                      icon={getLevelIcon(log.level)}
                      label={log.level.toUpperCase()}
                      color={getLevelColor(log.level)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                  <TableCell sx={{ wordBreak: 'break-word' }}>{log.message}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleViewDetails(log)}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalLogs}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Clear Logs</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all logs? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={async () => { await handleDeleteLogs(); }} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Log Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Chip
                  icon={getLevelIcon(selectedLog.level)}
                  label={selectedLog.level.toUpperCase()}
                  color={getLevelColor(selectedLog.level)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Typography variant="subtitle1" gutterBottom>
                  {selectedLog.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(selectedLog.timestamp)}
                </Typography>
              </Box>

              {selectedLog.context && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Context
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                      borderRadius: 1,
                      maxHeight: '300px',
                      overflow: 'auto',
                    }}
                  >
                    <Box
                      component="pre"
                      sx={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {JSON.stringify(selectedLog.context, null, 2)}
                    </Box>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
