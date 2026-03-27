# 🚀 Quick Start Guide - Todo App

Get up and running in 5 minutes!

---

## ⚡ TL;DR - Copy & Paste Commands

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### 1️⃣ Create Monorepo Folder Structure

```bash
# Create root project folder
mkdir todo-app && cd todo-app

# Initialize monorepo
npm init -y

# Create backend and frontend folders
mkdir -p apps/backend apps/frontend
```

### 2️⃣ Set Up PostgreSQL Database (First Time Only)

```bash
# Connect to PostgreSQL (Windows/macOS/Linux)
psql -U postgres

# In PostgreSQL prompt, run:
CREATE DATABASE todo_app_dev;
CREATE DATABASE todo_app_test;
\q
```

### 3️⃣ Backend Setup (Express + Prisma)

```bash
# Navigate to backend
cd apps/backend

# Initialize backend project
npm init -y

# Install dependencies
npm install express cors dotenv
npm install -D typescript ts-node @types/express @types/node nodemon
npm install @prisma/client prisma

# Initialize Prisma
npx prisma init

# Create .env file with:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/todo_app_dev"
# PORT=5000
# NODE_ENV=development
# FRONTEND_URL="http://localhost:3000"
# JWT_SECRET="dev-secret-key"

# Copy Prisma schema from DATABASE_SCHEMA.md to prisma/schema.prisma

# Run migrations
npx prisma migrate dev --name init

# Return to root
cd ../..
```

### 4️⃣ Frontend Setup (Next.js)

```bash
# Navigate to frontend
cd apps/frontend

# Create Next.js project
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Install additional dependencies
npm install axios dnd-kit @dnd-kit/core @dnd-kit/sortable react-toastify

# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Return to root
cd ../..
```

### 5️⃣ Test Both Servers

**Terminal 1 (Backend):**
```bash
cd apps/backend
npm run dev
# Should see: ✅ Server running at http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd apps/frontend
npm run dev
# Should see: ▲ Next.js ready at http://localhost:3000
```

**Test:**
- Open http://localhost:3000 in browser
- Frontend should load (with placeholder content)
- Backend health check: `curl http://localhost:5000/api/health`

---

## 📖 Full Documentation

After quick start, read:

1. **[BRD.md](./BRD.md)** — Business requirements & features
2. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** — Detailed environment setup
3. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** — Database design & queries
4. **[UI_CONSTRUCT.md](./UI_CONSTRUCT.md)** — Component specifications
5. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** — Phase 1-5 checklists
6. **[API_CONTRACT.md](./API_CONTRACT.md)** — Express API endpoints reference

---

## 🛠️ Troubleshooting

### PostgreSQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
✅ **Solution:** Start PostgreSQL:
- **Windows:** Start service in Services or use `pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start`
- **macOS:** `brew services start postgresql@15`
- **Linux:** `sudo service postgresql start`

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
✅ **Solution:** Kill existing process:
```bash
# macOS/Linux:
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### Prisma Client Generation Failed
```
Error: PrismaClientInitializationError
```
✅ **Solution:**
```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev
```

### CORS Error (Frontend → Backend)
```
Error: No 'Access-Control-Allow-Origin' header found
```
✅ **Solution:** Verify backend `.env`:
```
FRONTEND_URL="http://localhost:3000"
```
Restart backend server after changing.

---

## 📝 What's Next?

### Phase 1 Development (2-3 weeks)

**Backend:**
- Create API routes for projects, todos, sections
- Set up Zod validation
- Implement CORS middleware

**Frontend:**
- Create Sidebar component
- Build ListView component
- Set up hook-based state management (useProjects, useTodos)

**Full Phase 1 Checklist:** See [IMPLEMENTATION_GUIDE.md - Phase 1](./IMPLEMENTATION_GUIDE.md#phase-1-foundation-core-crud-list-view--2-3-weeks)

---

## 🔗 Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Express Docs](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Zod Validation](https://zod.dev/)
- [dnd-kit (Drag-Drop)](https://docs.dndkit.com/)

---

## 💡 Tips

1. **Use Prisma Studio** to inspect database:
   ```bash
   cd apps/backend
   npx prisma studio
   ```

2. **Test API endpoints** with cURL:
   ```bash
   curl http://localhost:5000/api/health
   ```

3. **Hot reload enabled** — Changes auto-refresh:
   - Backend: via `nodemon`
   - Frontend: Next.js built-in

4. **Database reset** (useful for testing):
   ```bash
   cd apps/backend
   npx prisma migrate dev --name reset
   npm run seed  # Populates test data
   ```

---

**Ready to start? Run the commands above and let's build! 🎉**

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).
