import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ContentCopy as CopyIcon,
  ContentPaste as PasteIcon,
  ContentCut as CutIcon,
  FormatColorFill as FillIcon,
  BorderColor as BorderColorIcon,
  TextFields as TextIcon,
  Settings as SettingsIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitViewIcon,
  GridOn as GridIcon,
  GridOff as GridOffIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  Box,
  Fab,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Typography,
  Drawer,
  Button,
  Slider,
} from '@mui/material';
import React, { useState, useRef } from 'react';

import { useI18n } from '../../contexts/I18nContext';

interface EnhancedControlsPanelProps {
  onAddNode?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onOpenNodeStyle?: () => void;
  onOpenEdgeStyle?: () => void;
  onOpenTextStyle?: () => void;
  onOpenSettings?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onToggleGrid?: () => void;
  onZoomChange?: (zoom: number) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasSelection?: boolean;
  hasCopiedItems?: boolean;
  showGrid?: boolean;
  currentZoom?: number;
}

/**
 * Enhanced controls panel with a clean, non-overlapping UI
 * Based on the provided screenshot design
 */
const EnhancedControlsPanel: React.FC<EnhancedControlsPanelProps> = ({
  onAddNode,
  onDelete,
  onSave,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onCut,
  onOpenNodeStyle,
  onOpenEdgeStyle,
  onOpenTextStyle,
  onOpenSettings,
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleGrid,
  onZoomChange,
  canUndo = false,
  canRedo = false,
  hasSelection = false,
  hasCopiedItems = false,
  showGrid = true,
  currentZoom = 1,
}) => {
  const { t } = useI18n();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [zoomValue, setZoomValue] = useState<number>(currentZoom * 100);
  
  // Update zoom value when currentZoom changes
  useEffect(() => {
    setZoomValue(Math.round(currentZoom * 100));
  }, [currentZoom]);

  // Handle zoom input change
  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value, 10);
    if (!isNaN(newValue) && newValue > 0 && newValue <= 200) {
      setZoomValue(newValue);
      onZoomChange?.(newValue / 100);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        borderRadius: 8,
        p: 0.5,
        zIndex: 5,
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
      }}
    >
      {/* Edit tools */}
      {!isMobile && (
        <>
          <IconButton 
            onClick={onUndo} 
            disabled={!canUndo} 
            size="small" 
            aria-label={t('common.undo')}
          >
            <UndoIcon />
          </IconButton>
          <IconButton 
            onClick={onRedo} 
            disabled={!canRedo} 
            size="small" 
            aria-label={t('common.redo')}
          >
            <RedoIcon />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        </>
      )}
      
      {/* Zoom controls */}
      <IconButton 
        onClick={onZoomOut} 
        size="small" 
        aria-label={t('common.zoomOut')}
      >
        <ZoomOutIcon />
      </IconButton>
      
      {!isMobile && (
        <Box
          component="form"
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: 64,
            mx: 0.5,
          }}
          onSubmit={(e) => e.preventDefault()}
        >
          <TextField
            value={zoomValue}
            onChange={handleZoomChange}
            variant="standard"
            size="small"
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
              sx: { fontSize: '0.875rem' }
            }}
            aria-label={t('common.zoomLevel')}
            sx={{ width: '100%' }}
          />
        </Box>
      )}
      
      <IconButton 
        onClick={onZoomIn} 
        size="small" 
        aria-label={t('common.zoomIn')}
      >
        <ZoomInIcon />
      </IconButton>
      
      <IconButton 
        onClick={onFitView} 
        size="small" 
        aria-label={t('common.fitView')}
      >
        <FitScreenIcon />
      </IconButton>
      
      {!isMobile && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <IconButton 
            onClick={onToggleGrid} 
            color={showGrid ? "primary" : "default"}
            size="small" 
            aria-label={t('common.toggleGrid')}
          >
            <GridOnIcon />
          </IconButton>
        </>
      )}
    </Paper>
  );
};

export default EnhancedControlsPanel;


