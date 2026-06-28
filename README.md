# Escruta - App

Desktop application for the Escruta research platform. It provides an interface for source management, notebook organization, and AI-assisted document analysis.

Built with React, TypeScript, Tailwind CSS, Vite, and Electron.

> [!IMPORTANT]
> This application is part of the Escruta ecosystem and requires the core service to be running for full functionality. The project is under development and may contain incomplete features or breaking changes.

## Getting Started

- `pnpm install` - Install dependencies.
- `pnpm run dev` - Launch the app in development with hot reload (Vite dev server for the renderer, electron-forge for the main process).
- `pnpm run build` - Build and package installable desktop applications (output in `out/`).
- `pnpm run check` - Run lint, format, and typecheck.

## Configuration

### Environment Variables

- `VITE_ESCRUTA_CORE_URL`: Core API URL (defaults to `http://localhost:8080`).

> [!NOTE]
> It can be set using a `.env` file in the app root directory.
