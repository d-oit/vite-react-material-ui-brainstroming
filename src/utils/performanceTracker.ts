import React, { useEffect, useRef } from 'react'

import type { LoggerService } from '../services/LoggerService'

// Define performance metric categories
export enum MetricCategory {
	RENDER = 'render',
	NETWORK = 'network',
	INTERACTION = 'interaction',
	RESOURCE = 'resource',
	CUSTOM = 'custom',
}

// For compatibility with existing code
export enum PerformanceCategory {
	RENDERING = 'rendering',
	DATA_LOADING = 'data_loading',
	USER_INTERACTION = 'user_interaction',
	NETWORK = 'network',
	STORAGE = 'storage',
}

// Define performance metric interface
export interface PerformanceMetric {
	id: string
	name: string
	category: MetricCategory | PerformanceCategory
	startTime: number
	endTime?: number
	duration?: number
	metadata?: Record<string, any>
}

// Define performance budget thresholds
export const PerformanceBudget = {
	RENDER: {
		GOOD: 16, // 60fps (16.67ms)
		ACCEPTABLE: 33, // 30fps (33.33ms)
		POOR: 50, // 20fps (50ms)
	},
	NETWORK: {
		GOOD: 300, // 300ms
		ACCEPTABLE: 1000, // 1s
		POOR: 3000, // 3s
	},
	INTERACTION: {
		GOOD: 100, // 100ms
		ACCEPTABLE: 300, // 300ms
		POOR: 500, // 500ms
	},
}

class PerformanceTracker {
	private metrics: PerformanceMetric[] = []
	private activeMetrics: Map<string, PerformanceMetric> = new Map()
	private isEnabled: boolean = true
	private listeners: Set<(metrics: PerformanceMetric[]) => void> = new Set()
	private logger: Pick<LoggerService, 'info' | 'error' | 'warn' | 'debug' | 'log'>

	constructor() {
		// Use fallback logger with Promise wrappers
		this.logger = {
			info: async (...args) => { console.info(...args); return Promise.resolve() },
			error: async (...args) => { console.error(...args); return Promise.resolve() },
			warn: async (...args) => { console.warn(...args); return Promise.resolve() },
			debug: async (...args) => { console.debug(...args); return Promise.resolve() },
			log: async (...args) => { console.log(...args); return Promise.resolve() },
		}
	}

	public setEnabled(enabled: boolean): void {
		this.isEnabled = enabled
	}

	public startMeasure(
		name: string,
		category: MetricCategory | PerformanceCategory,
		metadata?: Record<string, any>,
	): string {
		if (!this.isEnabled) return ''

		const uniqueId = `${name}_${Math.random().toString(36).substring(2, 9)}`

		const metric: PerformanceMetric = {
			id: uniqueId,
			name,
			category,
			startTime: performance?.now?.() ?? Date.now(),
			metadata,
		}

		this.activeMetrics.set(uniqueId, metric)
		return uniqueId
	}

	public endMeasure(id: string, additionalMetadata?: Record<string, any>): number {
		if (!this.isEnabled || !id) return 0

		const metric = this.activeMetrics.get(id)
		if (!metric) {
			console.warn(`No active metric found with id: ${id}`)
			return 0
		}

		metric.endTime = performance?.now?.() ?? Date.now()
		metric.duration = metric.endTime - metric.startTime

		if (additionalMetadata) {
			metric.metadata = {
				...metric.metadata,
				...additionalMetadata,
			}
		}

		this.metrics.push(metric)
		this.activeMetrics.delete(id)

		this.notifyListeners()
		this.logPerformanceIssue(metric)

		// Log the metric
		try {
			const categoryMap: Record<string, 'performance' | 'network' | 'storage'> = {
				[MetricCategory.RENDER]: 'performance',
				[MetricCategory.INTERACTION]: 'performance',
				[MetricCategory.RESOURCE]: 'performance',
				[MetricCategory.CUSTOM]: 'performance',
				[PerformanceCategory.RENDERING]: 'performance',
				[PerformanceCategory.DATA_LOADING]: 'storage',
				[PerformanceCategory.USER_INTERACTION]: 'performance',
				[PerformanceCategory.STORAGE]: 'storage',
				[MetricCategory.NETWORK]: 'network',
			}

			// Get the appropriate log category based on the metric category
			const logCategory = metric.category === PerformanceCategory.NETWORK
				? 'network'
				: categoryMap[metric.category] || 'performance'

			void this.logger.info(`Performance metric: ${metric.name}`, {
				category: logCategory,
				duration: metric.duration,
				metadata: metric.metadata,
			})
		} catch (error) {
			console.info(`Performance metric: ${metric.name}`, {
				duration: metric.duration,
				metadata: metric.metadata,
			})
		}

		return metric.duration || 0
	}

