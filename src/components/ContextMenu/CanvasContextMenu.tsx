import AddIcon from '@mui/icons-material/Add';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import MapIcon from '@mui/icons-material/Map';
import React from 'react';

import ContextMenu, { ContextMenuItem } from './ContextMenu';

interface CanvasContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onAddNode: () => void;
  onPaste: () => void;
  onFitView: () => void;
  onToggleMinimap: () => void;
  hasClipboardContent?: boolean;
  minimapEnabled?: boolean;
}

const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  position,
  onClose,
  onAddNode,
  onPaste,
  onFitView,
  onToggleMinimap,
  hasClipboardContent = false,
  minimapEnabled = false,
}) => {
  const menuItems: ContextMenuItem[] = [
    {
      label: 'Add Node',
      icon: <AddIcon />,
      onClick: onAddNode,
    },
    {
      label: 'Paste from Clipboard',
      icon: <ContentPasteIcon />,
      onClick: onPaste,
      disabled: !hasClipboardContent,
    },
    {
      label: 'Fit View',
      icon: <CenterFocusStrongIcon />,
      onClick: onFitView,
    },
    {
      label: `${minimapEnabled ? 'Hide' : 'Show'} Mini-map`,
      icon: <MapIcon />,
      onClick: onToggleMinimap,
    },
  ];

  return (
    <ContextMenu
      items={menuItems}
      position={position}
      onClose={onClose}
      data-testid="canvas-context-menu"
    />
  );
};

export default CanvasContextMenu;
