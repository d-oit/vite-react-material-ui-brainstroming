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
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [zoomValue, setZoomValue] = useState<number>(currentZoom * 100);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Handle menu open/close
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Handle settings drawer
  const handleOpenSettings = () => {
    setSettingsDrawerOpen(true);
    handleMenuClose();
  };

  const handleCloseSettings = () => {
    setSettingsDrawerOpen(false);
  };

  // Handle zoom slider change
  const handleZoomChange = (_event: Event, newValue: number | number[]) => {
    const zoom = Array.isArray(newValue) ? newValue[0] : newValue;
    setZoomValue(zoom);
    if (onZoomChange) {
      onZoomChange(zoom / 100);
    }
  };

  // Handle add node
  const handleAddNode = () => {
    if (onAddNode) {
      onAddNode();
    }
  };

  return (
    <>
      {/* Main toolbar at the top */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          boxShadow: 1,
        }}
      >
        <IconButton
          color="inherit"
          onClick={handleMenuOpen}
          aria-label={t('flow.menu') ?? 'Menu'}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {onZoomOut && (
            <Tooltip title={t('flow.zoomOut') ?? 'Zoom out'}>
              <IconButton
                color="inherit"
                onClick={onZoomOut}
                aria-label={t('flow.zoomOut') ?? 'Zoom out'}
              >
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
          )}

          <Typography
            variant="body2"
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.2)',
              px: 1,
              borderRadius: 1,
              minWidth: 50,
              justifyContent: 'center'
            }}
          >
            {Math.round(zoomValue)}%
          </Typography>

          {onZoomIn && (
            <Tooltip title={t('flow.zoomIn') ?? 'Zoom in'}>
              <IconButton
                color="inherit"
                onClick={onZoomIn}
                aria-label={t('flow.zoomIn') ?? 'Zoom in'}
              >
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
          )}

          {onFitView && (
            <Tooltip title={t('flow.fitView') ?? 'Fit view'}>
              <IconButton
                color="inherit"
                onClick={onFitView}
                aria-label={t('flow.fitView') ?? 'Fit view'}
              >
                <FitViewIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {onSave && (
            <Tooltip title={t('flow.save') ?? 'Save'}>
              <IconButton
                color="inherit"
                onClick={onSave}
                aria-label={t('flow.save') ?? 'Save'}
              >
                <SaveIcon />
              </IconButton>
            </Tooltip>
          )}

          {onToggleGrid && (
            <Tooltip title={showGrid ? t('flow.hideGrid') ?? 'Hide grid' : t('flow.showGrid') ?? 'Show grid'}>
              <IconButton
                color="inherit"
                onClick={onToggleGrid}
                aria-label={showGrid ? t('flow.hideGrid') ?? 'Hide grid' : t('flow.showGrid') ?? 'Show grid'}
              >
                {showGrid ? <GridOffIcon /> : <GridIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Add button (floating action button) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          zIndex: 10,
        }}
      >
        <Tooltip title={t('flow.addNode') ?? 'Add Node'}>
          <Fab
            color="primary"
            onClick={handleAddNode}
            ref={addButtonRef}
            aria-label={t('flow.addNode') ?? 'Add Node'}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* Right-side tools */}
      <Box
        sx={{
          position: 'absolute',
          top: 70,
          right: 10,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            p: 0.5,
            borderRadius: 1,
          }}
        >
          {onUndo && (
            <Tooltip title={t('flow.undo') ?? 'Undo'} placement="left">
              <span>
                <IconButton
                  size="small"
                  onClick={onUndo}
                  disabled={!canUndo}
                  aria-label={t('flow.undo') ?? 'Undo'}
                >
                  <UndoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}

          {onRedo && (
            <Tooltip title={t('flow.redo') ?? 'Redo'} placement="left">
              <span>
                <IconButton
                  size="small"
                  onClick={onRedo}
                  disabled={!canRedo}
                  aria-label={t('flow.redo') ?? 'Redo'}
                >
                  <RedoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Paper>

        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            p: 0.5,
            borderRadius: 1,
          }}
        >
          {onCopy && (
            <Tooltip title={t('flow.copy') ?? 'Copy'} placement="left">
              <span>
                <IconButton
                  size="small"
                  onClick={onCopy}
                  disabled={!hasSelection}
                  aria-label={t('flow.copy') ?? 'Copy'}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}

          {onCut && (
            <Tooltip title={t('flow.cut') ?? 'Cut'} placement="left">
              <span>
                <IconButton
                  size="small"
                  onClick={onCut}
                  disabled={!hasSelection}
                  aria-label={t('flow.cut') ?? 'Cut'}
                >
                  <CutIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}

          {onPaste && (
            <Tooltip title={t('flow.paste') ?? 'Paste'} placement="left">
              <span>
                <IconButton
                  size="small"
                  onClick={onPaste}
                  disabled={!hasCopiedItems}
                  aria-label={t('flow.paste') ?? 'Paste'}
                >
                  <PasteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Paper>

        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            p: 0.5,
            borderRadius: 1,
          }}
        >
          {onOpenNodeStyle && (
            <Tooltip title={t('flow.nodeStyle') ?? 'Node Style'} placement="left">
              <IconButton
                size="small"
                onClick={onOpenNodeStyle}
                aria-label={t('flow.nodeStyle') ?? 'Node Style'}
              >
                <FillIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {onOpenEdgeStyle && (
            <Tooltip title={t('flow.edgeStyle') ?? 'Edge Style'} placement="left">
              <IconButton
                size="small"
                onClick={onOpenEdgeStyle}
                aria-label={t('flow.edgeStyle') ?? 'Edge Style'}
              >
                <BorderColorIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {onOpenTextStyle && (
            <Tooltip title={t('flow.textStyle') ?? 'Text Style'} placement="left">
              <IconButton
                size="small"
                onClick={onOpenTextStyle}
                aria-label={t('flow.textStyle') ?? 'Text Style'}
              >
                <TextIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Paper>
      </Box>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={handleOpenSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('flow.settings') ?? 'Settings'} />
        </MenuItem>

        {onDelete && (
          <MenuItem
            onClick={() => {
              if (onDelete) onDelete();
              handleMenuClose();
            }}
            disabled={!hasSelection}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('flow.delete') ?? 'Delete'} />
          </MenuItem>
        )}

        <Divider />

        {onSave && (
          <MenuItem
            onClick={() => {
              if (onSave) onSave();
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <SaveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('flow.save') ?? 'Save'} />
          </MenuItem>
        )}
      </Menu>

      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={settingsDrawerOpen}
        onClose={handleCloseSettings}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{t('flow.settings') ?? 'Settings'}</Typography>
            <IconButton onClick={handleCloseSettings} edge="end">
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            {t('flow.zoomLevel') ?? 'Zoom Level'}: {zoomValue}%
          </Typography>
          <Slider
            value={zoomValue}
            onChange={handleZoomChange}
            aria-labelledby="zoom-slider"
            min={10}
            max={400}
            step={10}
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${value}%`}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" gutterBottom>
            {t('flow.shortcuts') ?? 'Keyboard Shortcuts'}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 3 }}>
            <Typography variant="body2">
              <strong>Ctrl + +</strong>
            </Typography>
            <Typography variant="body2">
              {t('flow.zoomIn') ?? 'Zoom in'}
            </Typography>
            <Typography variant="body2">
              <strong>Ctrl + -</strong>
            </Typography>
            <Typography variant="body2">
              {t('flow.zoomOut') ?? 'Zoom out'}
            </Typography>
            <Typography variant="body2">
              <strong>Ctrl + 0</strong>
            </Typography>
            <Typography variant="body2">
              {t('flow.fitView') ?? 'Fit view'}
            </Typography>
            <Typography variant="body2">
              <strong>Ctrl + Z</strong>
            </Typography>
            <Typography variant="body2">
              {t('flow.undo') ?? 'Undo'}
            </Typography>
            <Typography variant="body2">
              <strong>Ctrl + Y</strong>
            </Typography>
            <Typography variant="body2">
              {t('flow.redo') ?? 'Redo'}
            </Typography>
            <Typography variant="body2">
              <strong>Ctrl + S</strong>
            </Typography>
            <Typography variant="body2">
              {t('flow.save') ?? 'Save'}
            </Typography>
            <Typography variant="body2">
              <strong>Delete</strong>
            </Typography>
            <Typography variant="body2">
              {t('flow.deleteSelected') ?? 'Delete selected'}
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={handleCloseSettings}
          >
            {t('common.close') ?? 'Close'}
          </Button>
        </Box>
      </Drawer>
    </>
  );
};

export default EnhancedControlsPanel;
