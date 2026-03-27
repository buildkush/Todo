# Business Requirements Document (BRD)
## Hierarchical Todo Management App

**Version:** 1.0  
**Date:** March 27, 2026  
**Status:** MVP Planning  
**Author:** Development Team

---

## 1. Executive Summary

This is a **single-user (MVP) todo management application** with extensibility for multi-user support. The app allows users to organize tasks through:
- **Quick capture** (Inbox) for spontaneous todos
- **Projects** with two visualization modes: **List** (hierarchical) and **Board** (kanban)
- **Completed tracking** with hierarchical preservation
- **Drag-drop reordering** for intuitive prioritization

**Tech Stack:** Next.js, Express, Node.js, PostgreSQL, Prisma, React  
**Target Users:** Individual productivity enthusiasts, interview prep students, project managers  
**Timeline:** 5-phase rollout (MVP = Phases 1-4, ~8 weeks)

---

## 2. Business Objectives

- ✅ Provide fast, distraction-free task capture and organization
- ✅ Support flexible project structures (flat todos + hierarchical sections)
- ✅ Enable kanban-style workflow visualization (Board view)
- ✅ Track task completion with historical record (Completed tab)
- ✅ Set foundation for future multi-user collaboration
- ✅ Ensure mobile-first, responsive experience
- ✅ Maintain data integrity through soft-delete practices

---

## 3. User Personas & Use Cases

### Persona 1: Alex (Interview Prep Student)
**Goal:** Organize interview prep by topic (Angular, JavaScript, System Design)  
**Example Workflow:**
1. Creates project "Angular Interview"
2. Adds sections: "Core Concepts", "Advanced Patterns", "Common Questions"
3. Under each section, adds specific topics (e.g., "Dependency Injection")
4. Uses List view for hierarchical organization
5. Checks off completed topics; reviews them in Completed tab

### Persona 2: Jordan (Project Manager)
**Goal:** Track sprint tasks and visual status updates  
**Example Workflow:**
1. Creates project "Sprint 42" with Board view
2. Auto-creates sections: "To Do", "In Progress", "In Review", "Done"
3. Adds cards (todos) for each task
4. Drags card from "To Do" → "In Progress" as work starts
5. Moves completed cards to "Done"; archived in Completed tab

### Persona 3: Casey (Random Thoughts Catcher)
**Goal:** Capture ideas quickly, organize into projects later  
**Example Workflow:**
1. Clicks "Add task" in Inbox (no project)
2. Types quick idea: "Learn Web Workers"
3. Later, drags into "JavaScript" project
4. Adds description and organizes further

**Use Cases:**
| UC # | Actor | Goal | Preconditions | Steps | Result |
|------|-------|------|---------------|-------|--------|
| UC-1 | User | Create quick todo | App loaded | 1. Click "Add task" 2. Enter title 3. Submit | Todo added to Inbox |
| UC-2 | User | Create project | App loaded | 1. Click "+ Add Project" 2. Enter name, select type (List/Board) 3. Submit | Project created, empty |
| UC-3 | User | Create section | Project open (List) | 1. Click "+ Add Section" 2. Enter name 3. Submit | Section created, empty |
| UC-4 | User | Add todo to section | Project + section exists | 1. Inside section, click "Add task" 2. Enter title 3. Submit | Todo added under section |
| UC-5 | User | Reorder todos | List view open | 1. Hover over todo 2. Drag reorder icon 3. Drop in new position | Todo moved, order updated in DB |
| UC-6 | User | Move todo between sections | List view open | 1. Drag todo from Section A 2. Drop in Section B | Todo's `sectionId` updated, appears in Section B |
| UC-7 | User | Mark todo as complete | Todo visible | 1. Click checkbox on todo | Todo `isCompleted=true`, strikethrough appears |
| UC-8 | User | View completed tasks | App logged in | 1. Click "Completed" tab 2. See grouped todos (Project → Section → Todo) | All completed todos shown hierarchically |
| UC-9 | User | Delete section | Section exists | 1. Hover section 2. Click delete 3. Confirm modal | Section + all child todos soft-deleted |
| UC-10 | User | Edit todo | Todo exists | 1. Hover todo 2. Click edit icon 3. Modify title/desc 4. Save | Todo updated in DB |
| UC-11 | User | Switch project view | Project exists | 1. Click List/Board toggle in header | View switches, todos preserved |
| UC-12 | User | Drag-drop in Board view | Board view open | 1. Drag card from Col A 2. Drop in Col B | Todo's `boardSectionId` updated, appears in Col B |

