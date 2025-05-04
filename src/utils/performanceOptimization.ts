import { useEffect, useRef, useState } from 'react'
import type { DependencyList } from 'react'

import performanceMonitoring, { PerformanceCategory } from './performanceMonitoring'

type UnknownFunction = (...args: never[]) => unknown

/**
 * Debounce function to limit the rate at which a function can fire
 */
export function debounce<T extends UnknownFunction>(fn: T, delay: number): (...args: Parameters<T>) => void {
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
 */
export function throttle<T extends UnknownFunction>(fn: T, limit: number): (...args: Parameters<T>) => void {
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
 */
export function memoize<T extends UnknownFunction>(fn: T): T {
	const cache = new Map<string, ReturnType<T>>()

	return ((...args: Parameters<T>): ReturnType<T> => {
		const key = JSON.stringify(args)
		const cachedResult = cache.get(key)

		if (cachedResult !== undefined) {
			return cachedResult
		}

		const result = fn(...args)
		cache.set(key, result as ReturnType<T>)

		return result as ReturnType<T>
	}) as T
}

/**
 * React hook for lazy loading components
 */
export function useLazyLoad<T>(
	loadFn: () => Promise<T>,
	options: {
		immediate?: boolean,
		onLoad?: (component: T) => void,
		onError?: (error: Error) => void,
	} = {},
): [T | null, boolean, Error | null] {
	const [component, setComponent] = useState<T | null>(null)
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<Error | null>(null)
	const loadFnRef = useRef(loadFn)
	const optionsRef = useRef(options)

	const loadComponent = async () => {
		if (component !== null || loading === true) return

		setLoading(true)

		const metricId = performanceMonitoring.startMeasure('LazyLoad', PerformanceCategory.DATA_LOADING)

		try {
			const loadedComponent = await loadFnRef.current()
			setComponent(loadedComponent)

			if (optionsRef.current.onLoad) {
				optionsRef.current.onLoad(loadedComponent)
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err))
			setError(error)

			if (optionsRef.current.onError) {
				optionsRef.current.onError(error)
			}
		} finally {
			setLoading(false)
			performanceMonitoring.endMeasure(metricId)
		}
	}

	useEffect(() => {
		loadFnRef.current = loadFn
		optionsRef.current = options

		if (options.immediate === true) {
			void loadComponent()
		}
	}, [loadFn, options, loadComponent])

	return [component, loading, error]
}

/**
 * React hook for optimizing expensive calculations
 */
export function useCalculation<T>(calculateFn: () => T, dependencies: readonly unknown[]): T {
	const [value, setValue] = useState<T>(() => calculateFn())
	const calculateFnRef = useRef(calculateFn)

	useEffect(() => {
		calculateFnRef.current = calculateFn
	}, [calculateFn])

	useEffect(() => {
		const metricId = performanceMonitoring.startMeasure('Calculation', PerformanceCategory.RENDERING)
		const newValue = calculateFnRef.current()
		setValue(newValue)
		performanceMonitoring.endMeasure(metricId)
	}, [calculateFnRef, ...dependencies])

	return value
}

/**
 * React hook for detecting when a component is visible in the viewport
 */
export function useInView(options: IntersectionObserverInit = {}): [React.RefObject<HTMLElement>, boolean] {
	const ref = useRef<HTMLElement>(null)
	const [isVisible, setIsVisible] = useState<boolean>(false)
	const optionsRef = useRef(options)

	useEffect(() => {
		optionsRef.current = options
	}, [options])

	useEffect(() => {
		const element = ref.current
		if (!element) return

		const observer = new IntersectionObserver(([entry]) => {
			setIsVisible(entry.isIntersecting)
		}, optionsRef.current)

		observer.observe(element)

		return () => observer.disconnect()
	}, [])

	return [ref, isVisible]
}

/**
 * React hook for optimizing event handlers
 */
export function useOptimizedHandler<T extends UnknownFunction>(
	handler: T,
	delay: number,
	dependencies: readonly unknown[] = [],
): T {
	const handlerRef = useRef(handler)

	useEffect(() => {
		handlerRef.current = handler
	}, [handler])

	const debouncedHandlerRef = useRef<T>(
		debounce((...args: Parameters<T>) => handlerRef.current(...args), delay) as T,
	)

	useEffect(() => {
		debouncedHandlerRef.current = debounce(
			(...args: Parameters<T>) => handlerRef.current(...args),
			delay,
		) as T
	}, [delay, handler, ...dependencies])

	return debouncedHandlerRef.current
}

/**
 * React hook for optimizing renders
 */
export function useDeepMemo<T>(value: T, dependencies: readonly unknown[]): T {
	const ref = useRef<T>(value)

	useEffect(() => {
		ref.current = value
	}, [value, ...dependencies])

	return ref.current
}

/**
 * React hook for optimizing animations
 */
export function useAnimation(
	animate: (progress: number) => void,
	duration: number,
	dependencies: readonly unknown[] = [],
): [boolean, number] {
	const [isAnimating, setIsAnimating] = useState<boolean>(false)
	const [progress, setProgress] = useState<number>(0)
	const animateRef = useRef(animate)

	useEffect(() => {
		animateRef.current = animate
	}, [animate])

	useEffect(() => {
		setIsAnimating(true)
		setProgress(0)

		const startTime = performance.now()
		let animationFrameId: number

		const updateAnimation = (currentTime: number) => {
			const elapsed = currentTime - startTime
			const newProgress = Math.min(elapsed / duration, 1)

			setProgress(newProgress)
			animateRef.current(newProgress)

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
	}, [duration, animate, ...dependencies])

	return [isAnimating, progress]
}

/**
 * React hook for optimizing resource loading
 */
export function useResource<T>(
	resourceUrl: string,
	options: {
		fetcher?: (url: string) => Promise<T>,
		immediate?: boolean,
		onLoad?: (resource: T) => void,
		onError?: (error: Error) => void,
	} = {},
): [T | null, boolean, Error | null] {
	const [resource, setResource] = useState<T | null>(null)
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<Error | null>(null)
	const optionsRef = useRef(options)
	const resourceUrlRef = useRef(resourceUrl)

	useEffect(() => {
		optionsRef.current = options
		resourceUrlRef.current = resourceUrl
	}, [options, resourceUrl])

	const loadResource = async () => {
		if (resource !== null || loading === true) return

		setLoading(true)

		const metricId = performanceMonitoring.startMeasure(
			`ResourceLoad_${resourceUrlRef.current}`,
			PerformanceCategory.DATA_LOADING,
		)

		try {
			const fetcher = optionsRef.current.fetcher ?? ((url: string) => fetch(url).then((res) => res.json()))
			const loadedResource = await fetcher(resourceUrlRef.current)

			setResource(loadedResource)

			if (optionsRef.current.onLoad) {
				optionsRef.current.onLoad(loadedResource)
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err))
			setError(error)

			if (optionsRef.current.onError) {
				optionsRef.current.onError(error)
			}
		} finally {
			setLoading(false)
			performanceMonitoring.endMeasure(metricId)
		}
	}

	useEffect(() => {
		if (optionsRef.current.immediate === true) {
			void loadResource()
		}
	}, [resourceUrl, options])

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
