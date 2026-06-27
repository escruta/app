# Escruta - App

Desktop application for the Escruta research platform. It provides an interface for source management, notebook organization, and AI-assisted document analysis.

Built with React, TypeScript, Tailwind CSS, Vite, and Electron.

> [!IMPORTANT]
> This application is part of the Escruta ecosystem and requires the core service to be running for full functionality. The project is under development and may contain incomplete features or breaking changes.

## Getting Started

### Prerequisites

- Node.js (version 24 or higher).
- Escruta Core running (see [core README](https://github.com/escruta/core)).

### Development Scripts

- `pnpm install` - Install dependencies.
- `pnpm run dev` - Launch the app in development with hot reload (Vite dev server for the renderer, electron-forge for the main process).
- `pnpm run build` - Build and package installable desktop applications (output in `out/`).
- `pnpm run lint` - Run Oxlint for code quality checks and fix issues.
- `pnpm run format` - Run Oxfmt for code formatting and fix issues.
- `pnpm run typecheck` - Run TypeScript for type checking.
- `pnpm run check` - Run lint, format, and typecheck.

## Configuration

### Environment Variables

- `VITE_ESCRUTA_CORE_URL`: Core API URL (defaults to `http://localhost:8080`).

> [!NOTE]
> It can be set using a `.env` file in the app root directory.
