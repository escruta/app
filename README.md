# Escruta - App

Frontend application for the Escruta research platform. It provides a web interface for source management, notebook organization, and AI-assisted document analysis.

Built with React, TypeScript, Tailwind CSS, and Vite.

> [!IMPORTANT]
> This application is part of the Escruta ecosystem and requires the core service to be running for full functionality. The project is under development and may contain incomplete features or breaking changes.

## Getting Started

### Prerequisites

- Node.js (version 20 or higher).
- Escruta Core running (see [core README](https://github.com/escruta/core)).

### Development Scripts

- `npm install` - Install dependencies.
- `npm run dev` - Start development server ([localhost:5173](http://localhost:5173/)).
- `npm run build` - Create production build.
- `npm run lint` - Run Oxlint for code quality checks and fix issues.
- `npm run format` - Run Oxfmt for code formatting and fix issues.
- `npm run typecheck` - Run TypeScript for type checking.
- `npm run check` - Run lint, format, and typecheck.
- `npm run preview` - Preview production build locally.

## Configuration

### Environment Variables

- `VITE_ESCRUTA_CORE_URL`: Core API URL (defaults to `http://localhost:8080`).

> [!NOTE]
> It can be set using a `.env` file in the app root directory.