	private logPerformanceIssue(metric: PerformanceMetric): void {
		if (!metric.duration) return

		let threshold = 0
		let level: 'GOOD' | 'ACCEPTABLE' | 'POOR' = 'GOOD'

		const category = String(metric.category)
		const metricName = String(metric.name || '')

		if (metricName.includes('App.initialization')) {
			threshold = 500
			if (metric.duration > 1000) {
				level = 'POOR'
			} else if (metric.duration > 500) {
				level = 'ACCEPTABLE'
			}
		} else {
			const categoryValues = [String(category)] as Array<MetricCategory | PerformanceCategory>

			if (categoryValues.includes(MetricCategory.RENDER) ||
					categoryValues.includes(PerformanceCategory.RENDERING)) {
				threshold = PerformanceBudget.RENDER.ACCEPTABLE
				if (metric.duration > PerformanceBudget.RENDER.POOR) {
					level = 'POOR'
				} else if (metric.duration > PerformanceBudget.RENDER.ACCEPTABLE) {
					level = 'ACCEPTABLE'
				}
			} else if (categoryValues.includes(MetricCategory.NETWORK) ||
					categoryValues.includes(PerformanceCategory.NETWORK)) {
				threshold = PerformanceBudget.NETWORK.ACCEPTABLE
				if (metric.duration > PerformanceBudget.NETWORK.POOR) {
					level = 'POOR'
				} else if (metric.duration > PerformanceBudget.NETWORK.ACCEPTABLE) {
					level = 'ACCEPTABLE'
				}
			} else if (categoryValues.includes(MetricCategory.INTERACTION) ||
					categoryValues.includes(PerformanceCategory.USER_INTERACTION)) {
				threshold = PerformanceBudget.INTERACTION.ACCEPTABLE
				if (metric.duration > PerformanceBudget.INTERACTION.POOR) {
					level = 'POOR'
				} else if (metric.duration > PerformanceBudget.INTERACTION.ACCEPTABLE) {
					level = 'ACCEPTABLE'
				}
			}
		}

		if (level === 'POOR') {
			console.warn(
				`Performance issue detected: ${metric.name} took ${metric.duration.toFixed(2)}ms (threshold: ${threshold}ms)`,
				metric,
			)
		}
	}

	public getMetrics(): PerformanceMetric[] {
		return [...this.metrics]
	}

	public clearMetrics(): void {
		this.metrics = []
		this.notifyListeners()
	}

	public addListener(listener: (metrics: PerformanceMetric[]) => void): () => void {
		this.listeners.add(listener)
		return () => {
			this.listeners.delete(listener)
		}
	}

	private notifyListeners(): void {
		const metrics = this.getMetrics()
		this.listeners.forEach((listener) => {
			listener(metrics)
		})
	}

	public measureFunction<T>(
		fn: () => T,
		name: string,
		category: MetricCategory | PerformanceCategory,
		metadata?: Record<string, any>,
	): T {
		const id = this.startMeasure(name, category, metadata)
		try {
			return fn()
		} finally {
			this.endMeasure(id)
		}
	}

	public async measureAsyncFunction<T>(
		fn: () => Promise<T>,
		name: string,
		category: MetricCategory | PerformanceCategory,
		metadata?: Record<string, any>,
	): Promise<T> {
		const id = this.startMeasure(name, category, metadata)
		try {
			return await fn()
		} finally {
			this.endMeasure(id)
		}
	}

