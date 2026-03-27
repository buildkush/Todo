# Todo App - Comprehensive Development Guide

A full-featured hierarchical todo management application with List and Board views, built with PostgreSQL, Prisma, Express, and Next.js.

---

## 📚 Documentation Structure

This project includes comprehensive documentation for all aspects of development:

### 🚀 For Developers Getting Started
- **[QUICK_START.md](./QUICK_START.md)** ⭐ START HERE
  - Copy-paste setup commands
  - 5-minute environment setup
  - Troubleshooting common issues

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** 
  - Step-by-step instructions with explanations
  - PostgreSQL installation (Windows, macOS, Linux)
  - Backend (Express + Prisma) initialization
  - Frontend (Next.js) initialization
  - Environment variables configuration

### 📋 For Understanding Requirements
- **[BRD.md](./BRD.md)** — Business Requirements Document
  - Product vision and user personas
  - 10 core features detailed
  - User workflows and use cases
  - Success metrics and risk mitigation
  - API endpoints overview
  - ~8,000 words, comprehensive reference

### 🗄️ For Database & Queries
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)**
  - Complete Prisma schema with 5 models
  - Relationship diagram (ER diagram)
  - Query patterns with Prisma examples
  - Indexes and optimization strategies
  - Soft-delete implementation details
  - Sample queries: projects list, todos by section, hierarchical grouping

### 🎨 For UI/Component Design
- **[UI_CONSTRUCT.md](./UI_CONSTRUCT.md)**
  - Component hierarchy and layout architecture
  - Responsive design breakpoints (<768px, 768-1024px, >1024px)
  - 7 major components with wireframes
  - Color palette (light + dark mode CSS variables)
  - Typography system (4-level hierarchy)
  - Spacing system (8px base unit)
  - Accessibility specs (WCAG AA, ARIA labels)

### 🛠️ For Implementation Planning
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)**
  - Phase 1-5 development breakdown (8-9 weeks total)
  - Detailed checklists with 100+ specific tasks
  - Technology stack justifications
  - Project folder structure
  - Key architectural decisions
  - Common pitfalls and solutions
  - Success metrics and testing strategies

### 🔌 For API Development
- **[API_CONTRACT.md](./API_CONTRACT.md)**
  - 19 Express endpoints fully documented
  - Request/response schemas with TypeScript types
  - Query parameters and pagination
  - Error codes and standard responses
  - Example cURL commands
  - Testing checklist per endpoint

---

## 🎯 Quick Reference

### Technology Stack
| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | Next.js | 13+ |
| Frontend Language | TypeScript | Latest |
| Frontend Styling | Tailwind CSS | 3+ |
| Frontend State | React Hooks + Context | - |
| Backend | Express.js | 4+ |
| Backend Runtime | Node.js | 18+ LTS |
| Database | PostgreSQL | 14+ |
| ORM | Prisma | Latest |
| Validation | Zod | Latest |
| Drag-Drop | dnd-kit | Latest |
| Package Manager | npm | 9+ |

### Port Configuration
- **Frontend:** `http://localhost:3000`
- **Backend:** `http://localhost:5000`
- **PostgreSQL:** `localhost:5432`

### Project Structure
```
todo-app/                    # Root monorepo
├── apps/
│   ├── frontend/           # Next.js (port 3000)
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities (api-client.ts)
│   │   └── .env.local      # Frontend env vars
│   │
│   └── backend/            # Express.js (port 5000)
│       ├── src/
│       │   ├── index.ts    # Express server entry
│       │   ├── routes/     # API route handlers
│       │   ├── controllers/# Business logic
│       │   ├── services/   # Database services
│       │   └── middleware/ # CORS, error handlers
│       ├── prisma/
│       │   ├── schema.prisma      # Data model
│       │   ├── seed.ts            # Test data
│       │   └── migrations/        # Migration history
│       └── .env            # Backend env vars
│
└── Documentation files (this directory)
```

---

## 📊 Development Phases

### Phase 1: Foundation (2-3 weeks)
**Focus:** Core CRUD + List View

- Backend: Projects, Todos, Sections CRUD endpoints
- Frontend: Sidebar, ListView, TodoItem components
- State management: React Hooks + useProjects, useTodos
- Database: PostgreSQL + Prisma migrations
- Testing: API endpoint tests + component tests

