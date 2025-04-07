# d.o.it.brainstorming

A fully responsive PWA for structured brainstorming with offline-first capabilities.

> Unleash structured creativity — anywhere, anytime.

## Features

- **React Flow Integration**: Visualize brainstorming workflows with draggable and editable nodes
- **Material UI v7**: Modern UI components with dark/light mode support
- **Git History Viewer**: Track changes and versions of your projects
- **OpenRouter LLM Chat**: AI-powered assistance for brainstorming with node generation
- **AWS S3 Sync**: Backup and sync your projects to the cloud (optional)
- **Offline-First PWA**: Work anywhere, even without an internet connection
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Accessibility**: Keyboard navigation, screen reader support, and more
- **Localization**: Available in English and German
- **Performance Optimized**: Code splitting, lazy loading, and memoization

## Tech Stack

- Vite + React 18 + TypeScript
- Material UI v7
- React Flow
- AWS SDK for S3 integration
- OpenRouter API for LLM chat
- Workbox for PWA and offline support
- Vitest for unit testing
- Playwright for E2E testing

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/d.o.it.brainstorming.git
   cd d.o.it.brainstorming
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```env
   # OpenRouter API (required for AI features)
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key

   # AWS S3 (optional)
   VITE_AWS_BUCKET_NAME=your_bucket_name
   VITE_AWS_ACCESS_KEY_ID=your_access_key_id
   VITE_AWS_SECRET_ACCESS_KEY=your_secret_access_key
   VITE_AWS_REGION=us-east-1

   VITE_PROJECT_VERSION=0.1.0
   ```

### Development

Start the development server:

```bash
npm run dev
```

### Building for Production

Build the app for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Testing

Run unit tests:

```bash
npm run test
```

Run E2E tests:

```bash
npm run test:e2e
```

### Code Quality

#### Linting

Check for linting issues:

```bash
npm run lint
```

Fix linting issues automatically:

```bash
npm run lint:fix
```

Run CI-level linting (zero warnings):

```bash
npm run ci:lint
```

#### Formatting

Format code with Prettier:

```bash
npm run format
```

Check if code is properly formatted:

```bash
npm run format:check
```

#### Pre-commit Hooks

This project uses Husky and lint-staged to automatically lint and format code before commits. This ensures that all committed code meets the project's quality standards.

## Project Structure

```text
d.o.it.brainstorming/
├── public/               # Static assets
├── src/
│   ├── components/       # UI components
│   │   ├── Accessibility/  # Accessibility components
│   │   ├── BrainstormFlow/ # Brainstorming canvas components
│   │   ├── Chat/           # AI chat components
│   │   ├── ErrorBoundary/  # Error handling
│   │   ├── Layout/         # Layout components
│   │   ├── OfflineIndicator/ # Offline status indicators
│   │   ├── Project/        # Project management components
│   │   ├── Security/       # Security components
│   │   └── UI/             # Common UI components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Third-party library integrations
│   ├── pages/            # Page components
│   ├── services/         # Business logic services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── sw.ts             # Service worker for PWA
├── .env                  # Environment variables
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

## PWA Features

- Installable on desktop and mobile devices
- Works offline with cached data
- Background sync for updates when online
- Push notifications (coming soon)

## Accessibility Features

- Keyboard navigation support
- ARIA attributes for screen readers
- Focus management
- Color contrast compliance
- Skip links for keyboard users

## Performance Optimizations

- Code splitting and lazy loading
- React.memo for performance-critical components
- Optimized React Flow rendering
- Efficient state management
- Responsive image loading
