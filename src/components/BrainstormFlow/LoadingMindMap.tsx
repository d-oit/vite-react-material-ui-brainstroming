import { Box, CircularProgress, Typography } from '@mui/material'
import React from 'react'

import { useI18n } from '../../contexts/I18nContext'

interface LoadingMindMapProps {
	message?: string
}

export const LoadingMindMap: React.FC<LoadingMindMapProps> = ({ message }) => {
	const { t } = useI18n()

	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 2,
			}}
			role="status"
			aria-label={message || t('brainstorm.loading') || 'Loading mind map'}>
			<CircularProgress size={48} />
			<Typography variant="body1" color="text.secondary">
				{message || t('brainstorm.loading') || 'Loading mind map...'}
			</Typography>
		</Box>
	)
}
