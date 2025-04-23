export interface AccessibilityConfig {
  skipLinks: boolean;
  focusTraps: string[]; // Array of selector strings for modal/dialog elements
}

export class AccessibilityService {
	private config: AccessibilityConfig
	private rootElement: HTMLElement
	private focusableElements: string =
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

	constructor(rootElement: HTMLElement, config: AccessibilityConfig) {
		this.rootElement = rootElement
		this.config = config
		this.init()
	}

	private init(): void {
		this.setupAriaAttributes()
		this.setupFocusTraps()
		if (this.config.skipLinks) {
			this.setupSkipLinks()
		}
	}

	private setupAriaAttributes(): void {
		// Add aria-live regions for dynamic content
		const dynamicRegions = this.rootElement.querySelectorAll('[data-dynamic-content]')
		dynamicRegions.forEach((region) => {
			region.setAttribute('aria-live', 'polite')
		})

		// Handle SVG accessibility
		const svgs = this.rootElement.querySelectorAll('svg')
		svgs.forEach((svg) => {
			if (!svg.getAttribute('aria-label')) {
				svg.setAttribute('role', 'img')
				const title = svg.querySelector('title')
				if (title) {
					svg.setAttribute('aria-labelledby', title.id || this.generateId())
				}
			}
		})

		// Set tabindex for focusable non-interactive elements
		const nonInteractiveElements = this.rootElement.querySelectorAll(
			'div[role="button"], div[role="link"]',
		)
		nonInteractiveElements.forEach((element) => {
			if (!element.getAttribute('tabindex')) {
				element.setAttribute('tabindex', '0')
			}
		})
	}

	private setupFocusTraps(): void {
		this.config.focusTraps.forEach((selector) => {
			const trapElement = this.rootElement.querySelector(selector)
			if (trapElement) {
				this.createFocusTrap(trapElement as HTMLElement)
			}
		})
	}

	private createFocusTrap(element: HTMLElement): void {
		element.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key !== 'Tab') return

			const focusableElements =
        element.querySelectorAll<HTMLElement>(this.focusableElements)
			const firstFocusable = focusableElements[0]
			const lastFocusable = focusableElements[focusableElements.length - 1]

			// Shift + Tab
			if (e.shiftKey) {
				if (document.activeElement === firstFocusable) {
					e.preventDefault()
					lastFocusable.focus()
				}
			}
			// Tab
			else {
				if (document.activeElement === lastFocusable) {
					e.preventDefault()
					firstFocusable.focus()
				}
			}
		})
	}

	private setupSkipLinks(): void {
		const mainContent = this.rootElement.querySelector('main')
		if (mainContent) {
			const skipLink = document.createElement('a')
			skipLink.href = '#' + (mainContent.id || this.generateId())
			skipLink.textContent = 'Skip to main content'
			skipLink.className = 'skip-link'
			this.rootElement.insertBefore(skipLink, this.rootElement.firstChild)
		}
	}

	private generateId(): string {
		return 'a11y-' + Math.random().toString(36).substr(2, 9)
	}

	// Public methods for dynamic content management
	public announceMessage(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
		const announcer = document.createElement('div')
		announcer.setAttribute('aria-live', priority)
		announcer.className = 'sr-only'
		this.rootElement.appendChild(announcer)

		// Use timeout to ensure screen readers catch the change
		setTimeout(() => {
			announcer.textContent = message
			setTimeout(() => announcer.remove(), 3000)
		}, 100)
	}

	public trapFocus(element: HTMLElement): void {
		this.createFocusTrap(element)
	}

	public updateAriaLabel(element: HTMLElement, label: string): void {
		element.setAttribute('aria-label', label)
	}
}
