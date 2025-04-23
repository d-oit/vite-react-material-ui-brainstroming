import { useTheme, useMediaQuery } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import type { Node } from 'reactflow'
import { useReactFlow, ReactFlowInstance } from 'reactflow'

interface NodeWidth {
	mobile: number
	tablet: number
	desktop: number
}

interface ResponsiveFlowConfig {
	mobileBreakpoint: number
	tabletBreakpoint: number
	desktopMinWidth: number
	nodeWidth: NodeWidth
}

interface ResponsiveFlowState {
	isMobile: boolean
	isTablet: boolean
	isDesktop: boolean
	currentNodeWidth: number
}

const defaultConfig: ResponsiveFlowConfig = {
	mobileBreakpoint: 600,
	tabletBreakpoint: 960,
	desktopMinWidth: 1280,
	nodeWidth: {
		mobile: 200,
		tablet: 250,
		desktop: 300,
	},
}

export function useResponsiveFlow(customConfig?: Partial<ResponsiveFlowConfig>) {
	const theme = useTheme()
	const config = { ...defaultConfig, ...customConfig }

	const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
	const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
	const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

	const { fitView, setCenter, getNodes, setNodes } = useReactFlow<Node>()

	const getCurrentNodeWidth = useCallback(() => {
		if (isMobile) return config.nodeWidth.mobile
		if (isTablet) return config.nodeWidth.tablet
		return config.nodeWidth.desktop
	}, [isMobile, isTablet, config.nodeWidth])

	const [state, setState] = useState<ResponsiveFlowState>({
		isMobile,
		isTablet,
		isDesktop,
		currentNodeWidth: getCurrentNodeWidth(),
	})

	const updateLayout = useCallback(() => {
		const nodes = getNodes()
		const updatedNodes = nodes.map((node) => ({
			...node,
			style: { ...node.style, width: state.currentNodeWidth },
		}))
		setNodes(updatedNodes)
		setTimeout(() => {
			fitView({ padding: 0.2 })
		}, 50)
	}, [fitView, getNodes, setNodes, state.currentNodeWidth])

	useEffect(() => {
		setState({
			isMobile,
			isTablet,
			isDesktop,
			currentNodeWidth: getCurrentNodeWidth(),
		})
	}, [isMobile, isTablet, isDesktop, getCurrentNodeWidth])

	useEffect(() => {
		updateLayout()
	}, [state.currentNodeWidth, updateLayout])

	const centerView = useCallback(() => {
		const nodes = getNodes()
		if (nodes.length === 0) return
		const [firstNode] = nodes
		setCenter(firstNode.position.x, firstNode.position.y, { duration: 800 })
	}, [getNodes, setCenter])

	return {
		...state,
		updateLayout,
		centerView,
	}
}
