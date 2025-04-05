import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { I18nProvider } from './contexts/I18nContext';
import { ErrorNotificationProvider } from './contexts/ErrorNotificationContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider defaultLocale="en">
      <ErrorNotificationProvider>
        <App />
      </ErrorNotificationProvider>
    </I18nProvider>
  </React.StrictMode>,
);
