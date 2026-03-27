# Implementation Quick Reference & Checklist
## Todo App - Phase 1-5 Development Guide

**Document Version:** 1.0  
**Last Updated:** March 27, 2026  
**Purpose:** Link BRD, Database Schema, and UI requirements for developers

---

## 📋 Document Navigation Map

| Document | Purpose | Key Sections |
|----------|---------|--------------|
| **BRD.md** | Business requirements & workflows | Use cases, features, API endpoints, user flows |
| **DATABASE_SCHEMA.md** | Database design & optimization | Collections, indexes, query patterns, validation rules |
| **UI_CONSTRUCT.md** | Component design & specifications | Layout hierarchy, responsive rules, accessibility, colors |
| **This File** | Implementation guide & checklist | Phase breakdown, tech decisions, quick links |

---

## 🚀 Technology Stack

### Frontend
- **Framework:** Next.js 13+ (App Router, port 3000)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (recommended)
- **State Management:** React Hooks + Context API
- **Drag-Drop:** dnd-kit (lightweight, recommended)
- **HTTP Client:** fetch API or axios
- **Form Handling:** React Hook Form (optional)
- **Notifications:** react-toastify (for toast messages)

### Backend
- **Runtime:** Node.js 18+ (LTS)
- **Framework:** Express.js (port 5000, separate from frontend)
- **Database:** PostgreSQL 14+
- **ORM:** Prisma (auto-migrations, type-safe)
- **Input Validation:** Zod (TypeScript-first)
- **Middleware:** CORS, body-parser, error handlers
- **Authentication:** JWT (Phase 5)
- **Testing:** Jest + Supertest

### DevOps & Tools
- **Package Manager:** npm with workspaces (or pnpm)
- **Version Control:** Git
- **Database:** PostgreSQL 14+ local or PostgreSQL managed service
- **Database GUI:** pgAdmin (optional) or `npx prisma studio`
- **API Testing:** Postman or Insomnia
- **Linting:** ESLint + Prettier
- **Deployment:** 
  - Frontend: Vercel (optimal for Next.js)
  - Backend: Railway, Render, or Fly.io
  - Database: Neon, Vercel Postgres, or AWS RDS

---

## 📐 Project Structure (Monorepo with Workspaces)

```
todo-app/                          # Root (Monorepo)
├── apps/
│   ├── frontend/                 # Next.js 13+ (PORT 3000)
│   │   ├── app/
│   │   │   ├── layout.tsx        # Persistent sidebar
│   │   │   ├── page.tsx          # Inbox
│   │   │   ├── projects/[id]/page.tsx
│   │   │   └── completed/page.tsx
│   │   ├── components/
│   │   │   ├── layout/           # Sidebar, Header
│   │   │   ├── views/            # ListView, BoardView, CompletedView
│   │   │   ├── items/            # TodoItem, SectionHeader
│   │   │   ├── forms/            # Add/Edit forms
│   │   │   └── modals/           # Confirmation modals
│   │   ├── hooks/
│   │   │   ├── useTodos.ts       # Fetch from backend
│   │   │   ├── useProjects.ts
│   │   │   └── useDragDrop.ts
│   │   ├── lib/
│   │   │   ├── api-client.ts     # Backend API wrapper
│   │   │   └── constants.ts
│   │   ├── .env.local            # NEXT_PUBLIC_API_URL=http://localhost:5000/api
│   │   └── package.json
│   │
│   └── backend/                  # Express.js (PORT 5000)
│       ├── src/
│       │   ├── index.ts          # Express server
│       │   ├── routes/
│       │   │   ├── projects.ts
│       │   │   ├── todos.ts
│       │   │   ├── sections.ts
│       │   │   └── boardSections.ts
│       │   ├── controllers/
│       │   │   ├── projectController.ts
│       │   │   ├── todoController.ts
│       │   │   └── sectionController.ts
│       │   ├── services/
│       │   │   ├── projectService.ts
│       │   │   └── todoService.ts
│       │   ├── middleware/
│       │   │   ├── cors.ts
│       │   │   └── errorHandler.ts
│       │   └── prisma.ts         # Prisma client
│       ├── prisma/
│       │   ├── schema.prisma     # Models: User, Project, Todo, Section, BoardSection
│       │   ├── seed.ts           # Test data
│       │   └── migrations/       # Auto-generated
│       ├── .env                  # DATABASE_URL, JWT_SECRET
│       └── package.json
│
├── shared/                       # Optional: Shared types
│   ├── types/
│   │   └── index.ts
│   └── package.json
│
├── .gitignore
├── package.json                  # Workspaces: ["apps/frontend", "apps/backend"]
└── README.md
```

