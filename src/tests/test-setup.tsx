import { render } from '@testing-library/react'
import type { RenderOptions, RenderResult } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { I18nProvider } from '../contexts/I18nContext'

function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
	return (
		<I18nProvider initialLocale="en">
			<BrowserRouter>
				{children}
			</BrowserRouter>
		</I18nProvider>
	)
}

export function renderWithProviders(
	ui: React.ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
	return render(ui, { wrapper: Wrapper, ...options })
}