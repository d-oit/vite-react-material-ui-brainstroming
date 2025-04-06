import { Link } from '@mui/material';
import React from 'react';

interface SkipLinkProps {
  targetId: string;
  label?: string;
}

/**
 * SkipLink component for keyboard users to skip to main content
 * This is an accessibility feature that allows keyboard users to skip navigation
 * and go directly to the main content
 */
export const SkipLink: React.FC<SkipLinkProps> = ({ targetId, label = 'Skip to main content' }) => {
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
        padding: 1,
        zIndex: 9999,
        '&:focus': {
          top: 0,
        },
      }}
    >
      {label}
    </Link>
  );
};

export default SkipLink;