	public createMethodDecorator(
		category: MetricCategory | PerformanceCategory,
		metadataFn?: (...args: any[]) => Record<string, any>,
	) {
		return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
			const originalMethod = descriptor.value
			const startMeasure = this.startMeasure.bind(this)
			const endMeasure = this.endMeasure.bind(this)

			descriptor.value = function (...args: any[]) {
				const metricName = `${target.constructor.name}.${propertyKey}`
				const metadata = metadataFn ? metadataFn(...args) : undefined

				const metricId = startMeasure(metricName, category, metadata)

				try {
					const result = originalMethod.apply(this, args)

					if (result instanceof Promise) {
						return result.finally(() => {
							endMeasure(metricId)
						})
					}

					endMeasure(metricId)
					return result
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					endMeasure(metricId, { error: errorMessage })
					throw error
				}
			}

			return descriptor
		}
	}

	public wrapComponent<P extends { [key: string]: unknown }>(
		Component: React.ComponentType<P>,
		name?: string,
	): React.FC<P> {
		const componentName = name || Component.displayName || Component.name || 'UnknownComponent'
		const startMeasure = this.startMeasure.bind(this)
		const endMeasure = this.endMeasure.bind(this)

		const WrappedComponent: React.FC<P> = (props) => {
			const metricId = useRef<string>('')

			useEffect(() => {
				metricId.current = startMeasure(
					`${componentName}_render`,
					PerformanceCategory.RENDERING,
					{ propKeys: Object.keys(props as object) },
				)

				return () => {
					endMeasure(metricId.current)
				}
			}, [props])

			return React.createElement<P>(Component, props)
		}

		WrappedComponent.displayName = `PerformanceMonitored(${componentName})`

		return WrappedComponent
	}

	public reportToConsole(): void {
		console.group('Performance Metrics Report')

		const categorized = this.metrics.reduce(
			(acc, metric) => {
				const category = String(metric.category)
				const categoryMetrics = acc[category] ?? []
				acc[category] = categoryMetrics
				categoryMetrics.push(metric)
				return acc
			},
			{} as Record<string, PerformanceMetric[]>,
		)

		Object.entries(categorized).forEach(([category, metrics]) => {
			console.group(`Category: ${category}`)

			metrics
				.sort((a, b) => {
					const durationA = typeof a.duration === 'number' ? a.duration : 0
					const durationB = typeof b.duration === 'number' ? b.duration : 0
					return durationB - durationA
				})
				.forEach((metric) => {
					const duration = typeof metric.duration === 'number'
						? metric.duration.toFixed(2)
						: '0.00'
					console.log(`${metric.name}: ${duration}ms`, metric.metadata ?? {})
				})

			console.groupEnd()
		})

		console.groupEnd()
	}
}

export const performanceTracker = new PerformanceTracker()

export function useRenderPerformance(componentName: string): void {
	const metricId = useRef<string>('')

	useEffect(() => {
		metricId.current = performanceTracker.startMeasure(
			`${componentName}_render`,
			MetricCategory.RENDER,
		)

		return () => {
			performanceTracker.endMeasure(metricId.current)
		}
	})
}

export function useMountPerformance(componentName: string, dependencies: any[] = []): void {
	useEffect(() => {
		const id = performanceTracker.startMeasure(
			`${componentName}_mount`,
			MetricCategory.RENDER,
		)

		return () => {
			performanceTracker.endMeasure(id)
		}
	}, [componentName, ...dependencies])
}

export function withPerformanceTracking<P extends object>(
	Component: React.ComponentType<P>,
	name?: string,
): React.FC<P> {
	const displayName = name || Component.displayName || Component.name || 'Component'

	const WrappedComponent: React.FC<P> = (props) => {
		useRenderPerformance(displayName)
		return React.createElement(Component, props)
	}

	WrappedComponent.displayName = `WithPerformanceTracking(${displayName})`

	return WrappedComponent
}

export function measurePerformance(category: MetricCategory | PerformanceCategory) {
	return performanceTracker.createMethodDecorator(category)
}

export function withPerformanceMonitoring<P extends { [key: string]: unknown }>(
	Component: React.ComponentType<P>,
	name?: string,
): React.FC<P> {
	return performanceTracker.wrapComponent<P>(Component, name)
}

export const performanceMonitoring = performanceTracker

export default performanceTracker
