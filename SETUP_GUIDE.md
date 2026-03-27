# Environment Setup & Local Development Guide
## PostgreSQL + Prisma + Express + Next.js Stack

**Version:** 1.0  
**Date:** March 28, 2026  
**Purpose:** Step-by-step setup for development environment

---

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js:** v18 or higher ([download](https://nodejs.org/))
- **npm or yarn:** Latest version
- **PostgreSQL:** v14 or higher ([download](https://www.postgresql.org/download/))
- **Git:** Latest version ([download](https://git-scm.com/))
- **VS Code** (recommended) or your preferred editor

### Verify Installation

```bash
node --version          # Should be v18+
npm --version           # Should be v9+
postgres --version      # Should be v14+
git --version          # Any recent version
```

---

## 🗂️ Project Structure Setup

### Option 1: Monorepo with Workspace (Recommended)

```bash
# Create root workspace directory
mkdir todo-app
cd todo-app

# Initialize as monorepo
npm init -y
npm install --workspace-root @types/node typescript ts-node

# Create frontend and backend folders
mkdir -p apps/frontend apps/backend
```

### Option 2: Separate Repositories

```bash
# Frontend repo
mkdir todo-app-frontend
cd todo-app-frontend
npx create-next-app@latest . --typescript --tailwind

# Backend repo (separate directory)
mkdir todo-app-backend
cd todo-app-backend
npm init -y
npm install express typescript ts-node @types/express @types/node
```

**Recommendation:** Start with **Option 1 (monorepo)** for easier development and shared types.

---

## 🗄️ PostgreSQL Setup

### 1. Install PostgreSQL

**Windows:**
- Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)
- Run installer, set password for `postgres` user (remember this!)
- Installer creates default PostgreSQL server on `localhost:5432`

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql prompt:
CREATE DATABASE todo_app_dev;
CREATE DATABASE todo_app_test;

# List databases
\l

# Exit psql
\q
```

### 3. Verify Connection

```bash
# Connect to your new database
psql -U postgres -d todo_app_dev

# You should see: todo_app_dev=#
\q
```

---

## 📦 Backend Setup (Express + Prisma)

### 1. Initialize Backend Project

```bash
cd apps/backend  # or your backend directory
npm init -y

# Install core dependencies
npm install express cors dotenv
npm install -D typescript ts-node @types/express @types/node
npm install @prisma/client @prisma/cli
npm install -D nodemon
```

### 2. Create TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. Initialize Prisma

```bash
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env file
```

### 4. Configure Environment Variables

**.env file** (in backend root):
```env
# Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/todo_app_dev"

# Server
PORT=5000
NODE_ENV=development

# Frontend origin (for CORS)
FRONTEND_URL="http://localhost:3000"

# JWT Secret (Phase 5)
JWT_SECRET="your-super-secret-key-change-in-production"
```

**⚠️ Warning:** Never commit `.env` to Git. Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

### 5. Create Prisma Schema

**prisma/schema.prisma** — Copy from [DATABASE_SCHEMA.md](#2-prisma-schema) the complete schema

### 6. Run Prisma Migrations

```bash
# Create initial migration
npx prisma migrate dev --name init

# This:
# 1. Creates migration files
# 2. Runs migration against PostgreSQL
# 3. Generates Prisma Client
```

### 7. Seed Database (Optional)

**prisma/seed.ts:**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed_password_here'
    }
  });

  // Create test project
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: 'Angular Learning',
      viewType: 'list'
    }
  });

  // Create test section
  const section = await prisma.section.create({
    data: {
      userId: user.id,
      projectId: project.id,
      name: 'Core Concepts',
      order: 0
    }
  });

  // Create test todos
  await prisma.todo.create({
    data: {
      userId: user.id,
      projectId: project.id,
      sectionId: section.id,
      title: 'Learn Dependency Injection',
      order: 0
    }
  });

  console.log('✅ Seed successful!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

**package.json** (add to scripts):
```json
{
  "scripts": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run seeding:
```bash
npm run seed
```

### 8. Create Express Server

**src/index.ts:**
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL
}));
app.use(express.json());

// Routes (will add in Phase 1)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

### 9. Add npm Scripts

**package.json:**
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:studio": "prisma studio",
    "prisma:migrate": "prisma migrate dev",
    "test": "jest"
  }
}
```

### 10. Test Backend Server

```bash
npm run dev

# You should see:
# ✅ Server running at http://localhost:5000

# Test health endpoint:
curl http://localhost:5000/api/health
# Response: {"status":"OK","message":"Backend is running"}
```

---

## 🎨 Frontend Setup (Next.js)

### 1. Create Next.js Project

```bash
cd apps/frontend  # or your frontend directory

npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"

# Or use interactive prompt (recommended)
npx create-next-app@latest
```

### 2. Install Additional Dependencies

```bash
npm install axios  # For API calls (or use fetch)
npm install dnd-kit @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities  # Drag-drop
npm install react-toastify  # For toast notifications
```

### 3. Create Environment Variables

**.env.local** (in frontend root):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Todo App
```

### 4. Create API Client

**lib/api-client.ts:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Projects
  getProjects: () => apiCall<any[]>('/projects'),
  getProject: (id: string) => apiCall<any>(`/projects/${id}`),
  createProject: (data: any) => apiCall<any>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Todos
  getTodos: (projectId?: string) => 
    apiCall<any[]>(`/todos?projectId=${projectId || ''}`),
  createTodo: (data: any) => apiCall<any>('/todos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Add more as needed...
};
```

### 5. Test Frontend Server

```bash
npm run dev

# Navigate to http://localhost:3000
# You should see Next.js default page
```

---

## 🔄 Running Full Stack Locally

### Terminal 1: Start Backend

```bash
cd apps/backend
npm run dev
# Outputs: ✅ Server running at http://localhost:5000
```

### Terminal 2: Start Frontend

```bash
cd apps/frontend
npm run dev
# Outputs: ▲ Next.js ... ready on http://localhost:3000
```

### Terminal 3: View Database (Optional)

```bash
cd apps/backend
npx prisma studio
# Opens http://localhost:5555 — visual database editor
```

---

## 🧪 Testing Setup

### Backend Testing (Jest)

```bash
cd apps/backend
npm install -D jest @types/jest ts-jest

# Create jest.config.js
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
};
EOF

