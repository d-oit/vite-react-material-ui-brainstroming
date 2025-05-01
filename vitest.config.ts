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
			optimizer: {
				web: {
					include: [
						'@mui/material',
						'@emotion/react',
						'@emotion/styled',
						'react',
						'react-dom',
						'@testing-library/react',
						'i18next',
						'react-i18next',
					],
				},
			},
		},
		// Test execution configuration
		fileParallelism: true,
		maxConcurrency: undefined, // Uses available CPU cores
		bail: 5,
		onConsoleLog: (log, type) => {
			if (type === 'stderr' && log.includes('EMFILE')) {
				return false
			}
			return true
		},
		// Resource management
		poolOptions: {
			threads: {
				singleThread: false,
			},
		},
		// Browser APIs
		environmentOptions: {
			jsdom: {
				resources: 'usable',
			},
		},
		sequence: {
			shuffle: false,
		},
		testTimeout: 20000,
		hookTimeout: 10000,
		watch: false,
	},
})
