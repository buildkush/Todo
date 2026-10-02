# Backend Setup Guide

## Quick Start

### Prerequisites
- Docker and Docker Compose running (PostgreSQL/Adminer)
- Node.js 18+
- npm installed

### Step 1: Install Dependencies

```bash
cd apps/backend
npm install
```

### Step 2: Database Migration

Run Prisma migrations to create tables:

```bash
npm run prisma:migrate
```

When prompted, enter a name for the migration (e.g., "init").

### Step 3: Seed Database (Optional)

Populate with sample data:

```bash
npm run prisma:seed
```

### Step 4: Start Development Server

```bash
npm run dev
```

Output:
```
✅ Database connected successfully
🚀 Server running at http://localhost:5000
📚 API Base URL: http://localhost:5000/api
🔗 Frontend URL: http://localhost:3000
```

## Testing the API

### Health Check

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "success": true,
  "status": "OK",
  "message": "Backend is running",
  "timestamp": "2026-04-01T10:00:00.000Z"
}
```

### Create a Project

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "x-user-id: mock-user-id" \
  -d '{
    "name": "My First Project",
    "viewType": "list",
    "color": "#FF5733",
    "description": "A test project"
  }'
```

### List Projects

```bash
curl -X GET "http://localhost:5000/api/projects?skip=0&take=10" \
  -H "x-user-id: mock-user-id"
```

## Useful Commands

```bash
npm run dev              # Start with hot reload
npm run build            # Build TypeScript
npm start                # Run built version
npm run prisma:studio    # Open Prisma Studio GUI
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed data
npm run type-check       # Check types
```

## Environment Variables

In `.env.local`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_db"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

## Troubleshooting

### Database Connection Error
- Ensure Docker PostgreSQL is running: `docker-compose up -d` in `db/` folder
- Check DATABASE_URL matches your setup

### Port Already in Use
- Change PORT in `.env.local` to another port
- Or kill existing process: `lsof -i :5000` then `kill -9 <PID>`

### Prisma Client Issues
- Regenerate: `npm run prisma:gen`
- Reinstall: `rm -rf node_modules && npm install`

## Next Steps

1. ✅ **Backend setup complete**
2. 🔄 **Frontend integration** - Create components to call these APIs
3. 🔄 **Authentication** - Implement JWT in Phase 5
4. 🔄 **Testing** - Add unit tests with Jest

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for full endpoint reference.
