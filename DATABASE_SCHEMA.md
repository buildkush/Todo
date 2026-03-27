# Database Schema & Structure
## Todo App - PostgreSQL & Prisma Design

**Version:** 2.0  
**Date:** March 28, 2026  
**Format:** Prisma Schema + SQL Examples

---

## 1. Database Architecture Overview

### Architecture
- **Database:** PostgreSQL 14+
- **ORM:** Prisma
- **Structure:** Highly relational with strict Foreign Keys

### Key Design Principles
- **Relational Integrity:** Uses Foreign Keys (Cascade deletes enabled) so child records are automatically managed.
- **Soft Deletes:** All records have `deletedAt` field (`null` = active).
- **Extensible:** Schema includes fields for future features (dueDate, priority).
- **Multi-user Ready:** All tables have `userId` relationships.

---

## 2. Prisma Schema (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                 String    @id @default(uuid())
  email              String    @unique
  passwordHash       String?
  name               String?
  theme              String?   @default("light")
  language           String?   @default("en-US")
  defaultProjectView String?   @default("list")
  
  projects           Project[]
  todos              Todo[]
  sections           Section[]
  boardSections      BoardSection[]

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  deletedAt          DateTime?

  @@index([createdAt(sort: Desc)])
}

model Project {
  id                           String    @id @default(uuid())
  userId                       String
  user                         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name                         String
  description                  String?
  viewType                     String    // "list" | "board"
  status                       String?   @default("active")
  color                        String?
  icon                         String?
  
  defaultSortOrder             String?   @default("manual")
  showCompletedTodos           Boolean   @default(true)
  allowDragDropBetweenSections Boolean   @default(true)

  sections                     Section[]
  boardSections                BoardSection[]
  todos                        Todo[]

  createdAt                    DateTime  @default(now())
  updatedAt                    DateTime  @updatedAt
  deletedAt                    DateTime?

  @@index([userId, deletedAt])
  @@index([createdAt(sort: Desc)])
}

model Todo {
  id             String    @id @default(uuid())
  userId         String
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  projectId      String?
  project        Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  sectionId      String?
  section        Section?  @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  
  boardSectionId String?
  boardSection   BoardSection? @relation(fields: [boardSectionId], references: [id], onDelete: Cascade)
  
  title          String
  description    String?
  isCompleted    Boolean   @default(false)
  order          Int       // Position within parent
  
  dueDate        DateTime?
  priority       String?   // "low" | "medium" | "high"

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  completedAt    DateTime?
  deletedAt      DateTime?

  @@index([userId, deletedAt])
  @@index([projectId, sectionId, order, deletedAt])
  @@index([projectId, boardSectionId, order, deletedAt])
  @@index([isCompleted, userId, deletedAt])
}

model Section {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  name        String
  description String?
  order       Int
  isCollapsed Boolean   @default(false)
  color       String?

  todos       Todo[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([projectId, order, deletedAt])
  @@index([userId, deletedAt])
}

model BoardSection {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  name        String
  description String?
  order       Int
  color       String?
  wip         Int?      // Work-in-progress limit

  todos       Todo[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([projectId, order, deletedAt])
  @@index([userId, deletedAt])
}
```

---

## 3. Relationship Diagram (ER Diagram)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA                                 │
└──────────────────────────────────────────────────────────────────────────┘

                            ┌─────────────┐
                            │   User      │
                            │─────────────│
                            │ id (PK)     │
                            │ email       │
                            │ preferences │
                            └──────┬──────┘
                                   │ (1)
                    ┌──────────────┼──────────────┐
                    │ (many)       │ (many)       │ (many)
                    │              │              │
            ┌───────▼────────┐ ┌──▼──────────┐ ┌─▼─────────────┐
            │  Project       │ │   Todo      │ │  Section      │
            │────────────────│ │─────────────│ │───────────────│
            │ id (PK)        │ │ id (PK)     │ │ id (PK)       │
            │ userId (FK)    │ │ userId (FK) │ │ userId (FK)   │
            │ name           │ │ projectId   │ │ projectId (FK)│
            │ viewType       │ │ sectionId   │ │ name          │
            │ settings       │ │ boardSec... │ │ order         │
            └───────┬────────┘ │ title       │ └───────────────┘
                    │          │ isCompleted │
                    │          │ order       │
                    │          └──────┬──────┘
                    │                 │
                    │ (1)      (many) │
                    └────────────┬────┘
                                 │
                    ┌────────────────────────┐
                    │  BoardSection          │
                    │────────────────────────│
                    │ id (PK)                │
                    │ userId (FK)            │
                    │ projectId (FK)         │
                    │ name                   │
                    │ order                  │
                    └────────────────────────┘
```

---

## 4. Query Patterns & Optimization (Prisma)

### Query 1: Get All Projects for User
```typescript
const projects = await prisma.project.findMany({
  where: { 
    userId: currentUserId,
    deletedAt: null
  },
  orderBy: { createdAt: 'desc' }
});
```

### Query 2: Get All Todos in Project (List View)
```typescript
const todos = await prisma.todo.findMany({
  where: {
    projectId: currentProjectId,
    sectionId: null, // Direct project todos
    deletedAt: null
  },
  orderBy: { order: 'asc' }
});
```

### Query 3: Get All Completed Todos (Hierarchically Grouped)
```typescript
// With Prisma, we can easily join relations natively in one query
const completedTodos = await prisma.todo.findMany({
  where: {
    userId: currentUserId,
    isCompleted: true,
    deletedAt: null
  },
  include: {
    project: true,
    section: true
  },
  orderBy: [
    { projectId: 'asc' },
    { sectionId: 'asc' },
    { order: 'asc' }
  ]
});
// Result is easily serialized and grouped on the frontend/backend
```

### Query 4: Move Todo Between Sections & Update Orders
```typescript
// Utilizing Prisma interactive transactions for atomic order updates
await prisma.$transaction(async (tx) => {
  // Move todo to new section at order 0
  await tx.todo.update({
    where: { id: todoId },
    data: { sectionId: newSectionId, order: 0 }
  });

  // Shift other todos down
  await tx.todo.updateMany({
    where: { 
      sectionId: newSectionId,
      id: { not: todoId },
      order: { gte: 0 }
    },
    data: { order: { increment: 1 } }
  });
});
```

### Query 5: Soft Delete Section + All Todos
```typescript
await prisma.$transaction([
  prisma.section.update({
    where: { id: sectionId },
    data: { deletedAt: new Date() }
  }),
  prisma.todo.updateMany({
    where: { sectionId: sectionId, deletedAt: null },
    data: { deletedAt: new Date() }
  })
]);
```

---

## 5. End of Database Schema Document