**Completion Criteria:** Create project → add sections → add todos → view list

---

### Phase 2: Drag-Drop & Board (2 weeks)
**Focus:** Reordering + Board View

- Drag-drop library integration (dnd-kit recommended)
- Todo reordering within/between sections
- Board view components + board sections
- Optimistic UI updates with rollback

**Completion Criteria:** Drag todos between sections, switch between List/Board views

---

### Phase 3: Completed Tab (1.5 weeks)
**Focus:** Soft Deletes + Completed View

- Completed todos tab with hierarchical grouping
- Soft-delete verification (all queries filter `deletedAt: null`)
- Confirmation modals for destructive actions
- Toast notifications

**Completion Criteria:** Complete todo → appears in Completed tab → can uncomplete

---

### Phase 4: Responsive + a11y (1.5 weeks)
**Focus:** Mobile + Accessibility

- Mobile responsive (<768px): hamburger menu, single column
- Tablet responsive (768-1024px): collapsed sidebar
- Dark mode CSS structure
- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels, focus indicators
- Lighthouse audit (target: 90+ mobile)

**Completion Criteria:** Fully functional on mobile/tablet/desktop, WCAG AA compliance

---

### Phase 5: Auth + Extensibility (2 weeks, Post-MVP)
**Focus:** Multi-User + Future Features

- JWT authentication setup
- Multi-user data isolation (userId filtering)
- nullable fields for future: dueDate, priority, tags
- Search + filter infrastructure
- Recurrence structure (prepared)

**Completion Criteria:** Login/logout works, users see only their data

---

## 🚀 Getting Started (3 Options)

### Option A: Copy-Paste Quick Start (5 minutes)
→ See [QUICK_START.md](./QUICK_START.md) for exact commands

### Option B: Step-by-Step Guided Setup
→ Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md) with detailed explanations

### Option C: Manual Setup
1. Create monorepo folder structure (shown above)
2. Initialize PostgreSQL databases
3. Run backend setup (Express + Prisma)
4. Run frontend setup (Next.js)
5. Start both servers

---

## 📖 Which Document Do I Read?

| Question | Document |
|----------|----------|
| **How do I start developing?** | [QUICK_START.md](./QUICK_START.md) |
| **What are the detailed setup steps?** | [SETUP_GUIDE.md](./SETUP_GUIDE.md) |
| **What is this app supposed to do?** | [BRD.md](./BRD.md) |
| **How should the database be structured?** | [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) |
| **What components should I build?** | [UI_CONSTRUCT.md](./UI_CONSTRUCT.md) |
| **What's the development checklist?** | [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) |
| **How do I build the REST API?** | [API_CONTRACT.md](./API_CONTRACT.md) |

---

## 💡 Key Architectural Decisions

### Soft Deletes Instead of Hard Deletes
- ✅ Preserves data integrity and audit trails
- ✅ Allows recovery of deleted items
- ✅ **Important:** All queries must filter `deletedAt: null`

### Flat Todos Table with sectionId/boardSectionId References
- ✅ Simplifies queries (no nested documents)
- ✅ Flexible: supports both List and Board views
- ✅ Fast lookups via indexes on (projectId, sectionId, order)

### Integer Order Field for Reordering
- ✅ Atomic updates (single query per reorder)
- ✅ No race conditions unlike string-based ordering
- ✅ O(n) worst-case but acceptable for todo lists

### Monorepo Structure
- ✅ Shared types between frontend/backend (future)
- ✅ Single CI/CD pipeline
- ✅ More complex but better for team development

### userId in All Models (Phase 5 Ready)
- ✅ All models prepared for multi-user filtering
- ✅ No migration needed when Phase 5 auth added
- ✅ Simplified permission checks (resource.userId === currentUser.id)

---

## 🧪 Testing Strategy

### Backend Testing
**Unit Tests:** Controllers + services (Jest)
**Integration Tests:** API endpoints with real DB (Postman/SuperTest)
**Manual Testing:** Happy path + error scenarios

### Frontend Testing
**Component Tests:** React Testing Library
**Integration Tests:** Component + hook interaction
**E2E Tests:** User workflows (manual initially)

### Testing Checklist
- ✅ API returns correct schemas
- ✅ deletedAt filtering works (deleted items hidden)
- ✅ Order field consistency after reordering
- ✅ CORS working (frontend can reach backend)
- ✅ Soft deletes cascade to child records
- ✅ Authentication working (Phase 5)

