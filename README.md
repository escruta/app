# Escruta - App

_"Think, ask, learn"_

**Escruta App** is the user interface component of the Escruta research assistant platform. Built with modern web technologies, it provides an intuitive and responsive experience for managing your research workflows, organizing sources, and interacting with AI-powered analysis tools.

> [!IMPORTANT]
> This application is part of the Escruta ecosystem and requires the core service to be running for full functionality. The project is under development and may contain incomplete features or breaking changes.

## Technology Stack

- **Runtime**: Node.js with npm package management.
- **Build Tool**: Vite for fast development and optimized production builds.
- **Framework**: React 19 with TypeScript for type-safe development.
- **Routing**: React Router for client-side navigation.
- **Styling**: Tailwind CSS with custom design system components.
- **Animations**: Motion library for smooth transitions and interactions.
- **Rich Text**: Quill.js for advanced note editing capabilities.
- **Code Highlighting**: highlight.js for syntax highlighting in code blocks.

## Getting Started

### Prerequisites

- Node.js (version 20 or higher)
- Escruta Core running (see [core README](https://github.com/escruta/core))

### Installation

1. `npm install` - Install dependencies
2. `npm run dev` - Start the development server

The application will be available at [localhost:5173](http://localhost:5173/) by default.

### Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Create production build
- `npm run lint` - Run Biome for code quality checks
- `npm run format` - Run Biome for code formatting
- `npm run preview` - Preview production build locally

## Configuration

### Environment Variables

Create a `.env` file in the app root directory:

```env
VITE_ESCRUTA_CORE_URL=http://localhost:8080
```

Available environment variables:

- `VITE_ESCRUTA_CORE_URL`: Core API URL (defaults to `http://localhost:8080`)

## Integration with Core

The app communicates with the Escruta core through RESTful APIs. Ensure the backend service is running and accessible at the configured `VITE_ESCRUTA_CORE_URL` for full functionality.
