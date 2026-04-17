# PartyGames

A real-time multiplayer "Wavelength" clone built with Next.js and PartyKit.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [pnpm](https://pnpm.io/) (v8 or later)

### Installation

Install dependencies for all workspaces:

```bash
pnpm install
```

### Development

To start both the frontend (Next.js) and the real-time server (PartyKit) in development mode:

```bash
pnpm dev
```

- **Web Frontend**: [http://localhost:3000](http://localhost:3000)
- **PartyKit Server**: [http://localhost:1999](http://localhost:1999)

## Other Commands

- **Build**: `pnpm build` (Builds all packages in the correct order)
- **Type-Check**: `pnpm type-check` (Runs TypeScript compilation checks across all workspaces)

## Tech Stack

- **Monorepo Manager**: pnpm workspaces
- **Frontend**: Next.js (App Router), React 19, Tailwind CSS 4
- **Backend/Real-time**: PartyKit (Edge Workers)
- **Shared Package**: TypeScript types for unified state and messaging
