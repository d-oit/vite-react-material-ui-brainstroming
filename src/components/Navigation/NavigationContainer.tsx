import { Box, Drawer as MuiDrawer, Paper, useMediaQuery, useTheme } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useNavigation } from '../../contexts/NavigationContext';
import { breakpointConfig } from '../../types/navigation';

import NavigationErrorDisplay from './NavigationErrorDisplay';
import NavigationItem from './NavigationItem';
import NavigationSearch from './NavigationSearch';

interface NavigationContainerProps {
  open: boolean;
  onClose: () => void;
  ariaLabelledby: string;
}

const NavigationContainer = ({ open, onClose, ariaLabelledby }: NavigationContainerProps) => {
  const theme = useTheme();
  useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { items, error } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(items);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine drawer width based on breakpoint
  const drawerWidth = isDesktop
    ? breakpointConfig.desktop.width
    : isTablet
      ? breakpointConfig.tablet.width
      : breakpointConfig.mobile.width;

  // Determine drawer variant based on breakpoint
  const drawerVariant = isDesktop ? 'persistent' : 'temporary';

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setSearchResults(items);
        return;
      }

      const results = items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()));
      setSearchResults(results);
    },
    [items]
  );

  // Clear search when drawer closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults(items);
    }
  }, [open, items]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '/':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Focus search input
            const searchInput = containerRef.current?.querySelector('input[type="search"]');
            if (searchInput) {
              (searchInput as HTMLInputElement).focus();
            }
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <MuiDrawer
      variant={drawerVariant as 'permanent' | 'persistent' | 'temporary'}
      open={open}
      onClose={onClose}
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'none',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
      aria-labelledby={ariaLabelledby}
    >
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        ref={containerRef}
      >
        {/* Search component */}
        <NavigationSearch value={searchQuery} onChange={handleSearch} />

        {/* Error display */}
        {error && <NavigationErrorDisplay error={error} />}

        {/* Navigation items */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            py: 1,
          }}
          role="navigation"
          aria-labelledby={ariaLabelledby}
        >
          {searchResults.map(item => (
            <NavigationItem key={item.id} item={item} level={0} />
          ))}

          {searchQuery && searchResults.length === 0 && (
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
              No results found for &quot;{searchQuery}&quot;
            </Box>
          )}
        </Box>
      </Paper>
    </MuiDrawer>
  );
};

export default NavigationContainer;