**Setup monorepo root package.json:**
```json
{
  "name": "todo-app",
  "workspaces": ["apps/frontend", "apps/backend", "shared"],
  "scripts": {
    "dev": "npm -w @todo/frontend run dev & npm -w @todo/backend run dev"
  }
}
```

Then run both servers together:
```bash
npm run dev
# Starts frontend on :3000 AND backend on :5000
```

---

## 📝 Implementation Checklist

### Phase 1: Foundation (Core CRUD, List View) — 2-3 weeks

- [ ] **Project Setup (See SETUP_GUIDE.md for detailed steps)**
  - [ ] Clone or initialize monorepo structure
  - [ ] Set up PostgreSQL locally and create `todo_app_dev` database
  - [ ] Initialize frontend (Next.js with TypeScript + Tailwind)
  - [ ] Initialize backend (Express with TypeScript + Prisma + PostgreSQL)
  - [ ] Configure environment variables (.env files)
  - [ ] Install all dependencies (npm install in both apps)
  - [ ] Verify both servers start (`npm run dev` in each terminal)
  
- [ ] **Backend: Database & Prisma Setup**
  - [ ] Copy Prisma schema from DATABASE_SCHEMA.md to prisma/schema.prisma
  - [ ] Run `npx prisma migrate dev --name init` to apply schema
  - [ ] Create seed data (prisma/seed.ts) for testing
  - [ ] Verify Prisma Studio works: `npx prisma studio`
  - [ ] All models created: User, Project, Todo, Section, BoardSection
  
- [ ] **Backend: Express API Routes (Projects)**
  - [ ] Create Express server with CORS middleware
  - [ ] `POST /api/projects` — Create project (validate, save to DB)
  - [ ] `GET /api/projects` — List projects (filter by userId, exclude deleted)
  - [ ] `GET /api/projects/:id` — Get project with todos & sections
  - [ ] `PUT /api/projects/:id` — Update project metadata
  - [ ] `DELETE /api/projects/:id` — Soft-delete (set deletedAt)
  - [ ] Input validation (Zod) for all endpoints
  - [ ] Error handling middleware for 400/404/500 responses

- [ ] **Backend: Express API Routes (Todos)**
  - [ ] `POST /api/todos` — Create todo (validate title, save to DB)
  - [ ] `GET /api/todos?projectId=X&sectionId=Y&isCompleted=false` — List todos (filtered)
  - [ ] `PUT /api/todos/:id` — Update todo (title, desc, isCompleted, order)
  - [ ] `DELETE /api/todos/:id` — Soft-delete todo (set deletedAt)
  - [ ] Zod validation on all endpoints
  - [ ] Ensure deletedAt: null filter on all queries (test this!)

- [ ] **Backend: Express API Routes (Sections)**
  - [ ] `POST /api/sections` — Create section under project
  - [ ] `PUT /api/sections/:id` — Update section name/order
  - [ ] `DELETE /api/sections/:id` — Soft-delete section + all child todos
  - [ ] Validation: projectId must exist, section name required
  - [ ] Confirmation logic: client sends list of todo IDs to delete

