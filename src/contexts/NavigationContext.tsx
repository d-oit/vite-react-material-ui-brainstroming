import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import type { NavigationItem, NavigationError } from '../types/navigation'

interface NavigationContextType {
	items: NavigationItem[]
	activeItemId: string | null
	expandedSections: string[]
	error: NavigationError | null
	isLoading: boolean
	toggleSection: (sectionId: string) => void
	setActiveItem: (itemId: string) => void
	searchItems: (query: string) => NavigationItem[]
	retryLoading: () => Promise<void>
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

interface NavigationProviderProps {
	children: ReactNode
	initialItems: NavigationItem[]
}

export const NavigationProvider = ({ children, initialItems }: NavigationProviderProps) => {
	const location = useLocation()
	// We're using initialItems directly and don't need to update items
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [items, setItems] = useState<NavigationItem[]>(initialItems)
	const [activeItemId, setActiveItemId] = useState<string | null>(null)
	const [expandedSections, setExpandedSections] = useState<string[]>([])
	const [error, setError] = useState<NavigationError | null>(null)
	const [isLoading, setIsLoading] = useState<boolean>(false)

	// Find active item based on current path
	useEffect(() => {
		const findActiveItem = (items: NavigationItem[]): string | null => {
			for (const item of items) {
				if (item.path && location.pathname.startsWith(item.path)) {
					return item.id
				}
				if (item.children) {
					const activeChildId = findActiveItem(item.children)
					if (activeChildId) {
						// Auto-expand parent sections when child is active
						if (!expandedSections.includes(item.id)) {
							setExpandedSections((prev) => [...prev, item.id])
						}
						return activeChildId
					}
				}
			}
			return null
		}

		const activeId = findActiveItem(items)
		setActiveItemId(activeId)
	}, [location.pathname, items, expandedSections])

	const toggleSection = useCallback((sectionId: string) => {
		setExpandedSections((prev) =>
			prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
		)
	}, [])

	const setActiveItem = useCallback((itemId: string) => {
		setActiveItemId(itemId)
	}, [])

	const searchItems = useCallback(
		(query: string): NavigationItem[] => {
			if (!query.trim()) return []

			const searchTerm = query.toLowerCase()
			const results: NavigationItem[] = []

			const searchInItems = (items: NavigationItem[]) => {
				for (const item of items) {
					if (item.label.toLowerCase().includes(searchTerm)) {
						results.push(item)
					}
					if (item.children) {
						searchInItems(item.children)
					}
				}
			}

			searchInItems(items)
			return results
		},
		[items],
	)

	const retryLoading = useCallback(async () => {
		if (!error || !error.retry) return

		setIsLoading(true)
		setError(null)

		try {
			await error.retry()
		} catch (_) {
			setError({
				type: 'load',
				severity: 'error',
				retry: error.retry,
				fallback: error.fallback,
			})
		} finally {
			setIsLoading(false)
		}
	}, [error])

	const contextValue = useMemo(
		() => ({
			items,
			activeItemId,
			expandedSections,
			error,
			isLoading,
			toggleSection,
			setActiveItem,
			searchItems,
			retryLoading,
		}),
		[
			items,
			activeItemId,
			expandedSections,
			error,
			isLoading,
			toggleSection,
			setActiveItem,
			searchItems,
			retryLoading,
		],
	)

	return <NavigationContext.Provider value={contextValue}>{children}</NavigationContext.Provider>
}

export const useNavigation = () => {
	const context = useContext(NavigationContext)
	if (context === undefined) {
		throw new Error('useNavigation must be used within a NavigationProvider')
	}
	return context
}
