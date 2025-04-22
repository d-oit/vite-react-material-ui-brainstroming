import { useEffect, useRef, useState } from 'react'

import performanceMonitoring, { PerformanceCategory } from './performanceMonitoring'

/**
 * Debounce function to limit the rate at which a function can fire
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | null = null

	return function (...args: Parameters<T>): void {
		if (timeoutId) {
			clearTimeout(timeoutId)
		}

		timeoutId = setTimeout(() => {
			fn(...args)
			timeoutId = null
		}, delay)
	}
}

/**
 * Throttle function to limit the rate at which a function can fire
 * @param fn Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void {
	let lastCall = 0

	return function (...args: Parameters<T>): void {
		const now = Date.now()

		if (now - lastCall >= limit) {
			fn(...args)
			lastCall = now
		}
	}
}

/**
 * Memoize function to cache results of expensive function calls
 * @param fn Function to memoize
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T> {
	const cache = new Map<string, ReturnType<T>>()

	return function (...args: Parameters<T>): ReturnType<T> {
		const key = JSON.stringify(args)

		if (cache.has(key)) {
			return cache.get(key) as ReturnType<T>
		}

		const result = fn(...args)
		cache.set(key, result)

		return result
	}
}

/**
 * React hook for lazy loading components
 * @param loadFn Function that loads the component
 * @param options Options for the lazy loading
 * @returns [Component, loading, error]
 */
export function useLazyLoad<T>(
	loadFn: () => Promise<T>,
	options: {
		immediate?: boolean
		onLoad?: (component: T) => void
		onError?: (error: Error) => void
	} = {},
): [T | null, boolean, Error | null] {
	const [component, setComponent] = useState<T | null>(null)
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<Error | null>(null)

	const loadComponent = async () => {
		if (component !== null || loading === true) return

		setLoading(true)

		const metricId = performanceMonitoring.startMeasure('LazyLoad', PerformanceCategory.LOADING)

		try {
			const loadedComponent = await loadFn()
			setComponent(loadedComponent)

			if (options.onLoad) {
				options.onLoad(loadedComponent)
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err))
			setError(error)

			if (options.onError) {
				options.onError(error)
			}
		} finally {
			setLoading(false)
			performanceMonitoring.endMeasure(metricId)
		}
	}

	useEffect(() => {
		if (options.immediate === true) {
			void loadComponent()
		}
	}, [])

	return [component, loading, error]
}

/**
 * React hook for optimizing expensive calculations
 * @param calculateFn Function that performs the calculation
 * @param dependencies Dependencies array that triggers recalculation
 * @returns Calculated value
 */
export function useCalculation<T>(calculateFn: () => T, dependencies: any[]): T {
	const [value, setValue] = useState<T>(() => calculateFn())

	useEffect(() => {
		const metricId = performanceMonitoring.startMeasure('Calculation', PerformanceCategory.PROCESSING)

		const newValue = calculateFn()
		setValue(newValue)

		performanceMonitoring.endMeasure(metricId)
	}, dependencies)

	return value
}

/**
 * React hook for detecting when a component is visible in the viewport
 * @param options IntersectionObserver options
 * @returns [ref, isVisible]
 */
export function useInView(options: IntersectionObserverInit = {}): [React.RefObject<HTMLElement>, boolean] {
	const ref = useRef<HTMLElement>(null)
	const [isVisible, setIsVisible] = useState<boolean>(false)

	useEffect(() => {
		const element = ref.current
		if (!element) return

		const observer = new IntersectionObserver(([entry]) => {
			setIsVisible(entry.isIntersecting)
		}, options)

		observer.observe(element)

		return () => {
			observer.disconnect()
		}
	}, [options])

	return [ref, isVisible]
}

/**
 * React hook for optimizing event handlers
 * @param handler Event handler function
 * @param delay Debounce delay in milliseconds
 * @param dependencies Dependencies array
 * @returns Optimized event handler
 */
export function useOptimizedHandler<T extends (...args: any[]) => any>(
	handler: T,
	delay: number,
	dependencies: any[] = [],
): T {
	const debouncedHandler = useRef<(...args: Parameters<T>) => void>(debounce(handler, delay))

	useEffect(() => {
		debouncedHandler.current = debounce(handler, delay)
	}, dependencies)

	return ((...args: Parameters<T>) => {
		return debouncedHandler.current(...args)
	}) as T
}

/**
 * React hook for optimizing renders
 * @param value Value to memoize
 * @param dependencies Dependencies array
 * @returns Memoized value
 */
export function useDeepMemo<T>(value: T, dependencies: any[]): T {
	const ref = useRef<T>(value)

	useEffect(() => {
		ref.current = value
	}, dependencies)

	return ref.current
}

/**
 * React hook for optimizing animations
 * @param animate Animation function
 * @param duration Animation duration in milliseconds
 * @param dependencies Dependencies array
 * @returns [isAnimating, progress]
 */
export function useAnimation(
	animate: (progress: number) => void,
	duration: number,
	dependencies: any[] = [],
): [boolean, number] {
	const [isAnimating, setIsAnimating] = useState<boolean>(false)
	const [progress, setProgress] = useState<number>(0)

	useEffect(() => {
		setIsAnimating(true)
		setProgress(0)

		const startTime = performance.now()
		let animationFrameId: number

		const updateAnimation = (currentTime: number) => {
			const elapsed = currentTime - startTime
			const newProgress = Math.min(elapsed / duration, 1)

			setProgress(newProgress)
			animate(newProgress)

			if (newProgress < 1) {
				animationFrameId = requestAnimationFrame(updateAnimation)
			} else {
				setIsAnimating(false)
			}
		}

		animationFrameId = requestAnimationFrame(updateAnimation)

		return () => {
			cancelAnimationFrame(animationFrameId)
		}
	}, dependencies)

	return [isAnimating, progress]
}

/**
 * React hook for optimizing resource loading
 * @param resourceUrl URL of the resource to load
 * @param options Options for resource loading
 * @returns [resource, loading, error]
 */
export function useResource<T>(
	resourceUrl: string,
	options: {
		fetcher?: (url: string) => Promise<T>
		immediate?: boolean
		onLoad?: (resource: T) => void
		onError?: (error: Error) => void
	} = {},
): [T | null, boolean, Error | null] {
	const [resource, setResource] = useState<T | null>(null)
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<Error | null>(null)

	const loadResource = async () => {
		if (resource !== null || loading === true) return

		setLoading(true)

		const metricId = performanceMonitoring.startMeasure(`ResourceLoad_${resourceUrl}`, PerformanceCategory.LOADING)

		try {
			const fetcher = options.fetcher || ((url: string) => fetch(url).then((res) => res.json()))
			const loadedResource = await fetcher(resourceUrl)

			setResource(loadedResource)

			if (options.onLoad) {
				options.onLoad(loadedResource)
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err))
			setError(error)

			if (options.onError) {
				options.onError(error)
			}
		} finally {
			setLoading(false)
			performanceMonitoring.endMeasure(metricId)
		}
	}

	useEffect(() => {
		if (options.immediate === true) {
			void loadResource()
		}
	}, [resourceUrl])

	return [resource, loading, error]
}

export default {
	debounce,
	throttle,
	memoize,
	useLazyLoad,
	useCalculation,
	useInView,
	useOptimizedHandler,
	useDeepMemo,
	useAnimation,
	useResource,
}
