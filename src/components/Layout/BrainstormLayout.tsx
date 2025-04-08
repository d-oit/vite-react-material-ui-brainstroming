import {
  Chat as ChatIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Save as SaveIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitScreenIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
  Fab,
  Zoom,
  Tooltip,
  Badge,
  CircularProgress,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';

import { useI18n } from '../../contexts/I18nContext';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`sidebar-tabpanel-${index}`}
      aria-labelledby={`sidebar-tab-${index}`}
      aria-hidden={value !== index}
      sx={{ height: '100%', overflow: 'auto' }}
      {...other}
    >
      {value === index && (
        <Box
          sx={{ height: '100%' }}
          tabIndex={value === index ? 0 : -1}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}

interface BrainstormLayoutProps {
  mainContent: ReactNode;
  chatPanel: ReactNode;
  historyPanel: ReactNode;
  onSave?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onAddNode?: () => void;
}

export const BrainstormLayout = ({
  mainContent,
  chatPanel,
  historyPanel,
  onSave,
  onZoomIn,
  onZoomOut,
  onFitView,
  onAddNode,
}: BrainstormLayoutProps) => {
  const theme = useTheme();
  const { t } = useI18n();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarTab, setSidebarTab] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showControls]);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const handleSave = () => {
    if (onSave) {
      setIsSaving(true);
      // Simulate saving process
      setTimeout(() => {
        onSave();
        setIsSaving(false);
      }, 800);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSidebarTab(newValue);
  };

  const sidebarWidth = isLargeScreen ? 400 : 320;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: isFullscreen ? '100vh' : '100%',
        position: 'relative',
        ...(isFullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.default,
        }),
      }}
      onMouseMove={handleMouseMove}
    >
      <Paper
        elevation={1}
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          height: '100%',
          borderRadius: 0,
        }}
      >
        {isMobile ? (
          <>
            <Box sx={{ flexGrow: 1, height: '100%', position: 'relative' }}>
              {mainContent}

              {/* Mobile controls - more compact and touch-friendly */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 1,
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 20, // More rounded for touch
                  boxShadow: theme.shadows[3],
                  p: 0.5,
                  zIndex: 900,
                  // Ensure it doesn't overlap with the minimap
                  marginLeft: 60,
                }}
              >
                <IconButton
                  onClick={onZoomIn}
                  size="small"
                  aria-label={t('brainstorm.zoomIn')}
                >
                  <ZoomInIcon />
                </IconButton>
                <IconButton
                  onClick={onZoomOut}
                  size="small"
                  aria-label={t('brainstorm.zoomOut')}
                >
                  <ZoomOutIcon />
                </IconButton>
                <IconButton
                  onClick={onFitView}
                  size="small"
                  aria-label={t('brainstorm.fitView')}
                >
                  <FitScreenIcon />
                </IconButton>
              </Box>
            </Box>

            <Drawer
              anchor="right"
              open={sidebarOpen}
              onClose={toggleSidebar}
              sx={{
                '& .MuiDrawer-paper': {
                  width: '80%',
                  maxWidth: 400,
                  height: isFullscreen ? '100vh' : 'calc(100vh - 64px)', // Adjust for app bar
                  top: isFullscreen ? 0 : 64, // Position below app bar when not in fullscreen
                },
                zIndex: theme.zIndex.drawer,
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={sidebarTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    aria-label="Sidebar tabs"
                  >
                    <Tab
                      icon={<ChatIcon />}
                      label={t('chat.title')}
                      id={`sidebar-tab-0`}
                      aria-controls={`sidebar-tabpanel-0`}
                    />
                    <Tab
                      icon={<HistoryIcon />}
                      label={t('gitHistory.title')}
                      id={`sidebar-tab-1`}
                      aria-controls={`sidebar-tabpanel-1`}
                    />
                  </Tabs>
                </Box>

                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <TabPanel value={sidebarTab} index={0}>
                    {chatPanel}
                  </TabPanel>
                  <TabPanel value={sidebarTab} index={1}>
                    {historyPanel}
                  </TabPanel>
                </Box>
              </Box>
            </Drawer>
          </>
        ) : (
          <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
            <Box
              sx={{
                flex: sidebarOpen ? `0 0 calc(100% - ${sidebarWidth}px)` : 1,
                height: '100%',
                position: 'relative',
                transition: theme.transitions.create('flex', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.standard,
                }),
              }}
            >
              {mainContent}

              {/* Desktop zoom controls - repositioned to avoid overlap with minimap */}
              <Zoom in={showControls}>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 1,
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 8,
                    boxShadow: theme.shadows[3],
                    p: 0.5,
                    zIndex: 900, // Ensure it's below FABs but above the canvas
                    // Ensure it doesn't overlap with the minimap
                    marginLeft: isLargeScreen ? 120 : isTablet ? 80 : 0,
                  }}
                >
                  <Tooltip title={t('brainstorm.zoomIn')}>
                    <IconButton
                      onClick={onZoomIn}
                      size="small"
                      aria-label={t('brainstorm.zoomIn')}
                    >
                      <ZoomInIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('brainstorm.zoomOut')}>
                    <IconButton
                      onClick={onZoomOut}
                      size="small"
                      aria-label={t('brainstorm.zoomOut')}
                    >
                      <ZoomOutIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('brainstorm.fitView')}>
                    <IconButton
                      onClick={onFitView}
                      size="small"
                      aria-label={t('brainstorm.fitView')}
                    >
                      <FitScreenIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Zoom>
            </Box>

            {sidebarOpen && (
              <Box
                sx={{
                  width: sidebarWidth,
                  height: '100%',
                  borderLeft: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  flexDirection: 'column',
                }}
                id="sidebar-panel"
                aria-label={t('common.sidebar')}
                role="complementary"
              >
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tabs
                      value={sidebarTab}
                      onChange={handleTabChange}
                      variant="fullWidth"
                      sx={{ flex: 1 }}
                    >
                      <Tab icon={<ChatIcon />} label={t('chat.title')} />
                      <Tab icon={<HistoryIcon />} label={t('gitHistory.title')} />
                    </Tabs>
                    <IconButton onClick={toggleSidebar} sx={{ mx: 1 }}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <TabPanel value={sidebarTab} index={0}>
                    {chatPanel}
                  </TabPanel>
                  <TabPanel value={sidebarTab} index={1}>
                    {historyPanel}
                  </TabPanel>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Action buttons - repositioned to avoid overlap with chat panel */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: sidebarOpen ? `calc(${sidebarWidth}px + 24px)` : 16, // Adjust position based on sidebar
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000,
          transition: theme.transitions.create('right', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        {onSave && (
          <Tooltip title={isSaving ? t('common.saving') : t('common.save')}>
            <span>
              <Fab
                color="primary"
                size="medium"
                onClick={handleSave}
                disabled={isSaving}
                aria-label={isSaving ? t('common.saving') : t('common.save')}
              >
                {isSaving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
              </Fab>
            </span>
          </Tooltip>
        )}

        <Tooltip title={isFullscreen ? t('brainstorm.exitFullscreen') : t('brainstorm.fullscreen')}>
          <span>
            <Fab
              color="default"
              size="medium"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? t('brainstorm.exitFullscreen') : t('brainstorm.fullscreen')}
              aria-pressed={isFullscreen}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </Fab>
          </span>
        </Tooltip>

        {/* Add button for creating new nodes */}
        <Tooltip title={t('brainstorm.addNode')}>
          <span>
            <Fab
              color="default"
              size="medium"
              onClick={onAddNode}
              aria-label={t('brainstorm.addNode')}
            >
              <AddIcon />
            </Fab>
          </span>
        </Tooltip>

        {/* Chat button - only show when sidebar is closed */}
        {!sidebarOpen && (
          <Tooltip title={t('chat.openAssistant')}>
            <span>
              <Fab
                color="secondary"
                size="medium"
                onClick={toggleSidebar}
                aria-label={t('chat.openAssistant')}
                aria-expanded={sidebarOpen}
                aria-controls="sidebar-panel"
              >
                <Badge color="error" variant="dot" invisible={true}>
                  <ChatIcon />
                </Badge>
              </Fab>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};
