# Backend API Documentation

## Overview

This is a production-ready Express.js backend for the Todo Application with the following features:

- ✅ **TypeScript** support for type safety
- ✅ **Prisma ORM** for database management
- ✅ **Zod** for request validation
- ✅ **Error Handling** with custom error classes
- ✅ **Service Layer** for business logic
- ✅ **Controller Pattern** for request handling
- ✅ **Mock Authentication** (ready for JWT integration in Phase 5)
- ✅ **Soft Deletes** for data integrity
- ✅ **Pagination** support
- ✅ **CORS** configured for frontend

## Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── ProjectController.ts
│   ├── TodoController.ts
│   ├── SectionController.ts
│   └── BoardSectionController.ts
├── services/            # Business logic layer
│   ├── ProjectService.ts
│   ├── TodoService.ts
│   ├── SectionService.ts
│   └── BoardSectionService.ts
├── routes/              # API route definitions
│   ├── projectRoutes.ts
│   ├── todoRoutes.ts
│   ├── sectionRoutes.ts
│   └── boardSectionRoutes.ts
├── middleware/          # Express middleware
│   ├── errorHandler.ts
│   └── validators.ts
├── validators/          # Zod validation schemas
│   └── index.ts
├── types/               # TypeScript types and interfaces
│   └── index.ts
└── index.ts            # Application entry point
```

## Setup & Installation

### 1. Install Dependencies

```bash
cd apps/backend
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_db"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

### 3. Run Database Migrations

```bash
npm run prisma:migrate
```

### 4. Seed Database (Optional)

```bash
npm run prisma:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Health Check

```
GET /api/health
```

### Projects

| Method | Endpoint | Description |
|--------|----------|---|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List projects |
| GET | `/api/projects/:id` | Get project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Todos

| Method | Endpoint | Description |
|--------|----------|---|
| POST | `/api/todos` | Create todo |
| GET | `/api/todos` | List todos |
| GET | `/api/todos/:id` | Get todo |
| PUT | `/api/todos/:id` | Update todo |
| PATCH | `/api/todos/:id/move` | Move todo |
| DELETE | `/api/todos/:id` | Delete todo |

### Sections

| Method | Endpoint | Description |
|--------|----------|---|
| POST | `/api/sections` | Create section |
| GET | `/api/projects/:projectId/sections` | List sections |
| GET | `/api/sections/:id` | Get section |
| PUT | `/api/sections/:id` | Update section |
| PATCH | `/api/sections/batch/reorder` | Reorder sections |
| DELETE | `/api/sections/:id` | Delete section |

### Board Sections

| Method | Endpoint | Description |
|--------|----------|---|
| POST | `/api/boardSections` | Create board section |
| GET | `/api/projects/:projectId/boardSections` | List board sections |
| GET | `/api/boardSections/:id` | Get board section |
| PUT | `/api/boardSections/:id` | Update board section |
| PATCH | `/api/boardSections/batch/reorder` | Reorder board sections |
| DELETE | `/api/boardSections/:id` | Delete board section |

## Authentication

### Current Implementation (Mock)

For development, pass `x-user-id` header:

```bash
curl -X GET http://localhost:5000/api/projects \
  -H "x-user-id: user-123"
```

### Future Implementation (Phase 5)

Replace mock authentication in `middleware/validators.ts` with JWT validation.

## Error Handling

All errors follow consistent format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "fields": {}  // Only for validation errors
}
```

### Error Codes

- `VALIDATION_ERROR` (400) - Request validation failed
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Access denied
- `NOT_FOUND` (404) - Resource not found
- `INTERNAL_ERROR` (500) - Server error

## Validation

All endpoints validate requests using Zod schemas in `src/validators/index.ts`

### Example: Create Project

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-123" \
  -d '{
    "name": "My Project",
    "viewType": "list",
    "color": "#FF5733"
  }'
```

## Database Operations

### Prisma Studio

Visualize and edit database:

```bash
npm run prisma:studio
```

Opens at `http://localhost:5555`

### Generate Prisma Client

```bash
npm run prisma:gen
```

## Available NPM Scripts

```bash
npm run dev              # Start development server with hot reload
npm run build            # Build TypeScript to JavaScript
npm start                # Run production build
npm run prisma:gen       # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database with sample data
npm run type-check       # Check TypeScript types
npm run lint             # Run linter
npm run test             # Run tests
```

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": { /* resource */ }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ /* array of resources */ ],
  "total": 100,
  "skip": 0,
  "take": 10
}
```

### Error Response

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error message"
}
```

## Next Steps

1. ✅ Backend APIs created with industry standards
2. 🔄 **Frontend Integration** - Create frontend components
3. 🔄 **Authentication** - Implement JWT (Phase 5)
4. 🔄 **Testing** - Add unit & integration tests
5. 🔄 **Deployment** - Deploy to production

## Architecture Principles

- **Separation of Concerns** - Controllers, Services, Routes cleanly separated
- **Type Safety** - Full TypeScript with Zod validation
- **Error Handling** - Consistent error responses
- **DRY** - No code duplication, reusable middleware
- **Scalability** - Easy to add new endpoints
- **Security** - Input validation, SQL injection prevention (via Prisma)
- **Performance** - Indexed queries, pagination support

## Support

For issues or questions, check:
- `API_CONTRACT.md` - Full API specification
- `DATABASE_SCHEMA.md` - Database structure
- `IMPLEMENTATION_GUIDE.md` - Implementation reference
