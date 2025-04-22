// Import polyfills first
import './polyfills/global'

import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import './index.css'
import './styles/accessibility.css'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import { ErrorNotificationProvider } from './contexts/ErrorNotificationContext'
import { I18nProvider } from './contexts/I18nContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<ErrorBoundary>
			<I18nProvider defaultLocale="en">
				<ErrorNotificationProvider>
					<App />
				</ErrorNotificationProvider>
			</I18nProvider>
		</ErrorBoundary>
	</React.StrictMode>,
)
