import React, { ReactNode } from 'react';
import { ToastProvider } from '../../contexts/ToastContext';

interface ToastProviderWrapperProps {
  children: ReactNode;
}

const ToastProviderWrapper: React.FC<ToastProviderWrapperProps> = ({ children }) => {
  return <ToastProvider>{children}</ToastProvider>;
};

export default ToastProviderWrapper;
