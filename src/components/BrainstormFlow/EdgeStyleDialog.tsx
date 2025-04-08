import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { TwitterPicker } from 'react-color';

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
  // Initialize state with default values
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [strokeDashArray, setStrokeDashArray] = useState<string>('');
  const [edgeType, setEdgeType] = useState<string>('default');
  const [animated, setAnimated] = useState<boolean>(false);
  const [label, setLabel] = useState<string>('');

  // Update state when edge changes or dialog opens
  useEffect(() => {
    if (edge && open) {
      setStrokeColor((edge.style?.stroke as string) ?? '#000000');
      setStrokeWidth((edge.style?.strokeWidth as number) ?? 2);
      setStrokeDashArray((edge.style?.strokeDasharray as string) ?? '');
      setEdgeType(edge.type ?? 'default');
      setAnimated((edge.animated as boolean) ?? false);
      setLabel(edge.label ?? '');
    }
  }, [edge, open]);

  const handleSave = () => {
    if (!edge) return;

    const style = {
      stroke: strokeColor,
      strokeWidth,
      strokeDasharray: strokeDashArray,
      type: edgeType,
      animated,
      label,
    };

    onSave(edge.id, style);
    onClose();
  };

  if (!edge) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('flow.styleEdge') ?? 'Style Edge'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              {t('flow.appearance') ?? 'Appearance'}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('flow.edgeColor') ?? 'Edge Color'}
              </Typography>
              <TwitterPicker
                color={strokeColor}
                onChange={color => setStrokeColor(color.hex)}
                triangle="hide"
                width="100%"
              />
            </Box>

            <Typography gutterBottom>
              {t('flow.edgeWidth') ?? 'Edge Width'}: {strokeWidth}px
            </Typography>
            <Slider
              value={strokeWidth}
              onChange={(_, value) => setStrokeWidth(value as number)}
              min={1}
              max={10}
              step={1}
              valueLabelDisplay="auto"
              aria-labelledby="edge-width-slider"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="edge-style-label">{t('flow.edgeStyle') ?? 'Edge Style'}</InputLabel>
              <Select
                labelId="edge-style-label"
                value={strokeDashArray}
                onChange={e => setStrokeDashArray(e.target.value)}
                label={t('flow.edgeStyle') ?? 'Edge Style'}
              >
                <MenuItem value="">{t('flow.edgeStyleSolid') ?? 'Solid'}</MenuItem>
                <MenuItem value="5,5">{t('flow.edgeStyleDashed') ?? 'Dashed'}</MenuItem>
                <MenuItem value="1,5">{t('flow.edgeStyleDotted') ?? 'Dotted'}</MenuItem>
                <MenuItem value="10,5,5,5">{t('flow.edgeStyleDashDot') ?? 'Dash-Dot'}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              {t('flow.behavior') ?? 'Behavior'}
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel id="edge-type-label">{t('flow.edgeType') ?? 'Edge Type'}</InputLabel>
              <Select
                labelId="edge-type-label"
                value={edgeType}
                onChange={e => setEdgeType(e.target.value)}
                label={t('flow.edgeType') ?? 'Edge Type'}
              >
                <MenuItem value="default">{t('flow.edgeTypeDefault') ?? 'Default'}</MenuItem>
                <MenuItem value="straight">{t('flow.edgeTypeStraight') ?? 'Straight'}</MenuItem>
                <MenuItem value="step">{t('flow.edgeTypeStep') ?? 'Step'}</MenuItem>
                <MenuItem value="smoothstep">{t('flow.edgeTypeSmoothStep') ?? 'Smooth Step'}</MenuItem>
                <MenuItem value="bezier">{t('flow.edgeTypeBezier') ?? 'Bezier'}</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={animated}
                  onChange={e => setAnimated(e.target.checked)}
                  color="primary"
                />
              }
              label={t('flow.animateEdge') ?? 'Animate Edge'}
              sx={{ mt: 2, mb: 1 }}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="edge-label-label">{t('flow.edgeLabel') ?? 'Edge Label'}</InputLabel>
              <Select
                labelId="edge-label-label"
                value={label}
                onChange={e => setLabel(e.target.value)}
                label={t('flow.edgeLabel') ?? 'Edge Label'}
              >
                <MenuItem value="">{t('flow.edgeLabelNone') ?? 'None'}</MenuItem>
                <MenuItem value="connects">{t('flow.edgeLabelConnects') ?? 'Connects'}</MenuItem>
                <MenuItem value="leads to">{t('flow.edgeLabelLeadsTo') ?? 'Leads to'}</MenuItem>
                <MenuItem value="depends on">{t('flow.edgeLabelDependsOn') ?? 'Depends on'}</MenuItem>
                <MenuItem value="relates to">{t('flow.edgeLabelRelatesTo') ?? 'Relates to'}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            {t('flow.preview') ?? 'Preview'}
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 200 100">
              <defs>
                {animated && (
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="10"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
                  </marker>
                )}
              </defs>
              <path
                d="M 20,50 H 180"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDashArray}
                fill="none"
                markerEnd={animated ? 'url(#arrowhead)' : undefined}
              />
              {label && (
                <text x="100" y="40" textAnchor="middle" fill={strokeColor} fontSize="12">{label}</text>
              )}
            </svg>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel') ?? 'Cancel'}</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {t('common.save') ?? 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EdgeStyleDialog;
