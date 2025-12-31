# Mik Review AI - API Platform

Backend API for Mik Review AI code review platform.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Fastify
- **Database:** PostgreSQL (Drizzle ORM)
- **Cache/Queue:** Redis + BullMQ
- **Language:** TypeScript

## Setup

### 1. Install Dependencies

```bash
# From project root
pnpm install

# Or from this package
cd packages/api
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT tokens (min 32 characters)
- `DEEPSEEK_API_KEY`: DeepSeek API key (or other AI provider)

### 3. Database Setup

```bash
# Generate migration files
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database with test data (optional)
pnpm db:seed
```

### 4. Start Development Server

```bash
pnpm dev
```

The API will be available at `http://localhost:3000`

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:generate` - Generate migration files
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with test data
- `pnpm test` - Run tests
- `pnpm lint` - Run ESLint

## API Endpoints

### Health Check
```
GET /health
```

### Root
```
GET /
```

## Project Structure

```
src/
├── config/         # Configuration files
├── database/       # Database schema and migrations
├── middleware/     # Fastify middleware
├── modules/        # Feature modules
│   ├── auth/
│   ├── users/
│   ├── reviews/
│   ├── api-keys/
│   └── ...
├── shared/         # Shared utilities
│   ├── utils/
│   ├── types/
│   └── errors/
├── app.ts          # Fastify app setup
└── index.ts        # Entry point
```

## Development

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- pnpm 8+

### Running Locally with Docker (Coming Soon)

```bash
docker-compose up -d
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Deployment

### Environment Variables (Production)

Ensure all required environment variables are set in your production environment.

### Build & Deploy

```bash
# Build
pnpm build

# Run migrations
pnpm db:migrate

# Start server
pnpm start
```

## License

MIT