---

## 🔐 Security Considerations (Implemented)

### Authentication (Phase 5)
- JWT token validation on protected endpoints
- Extract userId from decoded token
- Filter all queries by userId

### CORS Configuration
- `Access-Control-Allow-Origin: http://localhost:3000` (dev)
- Production: Replace with actual frontend domain

### Input Validation (Zod)
- Validate all request bodies
- Return 400 Bad Request for invalid input

### SQL Injection Prevention
- Prisma ORM handles parameterized queries automatically
- No raw SQL strings from user input

---

## 🚨 Important Reminders

1. **ALWAYS filter `deletedAt: null`** in queries
   ```typescript
   const todos = await prisma.todo.findMany({
     where: { projectId, deletedAt: null }
   });
   ```

2. **CORS requires FRONTEND_URL** in backend .env
   ```env
   FRONTEND_URL="http://localhost:3000"
   ```

3. **DATABASE_URL format** for PostgreSQL
   ```env
   DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/todo_app_dev"
   ```

4. **Monorepo workspaces** configured in root package.json
   ```json
   { "workspaces": ["apps/frontend", "apps/backend"] }
   ```

---

## 📞 Troubleshooting

**I'm getting "port 5000 already in use"**
→ See [QUICK_START.md](./QUICK_START.md#port-already-in-use)

**PostgreSQL connection error**
→ See [QUICK_START.md](./QUICK_START.md#postgresql-connection-error)

**Prisma client not generating**
→ See [QUICK_START.md](./QUICK_START.md#prisma-client-generation-failed)

**CORS error between frontend and backend**
→ See [QUICK_START.md](./QUICK_START.md#cors-error-frontend--backend)

---

## 📊 Success Metrics (MVP Target)

| Metric | Target | How to Measure |
|--------|--------|---|
| Phases 1-4 Complete | 100% of checklists | All tasks checked ✅ |
| Mobile Responsive | Works on <768px | Real device or emulator |
| Drag-Drop Performance | ≥60 FPS | Chrome DevTools Performance |
| API Response Time | <500ms average | Network tab + Postman |
| Page Load | <2 seconds (100 todos) | Lighthouse |
| Accessibility | WCAG AA | axe DevTools |
| Code Quality | ESLint errors: 0 | npm run lint |
| Test Coverage | ≥80% API / ≥60% components | Jest coverage report |

---

## 🎓 Learning Resources

### Official Documentation
- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)

### Tools & Libraries
- [Tailwind CSS](https://tailwindcss.com/docs)
- [dnd-kit](https://docs.dndkit.com/)
- [Zod Validation](https://zod.dev/)
- [Postman](https://www.postman.com/)

---

## 📝 Document Versioning

| Document | Version | Updated | Status |
|----------|---------|---------|--------|
| BRD.md | 1.0 | Mar 28, 2026 | Complete ✅ |
| DATABASE_SCHEMA.md | 2.0 | Mar 28, 2026 | Complete ✅ |
| UI_CONSTRUCT.md | 1.0 | Mar 28, 2026 | Complete ✅ |
| IMPLEMENTATION_GUIDE.md | 1.0 | Mar 28, 2026 | Complete ✅ |
| SETUP_GUIDE.md | 1.0 | Mar 28, 2026 | Complete ✅ |
| API_CONTRACT.md | 1.0 | Mar 28, 2026 | Complete ✅ |
| QUICK_START.md | 1.0 | Mar 28, 2026 | NEW ✅ |
| README.md | 1.0 | Mar 28, 2026 | Current |

---

## 🤝 Contributing

When adding new features:
1. Update relevant documentation first
2. Follow the phase structure
3. Add items to IMPLEMENTATION_GUIDE.md checklists
4. Update API_CONTRACT.md if adding endpoints
5. Add test cases to testing section

---

## 📞 Support

- Check documentation for detailed explanations
- See [QUICK_START.md](./QUICK_START.md) for common issues
- Reference [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for pitfalls + solutions

---

**Status:** ✅ Documentation Complete — Ready for Phase 1 Development

**Next Step:** Run commands from [QUICK_START.md](./QUICK_START.md) to set up your environment

---

**Happy coding! 🚀**
