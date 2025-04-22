import type { GitCommit } from '@/types'

// Mock Git history data (in a real app, this would call a backend API)
const mockGitHistory: GitCommit[] = [
	{
		hash: 'a1b2c3d',
		message: 'Initial project setup',
		author: 'Dominik Oswald',
		date: '2023-04-01T10:00:00Z',
	},
	{
		hash: 'e4f5g6h',
		message: 'Add brainstorming flow component',
		author: 'Dominik Oswald',
		date: '2023-04-02T14:30:00Z',
	},
	{
		hash: 'i7j8k9l',
		message: 'Implement dark mode',
		author: 'Dominik Oswald',
		date: '2023-04-03T09:15:00Z',
	},
	{
		hash: 'm1n2o3p',
		message: 'Fix node dragging issue',
		author: 'Dominik Oswald',
		date: '2023-04-04T16:45:00Z',
	},
	{
		hash: 'q4r5s6t',
		message: 'Add project versioning',
		author: 'Dominik Oswald',
		date: '2023-04-05T11:20:00Z',
	},
]

// Get Git history for a project
export const getGitHistory = async (_projectId: string): Promise<GitCommit[]> => {
	// In a real app, this would fetch from a backend API
	// For now, we'll return mock data with a delay to simulate an API call
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(mockGitHistory)
		}, 500)
	})
}

// Get Git commit details
export const getGitCommitDetails = async (commitHash: string): Promise<GitCommit | null> => {
	// In a real app, this would fetch from a backend API
	// For now, we'll find the commit in our mock data
	return new Promise((resolve) => {
		setTimeout(() => {
			const commit = mockGitHistory.find((c) => c.hash === commitHash) || null
			resolve(commit)
		}, 300)
	})
}

// Compare two Git commits
export const compareGitCommits = async (
	_baseCommitHash: string,
	_compareCommitHash: string,
): Promise<{ added: string[]; removed: string[]; modified: string[] }> => {
	// In a real app, this would fetch from a backend API
	// For now, we'll return mock data
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				added: ['src/components/NewFeature.tsx'],
				removed: ['src/components/OldFeature.tsx'],
				modified: ['src/components/ExistingFeature.tsx'],
			})
		}, 700)
	})
}
