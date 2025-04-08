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
  ArrowBack as ArrowBackIcon,
  ChevronRight as ChevronRightIcon,
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
  Toolbar,
  Typography,
  Button,
  Divider,
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
        <Box sx={{ height: '100%' }} tabIndex={value === index ? 0 : -1}>
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
  const [showControls, setShowControls] = useState(true); // Always show controls
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fixed sidebar width based on screen size
  const sidebarWidth = isLargeScreen ? 360 : 320;

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

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
    >
      {/* Top toolbar with title and actions */}
      <Paper 
        elevation={1}
        sx={{ 
          borderRadius: 0,
          zIndex: 10,
          position: 'relative'
        }}
      >
        <Toolbar variant="dense" sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              edge="start" 
              onClick={() => navigate(-1)}
              aria-label={t('common.back')}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              {t('brainstorm.quickSession')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? t('common.saving') : t('common.save')}
            </Button>
            <IconButton onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
            <IconButton 
              edge="end" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              color={sidebarOpen ? "primary" : "default"}
              aria-label={sidebarOpen ? t('common.closeSidebar') : t('common.openSidebar')}
            >
              {sidebarOpen ? <ChevronRightIcon /> : <ChatIcon />}
            </IconButton>
          </Box>
        </Toolbar>
      </Paper>

      {/* Main content area with sidebar */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Main canvas area */}
        <Box
          sx={{
            flexGrow: 1,
            position: 'relative',
            overflow: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          {mainContent}
          
          {/* Centered bottom controls */}
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              borderRadius: 8,
              p: 0.5,
              zIndex: 5,
            }}
          >
            <IconButton onClick={onZoomIn} size="small" aria-label={t('brainstorm.zoomIn')}>
              <ZoomInIcon />
            </IconButton>
            <IconButton onClick={onZoomOut} size="small" aria-label={t('brainstorm.zoomOut')}>
              <ZoomOutIcon />
            </IconButton>
            <IconButton onClick={onFitView} size="small" aria-label={t('brainstorm.fitView')}>
              <FitScreenIcon />
            </IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <IconButton onClick={onAddNode} size="small" aria-label={t('brainstorm.addNode')}>
              <AddIcon />
            </IconButton>
          </Paper>
        </Box>
        
        {/* Sidebar with tabs */}
        <Drawer
          variant="persistent"
          anchor="right"
          open={sidebarOpen}
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              position: 'relative',
              border: 'none',
              borderLeft: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={sidebarTab}
                onChange={(_, newValue) => setSidebarTab(newValue)}
                variant="fullWidth"
              >
                <Tab 
                  icon={<ChatIcon />} 
                  label={t('chat.title')} 
                  id="sidebar-tab-0"
                  aria-controls="sidebar-tabpanel-0"
                />
                <Tab 
                  icon={<HistoryIcon />} 
                  label={t('gitHistory.title')} 
                  id="sidebar-tab-1"
                  aria-controls="sidebar-tabpanel-1"
                />
              </Tabs>
            </Box>
            
            <TabPanel value={sidebarTab} index={0}>
              {chatPanel}
            </TabPanel>
            <TabPanel value={sidebarTab} index={1}>
              {historyPanel}
            </TabPanel>
          </Box>
        </Drawer>
      </Box>
    </Box>
  );
};


