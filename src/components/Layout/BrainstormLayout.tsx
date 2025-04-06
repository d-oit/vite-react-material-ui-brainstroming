import { ReactNode, useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Chat as ChatIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Save as SaveIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitScreenIcon,
} from '@mui/icons-material';
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
      sx={{ height: '100%', overflow: 'auto' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>{children}</Box>
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
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarTab, setSidebarTab] = useState(0);
  const [showControls, setShowControls] = useState(false);
  
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
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSidebarTab(newValue);
  };
  
  const sidebarWidth = isLargeScreen ? 400 : 320;
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        position: 'relative',
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
                }}
              >
                <IconButton onClick={onZoomIn} size="small">
                  <ZoomInIcon />
                </IconButton>
                <IconButton onClick={onZoomOut} size="small">
                  <ZoomOutIcon />
                </IconButton>
                <IconButton onClick={onFitView} size="small">
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
                },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={sidebarTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                  >
                    <Tab icon={<ChatIcon />} label={t('chat.title')} />
                    <Tab icon={<HistoryIcon />} label={t('gitHistory.title')} />
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
              
              {/* Desktop zoom controls */}
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
                  }}
                >
                  <Tooltip title={t('brainstorm.zoomIn')}>
                    <IconButton onClick={onZoomIn} size="small">
                      <ZoomInIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('brainstorm.zoomOut')}>
                    <IconButton onClick={onZoomOut} size="small">
                      <ZoomOutIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('brainstorm.fitView')}>
                    <IconButton onClick={onFitView} size="small">
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
      
      {/* Floating action buttons - repositioned to avoid overlap */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000,
        }}
      >
        {onSave && (
          <Tooltip title={t('common.save')}>
            <Fab color="primary" size="medium" onClick={onSave}>
              <SaveIcon />
            </Fab>
          </Tooltip>
        )}
        
        {!sidebarOpen && (
          <Tooltip title={t('chat.openAssistant')}>
            <Fab 
              color="secondary" 
              size="medium" 
              onClick={toggleSidebar}
            >
              <ChatIcon />
            </Fab>
          </Tooltip>
        )}
        
        {/* Add button for creating new nodes */}
        <Tooltip title={t('brainstorm.addNode')}>
          <Fab 
            color="default" 
            size="medium" 
            onClick={onAddNode}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>
    </Box>
  );
};







