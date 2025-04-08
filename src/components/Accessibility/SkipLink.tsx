import { Link, useTheme } from '@mui/material';
import React from 'react';

import { useI18n } from '../../contexts/I18nContext';

interface SkipLinkProps {
  targetId: string;
  label?: string;
}

/**
 * SkipLink component for keyboard users to skip to main content
 * This is an accessibility feature that allows keyboard users to skip navigation
 * and go directly to the main content
 */
export const SkipLink: React.FC<SkipLinkProps> = ({ targetId, label }) => {
  const { t } = useI18n();
  const theme = useTheme();
  const defaultLabel = t('accessibility.skipToContent') || 'Skip to main content';
  return (
    <Link
      className="skip-link"
      href={`#${targetId}`}
      sx={{
        position: 'absolute',
        top: '-40px',
        left: 0,
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        padding: theme.spacing(1, 2),
        zIndex: theme.zIndex.tooltip + 1,
        textDecoration: 'none',
        borderRadius: '0 0 4px 0',
        fontWeight: 500,
        transition: 'top 0.2s ease-in-out',
        '&:focus': {
          top: 0,
          outline: `2px solid ${theme.palette.primary.dark}`,
          outlineOffset: 2,
        },
      }}
    >
      {label || defaultLabel}
    </Link>
  );
};

export default SkipLink;
