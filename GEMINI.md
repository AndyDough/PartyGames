# GEMINI.md - Instructional Context for PartyGames

## Project Overview
**PartyGames** is a real-time multiplayer web application, specifically a clone of the "Wavelength" party game. The project is organized as a **pnpm monorepo** to ensure tight coupling and shared type safety between the frontend and backend.

### Architecture & Tech Stack
- **Monorepo Manager**: `pnpm` workspaces.
- **Frontend (`apps/web`)**: Next.js (App Router), React 19, Tailwind CSS 4, and `partysocket` for real-time synchronization.
- **Backend/Real-time Server (`apps/server`)**: PartyKit, a stateful Edge Workers platform that manages game rooms via WebSockets.
- **Shared Package (`packages/types`)**: TypeScript definitions for the `GameState`, `Player`, and `GameMessage`, ensuring end-to-end type safety.

## Building and Running
The project uses `pnpm` for all lifecycle commands.

### Development
To start both the frontend and the PartyKit server in development mode:
```bash
pnpm dev
```
*   **Web Frontend**: Typically runs on `http://localhost:3000`.
*   **PartyKit Server**: Typically runs on `http://localhost:1999`.

### Build
To build all packages in the correct order (types, then apps):
```bash
pnpm build
```

### Type-Checking
To run TypeScript compilation checks across all workspaces:
```bash
pnpm type-check
```

### Deployment
- **PartyKit Server**: Deployed using `pnpm --filter server deploy`.
- **Frontend**: Designed for deployment on Vercel. Ensure `NEXT_PUBLIC_PARTYKIT_HOST` is set to the deployed PartyKit URL in your Vercel environment variables.

## Development Conventions
- **Monorepo Structure**: 
    - `apps/*`: Application code.
    - `packages/*`: Shared utilities or type definitions.
- **Type Safety**: Always define new game messages or state properties in `packages/types` before implementing them in the client or server.
- **Real-time State**: Game state is authoritative on the PartyKit server (`apps/server/party/index.ts`). The frontend should primarily be a reactive consumer of the state synced via `usePartySocket`.
- **Styling**: Tailwind CSS 4 is used in the frontend. Prefer utility-first classes for rapid prototyping.
- **Indentation**: The project follows a 4-space indentation preference as established in user memories.
- **Deployment Prerequisites**: Deployment requires a PartyKit Cloud account and a Vercel project connected to the GitHub repository.
