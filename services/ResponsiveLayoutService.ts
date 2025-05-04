export interface Viewport {
	width: number;
	height: number;
}

export interface Breakpoint {
	name: string;
	min: number;
	max: number;
	layout: string;
}

export type LayoutRuleValue = string | number;

export interface LayoutResult {
	activeBreakpoint: string;
	layoutRules: Record<string, LayoutRuleValue>;
}

export class ResponsiveLayoutService {
	private breakpoints: Breakpoint[]

	constructor(breakpoints: Breakpoint[]) {
		if (breakpoints.length === 0) {
			throw new Error('At least one breakpoint must be provided')
		}
		// Sort breakpoints by min width ascending for consistent matching
		this.breakpoints = [...breakpoints].sort((a, b) => a.min - b.min)
	}

	public handleViewportChange(viewport: Viewport): LayoutResult {
		const activeBreakpoint = this.findActiveBreakpoint(viewport)
		const layoutRules = this.getLayoutRules(activeBreakpoint)

		return {
			activeBreakpoint: activeBreakpoint.name,
			layoutRules,
		}
	}

	private findActiveBreakpoint(viewport: Viewport): Breakpoint {
		const match = this.breakpoints.find((breakpoint) =>
			viewport.width >= breakpoint.min && viewport.width <= breakpoint.max,
		)

		// If no match is found, use the largest breakpoint as fallback
		// We know breakpoints array is not empty from constructor check
		const lastBreakpoint = this.breakpoints[this.breakpoints.length - 1]
		if (!lastBreakpoint) {
			throw new Error('Breakpoints array is empty')
		}

		return match || lastBreakpoint
	}

	private getLayoutRules(breakpoint: Breakpoint): Record<string, LayoutRuleValue> {
		// Convert layout string to structured rules
		// Example: "sidebar-collapsed grid-2" -> { sidebar: 'collapsed', grid: 2 }
		return breakpoint.layout.split(' ').reduce((rules, rule) => {
			const parts = rule.split('-')
			if (parts.length !== 2) return rules

			const [key, valueStr] = parts
			if (!key || !valueStr) return rules

			const numValue = Number(valueStr)
			const value: LayoutRuleValue = !isNaN(numValue) ? numValue : valueStr
			rules[key] = value

			return rules
		}, {} as Record<string, LayoutRuleValue>)
	}
}
