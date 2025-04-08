import {
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Memory as MemoryIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Chip,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import React, { useState, useEffect, useMemo } from 'react';

import { useI18n } from '../../contexts/I18nContext';
import {
  performanceTracker,
  MetricCategory,
  type PerformanceMetric,
} from '../../utils/performanceTracker';

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
 * Performance Dashboard Component
 *
 * This component displays performance metrics collected by the performance tracker.
 * It shows render times, network requests, and other performance metrics.
 */
export const PerformanceDashboard: React.FC = () => {
  const theme = useTheme();
  const { t } = useI18n();
  const [tabValue, setTabValue] = useState(0);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MetricCategory | null>(null);

  // Get metrics from performance tracker
  const refreshMetrics = () => {
    setLoading(true);
    try {
      const allMetrics = performanceTracker.getMetrics();
      setMetrics(allMetrics);
      setError(null);
    } catch (err) {
      setError('Failed to load performance metrics');
      console.error('Error loading performance metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshMetrics();

    // Add listener for new metrics
    const unsubscribe = performanceTracker.addListener(newMetrics => {
      setMetrics(newMetrics);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Clear metrics
  const handleClearMetrics = () => {
    performanceTracker.clearMetrics();
    setMetrics([]);
  };

  // Download metrics as JSON
  const handleDownloadMetrics = () => {
    const dataStr = JSON.stringify(metrics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `performance-metrics-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Filter metrics by category
  const filteredMetrics = useMemo(() => {
    if (filter === null) return metrics;
    return metrics.filter(metric => metric.category === filter);
  }, [metrics, filter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const renderMetrics = metrics.filter(m => m.category === MetricCategory.RENDER && m.duration);
    const networkMetrics = metrics.filter(m => m.category === MetricCategory.NETWORK && m.duration);
    const interactionMetrics = metrics.filter(
      m => m.category === MetricCategory.INTERACTION && m.duration
    );

    const calculateStats = (metricsList: PerformanceMetric[]) => {
      if (metricsList.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };

      const durations = metricsList.map(m => m.duration || 0);
      const sum = durations.reduce((a, b) => a + b, 0);

      return {
        avg: sum / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        count: durations.length,
      };
    };

    return {
      render: calculateStats(renderMetrics),
      network: calculateStats(networkMetrics),
      interaction: calculateStats(interactionMetrics),
    };
  }, [metrics]);

  // Get severity color based on duration
  const getSeverityColor = (duration: number | undefined, category: MetricCategory): string => {
    if (!duration) return theme.palette.info.main;

    switch (category) {
      case MetricCategory.RENDER:
        if (duration > 50) return theme.palette.error.main;
        if (duration > 16) return theme.palette.warning.main;
        return theme.palette.success.main;

      case MetricCategory.NETWORK:
        if (duration > 3000) return theme.palette.error.main;
        if (duration > 1000) return theme.palette.warning.main;
        return theme.palette.success.main;

      case MetricCategory.INTERACTION:
        if (duration > 500) return theme.palette.error.main;
        if (duration > 100) return theme.palette.warning.main;
        return theme.palette.success.main;

      default:
        return theme.palette.info.main;
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 2, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          {t('performance.dashboard.title') || 'Performance Dashboard'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={t('performance.dashboard.refresh') || 'Refresh'}>
            <IconButton onClick={refreshMetrics} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={t('performance.dashboard.clear') || 'Clear Metrics'}>
            <IconButton onClick={handleClearMetrics} disabled={loading || metrics.length === 0}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('performance.dashboard.download') || 'Download Metrics'}>
            <IconButton onClick={handleDownloadMetrics} disabled={loading || metrics.length === 0}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="performance dashboard tabs">
          <Tab
            label={t('performance.dashboard.overview') || 'Overview'}
            icon={<BarChartIcon />}
            iconPosition="start"
            {...a11yProps(0)}
          />
          <Tab
            label={t('performance.dashboard.metrics') || 'Metrics'}
            icon={<TimelineIcon />}
            iconPosition="start"
            {...a11yProps(1)}
          />
          <Tab
            label={t('performance.dashboard.memory') || 'Memory'}
            icon={<MemoryIcon />}
            iconPosition="start"
            {...a11yProps(2)}
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}
        >
          {/* Render Performance */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('performance.dashboard.renderPerformance') || 'Render Performance'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('performance.dashboard.componentRenderTimes') || 'Component render times'}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h4" component="div">
                {stats.render.avg.toFixed(2)} ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('performance.dashboard.avgRenderTime') || 'Average render time'}
              </Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('performance.dashboard.min') || 'Min'}
                </Typography>
                <Typography variant="body1">{stats.render.min.toFixed(2)} ms</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('performance.dashboard.max') || 'Max'}
                </Typography>
                <Typography variant="body1">{stats.render.max.toFixed(2)} ms</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('performance.dashboard.count') || 'Count'}
                </Typography>
                <Typography variant="body1">{stats.render.count}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Network Performance */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('performance.dashboard.networkPerformance') || 'Network Performance'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('performance.dashboard.apiRequestTimes') || 'API request times'}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h4" component="div">
                {stats.network.avg.toFixed(2)} ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('performance.dashboard.avgNetworkTime') || 'Average network time'}
              </Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('performance.dashboard.min') || 'Min'}
                </Typography>
                <Typography variant="body1">{stats.network.min.toFixed(2)} ms</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('performance.dashboard.max') || 'Max'}
                </Typography>
                <Typography variant="body1">{stats.network.max.toFixed(2)} ms</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('performance.dashboard.count') || 'Count'}
                </Typography>
                <Typography variant="body1">{stats.network.count}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Interaction Performance */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('performance.dashboard.interactionPerformance') || 'Interaction Performance'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('performance.dashboard.userInteractionTimes') || 'User interaction times'}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h4" component="div">
                {stats.interaction.avg.toFixed(2)} ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('performance.dashboard.avgInteractionTime') || 'Average interaction time'}
              </Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('performance.dashboard.min') || 'Min'}
                </Typography>
                <Typography variant="body1">{stats.interaction.min.toFixed(2)} ms</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('performance.dashboard.max') || 'Max'}
                </Typography>
                <Typography variant="body1">{stats.interaction.max.toFixed(2)} ms</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('performance.dashboard.count') || 'Count'}
                </Typography>
                <Typography variant="body1">{stats.interaction.count}</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Summary */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('performance.dashboard.summary') || 'Summary'}
          </Typography>
          <Typography variant="body2" paragraph>
            {t('performance.dashboard.totalMetrics', { count: metrics.length }) ||
              `Total metrics collected: ${metrics.length}`}
          </Typography>

          {metrics.length === 0 ? (
            <Alert severity="info">
              {t('performance.dashboard.noMetrics') ||
                'No performance metrics collected yet. Use the application to generate metrics.'}
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`${t('performance.dashboard.render') || 'Render'}: ${stats.render.count}`}
                color="primary"
                variant={filter === MetricCategory.RENDER ? 'filled' : 'outlined'}
                onClick={() =>
                  setFilter(filter === MetricCategory.RENDER ? null : MetricCategory.RENDER)
                }
              />
              <Chip
                label={`${t('performance.dashboard.network') || 'Network'}: ${stats.network.count}`}
                color="secondary"
                variant={filter === MetricCategory.NETWORK ? 'filled' : 'outlined'}
                onClick={() =>
                  setFilter(filter === MetricCategory.NETWORK ? null : MetricCategory.NETWORK)
                }
              />
              <Chip
                label={`${t('performance.dashboard.interaction') || 'Interaction'}: ${stats.interaction.count}`}
                color="success"
                variant={filter === MetricCategory.INTERACTION ? 'filled' : 'outlined'}
                onClick={() =>
                  setFilter(
                    filter === MetricCategory.INTERACTION ? null : MetricCategory.INTERACTION
                  )
                }
              />
              <Chip
                label={`${t('performance.dashboard.resource') || 'Resource'}: ${
                  metrics.filter(m => m.category === MetricCategory.RESOURCE).length
                }`}
                color="warning"
                variant={filter === MetricCategory.RESOURCE ? 'filled' : 'outlined'}
                onClick={() =>
                  setFilter(filter === MetricCategory.RESOURCE ? null : MetricCategory.RESOURCE)
                }
              />
              <Chip
                label={`${t('performance.dashboard.custom') || 'Custom'}: ${
                  metrics.filter(m => m.category === MetricCategory.CUSTOM).length
                }`}
                color="info"
                variant={filter === MetricCategory.CUSTOM ? 'filled' : 'outlined'}
                onClick={() =>
                  setFilter(filter === MetricCategory.CUSTOM ? null : MetricCategory.CUSTOM)
                }
              />

              {filter !== null && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterIcon />}
                  onClick={() => setFilter(null)}
                >
                  {t('performance.dashboard.clearFilter') || 'Clear Filter'}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {t('performance.dashboard.detailedMetrics') || 'Detailed Metrics'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {filter !== null && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterIcon />}
                onClick={() => setFilter(null)}
              >
                {t('performance.dashboard.clearFilter') || 'Clear Filter'}
              </Button>
            )}
          </Box>
        </Box>

        {filteredMetrics.length === 0 ? (
          <Alert severity="info">
            {filter !== null
              ? t('performance.dashboard.noMetricsForFilter') ||
                'No metrics found for the selected filter.'
              : t('performance.dashboard.noMetrics') || 'No performance metrics collected yet.'}
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('performance.dashboard.name') || 'Name'}</TableCell>
                  <TableCell>{t('performance.dashboard.category') || 'Category'}</TableCell>
                  <TableCell align="right">
                    {t('performance.dashboard.duration') || 'Duration (ms)'}
                  </TableCell>
                  <TableCell>{t('performance.dashboard.timestamp') || 'Timestamp'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMetrics.map(metric => (
                  <TableRow key={metric.id} hover>
                    <TableCell component="th" scope="row">
                      {metric.name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={metric.category}
                        size="small"
                        sx={{
                          backgroundColor:
                            metric.category === MetricCategory.RENDER
                              ? theme.palette.primary.main
                              : metric.category === MetricCategory.NETWORK
                                ? theme.palette.secondary.main
                                : metric.category === MetricCategory.INTERACTION
                                  ? theme.palette.success.main
                                  : metric.category === MetricCategory.RESOURCE
                                    ? theme.palette.warning.main
                                    : theme.palette.info.main,
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        sx={{
                          color: getSeverityColor(metric.duration, metric.category),
                          fontWeight: 'medium',
                        }}
                      >
                        {metric.duration?.toFixed(2) || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{new Date(metric.startTime).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6">
            {t('performance.dashboard.memoryUsage') || 'Memory Usage'}
          </Typography>

          <Alert severity="info">
            {t('performance.dashboard.memoryInfo') ||
              'Memory usage information is only available in browsers that support the Performance API.'}
          </Alert>

          <Button
            variant="contained"
            onClick={() => {
              if (window.gc) {
                window.gc();
                refreshMetrics();
              }
            }}
            disabled={!window.gc}
          >
            {t('performance.dashboard.runGarbageCollection') || 'Run Garbage Collection'}
          </Button>

          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('performance.dashboard.jsHeapSize') || 'JavaScript Heap Size'}
            </Typography>

            {window.performance && window.performance.memory !== undefined ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('performance.dashboard.usedJSHeapSize') || 'Used JS Heap Size'}
                  </Typography>
                  <Typography variant="body1">
                    {(window.performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('performance.dashboard.totalJSHeapSize') || 'Total JS Heap Size'}
                  </Typography>
                  <Typography variant="body1">
                    {(window.performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('performance.dashboard.jsHeapSizeLimit') || 'JS Heap Size Limit'}
                  </Typography>
                  <Typography variant="body1">
                    {(window.performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('performance.dashboard.memoryApiNotSupported') ||
                  'Memory API is not supported in this browser.'}
              </Typography>
            )}
          </Paper>
        </Box>
      </TabPanel>
    </Paper>
  );
};

export default PerformanceDashboard;
