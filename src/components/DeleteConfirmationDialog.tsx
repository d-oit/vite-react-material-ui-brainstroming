import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
} from '@mui/material';
import React, { useState } from 'react';

import { useSettings } from '../contexts/SettingsContext';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
}) => {
  const { settings, updateSettings } = useSettings();
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleConfirm = () => {
    if (dontAskAgain) {
      updateSettings({ skipDeleteConfirmation: true });
    }
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-confirmation-dialog-title"
      aria-describedby="delete-confirmation-dialog-description"
      data-testid="delete-confirmation-dialog"
    >
      <DialogTitle id="delete-confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-confirmation-dialog-description">{message}</DialogContentText>
        <FormControlLabel
          control={
            <Checkbox
              checked={dontAskAgain}
              onChange={e => setDontAskAgain(e.target.checked)}
              data-testid="dont-ask-again"
            />
          }
          label="Don't ask again"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="error" autoFocus data-testid="confirm-delete">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
