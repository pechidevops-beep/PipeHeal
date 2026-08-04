# PipeHeal Backend

This is the Node.js + Express backend for PipeHeal, the AI-powered Self-Healing CI/CD Pipeline Orchestrator.

## Architecture

This backend follows Clean Architecture principles:
- **Routes (`src/routes/`)**: Map HTTP endpoints to Controllers.
- **Controllers (`src/controllers/`)**: Handle HTTP requests, responses, and validation mapping.
- **Services (`src/services/`)**: Contain the core business logic.
- **Repositories (`src/repositories/`)**: Data access layer wrapping Prisma ORM.
- **Middlewares (`src/middlewares/`)**: Global error handling, JWT auth, request logging, and rate limiting.

## Prerequisites

- Node.js (v18+)
- PostgreSQL (or Supabase)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and configure it.
   ```bash
   cp .env.example .env
   ```
   > **Note on Graceful Startup**: The backend is designed to run even if external API keys (GitHub, AI, Docker) are missing. It will start in a "mocked" state, allowing the frontend to be developed against it immediately.

3. **Database Setup**
   Run Prisma migrations to create tables in your database:
   ```bash
   npx prisma db push
   ```
   *If you want to seed the database with mock data for testing:*
   ```bash
   npm run prisma:seed
   ```
   *(Ensure you add `"prisma:seed": "node prisma/seed.js"` to your `package.json` scripts if not already present).*

## Running the Server

**Development Mode** (auto-reloads on file changes)
```bash
npm run dev
```

**Production Mode**
```bash
npm start
```

## Socket.IO Integration

The server provides real-time updates via Socket.IO.
Clients connect with a JWT and subscribe to updates on namespaces:
- `/dashboard`
- `/incidents`
- `/pipelines`

Events are pushed automatically when business services perform actions (e.g., incident created, diagnosis completed, tests passed).
