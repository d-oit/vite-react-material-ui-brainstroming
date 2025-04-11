import { Box, Paper, useTheme } from '@mui/material';
import React from 'react';

interface ContentLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarWidth?: number | string;
  sidebarPosition?: 'left' | 'right';
  fullHeight?: boolean;
  noPadding?: boolean;
}

/**
 * A component for laying out content with proper spacing and structure
 */
const ContentLayout: React.FC<ContentLayoutProps> = ({
  children,
  header,
  footer,
  sidebar,
  sidebarWidth = 320,
  sidebarPosition = 'right',
  fullHeight = true,
  noPadding = false,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: fullHeight ? '100%' : 'auto',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      {header && (
        <Box
          sx={{
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {header}
        </Box>
      )}

      {/* Main content with optional sidebar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: sidebarPosition === 'left' ? 'row-reverse' : 'row',
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        {/* Main content area */}
        <Box
          component={Paper}
          elevation={0}
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: noPadding ? 0 : 2,
            borderRadius: 0,
            border: `1px solid ${theme.palette.divider}`,
            borderTop: 'none',
            position: 'relative',
          }}
        >
          {children}
        </Box>

        {/* Sidebar */}
        {sidebar && (
          <Box
            sx={{
              width: sidebarWidth,
              flexShrink: 0,
              borderLeft:
                sidebarPosition === 'right' ? `1px solid ${theme.palette.divider}` : 'none',
              borderRight:
                sidebarPosition === 'left' ? `1px solid ${theme.palette.divider}` : 'none',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {sidebar}
          </Box>
        )}
      </Box>

      {/* Footer */}
      {footer && (
        <Box
          sx={{
            flexShrink: 0,
            mt: 'auto',
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          {footer}
        </Box>
      )}
    </Box>
  );
};

export default ContentLayout;
