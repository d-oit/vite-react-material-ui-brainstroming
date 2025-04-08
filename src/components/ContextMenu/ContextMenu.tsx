import type { MenuProps } from '@mui/material';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import React from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  divider?: boolean;
  disabled?: boolean;
  children?: ContextMenuItem[];
}

interface ContextMenuProps extends Omit<MenuProps, 'open'> {
  items: ContextMenuItem[];
  position: { x: number; y: number } | null;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ items, position, onClose, ...menuProps }) => {
  const handleItemClick = (callback: () => void) => {
    callback();
    onClose();
  };

  const renderMenuItems = (menuItems: ContextMenuItem[]) => {
    return menuItems.map((item, index) => {
      if (item.divider) {
        return <Divider key={`divider-${index}`} />;
      }

      return (
        <MenuItem
          key={`${item.label}-${index}`}
          onClick={() => handleItemClick(item.onClick)}
          disabled={item.disabled}
        >
          {Boolean(item.icon) && <ListItemIcon>{item.icon}</ListItemIcon>}
          <ListItemText primary={item.label} />
        </MenuItem>
      );
    });
  };

  return (
    <Menu
      {...menuProps}
      open={Boolean(position)}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={position ? { top: position.y, left: position.x } : undefined}
      elevation={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transitionDuration={200}
      disablePortal
      onKeyDown={e => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
    >
      {renderMenuItems(items)}
    </Menu>
  );
};

export default ContextMenu;
