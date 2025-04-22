import type { ReactNode } from 'react'

export interface NavigationItem {
	id: string
	type: 'section' | 'action' | 'link' | 'custom'
	label: string
	icon: ReactNode
	path?: string
	badge?: number
	children?: NavigationItem[]
	accessLevel: 'basic' | 'admin'
	actionType?: string
	component?: 'accessibility' | 'performance' | string
}

export interface NavigationTheme {
	colors: {
		background: string
		hover: string
		active: string
		text: {
			primary: string
			secondary: string
			active: string
		}
		border: string
		divider: string
	}
	spacing: {
		item: string
		section: string
		indent: string
	}
	typography: {
		size: {
			label: string
			badge: string
		}
		weight: {
			normal: number
			bold: number
		}
	}
}

export interface NavigationConfig {
	preloadDepth: number
	cacheTimeout: number
	virtualizedThreshold: number
	debounceDelay: number
}

export interface NavigationARIA {
	role: 'navigation'
	labelledby: string
	expanded?: boolean
	controls?: string
	hidden?: boolean
}

export interface NavigationError {
	type: 'load' | 'permission' | 'network'
	severity: 'warning' | 'error'
	retry?: () => Promise<void>
	fallback?: NavigationItem[]
}

export interface BreakpointConfig {
	mobile: {
		width: string
		type: 'overlay'
		gesture: boolean
	}
	tablet: {
		width: string
		type: 'collapsible'
		gesture: boolean
	}
	desktop: {
		width: string
		type: 'persistent'
		gesture: boolean
	}
}

export const breakpointConfig: BreakpointConfig = {
	mobile: {
		width: '100%',
		type: 'overlay',
		gesture: true,
	},
	tablet: {
		width: '280px',
		type: 'collapsible',
		gesture: false,
	},
	desktop: {
		width: '320px',
		type: 'persistent',
		gesture: false,
	},
}

export const defaultNavigationConfig: NavigationConfig = {
	preloadDepth: 2,
	cacheTimeout: 5 * 60 * 1000, // 5 minutes
	virtualizedThreshold: 20,
	debounceDelay: 250,
}