- [ ] **Frontend: API Client Setup**
  - [ ] Create lib/api-client.ts with fetch wrapper
  - [ ] Configure NEXT_PUBLIC_API_URL to backend (http://localhost:5000/api)
  - [ ] Test CORS from frontend (should see no errors in console)
  - [ ] Example: fetch('/api/health') should work from Next.js

- [ ] **Frontend: Components (Layout)**
  - [ ] Create Sidebar component (project list + inbox + completed link)
  - [ ] Create Header component (project title + view toggle + options)
  - [ ] Create MainContent wrapper (persistent layout, responsive)
  - [ ] Hamburger menu for mobile (<768px)
  - [ ] Navigation between routes (inbox, /projects/[id], /completed)

- [ ] **Frontend Components (List View)**
  - [ ] ListView component (main container)
  - [ ] TodoItem component (checkbox, title, hover icons)
  - [ ] SectionHeader component (collapse, name, badge)
  - [ ] AddTodoForm (inline with submit)
  - [ ] AddSectionForm (inline with submit)
  - [ ] Display todos with strikethrough when completed

- [ ] **Frontend Hooks & State**
  - [ ] useProjects() — Fetch and manage projects
  - [ ] useTodos() — Fetch and manage todos
  - [ ] useSections() — Fetch and manage sections
  - [ ] useAsync() — Generic loading/error management
  - [ ] API client utilities (fetch wrappers)

- [ ] **UI Styling (Phase 1)**
  - [ ] CSS custom properties (colors, spacing, fonts)
  - [ ] Layout baseline (sidebar + main content)
  - [ ] Component base styles (buttons, inputs, badges)
  - [ ] Hover states for todo/section items
  - [ ] Responsive grid/flex layout

- [ ] **Testing & Validation**
  - [ ] API endpoint tests (Jest + Postman)
  - [ ] Database validation rules working
  - [ ] Soft-delete tests (deletedAt filtering)
  - [ ] Component render tests
  - [ ] Manual E2E: Create project → add sections → add todos

### Phase 2: Drag-Drop & Board View — 2 weeks

- [ ] **Select Drag-Drop Library**
  - [ ] Evaluate dnd-kit vs react-beautiful-dnd
  - [ ] Decision for Phase 2 implementation
  - [ ] Install and configure with Next.js

- [ ] **Backend API (Reordering)**
  - [ ] `PATCH /api/todos/[id]/move` — Move todo between sections
  - [ ] `PATCH /api/sections/batch/reorder` — Bulk reorder sections
  - [ ] Order recalculation logic (no gaps)
  - [ ] Atomic updates (single DB write per operation)

- [ ] **Backend API (Board Sections)**
  - [ ] Create BoardSection model
  - [ ] `POST /api/boardSections` — Create column
  - [ ] `PUT /api/boardSections/[id]` — Update
  - [ ] `DELETE /api/boardSections/[id]` — Soft-delete
  - [ ] `PATCH /api/boardSections/batch/reorder` — Reorder columns

- [ ] **Frontend Drag-Drop (List View)**
  - [ ] Integrate drag-drop library
  - [ ] Implement reorder within section (optimistic update)
  - [ ] Implement move between sections (API call + optimistic)
  - [ ] Reorder sections via drag (SectionHeader)
  - [ ] Visual feedback (opacity, shadow, placeholder)

- [ ] **Frontend Components (Board View)**
  - [ ] BoardView component (main container, horizontal scroll)
  - [ ] BoardColumn component (droppable column)
  - [ ] TodoCard component (draggable card)
  - [ ] Add board section button
  - [ ] Add todo-to-column button

- [ ] **Frontend Drag-Drop (Board View)**
  - [ ] Drag card within column (reorder)
  - [ ] Drag card between columns (move)
  - [ ] Drop zone highlighting
  - [ ] Optimistic updates + rollback on error

- [ ] **API Integration**
  - [ ] Move todo endpoint (`PATCH /api/todos/[id]/move`)
  - [ ] Batch reorder endpoints
  - [ ] Error handling for cross-section moves

- [ ] **Testing & Validation**
  - [ ] Drag-drop happy path test (reorder, move)
  - [ ] Order field persisted correctly
  - [ ] Frame rate ≥60fps (performance audit)
  - [ ] Mobile touch drag-drop functional

### Phase 3: Completed Tab & Confirmations — 1.5 weeks

- [ ] **Backend API (Completed)**
  - [ ] `GET /api/todos/completed` — Fetch completed todos with hierarchy
  - [ ] Aggregation pipeline: group by projectId → sectionId → todos

- [ ] **Frontend Components (Completed View)**
  - [ ] CompletedView main component
  - [ ] ProjectGroup (expandable/collapsible)
  - [ ] SectionGroup (nested, expandable)
  - [ ] CompletedTodoItem (strikethrough, gray, checkable)
  - [ ] Hierarchical display (Project → Section → Todo)

- [ ] **Frontend Logic (Completed Tab)**
  - [ ] Fetch completed todos on tab click
  - [ ] Group data on frontend (or backend via aggregation)
  - [ ] Uncheck todo → remove from completed, return to original location
  - [ ] Toggle expanded/collapsed state per project/section

- [ ] **Confirmation Modals**
  - [ ] ConfirmationModal component (reusable)
  - [ ] Delete section confirmation: "Delete X and N todos?"
  - [ ] Delete todo confirmation
  - [ ] Cancel action + rollback UI

- [ ] **Soft Delete Verification**
  - [ ] All queries filter `deletedAt: null`
  - [ ] Deleted items completely hidden from views
  - [ ] Verification in API tests
  - [ ] Verification in completed tab (no deleted items shown)

- [ ] **Toast Notifications**
  - [ ] Success toast: "Todo completed!"
  - [ ] Error toast: "Failed to save..."
  - [ ] Toast dismissal after 3-5 seconds
  - [ ] Position: bottom right

- [ ] **Testing & Validation**
  - [ ] Complete todo → appears in completed tab with hierarchy
  - [ ] Uncomplete todo → appears in original location
  - [ ] Delete todo → confirmation modal works
  - [ ] Delete section → all child todos deleted
  - [ ] Completed tab groups correctly

### Phase 4: Responsive Design & Accessibility — 1.5 weeks

- [ ] **Mobile Responsive (<768px)**
  - [ ] Sidebar hamburger drawer (slide from left)
  - [ ] Single-column layout for todos
  - [ ] Header stacked (title + buttons on second row)
  - [ ] Board view: horizontal scroll visible
  - [ ] Touch targets: minimum 44x44px all buttons
  - [ ] Remove/reduce padding for mobile

- [ ] **Tablet Responsive (768-1024px)**
  - [ ] Sidebar collapsed to icons only (60px)
  - [ ] Tooltips on sidebar hover (project names visible)
  - [ ] Main content: adjustable max-width
  - [ ] Board columns narrower but legible
  - [ ] Adjusted typography for smaller screens

- [ ] **Desktop Refinements (>1024px)**
  - [ ] Full sidebar (200-250px width)
  - [ ] Full spacing + typography
  - [ ] All hover states visible
  - [ ] Tooltips on icons

- [ ] **Dark Mode Prep**
  - [ ] CSS custom properties (colors, backgrounds)
  - [ ] Data attr or class toggle: `[data-theme="dark"]`
  - [ ] All colors transition smooth
  - [ ] No logic yet, just structure (Phase 5)

- [ ] **Accessibility (a11y)**
  - [ ] Keyboard navigation: Tab, Shift+Tab, Enter, Escape, Space
  - [ ] Focus indicators visible (2px outline)
  - [ ] ARIA labels on: reorder icons, delete buttons, collapse
  - [ ] Color contrast: 4.5:1 for text, 3:1 for large text
  - [ ] Form labels paired with inputs
  - [ ] Section headers have proper heading hierarchy (<h1>, <h2>, etc)

- [ ] **Performance Audit**
  - [ ] Lighthouse score ≥90 (mobile)
  - [ ] Page load <2 seconds (100 todos)
  - [ ] Completed tab load <1 second (500 todos)
  - [ ] Drag-drop frame rate ≥60fps
  - [ ] Image optimization (if added)
  - [ ] Code splitting for routes

- [ ] **Testing & Validation**
  - [ ] Responsive testing on real devices (mobile, tablet, desktop)
  - [ ] Emulator testing (Chrome DevTools)
  - [ ] Lighthouse audits (PWA, Accessibility, Performance)
  - [ ] Keyboard-only navigation test
  - [ ] Screen reader test (NVDA, JAWS basic)
  - [ ] Color contrast verification tool (aXe, WAVE)

### Phase 5: Auth & Extensibility (2 weeks) — Post-MVP

- [ ] **Authentication Setup**
  - [ ] Install NextAuth.js
  - [ ] Configure providers (Email/Password for MVP, OAuth later)
  - [ ] Create auth middleware

- [ ] **Multi-User Support**
  - [ ] Add userId filtering to all queries
  - [ ] Verify user owns resource before CRUD
  - [ ] Update API endpoints to extract userId from session

- [ ] **Future Feature Prep**
  - [ ] Add `dueDate`, `priority`, `tags` fields (nullable)
  - [ ] Add recurrence structure (no automation yet)
  - [ ] Prepare subtasks field (reserved, no UI)
  - [ ] Export endpoint structure (CSV/JSON format)

- [ ] **Search & Filter Prep**
  - [ ] Add title search endpoint
  - [ ] Add tag filter endpoint
  - [ ] Basic UI placeholders (grayed out for MVP)

- [ ] **Testing & Validation**
  - [ ] Login/logout flow works
  - [ ] User A can't see User B's todos
  - [ ] All endpoints verify user ownership
  - [ ] Schema extensible for new fields

---

## 🔑 Key Decisions & Rationale

| Decision | Why | Alternative Considered |
|----------|-----|------------------------|
| **Soft deletes** | Audit trail, recovery, simpler UI | Hard delete (rejected: no recovery) |
| **Manual reorder only** | User control, simpler logic | Auto-sort by date/priority (saved for Phase 5+) |
| **Flat todos table** | No schema nesting, easier queries | Nested sections.todos[] (rejected: harder to update) |
| **Order as integer field** | Atomic updates, no race conditions | String-based ordering (rejected: complexity) |
| **sectionId in todos** | Flexible hierarchies, fast lookups | Embedded todos in sections (rejected: hard to query) |
| **Board sections separate** | Clear separation per viewType | Mixed in todo (rejected: confusing) |
| **No real-time WebSocket (MVP)** | Simpler, single-user sufficient | WebSocket (saved for multi-user phase) |
| **Optimistic UI updates** | Fast UX feedback | Await server response (too slow) |
| **CSS custom properties** | Dark mode ready, easy maintenance | Hardcoded colors (rejected: difficult to change) |

---

## 🛠️ Development Workflow

### Before Starting
1. Read BRD.md (full context)
2. Review DATABASE_SCHEMA.md (understand data model)
3. Study UI_CONSTRUCT.md (know component layout)
4. Understand this checklist (phase breakdown)

### During Development
1. **Create feature branch** per phase/feature
2. **Follow checklist items** sequentially
3. **Test each API endpoint** (Postman or curl)
4. **Test each component** (React Testing Library)
5. **Commit frequently** with clear messages
6. **Document decisions** in code comments

### Before Phase Completion
1. **Run API tests** (Jest)
2. **Run component tests** (React Testing Library)
3. **Manual E2E test** (walk through all features)
4. **Lighthouse audit** (performance + a11y)
5. **Cross-browser test** (Chrome, Firefox, Safari)
6. **Merge to main branch**

---

## 🐛 Common Pitfalls & Solutions

| Pitfall | Problem | Solution |
|---------|---------|----------|
| **Not filtering `deletedAt: null`** | Deleted items appear in views | Add filter to ALL queries, test thoroughly |
| **Order field gaps/conflicts** | Reordering breaks, duplicates appear | Recalculate orders server-side, use atomic updates |
| **Missing userId in queries** | User A sees User B's todos (post-Phase 5) | Add userId to all queries from Phase 1 |
| **Drag-drop library mismatch** | React errors, DnD doesn't work | Test early, read docs, match version with Next.js |
| **No optimistic updates** | UI feels slow, users double-click | Update UI immediately, rollback on error |
| **Skipping accessibility** | App fails a11y audit, hard to fix later | Implement from Phase 1 (ARIA labels, focus states) |
| **Not indexing queries** | Slow DB, poor performance | Create indexes per DATABASE_SCHEMA.md before testing |
| **Responsive breakpoints ignored** | Mobile layout broken | Test on real devices, not just browser emulator |

---

## 📊 Success Metrics (MVP Target)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **MVP Launch** | All Phase 1-4 tasks complete | Checklist 100% done |
| **Page Load Time** | <2 seconds (100 todos) | Lighthouse, Chrome DevTools |
| **Drag-Drop Performance** | ≥60 FPS | Performance profiler |
| **API Response Time** | <500ms | Network tab, Postman |
| **WCAG Accessibility** | AA compliance | axe DevTools, WAVE |
| **Mobile Usability** | Fully functional on <768px | Manual testing + emulator |
| **Code Quality** | ESLint errors: 0 | npm run lint |
| **Test Coverage** | ≥80% API routes, ≥60% components | Jest coverage report |

---

## 📚 Resources & References

### Official Docs
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)

