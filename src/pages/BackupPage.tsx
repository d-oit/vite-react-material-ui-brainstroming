import {
	CloudUpload as UploadIcon,
	CloudDownload as DownloadIcon,
	Delete as DeleteIcon,
	Refresh as RefreshIcon,
} from '@mui/icons-material'
import {
	Box,
	Typography,
	Paper,
	Button,
	Divider,
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	IconButton,
	CircularProgress,
	Alert,
	Snackbar,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
} from '@mui/material'
import { useState, useEffect } from 'react'

import { MainLayout } from '@/components/Layout/MainLayout'
import { listProjects, downloadProject } from '@/lib/s3Service'

export const BackupPage = () => {
	const [projects, setProjects] = useState<{ id: string; versions: string[] }[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [snackbarOpen, setSnackbarOpen] = useState(false)
	const [snackbarMessage, setSnackbarMessage] = useState('')
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
	const [projectToDelete, setProjectToDelete] = useState<string | null>(null)

	useEffect(() => {
		fetchProjects()
	}, [])

	const fetchProjects = async () => {
		try {
			setLoading(true)
			const projectsList = await listProjects()
			setProjects(projectsList)
			setError(null)
		} catch (err) {
			console.error('Error fetching projects:', err)
			setError('Failed to load projects from S3')
		} finally {
			setLoading(false)
		}
	}

	const handleDownload = async (projectId: string, version?: string) => {
		try {
			setLoading(true)
			const project = await downloadProject(projectId, version)

			// In a real app, you would save this to local storage or your app's state
			console.log('Downloaded project:', project)

			showSnackbar('Project downloaded successfully', 'success')
		} catch (err) {
			console.error('Error downloading project:', err)
			showSnackbar('Failed to download project', 'error')
		} finally {
			setLoading(false)
		}
	}

	const handleDeleteConfirm = (projectId: string) => {
		setProjectToDelete(projectId)
		setConfirmDialogOpen(true)
	}

	const handleDelete = async () => {
		if (!projectToDelete) return

		try {
			// In a real app, you would call an API to delete the project from S3
			// For now, we'll just remove it from the local state
			setProjects(projects.filter((p) => p.id !== projectToDelete))
			showSnackbar('Project deleted successfully', 'success')
		} catch (err) {
			console.error('Error deleting project:', err)
			showSnackbar('Failed to delete project', 'error')
		} finally {
			setConfirmDialogOpen(false)
			setProjectToDelete(null)
		}
	}

	const showSnackbar = (message: string, severity: 'success' | 'error') => {
		setSnackbarMessage(message)
		setSnackbarSeverity(severity)
		setSnackbarOpen(true)
	}

	return (
		<MainLayout title="Backup & Sync">
			<Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Box>
					<Typography variant="h5" component="h1">
						Cloud Backup & Sync
					</Typography>
					<Typography variant="subtitle2" color="text.secondary">
						Manage your project backups on AWS S3
					</Typography>
				</Box>

				<Box>
					<Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchProjects} disabled={loading}>
						Refresh
					</Button>
				</Box>
			</Box>

			<Divider sx={{ mb: 2 }} />

			<Paper sx={{ p: 3, mb: 3 }}>
				<Typography variant="h6" gutterBottom>
					Backup Current Project
				</Typography>

				<Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
					<Button variant="contained" color="primary" startIcon={<UploadIcon />} disabled={loading}>
						Backup Current Project
					</Button>

					<Button variant="outlined" startIcon={<UploadIcon />} disabled={loading}>
						Backup All Projects
					</Button>
				</Box>
			</Paper>

			<Paper sx={{ p: 3 }}>
				<Typography variant="h6" gutterBottom>
					Cloud Backups
				</Typography>

				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
						<CircularProgress />
					</Box>
				) : error ? (
					<Alert severity="error" sx={{ mt: 2 }}>
						{error}
					</Alert>
				) : projects.length === 0 ? (
					<Box sx={{ p: 3, textAlign: 'center' }}>
						<Typography variant="body1" color="text.secondary">
							No backups found in the cloud.
						</Typography>
					</Box>
				) : (
					<List>
						{projects.map((project) => (
							<Box key={project.id}>
								<ListItem>
									<ListItemText
										primary={`Project ID: ${project.id}`}
										secondary={`Versions: ${project.versions.join(', ')}`}
									/>
									<ListItemSecondaryAction>
										<IconButton
											edge="end"
											aria-label="download"
											onClick={() => handleDownload(project.id)}
											disabled={loading}>
											<DownloadIcon />
										</IconButton>
										<IconButton
											edge="end"
											aria-label="delete"
											onClick={() => handleDeleteConfirm(project.id)}
											disabled={loading}
											color="error">
											<DeleteIcon />
										</IconButton>
									</ListItemSecondaryAction>
								</ListItem>
								<Divider />
							</Box>
						))}
					</List>
				)}
			</Paper>

			<Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
				<Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
					{snackbarMessage}
				</Alert>
			</Snackbar>

			<Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
				<DialogTitle>Confirm Deletion</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to delete this project backup? This action cannot be undone.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
					<Button onClick={handleDelete} color="error">
						Delete
					</Button>
				</DialogActions>
			</Dialog>
		</MainLayout>
	)
}
