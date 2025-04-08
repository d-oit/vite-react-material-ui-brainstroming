import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import MemoryIcon from '@mui/icons-material/Memory';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import RefreshIcon from '@mui/icons-material/Refresh';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import type { PerformanceMetric } from '../utils/performanceTracker';
import {
  performanceTracker as performanceMonitoringUtil,
  PerformanceCategory,
} from '../utils/performanceTracker';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`performance-tabpanel-${index}`}
      aria-labelledby={`performance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `performance-tab-${index}`,
    'aria-controls': `performance-tabpanel-${index}`,
  };
}

/**
 * Performance profiler component that displays performance metrics
 */
interface PerformanceProfilerProps {
  open?: boolean;
  onClose?: () => void;
}

const PerformanceProfiler: React.FC<PerformanceProfilerProps> = ({
  open: externalOpen,
  onClose
}) => {
  // Use internal state if no external open prop is provided
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;

  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // Refresh metrics
  const refreshMetrics = () => {
    setMetrics(performanceMonitoringUtil.getMetrics());
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    if (refreshInterval !== null) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    } else {
      const interval = window.setInterval(refreshMetrics, 2000);
      setRefreshInterval(interval as unknown as number);
    }
  };

  // Toggle performance monitoring
  const toggleMonitoring = () => {
    const newState = !enabled;
    setEnabled(newState);
    performanceMonitoringUtil.setEnabled(newState);
  };

  // Clear metrics
  const clearMetrics = () => {
    performanceMonitoringUtil.clearMetrics();
    refreshMetrics();
  };

  // Download metrics as JSON
  const downloadMetrics = () => {
    const dataStr = JSON.stringify(metrics, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `performance_metrics_${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter metrics by category
  const getFilteredMetrics = (category?: PerformanceCategory) => {
    if (category === undefined) return metrics;
    return metrics.filter(metric => metric.category === category);
  };

  // Calculate average duration for a category
  const getAverageDuration = (category?: PerformanceCategory) => {
    const filtered = getFilteredMetrics(category);
    if (filtered.length === 0) return 0;

    const sum = filtered.reduce((acc, metric) => acc + (metric.duration ?? 0), 0);
    return sum / filtered.length;
  };

  // Get the slowest metric for a category
  const getSlowestMetric = (category?: PerformanceCategory): PerformanceMetric | null => {
    const filtered = getFilteredMetrics(category);
    if (filtered.length === 0) return null;

    return filtered.reduce((slowest, current) => {
      const currentDuration = current.duration ?? 0;
      const slowestDuration = slowest.duration ?? 0;
      return currentDuration > slowestDuration ? current : slowest;
    }, filtered[0]);
  };

  // Effect to refresh metrics when the dialog opens
  useEffect(() => {
    if (open) {
      refreshMetrics();
    }
  }, [open]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval !== null) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  return (
    <>
      {/* Floating button to open the profiler */}
      <Tooltip title="Performance Profiler">
        <IconButton
          color="primary"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            bgcolor: 'background.paper',
            boxShadow: 3,
            '&:hover': {
              bgcolor: 'primary.light',
            },
          }}
        >
          <SpeedIcon />
        </IconButton>
      </Tooltip>

      {/* Performance profiler dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Performance Profiler
          <IconButton
            aria-label="close"
            onClick={() => setOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Box>
              <FormControlLabel
                control={<Switch checked={enabled} onChange={toggleMonitoring} color="primary" />}
                label="Enable Monitoring"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={refreshInterval !== null}
                    onChange={toggleAutoRefresh}
                    color="primary"
                  />
                }
                label="Auto Refresh"
              />
            </Box>
            <Box>
              <Tooltip title="Refresh Metrics">
                <IconButton onClick={refreshMetrics} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear Metrics">
                <IconButton onClick={clearMetrics} color="secondary">
                  <CloseIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download Metrics">
                <IconButton onClick={downloadMetrics} color="primary">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="performance tabs">
              <Tab icon={<SpeedIcon />} label="All" {...a11yProps(0)} />
              <Tab icon={<SpeedIcon />} label="Rendering" {...a11yProps(1)} />
              <Tab icon={<StorageIcon />} label="Data Loading" {...a11yProps(2)} />
              <Tab icon={<TouchAppIcon />} label="User Interaction" {...a11yProps(3)} />
              <Tab icon={<NetworkCheckIcon />} label="Network" {...a11yProps(4)} />
              <Tab icon={<MemoryIcon />} label="Storage" {...a11yProps(5)} />
            </Tabs>
          </Box>

          {/* Summary section */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="h6">Summary</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
              <Paper sx={{ p: 2, flexGrow: 1, minWidth: '200px' }}>
                <Typography variant="subtitle2">Total Metrics</Typography>
                <Typography variant="h4">{getFilteredMetrics().length}</Typography>
              </Paper>
              <Paper sx={{ p: 2, flexGrow: 1, minWidth: '200px' }}>
                <Typography variant="subtitle2">Average Duration</Typography>
                <Typography variant="h4">{getAverageDuration().toFixed(2)} ms</Typography>
              </Paper>
              <Paper sx={{ p: 2, flexGrow: 1, minWidth: '200px' }}>
                <Typography variant="subtitle2">Slowest Operation</Typography>
                {(() => {
                  const slowest = getSlowestMetric();
                  return (
                    <>
                      <Typography variant="h6">{slowest?.name ?? 'N/A'}</Typography>
                      <Typography variant="body2">
                        {slowest?.duration !== undefined ? slowest.duration.toFixed(2) : '0'} ms
                      </Typography>
                    </>
                  );
                })()}
              </Paper>
            </Box>
          </Box>

          {/* Tabs content */}
          <TabPanel value={tabValue} index={0}>
            <MetricsTable metrics={getFilteredMetrics()} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <MetricsTable metrics={getFilteredMetrics(PerformanceCategory.RENDERING)} />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <MetricsTable metrics={getFilteredMetrics(PerformanceCategory.DATA_LOADING)} />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <MetricsTable metrics={getFilteredMetrics(PerformanceCategory.USER_INTERACTION)} />
          </TabPanel>
          <TabPanel value={tabValue} index={4}>
            <MetricsTable metrics={getFilteredMetrics(PerformanceCategory.NETWORK)} />
          </TabPanel>
          <TabPanel value={tabValue} index={5}>
            <MetricsTable metrics={getFilteredMetrics(PerformanceCategory.STORAGE)} />
          </TabPanel>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Metrics table component
interface MetricsTableProps {
  metrics: PerformanceMetric[];
}

const MetricsTable: React.FC<MetricsTableProps> = ({ metrics }) => {
  // Sort metrics by duration (descending)
  const sortedMetrics = [...metrics].sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="performance metrics table">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Category</TableCell>
            <TableCell align="right">Duration (ms)</TableCell>
            <TableCell align="right">Start Time</TableCell>
            <TableCell align="right">End Time</TableCell>
            <TableCell>Metadata</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedMetrics.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No metrics available
              </TableCell>
            </TableRow>
          ) : (
            sortedMetrics.map((metric, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row">
                  {metric.name}
                </TableCell>
                <TableCell>{metric.category}</TableCell>
                <TableCell align="right">
                  {metric.duration !== undefined ? metric.duration.toFixed(2) : 'N/A'}
                </TableCell>
                <TableCell align="right">
                  {(() => {
                    if (metric.startTime === undefined) return 'N/A';
                    return new Date(metric.startTime).toLocaleTimeString();
                  })()}
                </TableCell>
                <TableCell align="right">
                  {(() => {
                    if (metric.endTime === undefined) return 'N/A';
                    return new Date(metric.endTime).toLocaleTimeString();
                  })()}
                </TableCell>
                <TableCell>
                  {metric.metadata !== undefined ? JSON.stringify(metric.metadata) : 'N/A'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PerformanceProfiler;
