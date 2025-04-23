import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { useI18n } from '../../../contexts/I18nContext'
import EnhancedControls from '../EnhancedControls'

// Mock the useI18n hook
vi.mock('../../../contexts/I18nContext', () => ({
	useI18n: vi.fn(),
}))

describe('EnhancedControls', () => {
	beforeEach(() => {
		// Mock the useI18n hook
		(useI18n as any).mockReturnValue({
			t: (key: string) => key,
		})
	})

	it('renders all controls correctly', () => {
		render(
			<EnhancedControls
				onZoomIn={vi.fn()}
				onZoomOut={vi.fn()}
				onFitView={vi.fn()}
				onToggleGrid={vi.fn()}
				onSave={vi.fn()}
				onFullscreen={vi.fn()}
				showGrid={true}
				canUndo={true}
				canRedo={true}
				isFullscreen={false}
				currentZoom={1}
			/>,
		)

		// Check if the save button is rendered
		expect(screen.getByTestId('save-button')).toBeInTheDocument()
	})

	it('hides save button when onSave is not provided', () => {
		render(
			<EnhancedControls
				onZoomIn={vi.fn()}
				onZoomOut={vi.fn()}
				onFitView={vi.fn()}
				onToggleGrid={vi.fn()}
				onSave={undefined}
				onFullscreen={vi.fn()}
				showGrid={true}
				canUndo={true}
				canRedo={true}
				isFullscreen={false}
				currentZoom={1}
			/>,
		)

		// Check if the save button is not rendered
		expect(screen.queryByTestId('save-button')).not.toBeInTheDocument()
	})

	it('shows fullscreen button correctly', () => {
		render(
			<EnhancedControls
				onZoomIn={vi.fn()}
				onZoomOut={vi.fn()}
				onFitView={vi.fn()}
				onToggleGrid={vi.fn()}
				onSave={vi.fn()}
				onFullscreen={vi.fn()}
				showGrid={true}
				canUndo={true}
				canRedo={true}
				isFullscreen={false}
				currentZoom={1}
			/>,
		)

		// Check if the fullscreen button is rendered
		expect(screen.getByLabelText('flow.enterFullscreen')).toBeInTheDocument()
	})

	it('shows exit fullscreen button when in fullscreen mode', () => {
		render(
			<EnhancedControls
				onZoomIn={vi.fn()}
				onZoomOut={vi.fn()}
				onFitView={vi.fn()}
				onToggleGrid={vi.fn()}
				onSave={vi.fn()}
				onFullscreen={vi.fn()}
				showGrid={true}
				canUndo={true}
				canRedo={true}
				isFullscreen={true}
				currentZoom={1}
			/>,
		)

		// Check if the exit fullscreen button is rendered
		expect(screen.getByLabelText('flow.exitFullscreen')).toBeInTheDocument()
	})
})