# Create test
mkdir src/__tests__
cat > src/__tests__/health.test.ts << 'EOF'
import request from 'supertest';
import app from '../index';

describe('Health Check', () => {
  it('should return OK status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });
});
EOF

# Run tests
npm run test
```

### Frontend Testing (React Testing Library)

```bash
cd apps/frontend
npm install -D @testing-library/react @testing-library/jest-dom jest

# Create jest.config.js
cat > jest.config.js << 'EOF'
const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
};

module.exports = createJestConfig(customJestConfig);
EOF

# Run tests
npm run test
```

### API Testing (Postman)

1. Download [Postman](https://www.postman.com/downloads/)
2. Create new collection "Todo App"
3. Add requests:

**GET /api/health:**
- URL: `http://localhost:5000/api/health`
- Method: GET

**GET /api/projects:**
- URL: `http://localhost:5000/api/projects`
- Method: GET
- Headers: `Content-Type: application/json`

**POST /api/projects:**
- URL: `http://localhost:5000/api/projects`
- Method: POST
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "userId": "user-id-here",
  "name": "My First Project",
  "viewType": "list"
}
```

---

## 🐛 Troubleshooting

### Issue: "PostgreSQL connection refused"

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   Get-Service postgresql-x64-15  # Should be "Running"
   
   # macOS
   brew services list  # Should show postgresql as "started"
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Check DATABASE_URL in `.env`
3. Verify password is correct
4. Check PostgreSQL is on `localhost:5432`

### Issue: "Cannot GET /api/health" (404 error)

**Solutions:**
1. Verify backend is running on port 5000
2. Check CORS is configured correctly
3. Try direct curl:
   ```bash
   curl -i http://localhost:5000/api/health
   ```

### Issue: "CORS error in browser"

**Solutions:**
1. Check `FRONTEND_URL` in backend `.env`
2. Verify cors middleware is set up
3. Ensure headers include `Content-Type: application/json`

### Issue: "Prisma migration errors"

**Solutions:**
1. Check DATABASE_URL points to correct database
2. Ensure PostgreSQL is running
3. Reset database (careful in dev only):
   ```bash
   npx prisma migrate reset
   ```
4. Check migration files in `prisma/migrations/`

---

## 📚 Useful Commands Reference

**Backend:**
```bash
npm run dev                    # Start dev server
npm run build                  # Build TypeScript
npm run start                  # Run production build
npx prisma studio             # Open database GUI
npx prisma migrate dev         # Run migrations
npx prisma migrate reset       # Reset DB (dev only!)
npx prisma db seed            # Seed database
npm run test                   # Run tests
```

**Frontend:**
```bash
npm run dev                    # Start dev server
npm run build                  # Build for production
npm start                      # Start production build
npm run test                   # Run tests
npm run lint                   # Lint code
```

**Database Management:**
```bash
psql -U postgres -d todo_app_dev   # Connect to DB
\dt                                # List tables
\d table_name                      # Describe table
DROP DATABASE todo_app_dev;        # Delete database
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] PostgreSQL running (`psql -U postgres`)
- [ ] Databases created (`\l` in psql)
- [ ] Backend `.env` configured
- [ ] Frontend `.env.local` configured
- [ ] `npm run dev` works in backend (port 5000)
- [ ] `npm run dev` works in frontend (port 3000)
- [ ] `curl http://localhost:5000/api/health` returns status OK
- [ ] Frontend can reach backend (no CORS errors)
- [ ] `npx prisma studio` opens database GUI
- [ ] Can create test data in Postman

---

## 🎓 Next Steps

1. **Backend Development:** Start implementing API routes (Phase 1, IMPLEMENTATION_GUIDE.md)
2. **Frontend Development:** Build React components (Phase 1, UI_CONSTRUCT.md)
3. **Database Adjustments:** Modify Prisma schema as needs evolve
4. **Testing:** Write tests alongside development
5. **Deployment:** Set up CI/CD pipeline (Phase 5)

---

**Stuck?** Refer to:
- [Next.js Docs](https://nextjs.org/docs)
- [Express Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

