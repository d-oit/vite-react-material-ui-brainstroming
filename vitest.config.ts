/// <reference types="vitest" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/setupTests.ts'],
		include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
		exclude: [
			'node_modules/**',
			'dist/**',
			'src/tests/e2e/**',
			'.idea/**',
			'.git/**',
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/setupTests.ts',
				'**/*.d.ts',
				'src/__mocks__/**',
			],
		},
		deps: {
			inline: [
				'@mui/material',
				'@mui/icons-material',
				'@emotion/react',
				'@emotion/styled',
			],
		},
		// Test execution configuration
		maxConcurrency: 1,
		fileParallelism: false,
		// Handle large test suites
		bail: 5, // Stop after 5 test failures
		onConsoleLog: (log, type) => {
			if (type === 'stderr' && log.includes('EMFILE')) {
				return false // Suppress EMFILE errors
			}
			return true
		},
		// Resource management
		poolOptions: {
			threads: {
				singleThread: true,
			},
		},
		// Browser APIs
		environmentOptions: {
			jsdom: {
				resources: 'usable',
			},
		},
		// Additional options
		sequence: {
			shuffle: false, // Don't randomize test order
		},
		// Test timeouts
		testTimeout: 20000,
		hookTimeout: 10000,
		watch: false,
	},
})
