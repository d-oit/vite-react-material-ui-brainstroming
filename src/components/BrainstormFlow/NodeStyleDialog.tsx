import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  // TextField is not used in this component
  Box,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { TwitterPicker } from 'react-color';

import { useI18n } from '../../contexts/I18nContext';
import type { Node } from '../../types';

interface NodeStyleDialogProps {
  open: boolean;
  onClose: () => void;
  node: Node | null;
  onSave: (nodeId: string, style: Record<string, unknown>) => void;
}

export const NodeStyleDialog: React.FC<NodeStyleDialogProps> = ({
  open,
  onClose,
  node,
  onSave,
}) => {
  const { t } = useI18n();
  // Initialize state with default values
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [borderWidth, setBorderWidth] = useState<number>(1);
  const [borderRadius, setBorderRadius] = useState<number>(5);
  const [fontSize, setFontSize] = useState<number>(14);
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [textColor, setTextColor] = useState<string>('#000000');

  // Update state when node changes or dialog opens
  useEffect(() => {
    if (node && open) {
      setBackgroundColor((node.style?.backgroundColor as string) ?? '#ffffff');
      setBorderColor((node.style?.borderColor as string) ?? '#000000');
      setBorderWidth((node.style?.borderWidth as number) ?? 1);
      setBorderRadius((node.style?.borderRadius as number) ?? 5);
      setFontSize((node.style?.fontSize as number) ?? 14);
      setFontFamily((node.style?.fontFamily as string) ?? 'Arial');
      setTextColor((node.style?.color as string) ?? '#000000');
    }
  }, [node, open]);

  const handleSave = () => {
    if (!node) return;

    const style = {
      backgroundColor,
      borderColor,
      borderWidth,
      borderRadius,
      fontSize,
      fontFamily,
      color: textColor,
    };

    onSave(node.id, style);
    onClose();
  };

  if (!node) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('flow.styleNode') ?? 'Style Node'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              {t('flow.background') ?? 'Background'}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('flow.backgroundColor') ?? 'Background Color'}
              </Typography>
              <TwitterPicker
                color={backgroundColor}
                onChange={color => setBackgroundColor(color.hex)}
                triangle="hide"
                width="100%"
              />
            </Box>

            <Typography variant="h6" gutterBottom>
              {t('flow.border') ?? 'Border'}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('flow.borderColor') ?? 'Border Color'}
              </Typography>
              <TwitterPicker
                color={borderColor}
                onChange={color => setBorderColor(color.hex)}
                triangle="hide"
                width="100%"
              />
            </Box>

            <Typography gutterBottom>
              {t('flow.borderWidth') ?? 'Border Width'}: {borderWidth}px
            </Typography>
            <Slider
              value={borderWidth}
              onChange={(_, value) => setBorderWidth(value as number)}
              min={0}
              max={10}
              step={1}
              valueLabelDisplay="auto"
              aria-labelledby="border-width-slider"
            />

            <Typography gutterBottom>
              {t('flow.borderRadius') ?? 'Border Radius'}: {borderRadius}px
            </Typography>
            <Slider
              value={borderRadius}
              onChange={(_, value) => setBorderRadius(value as number)}
              min={0}
              max={20}
              step={1}
              valueLabelDisplay="auto"
              aria-labelledby="border-radius-slider"
            />
          </Grid>

          <Grid item size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              {t('flow.text') ?? 'Text'}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('flow.textColor') ?? 'Text Color'}
              </Typography>
              <TwitterPicker
                color={textColor}
                onChange={color => setTextColor(color.hex)}
                triangle="hide"
                width="100%"
              />
            </Box>

            <Typography gutterBottom>
              {t('flow.fontSize') ?? 'Font Size'}: {fontSize}px
            </Typography>
            <Slider
              value={fontSize}
              onChange={(_, value) => setFontSize(value as number)}
              min={8}
              max={24}
              step={1}
              valueLabelDisplay="auto"
              aria-labelledby="font-size-slider"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="font-family-label">
                {t('flow.fontFamily') ?? 'Font Family'}
              </InputLabel>
              <Select
                labelId="font-family-label"
                value={fontFamily}
                onChange={e => setFontFamily(e.target.value)}
                label={t('flow.fontFamily') ?? 'Font Family'}
              >
                <MenuItem value="Arial">Arial</MenuItem>
                <MenuItem value="Helvetica">Helvetica</MenuItem>
                <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                <MenuItem value="Courier New">Courier New</MenuItem>
                <MenuItem value="Verdana">Verdana</MenuItem>
                <MenuItem value="Georgia">Georgia</MenuItem>
                <MenuItem value="Palatino">Palatino</MenuItem>
                <MenuItem value="Garamond">Garamond</MenuItem>
                <MenuItem value="Bookman">Bookman</MenuItem>
                <MenuItem value="Comic Sans MS">Comic Sans MS</MenuItem>
                <MenuItem value="Trebuchet MS">Trebuchet MS</MenuItem>
                <MenuItem value="Arial Black">Arial Black</MenuItem>
                <MenuItem value="Impact">Impact</MenuItem>
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
              backgroundColor,
              borderColor,
              borderWidth: `${borderWidth}px`,
              borderRadius: `${borderRadius}px`,
              borderStyle: 'solid',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: textColor,
              fontFamily,
              fontSize: `${fontSize}px`,
            }}
          >
            {node.data.title || 'Node Title'}
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

export default NodeStyleDialog;
