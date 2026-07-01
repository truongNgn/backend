# Backend (Task Manager API)

REST API built with NestJS + TypeORM + PostgreSQL, providing `Todo` and `User` resources for the Task Manager app.

## Tech stack

- NestJS 11 (Express platform)
- TypeORM + PostgreSQL (`pg`)
- class-validator / class-transformer for DTO validation
- Swagger (`@nestjs/swagger`) for API docs

## Requirements

- Node.js 18+
- A running PostgreSQL instance

## Setup

```bash
npm install
cp .env.example .env   # then edit values to match your local Postgres
```

`.env` variables:

| Variable | Description |
|---|---|
| `DB_HOST` | Postgres host (e.g. `localhost`) |
| `DB_PORT` | Postgres port (e.g. `5432`) |
| `DB_USERNAME` | Postgres user |
| `DB_PASSWORD` | Postgres password |
| `DB_NAME` | Database name (e.g. `todo_db`) — the database must already exist; TypeORM only creates tables, not the database |
| `PORT` | Present in `.env` but currently unused — the server always listens on port `3001` (hardcoded in `src/main.ts`) |

## Running

```bash
npm run start:dev   # watch mode, http://localhost:3001
npm run start        # single run
npm run start:prod   # runs pending migrations, then starts
```

- Swagger UI: `http://localhost:3001/api-docs`
- CORS is restricted to `http://localhost:3000` (the frontend dev server origin) in `src/main.ts`.
- Global `ValidationPipe` runs with `transform: true`, so DTO default values (e.g. pagination `page`/`limit`) are applied automatically when a request omits them.

## API overview

### Users — `/users`

| Method | Path | Description |
|---|---|---|
| POST | `/users` | Create a user (`email`, `firstName`, `lastName`) |
| GET | `/users` | List all users |
| GET | `/users/:id` | Get one user by id |
| PATCH | `/users/:id` | Update a user |
| DELETE | `/users/:id` | Soft-delete a user |

### Todos — `/todos`

| Method | Path | Description |
|---|---|---|
| POST | `/todos` | Create a todo (`title`, `dueDate`, `userId` required; `description`, `priority` optional) |
| GET | `/todos?page=&limit=` | Paginated list — returns `{ data, page, limit, total }` |
| PATCH | `/todos/:id` | Update a todo (title, description, priority, status, dueDate, userId) |
| DELETE | `/todos/:id` | Soft-delete a todo |

A `Todo` belongs to a `User` via `userId` (`ManyToOne`, nullable, `onDelete: SET NULL`). A `User` has many `Todo`s.

See [`../WORKFLOW.md`](../WORKFLOW.md) for how these routes are consumed by the frontend and how the two apps work together.

## Testing

```bash
npm run test       # unit tests
npm run test:e2e   # e2e tests
npm run test:cov   # coverage
```