### Drag-Drop Libraries
- [dnd-kit Docs](https://docs.dndkit.com/)
- [react-beautiful-dnd Docs](https://beautiful-and-accessible-drag-and-drop.netlify.app/)

### Styling & Accessibility
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Feather Icons](https://feathericons.com/)
- [Heroicons](https://heroicons.com/)

### Testing
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Postman for API Testing](https://www.postman.com/)

### Deployment
- [Vercel Deployment](https://vercel.com/docs)
- [Neon PostgreSQL (Serverless)](https://neon.tech/docs/introduction)
- [Supabase PostgreSQL](https://supabase.com/docs)

---

## 📞 Questions & Clarifications Template

When stuck, reference:
1. **What phase is this in?** (Check checklist)
2. **What is the BRD requirement?** (See BRD.md section)
3. **How does the data flow?** (See DATABASE_SCHEMA.md tables)
4. **What should it look like?** (See UI_CONSTRUCT.md component spec)
5. **Is there an existing pattern?** (Check Phase 1-4 for similar features)

---

**End of Implementation Quick Reference**

---

## Next Steps

1. ✅ **Review all three rowation files** (BRD, DATABASE_SCHEMA, UI_CONSTRUCT)
2. ✅ **Share with team/AI tool** for UI generation
3. ✅ **Decide drag-drop library** (dnd-kit vs react-beautiful-dnd)
4. ✅ **Set up project structure** (clone starter repo or init new)
5. ✅ **Begin Phase 1 implementation** following checklist

---

**Ready to start coding? Proceed to Phase 1 with checklist above!**
