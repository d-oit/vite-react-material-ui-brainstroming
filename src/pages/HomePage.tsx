import {
	Dashboard as DashboardIcon,
	FolderOpen as ProjectsIcon,
	BubbleChart as BrainstormIcon,
} from '@mui/icons-material'
import { Box, Typography, Button, Container, Stack, CircularProgress } from '@mui/material'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import AppShell from '../components/Layout/AppShell'
import { useI18n } from '../contexts/I18nContext'
import { handleQuickBrainstorm } from '../features/brainstorming/quickBrainstormUtils'
import projectService from '../services/ProjectService'
import { ProjectTemplate } from '../types/project'

interface HomePageProps {
	onThemeToggle: () => void
	isDarkMode: boolean
}

const HomePage = ({ onThemeToggle, isDarkMode }: HomePageProps) => {
	const { t } = useI18n()
	const navigate = useNavigate()
	const [isCreating, setIsCreating] = useState(false)

	const handleQuickBrainstormClick = async () => {
		setIsCreating(true)
		await handleQuickBrainstorm(navigate)
		setIsCreating(false)
	}

	return (
		<AppShell title={t('app.title')} onThemeToggle={onThemeToggle} isDarkMode={isDarkMode}>
			<Container maxWidth="md">
				<Box sx={{ my: 4, textAlign: 'center' }}>
					<Typography variant="h2" component="h1" gutterBottom>
						{t('app.title')}
					</Typography>
					<Typography variant="h5" component="p" color="text.secondary" gutterBottom>
						{t('app.tagline')}
					</Typography>
					<Typography variant="body1" paragraph>
						{t('app.welcome')}
					</Typography>
					<Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
						<Button
							variant="contained"
							color="primary"
							size="large"
							component={Link}
							to="/projects"
							startIcon={<ProjectsIcon />}>
							{t('project.myProjects')}
						</Button>
						<Button
							variant="outlined"
							color="primary"
							size="large"
							onClick={handleQuickBrainstormClick}
							startIcon={<DashboardIcon />}
							disabled={isCreating}
							data-quick-brainstorm>
							{isCreating ? (
								<>
									<CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
									{t('app.creating')}
								</>
							) : (
								t('navigation.quickBrainstorm')
							)}
						</Button>
						<Button
							variant="contained"
							color="secondary"
							size="large"
							component={Link}
							to="/brainstorm-demo"
							startIcon={<BrainstormIcon />}>
							{t('app.uiDemo')}
						</Button>
					</Stack>
				</Box>
			</Container>
		</AppShell>
	)
}

export default HomePage
