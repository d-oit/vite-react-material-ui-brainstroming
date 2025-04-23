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

export interface LayoutResult {
  activeBreakpoint: string;
  layoutRules: Record<string, any>;
}

export class ResponsiveLayoutService {
	private breakpoints: Breakpoint[]

	constructor(breakpoints: Breakpoint[]) {
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
		return match || this.breakpoints[this.breakpoints.length - 1]
	}

	private getLayoutRules(breakpoint: Breakpoint): Record<string, any> {
		// Convert layout string to structured rules
		// Example: "sidebar-collapsed grid-2" -> { sidebar: 'collapsed', grid: 2 }
		return breakpoint.layout.split(' ').reduce((rules, rule) => {
			const [key, value] = rule.split('-')
			rules[key] = !isNaN(Number(value)) ? Number(value) : value
			return rules
		}, {} as Record<string, any>)
	}
}
