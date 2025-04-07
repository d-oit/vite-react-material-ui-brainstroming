import React, { createContext, useContext, useState, useCallback } from 'react';

import type { ActionFeedbackType } from '../components/UI/ActionFeedback';
import ActionFeedback from '../components/UI/ActionFeedback';

interface ActionFeedbackContextType {
  showFeedback: (message: string, type: ActionFeedbackType, duration?: number) => void;
  showLoading: (message: string, autoClose?: boolean) => string;
  updateLoading: (id: string, message: string, progress?: number) => void;
  completeLoading: (id: string, message: string, type?: 'success' | 'error') => void;
  hideFeedback: () => void;
}

const ActionFeedbackContext = createContext<ActionFeedbackContextType | undefined>(undefined);

interface ActionFeedbackProviderProps {
  children: React.ReactNode;
}

export const ActionFeedbackProvider: React.FC<ActionFeedbackProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ActionFeedbackType>('info');
  const [duration, setDuration] = useState(4000);
  const [progress, setProgress] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Show feedback
  const showFeedback = useCallback((message: string, type: ActionFeedbackType, duration = 4000) => {
    setMessage(message);
    setType(type);
    setDuration(duration);
    setProgress(0);
    setLoadingId(null);
    setOpen(true);
  }, []);

  // Show loading feedback
  const showLoading = useCallback((message: string, autoClose = false) => {
    const id = `loading-${Date.now()}`;
    setMessage(message);
    setType('loading');
    setDuration(autoClose ? 10000 : null);
    setProgress(0);
    setLoadingId(id);
    setOpen(true);
    return id;
  }, []);

  // Update loading feedback
  const updateLoading = useCallback(
    (id: string, message: string, progress = 0) => {
      if (id === loadingId) {
        setMessage(message);
        setProgress(progress);
      }
    },
    [loadingId]
  );

  // Complete loading feedback
  const completeLoading = useCallback(
    (id: string, message: string, type: 'success' | 'error' = 'success') => {
      if (id === loadingId) {
        setMessage(message);
        setType(type);
        setProgress(100);
        setDuration(4000);

        // Auto-close after a delay
        setTimeout(() => {
          setOpen(false);
        }, 4000);
      }
    },
    [loadingId]
  );

  // Hide feedback
  const hideFeedback = useCallback(() => {
    setOpen(false);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    if (type !== 'loading' || duration) {
      setOpen(false);
    }
  }, [type, duration]);

  return (
    <ActionFeedbackContext.Provider
      value={{
        showFeedback,
        showLoading,
        updateLoading,
        completeLoading,
        hideFeedback,
      }}
    >
      {children}
      <ActionFeedback
        message={message}
        type={type}
        open={open}
        onClose={handleClose}
        autoHideDuration={duration}
        showProgress={type === 'loading'}
        progressValue={progress}
      />
    </ActionFeedbackContext.Provider>
  );
};

export const useActionFeedback = (): ActionFeedbackContextType => {
  const context = useContext(ActionFeedbackContext);
  if (!context) {
    throw new Error('useActionFeedback must be used within an ActionFeedbackProvider');
  }
  return context;
};

export default ActionFeedbackContext;
