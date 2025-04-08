import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import React, { useState } from 'react';
import { SketchPicker } from 'react-color';

import { useI18n } from '../../contexts/I18nContext';
import type { Edge } from '../../types';

interface EdgeStyleDialogProps {
  open: boolean;
  onClose: () => void;
  edge: Edge | null;
  onSave: (edgeId: string, style: Record<string, unknown>) => void;
}

export const EdgeStyleDialog: React.FC<EdgeStyleDialogProps> = ({
  open,
  onClose,
  edge,
  onSave,
}) => {
  const { t } = useI18n();
  const [strokeColor, setStrokeColor] = useState<string>(
    (edge?.style?.stroke as string) || '#000000'
  );
  const [strokeWidth, setStrokeWidth] = useState<number>((edge?.style?.strokeWidth as number) || 1);
  const [strokeDashArray, setStrokeDashArray] = useState<string>(
    (edge?.style?.strokeDasharray as string) || ''
  );
  const [edgeType, setEdgeType] = useState<string>(edge?.type ? edge.type : 'default');
  const [showStrokeColorPicker, setShowStrokeColorPicker] = useState(false);

  const handleSave = () => {
    if (!edge) return;

    const style = {
      stroke: strokeColor,
      strokeWidth,
      strokeDasharray: strokeDashArray,
    };

    onSave(edge.id, style);
    onClose();
  };

  if (!edge) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('flow.styleEdge') || 'Style Edge'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              {t('flow.line') || 'Line'}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <TextField
                label={t('flow.strokeColor') || 'Stroke Color'}
                value={strokeColor}
                onChange={e => setStrokeColor(e.target.value)}
                fullWidth
                margin="normal"
                onClick={() => setShowStrokeColorPicker(true)}
              />
              {showStrokeColorPicker && (
                <Box sx={{ position: 'absolute', zIndex: 2 }}>
                  <Box
                    sx={{
                      position: 'fixed',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                    }}
                    onClick={() => setShowStrokeColorPicker(false)}
                  />
                  <SketchPicker color={strokeColor} onChange={color => setStrokeColor(color.hex)} />
                </Box>
              )}
            </Box>

            <Typography gutterBottom>
              {t('flow.strokeWidth') || 'Stroke Width'}: {strokeWidth}px
            </Typography>
            <Slider
              value={strokeWidth}
              onChange={(_, value) => setStrokeWidth(value as number)}
              min={1}
              max={10}
              step={1}
              valueLabelDisplay="auto"
              aria-labelledby="stroke-width-slider"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="stroke-dash-array-label">
                {t('flow.strokeStyle') || 'Stroke Style'}
              </InputLabel>
              <Select
                labelId="stroke-dash-array-label"
                value={strokeDashArray}
                onChange={e => setStrokeDashArray(e.target.value)}
                label={t('flow.strokeStyle') || 'Stroke Style'}
              >
                <MenuItem value="">{t('flow.solid') || 'Solid'}</MenuItem>
                <MenuItem value="5,5">{t('flow.dashed') || 'Dashed'}</MenuItem>
                <MenuItem value="1,5">{t('flow.dotted') || 'Dotted'}</MenuItem>
                <MenuItem value="10,5,5,5">{t('flow.dashDot') || 'Dash-Dot'}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="edge-type-label">{t('flow.edgeType') || 'Edge Type'}</InputLabel>
              <Select
                labelId="edge-type-label"
                value={edgeType}
                onChange={e => setEdgeType(e.target.value)}
                label={t('flow.edgeType') || 'Edge Type'}
              >
                <MenuItem value="default">{t('flow.default') || 'Default'}</MenuItem>
                <MenuItem value="straight">{t('flow.straight') || 'Straight'}</MenuItem>
                <MenuItem value="step">{t('flow.step') || 'Step'}</MenuItem>
                <MenuItem value="smoothstep">{t('flow.smoothStep') || 'Smooth Step'}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            {t('flow.preview') || 'Preview'}
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="100%" height="100%">
              <line
                x1="10%"
                y1="50%"
                x2="90%"
                y2="50%"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDashArray}
              />
              <polygon points="90%,50% 85%,45% 85%,55%" fill={strokeColor} />
            </svg>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel') || 'Cancel'}</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {t('common.save') || 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EdgeStyleDialog;
