import AddIcon from '@mui/icons-material/Add';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import React from 'react';

import type { Node } from '../../types/models';

import type { ContextMenuItem } from './ContextMenu';
import ContextMenu from './ContextMenu';

interface NodeContextMenuProps {
  node: Node;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onEdit: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onChangeColor: (nodeId: string) => void;
  onAddChild: (nodeId: string) => void;
  onLinkChat: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  node,
  position,
  onClose,
  onEdit,
  onDuplicate,
  onChangeColor,
  onAddChild,
  onLinkChat,
  onDelete,
}) => {
  const menuItems: ContextMenuItem[] = [
    {
      label: 'Edit',
      icon: <EditIcon />,
      onClick: () => onEdit(node.id),
    },
    {
      label: 'Duplicate',
      icon: <ContentCopyIcon />,
      onClick: () => onDuplicate(node.id),
    },
    {
      label: 'Change Color',
      icon: <ColorLensIcon />,
      onClick: () => onChangeColor(node.id),
    },
    {
      label: 'Add Child Node',
      icon: <AddIcon />,
      onClick: () => onAddChild(node.id),
    },
    {
      label: 'Link to Chat Message',
      icon: <LinkIcon />,
      onClick: () => onLinkChat(node.id),
    },
    {
      label: '',
      onClick: () => {},
      divider: true,
    },
    {
      label: 'Delete',
      icon: <DeleteIcon />,
      onClick: () => onDelete(node.id),
    },
  ];

  return (
    <ContextMenu
      items={menuItems}
      position={position}
      onClose={onClose}
      data-testid="node-context-menu"
    />
  );
};

export default NodeContextMenu;
