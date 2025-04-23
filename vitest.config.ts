/// <reference types="vitest" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/setupTests.ts'],
		testTimeout: 60000, // Increased from 30000 to 60000
		include: [
			'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
		],
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/cypress/**',
			'**/.{idea,git,cache,output,temp}/**',
			'**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
			'src/tests/e2e/**', // Exclude Playwright E2E tests
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/setupTests.ts',
				'src/test.d.ts',
				'src/**/*.d.ts',
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
	},
})
