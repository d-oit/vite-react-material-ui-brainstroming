# d.o.it.brainstorming

A fully responsive PWA for structured brainstorming with offline-first capabilities.

> Unleash structured creativity — anywhere, anytime.

## Features

- **React Flow Integration**: Visualize brainstorming workflows with draggable and editable nodes
- **Material UI v7**: Modern UI components with dark/light mode support
- **Git History Viewer**: Track changes and versions of your projects
- **OpenRouter LLM Chat**: AI-powered assistance for brainstorming
- **AWS S3 Sync**: Backup and sync your projects to the cloud
- **Offline-First PWA**: Work anywhere, even without an internet connection
- **Responsive Design**: Mobile-first approach with adaptive layouts

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
   ```
   VITE_S3_ENDPOINT=your_s3_endpoint_here
   VITE_OPENROUTER_API_URL=your_openrouter_api_url_here
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

## Project Structure

```
d.o.it.brainstorming/
├── public/               # Static assets
├── src/
│   ├── assets/           # Images, fonts, etc.
│   ├── components/       # Reusable UI components
│   ├── features/         # Feature-specific components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and services
│   ├── pages/            # Application pages
│   ├── tests/            # Test files
│   └── types/            # TypeScript type definitions
├── .env                  # Environment variables
├── index.html            # HTML entry point
└── vite.config.ts        # Vite configuration
```

## PWA Features

- Installable on desktop and mobile devices
- Works offline with cached data
- Background sync for updates when online
- Push notifications (coming soon)

## License

MIT

---

Created by Dominik Oswald
