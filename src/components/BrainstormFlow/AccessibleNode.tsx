import React from 'react';
import { Box, Card, CardContent, Typography, Chip, useTheme } from '@mui/material';

import { useI18n } from '../../contexts/I18nContext';
import type { NodeData } from '../../types';

interface AccessibleNodeProps {
  data: NodeData;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  style?: React.CSSProperties;
}

/**
 * An accessible version of the node component that can be navigated with keyboard
 * This is used for screen readers and keyboard navigation
 */
const AccessibleNode: React.FC<AccessibleNodeProps> = ({
  data,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  style,
}) => {
  const theme = useTheme();
  const { t } = useI18n();

  // Default colors if not provided
  const backgroundColor = style?.backgroundColor || theme.palette.background.paper;
  const borderColor = style?.borderColor || theme.palette.primary.main;
  const textColor = style?.color || theme.palette.text.primary;

  return (
    <Card
      sx={{
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        color: textColor,
        boxShadow: isSelected ? 4 : 2,
        mb: 2,
        transition: 'all 0.2s ease',
        '&:focus': {
          outline: `2px solid ${theme.palette.primary.main}`,
          boxShadow: 4,
        },
      }}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${data.label}: ${data.content}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onSelect();
        } else if (e.key === 'e' || e.key === 'E') {
          onEdit();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          onDelete();
        }
      }}
    >
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          {data.label}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {data.content}
        </Typography>
        {data.tags && data.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {data.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{ backgroundColor: `${borderColor}40` }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessibleNode;