---

## 4. Functional Requirements

### 4.1 Core Features (MVP)

#### F-1: Project Management
- **F-1.1:** User can create project with name + description (optional)
- **F-1.2:** User can select project type: "List" or "Board"
- **F-1.3:** User can view all projects in sidebar with count badges (# of active todos)
- **F-1.4:** User can delete project (soft-delete, confirm popup)
- **F-1.5:** User can edit project name/description
- **F-1.6:** User can create empty project (content added later)
- **F-1.7:** Projects persist in database (PostgreSQL)
- **F-1.8:** Project slug/ID used in URL for navigation

#### F-2: Inbox (Quick Capture)
- **F-2.1:** Inbox is default landing page
- **F-2.2:** User can add todo without assigning to project (projectId = null)
- **F-2.3:** Inbox shows count of unassigned todos in sidebar badge
- **F-2.4:** User can move inbox todo to project via drag-drop or context menu
- **F-2.5:** User can complete/delete inbox todos like any other todo

#### F-3: List View (Sections + Todos)
- **F-3.1:** Displays project name at top with "+ Add task" button
- **F-3.2:** Shows sections (expandable/collapsible) with todos listed under each
- **F-3.3:** Displays direct todos (projectId set, sectionId null) above or separate from sections
- **F-3.4:** User can create section within project
- **F-3.5:** User can collapse/expand sections (state persisted per session, not DB initially)
- **F-3.6:** User can reorder sections via drag-drop (order field updated)
- **F-3.7:** User can reorder todos within section via drag-drop
- **F-3.8:** User can move todo between sections via drag-drop
- **F-3.9:** User can delete section (confirm popup, deletes all child todos)
- **F-3.10:** User can edit section name

#### F-4: Board View (Kanban Columns)
- **F-4.1:** Displays project name at top with "+ Add section" button
- **F-4.2:** Horizontal scrollable/grid layout of columns (board sections)
- **F-4.3:** Each column shows section name + todo count
- **F-4.4:** User can create custom board sections (any name, not predefined)
- **F-4.5:** User can drag-drop todos within same column (reorder)
- **F-4.6:** User can drag-drop todos between columns (moves to new section)
- **F-4.7:** User can delete board section (confirm, deletes child todos)
- **F-4.8:** User can reorder columns via drag-drop
- **F-4.9:** Todos persist `boardSectionId` instead of `sectionId`

#### F-5: Todo CRUD
- **F-5.1:** Todo has title (required) + description (optional)
- **F-5.2:** User can create todo in Inbox, Project, or Section
- **F-5.3:** User can edit title/description (inline or modal)
- **F-5.4:** User can delete todo (confirm popup for destructive action, soft-delete)
- **F-5.5:** User can mark todo as complete (checkbox toggle)
- **F-5.6:** Completed todo remains visible (strikethrough UI)
- **F-5.7:** Completed date tracked (`completedAt` field)
- **F-5.8:** Todo `order` field maintains position within parent (project or section)

#### F-6: Completed Tracking
- **F-6.1:** "Completed" tab visible in main navigation (sidebar)
- **F-6.2:** Completed tab displays all todos with `isCompleted=true`
- **F-6.3:** Todos grouped hierarchically: Project → Section (if exists) → Todo
- **F-6.4:** Sections with all todos completed still show (collapsed by default)
- **F-6.5:** User can uncheck todo to mark incomplete (removed from completed, returns to original list)
- **F-6.6:** Completed count badge shows total completed todos

#### F-7: Drag-Drop & Reordering
- **F-7.1:** Reorder todo within section (updates `order` field)
- **F-7.2:** Move todo between sections (updates `sectionId`, recalculates `order` in target)
- **F-7.3:** Reorder sections within project (updates section `order`)
- **F-7.4:** In Board view: move todo between columns (updates `boardSectionId`)
- **F-7.5:** In Board view: reorder columns (updates `order`)
- **F-7.6:** Drag-drop is smooth (60+ FPS), optimistically updates UI
- **F-7.7:** Order values are atomic integers, no gaps (e.g., 0, 1, 2, 3)

#### F-8: UI Interactions
- **F-8.1:** On hover todo: reorder icon (⋮) appears left, edit/delete icons appear right
- **F-8.2:** On hover section header: reorder icon left, edit/delete/options right
- **F-8.3:** Section collapse icon always visible (chevron ▶/▼)
- **F-8.4:** Icons appear/disappear smoothly (no layout shift)
- **F-8.5:** Checked todo renders strikethrough text + gray color
- **F-8.6:** Delete action shows confirmation modal (can't undo)
- **F-8.7:** Edit actions open inline form or modal with pre-filled values

#### F-9: Responsive Design
- **F-9.1:** Mobile (<768px): Sidebar collapses to hamburger drawer
- **F-9.2:** Mobile: Single-column layout for todos
- **F-9.3:** Tablet (768-1024px): Sidebar shrinks to icons, main content adjusts
- **F-9.4:** Desktop (>1024px): Full sidebar + main content side-by-side
- **F-9.5:** Board view: Horizontal scroll on mobile, grid on desktop
- **F-9.6:** Touch-friendly: Tap targets ≥44x44px on mobile
- **F-9.7:** No horizontal scroll on mobile except for Board columns

#### F-10: Data Persistence
- **F-10.1:** All data saved to PostgreSQL
- **F-10.2:** Soft-delete: `deletedAt` field set, not hard-deleted
- **F-10.3:** All queries filter out soft-deleted records
- **F-10.4:** Order values are unique per parent (no duplicates)
- **F-10.5:** Foreign key refs valid: `sectionId` points to existing section in project
- **F-10.6:** API returns errors with clear messages (400, 404, 500 handling)

---

### 4.2 Non-Functional Requirements

#### NFR-1: Performance
- Page load time: <2 seconds for project with 100 todos
- Drag-drop frame rate: ≥60 FPS
- Completed tab load: <1 second for 500 completed todos
- API response time: <500ms for CRUD operations
- Images/assets optimized (lazy-loading if added later)

#### NFR-2: Accessibility
- WCAG 2.1 AA compliance minimum
- Keyboard navigation: Tab through all interactive elements
- Focus indicators: Visible on all buttons, links, inputs
- ARIA labels on: reorder icons, delete buttons, collapse buttons
- Color contrast: ≥4.5:1 for normal text, ≥3:1 for large text
- Screen reader support: All icons have descriptive labels

#### NFR-3: Security (Future)
- Input validation: Title/description sanitized
- XSS prevention: React auto-escapes
- CSRF protection: Implement for future multi-user
- Rate limiting: TBD post-MVP
- Data encryption: TBD post-MVP

#### NFR-4: Usability
- Error messages: Clear, actionable, localized (en-US for MVP)
- Undo support: Not required for MVP (future)
- Learn-ability: Intuitive icons, hover hints, empty state prompts
- Consistency: Buttons, colors, spacing consistent across views

#### NFR-5: Maintainability
- Code modular: Components, hooks, utils separated
- Documentation: JSDoc comments for complex functions
- Testing: Unit tests for API endpoints + React components (post-Phase 4)
- Tech debt: Minimize as we build

#### NFR-6: Scalability (Future)
- Support 1000+ todos per project (pagination/virtualization)
- Support multi-user without DB refactor
- Horizontal scaling: Stateless API servers

---

## 5. Data Model Overview

### Entities

| Entity | Purpose | Key Fields |
|--------|---------|-----------|
| **User** | Authentication & multi-user support (future) | `id`, `email`, `passwordHash`, `createdAt`, `updatedAt` |
| **Project** | Container for todos/sections | `id`, `userId`, `name`, `description`, `viewType` ("list"\|"board"), `createdAt`, `updatedAt`, `deletedAt` |
| **Todo** | Individual task | `id`, `userId`, `projectId`, `sectionId`, `title`, `description`, `isCompleted`, `order`, `createdAt`, `updatedAt`, `completedAt`, `deletedAt` |
| **Section** (List) | Hierarchical grouping in List view | `id`, `userId`, `projectId`, `name`, `order`, `isCollapsed`, `createdAt`, `updatedAt`, `deletedAt` |
| **BoardSection** (Board) | Column in Board view | `id`, `userId`, `projectId`, `name`, `order`, `createdAt`, `updatedAt`, `deletedAt` |

### Relationships

```
User (1) ──→ (Many) Project
Project (1) ──→ (Many) Todo (projectId)
Project (1) ──→ (Many) Section (List view only)
Project (1) ──→ (Many) BoardSection (Board view only)
Section (1) ──→ (Many) Todo (sectionId)
BoardSection (1) ──→ (Many) Todo (boardSectionId)
```

---

## 6. API Endpoints Summary

### Projects
- `POST /api/projects` — Create
- `GET /api/projects` — List all
- `GET /api/projects/[id]` — Get detail (with todos + sections)
- `PUT /api/projects/[id]` — Update
- `DELETE /api/projects/[id]` — Soft-delete

### Todos
- `POST /api/todos` — Create
- `GET /api/todos?projectId=X&sectionId=Y&isCompleted=false` — List (filtered)
- `GET /api/todos/completed` — Get completed (grouped hierarchically)
- `PUT /api/todos/[id]` — Update (title, desc, isCompleted, order)
- `DELETE /api/todos/[id]` — Soft-delete
- `PATCH /api/todos/[id]/move` — Move to different section/project

### Sections (List)
- `POST /api/sections` — Create
- `PUT /api/sections/[id]` — Update (name, order, isCollapsed)
- `DELETE /api/sections/[id]` — Soft-delete

### Board Sections
- `POST /api/boardSections` — Create
- `PUT /api/boardSections/[id]` — Update (name, order)
- `DELETE /api/boardSections/[id]` — Soft-delete

### Inbox
- `GET /api/inbox` — Get all todos with projectId=null

---

## 7. User Workflows

### Workflow 1: Create Project + Add Todos (List View)
```
1. User lands on app → sees Inbox with 0 todos
2. Clicks "Add Project" in sidebar
3. Enters "Angular Interview" + selects "List"
4. Redirected to project page (empty)
5. Clicks "+ Add Section" → enters "Core Concepts"
6. Section appears, clicks "+ Add task" inside it
7. Enters "Understand Dependency Injection"
8. Todo appears under section
9. Repeats for more todos
10. Completed todos show strikethrough in original location + in Completed tab
```

### Workflow 2: Move Todo Between Sections (Drag-Drop)
```
1. User has Project with Section A, B
2. Todo in Section A, wants to move to Section B
3. Hovers over todo → reorder icon appears
4. Drags todo to Section B
5. Todo disappears from Section A, appears in Section B
6. Order recalculated, DB updated
```

### Workflow 3: Delete Section (With Confirmation)
```
1. Hovers over Section header
2. Clicks delete/trash icon
3. Modal appears: "Delete 'Core Concepts' and 3 todos? This cannot be undone."
4. User clicks "Confirm"
5. Section + all 3 todos deleted (soft-delete)
6. Section removed from view
```

### Workflow 4: Complete Todo Flow
```
1. Todo visible in List or Board view
2. User clicks checkbox
3. Todo text becomes strikethrough + gray
4. Todo appears in Completed tab (grouped under project/section)
5. User later clicks "Completed" tab to review
6. Can uncheck to mark incomplete → returns to original location
```

### Workflow 5: Board View Kanban Flow
```
1. Project created with "Board" type
2. User adds board sections: "To Do", "In Progress", "Done"
3. User adds todo to "To Do" section
4. As work progresses, drags card from "To Do" → "In Progress"
5. On completion, drags to "Done"
6. Board tracks workflow visually
```

---

## 8. UI Navigation & Page Structure

### Main Navigation
```
Sidebar (Left)
├── Logo / Branding
├── "Todo" Count Badge (Inbox count)
├── Projects List
│   ├── Project 1 (expandable, shows count)
│   ├── Project 2
│   └── "+ Add Project" Button
├── "Completed" Tab (Separate section)
├── Settings (Future)
└── Logout (Future)

MainContent (Right)
├── Header (Project name, view toggle, options)
├── ViewContainer
│   ├── ListView (Sections + Todos hierarchical)
│   ├── BoardView (Horizontal kanban columns)
│   └── CompletedView (Tree grouped by project/section)
└── Footer (Optional status message)
```

---

## 9. Out of Scope (MVP)

- User authentication (infrastructure in design, not implemented)
- Multi-user collaboration
- Real-time WebSocket sync
- Tags, Priority, Due dates (fields reserved in schema)
- Recurring tasks (structure prepared, no automation)
- Search/filter UI (endpoints prepared)
- Comments, Subtasks, Time tracking
- Export functionality
- Dark mode logic (CSS variables prepared)
- Notifications, Email reminders
- Mobile app (web-only)

---

## 10. Success Criteria

### MVP Success (Phase 1-4)
- ✅ User can create projects (List + Board)
- ✅ User can add todos to Inbox and projects
- ✅ List view shows sections + todos hierarchically
- ✅ Board view shows kanban columns with drag-drop
- ✅ Drag-drop reordering works (todos, sections, columns)
- ✅ Completed tab shows all completed todos grouped by project/section
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ All CRUD operations persist to DB
- ✅ Soft-delete working (deleted items hidden from views)
- ✅ Hover interactions smooth (no layout shift)

### Phase 5 Success (Post-MVP)
- ✅ User registration + login working
- ✅ Multi-user queries filtering by userId
- ✅ Codebase ready for extensions (tags, priority, due dates)
- ✅ Search/filter endpoints functional

---

## 11. Assumptions & Constraints

### Assumptions
- Single desktop user during MVP (auth stubbed)
- PostgreSQL available (local or Neon/Supabase hosted)
- Node.js ≥18, Next.js ≥13 (App Router)
- Modern browser (Chrome, Firefox, Safari, Edge)
- English (en-US) for MVP

### Constraints
- No real-time sync (optimistic updates only)
- No offline mode
- Single-user concurrency (no conflict resolution)
- No file uploads (text fields only)
- No integrations (Slack, Google Calendar, etc.)

---

## 12. Risk & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Drag-drop library incompatibility | Whole feature broken | Medium | Test both dnd-kit + react-beautiful-dnd early |
| PostgreSQL connection issues | App won't start | Low | Use Neon/Supabase for reliability, implement retry logic |
| Order field conflicts | Data inconsistency | Low | Atomic updates via Prisma transactions, server-side recalculation, tests |
| Mobile responsiveness bugs | Poor UX on phones | Medium | Responsive testing on real devices, Lighthouse audits |
| Large dataset slowdown (1000+ todos) | Slow page load | Medium | Implement pagination/virtualization in Phase 4 |
| Soft-delete filter bypass | Deleted items reappear | Low | Server-side filtering in all queries, Prisma middleware |
| CORS misconfiguration | Frontend can't reach backend | Low | Validate CORS origin env var at startup |

---

## 13. Rollout Plan

### Phase 1: Foundation (2-3 weeks)
**Deliverable:** Core CRUD + List view MVP  
- Projects, Todos, Sections CRUD
- List view UI + reorder logic
- Basic API endpoints

### Phase 2: Board & Drag-Drop (2 weeks)
**Deliverable:** Full drag-drop + Board view  
- Board view UI + kanban columns
- Drag-drop library integration
- Cross-section moving

### Phase 3: Completed Tab (1.5 weeks)
**Deliverable:** Completed tracking + confirmations  
- Completed API + UI
- Delete confirmations

### Phase 4: Responsive + Polish (1.5 weeks)
**Deliverable:** Mobile-first, fully responsive, accessible  
- Mobile/tablet layouts
- Accessibility audit
- Performance optimization

### Phase 5: Auth & Extensibility (2 weeks) — Post-MVP
**Deliverable:** Multi-user ready + extensible schema  
- NextAuth.js integration
- userId filtering
- Future-feature prep

---

## 14. Glossary

| Term | Definition |
|------|-----------|
| **Inbox** | Default capture area for todos without a project |
| **Project** | Container for organized todos, has List or Board view |
| **Section** | Hierarchical grouping under project (List view only) |
| **Board Section** | Column in kanban view (Board view only) |
| **Todo** | Individual task with title, description, completion status |
| **Soft Delete** | Mark record with `deletedAt` field, not hard-deleted |
| **Order** | Integer field maintaining position within parent (project or section) |
| **isCompleted** | Boolean flag indicating todo is done |
| **Drag-Drop** | UI interaction for reordering todos/sections |
| **Kanban** | Board view with columns (sections) for workflow visualization |

---

## 15. Approval & Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | — | — | — |
| Tech Lead | — | — | — |
| Designer | — | — | — |

---

**End of BRD**

---

### Next Steps
1. Database schema finalization
2. UI component specs + mockups
3. API endpoint detailed design
4. Implementation sprint planning
