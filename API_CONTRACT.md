# API Contract & Endpoint Specification
## Todo App - Express Backend API

**Version:** 1.0  
**Date:** March 28, 2026  
**Base URL:** `http://localhost:5000/api`  
**Authentication:** Bearer Token (JWT, Phase 5)

---

## 📋 Quick Reference Table

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---|
| GET | `/health` | Health check | No |
| **PROJECTS** | | | |
| POST | `/projects` | Create project | Yes (Phase 5) |
| GET | `/projects` | List projects | Yes (Phase 5) |
| GET | `/projects/:id` | Get project details | Yes (Phase 5) |
| PUT | `/projects/:id` | Update project | Yes (Phase 5) |
| DELETE | `/projects/:id` | Soft-delete project | Yes (Phase 5) |
| **TODOS** | | | |
| POST | `/todos` | Create todo | Yes (Phase 5) |
| GET | `/todos` | List todos (filtered) | Yes (Phase 5) |
| PUT | `/todos/:id` | Update todo | Yes (Phase 5) |
| PATCH | `/todos/:id/move` | Move todo between sections | Yes (Phase 5) |
| DELETE | `/todos/:id` | Soft-delete todo | Yes (Phase 5) |
| **SECTIONS** | | | |
| POST | `/sections` | Create section | Yes (Phase 5) |
| PUT | `/sections/:id` | Update section | Yes (Phase 5) |
| DELETE | `/sections/:id` | Soft-delete section | Yes (Phase 5) |
| PATCH | `/sections/batch/reorder` | Reorder multiple sections | Yes (Phase 5) |
| **BOARD SECTIONS** | | | |
| POST | `/boardSections` | Create board section | Yes (Phase 5) |
| PUT | `/boardSections/:id` | Update board section | Yes (Phase 5) |
| DELETE | `/boardSections/:id` | Soft-delete board section | Yes (Phase 5) |
| PATCH | `/boardSections/batch/reorder` | Reorder board sections | Yes (Phase 5) |

---

## 🔗 Detailed Endpoint Specifications

### 1. HEALTH CHECK

#### GET `/api/health`
Check if backend is running.

**Request:**
```
GET /api/health
```

**Response (200 OK):**
```typescript
{
  status: string;        // "OK"
  message: string;       // "Backend is running"
}
```

**Example:**
```bash
curl http://localhost:5000/api/health
```

---

## 📁 PROJECTS

### 2. CREATE PROJECT

#### POST `/api/projects`
Create a new project for the current user.

**Request:**
```typescript
{
  name: string;                    // Required. Min 1, Max 100 chars
  description?: string;            // Optional. Max 500 chars
  viewType: "list" | "board";     // Required. Default project view
  color?: string;                  // Optional. Hex color (e.g., "#FF5733")
  icon?: string;                   // Optional. Icon name (e.g., "inbox")
}
```

**Response (201 Created):**
```typescript
{
  id: string;                      // UUID
  userId: string;                  // Current user ID
  name: string;
  description: string | null;
  viewType: "list" | "board";
  status: string;                  // "active"
  color: string | null;
  icon: string | null;
  defaultSortOrder: string;        // "manual"
  showCompletedTodos: boolean;     // true
  allowDragDropBetweenSections: boolean; // true
  createdAt: string;               // ISO 8601 timestamp
  updatedAt: string;               // ISO 8601 timestamp
  deletedAt: string | null;        // null for active
}
```

**Error Responses:**
- **400 Bad Request** — Missing required fields or validation failed
  ```typescript
  { error: string; message: string; }
  ```
- **401 Unauthorized** — User not authenticated (Phase 5)
  ```typescript
  { error: "Unauthorized"; message: "JWT token missing or invalid" }
  ```

**Example:**
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Angular Project",
    "viewType": "list",
    "color": "#FF5733"
  }'
```

---

### 3. LIST PROJECTS

#### GET `/api/projects`
List all projects for the current user (excludes deleted).

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|---|
| `skip` | number | 0 | Pagination offset |
| `take` | number | 50 | Items per page |
| `sortBy` | string | "createdAt" | Field to sort by (createdAt, name) |
| `sortOrder` | "asc" \| "desc" | "desc" | Sort direction |

**Request:**
```
GET /api/projects?skip=0&take=10&sortBy=createdAt&sortOrder=desc
```

**Response (200 OK):**
```typescript
{
  data: Project[];                 // Array of Project objects
  total: number;                   // Total count of projects
  skip: number;
  take: number;
}
```

**Project Shape:**
```typescript
{
  id: string;
  userId: string;
  name: string;
  description: string | null;
  viewType: "list" | "board";
  status: string;
  color: string | null;
  icon: string | null;
  defaultSortOrder: string;
  showCompletedTodos: boolean;
  allowDragDropBetweenSections: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;  // Always null in this response
}
```

**Example:**
```bash
curl http://localhost:5000/api/projects?skip=0&take=20
```

---

### 4. GET PROJECT DETAILS

#### GET `/api/projects/:id`
Retrieve a single project with associated metadata.

**URL Parameters:**
- `id` (string, UUID) — Project ID

**Request:**
```
GET /api/projects/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```typescript
{
  id: string;
  userId: string;
  name: string;
  description: string | null;
  viewType: "list" | "board";
  status: string;
  color: string | null;
  icon: string | null;
  defaultSortOrder: string;
  showCompletedTodos: boolean;
  allowDragDropBetweenSections: boolean;
  sections?: Section[];           // Included if viewType = "list"
  boardSections?: BoardSection[]; // Included if viewType = "board"
  todos?: Todo[];                 // Direct project todos
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
}
```

**Error Responses:**
- **404 Not Found** — Project ID doesn't exist or belongs to another user
  ```typescript
  { error: "NotFound"; message: "Project not found" }
  ```

**Example:**
```bash
curl http://localhost:5000/api/projects/550e8400-e29b-41d4-a716-446655440000
```

---

### 5. UPDATE PROJECT

#### PUT `/api/projects/:id`
Update project metadata.

**URL Parameters:**
- `id` (string, UUID) — Project ID

**Request Body:**
```typescript
{
  name?: string;                   // Optional. Max 100 chars
  description?: string;            // Optional. Max 500 chars
  viewType?: "list" | "board";    // Optional. Can't change if todos exist
  color?: string;                  // Optional. Hex color
  icon?: string;                   // Optional
  status?: "active" | "archived";  // Optional
  showCompletedTodos?: boolean;    // Optional
  allowDragDropBetweenSections?: boolean;
}
```

**Response (200 OK):**
```typescript
{
  id: string;
  userId: string;
  name: string;
  description: string | null;
  viewType: "list" | "board";
  status: string;
  color: string | null;
  icon: string | null;
  defaultSortOrder: string;
  showCompletedTodos: boolean;
  allowDragDropBetweenSections: boolean;
  createdAt: string;
  updatedAt: string;    // Updated timestamp
  deletedAt: null;
}
```

**Error Responses:**
- **400 Bad Request** — Validation failed
- **404 Not Found** — Project not found
- **403 Forbidden** — User doesn't own project

**Example:**
```bash
curl -X PUT http://localhost:5000/api/projects/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Project Name",
    "color": "#00FF00"
  }'
```

---

### 6. DELETE PROJECT (Soft Delete)

#### DELETE `/api/projects/:id`
Mark project as deleted (soft delete). All child todos/sections are cascade-deleted.

**URL Parameters:**
- `id` (string, UUID) — Project ID

**Request:**
```
DELETE /api/projects/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```typescript
{
  id: string;
  userId: string;
  name: string;
  description: string | null;
  viewType: "list" | "board";
  status: string;
  color: string | null;
  icon: string | null;
  defaultSortOrder: string;
  showCompletedTodos: boolean;
  allowDragDropBetweenSections: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;   // NOW SET (ISO 8601 timestamp)
}
```

**Error Responses:**
- **404 Not Found** — Project not found
- **403 Forbidden** — User doesn't own project

---

## 📝 TODOS

### 7. CREATE TODO

#### POST `/api/todos`
Create a new todo item.

**Request Body:**
```typescript
{
  projectId: string;               // Required. Must exist and belong to user
  sectionId?: string;              // Optional. If provided, todo goes in section
  boardSectionId?: string;         // Optional. If provided, todo goes in board column
  title: string;                   // Required. Min 1, Max 200 chars
  description?: string;            // Optional. Max 1000 chars
  dueDate?: string;                // Optional. ISO 8601 date (Phase 5+)
  priority?: "low" | "medium" | "high"; // Optional (Phase 5+)
}
```

**Response (201 Created):**
```typescript
{
  id: string;                      // UUID
  userId: string;
  projectId: string;
  sectionId: string | null;
  boardSectionId: string | null;
  title: string;
  description: string | null;
  isCompleted: boolean;            // false
  order: number;                   // Auto-calculated position
  dueDate: string | null;
  priority: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
}
```

**Error Responses:**
- **400 Bad Request** — Invalid input
- **404 Not Found** — Project/section not found
- **403 Forbidden** — User doesn't own project

**Example:**
```bash
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "sectionId": "660e8400-e29b-41d4-a716-446655440000",
    "title": "Learn Angular directives",
    "description": "Understand *ngIf, *ngFor, etc."
  }'
```

---

### 8. LIST TODOS

#### GET `/api/todos`
Fetch todos with optional filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|---|
| `projectId` | string | - | Filter by project (required for most use cases) |
| `sectionId` | string | - | Filter by section (optional) |
| `boardSectionId` | string | - | Filter by board section (optional) |
| `isCompleted` | boolean | - | Filter by completion status (optional) |
| `skip` | number | 0 | Pagination offset |
| `take` | number | 100 | Items per page |
| `sortBy` | string | "order" | Field to sort by (order, createdAt, dueDate) |

**Request:**
```
GET /api/todos?projectId=550e8400-e29b-41d4-a716-446655440000&sectionId=660e8400-e29b-41d4-a716-446655440000&isCompleted=false&skip=0&take=50
```

**Response (200 OK):**
```typescript
{
  data: Todo[];                    // Array of Todo objects
  total: number;                   // Total count matching filters
  skip: number;
  take: number;
}
```

**Todo Shape:**
```typescript
{
  id: string;
  userId: string;
  projectId: string;
  sectionId: string | null;
  boardSectionId: string | null;
  title: string;
  description: string | null;
  isCompleted: boolean;
  order: number;
  dueDate: string | null;
  priority: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;  // Always null in active list
}
```

**Example:**
```bash
# List all active todos in a project
curl "http://localhost:5000/api/todos?projectId=550e8400-e29b-41d4-a716-446655440000&isCompleted=false"

# List todos in a specific section
curl "http://localhost:5000/api/todos?projectId=550e8400-e29b-41d4-a716-446655440000&sectionId=660e8400-e29b-41d4-a716-446655440000"

# List completed todos
curl "http://localhost:5000/api/todos?projectId=550e8400-e29b-41d4-a716-446655440000&isCompleted=true"
```

---

### 9. UPDATE TODO

#### PUT `/api/todos/:id`
Update a todo's properties.

**URL Parameters:**
- `id` (string, UUID) — Todo ID

**Request Body (all optional):**
```typescript
{
  title?: string;                  // Max 200 chars
  description?: string;            // Max 1000 chars
  isCompleted?: boolean;           // Mark as done/undone
  dueDate?: string;                // ISO 8601 date
  priority?: "low" | "medium" | "high";
}
```

**Response (200 OK):**
```typescript
{
  id: string;
  userId: string;
  projectId: string;
  sectionId: string | null;
  boardSectionId: string | null;
  title: string;
  description: string | null;
  isCompleted: boolean;            // Updated value
  order: number;
  dueDate: string | null;
  priority: string | null;
  completedAt: string | null;      // Updated if isCompleted changed
  createdAt: string;
  updatedAt: string;               // Updated timestamp
  deletedAt: null;
}
```

**Logic:**
- When `isCompleted` changes from `false` → `true`: Set `completedAt` to now
- When `isCompleted` changes from `true` → `false`: Set `completedAt` to null

**Error Responses:**
- **404 Not Found** — Todo not found
- **403 Forbidden** — User doesn't own todo

**Example:**
```bash
# Mark todo as complete
curl -X PUT http://localhost:5000/api/todos/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "isCompleted": true
  }'

# Update title and priority
curl -X PUT http://localhost:5000/api/todos/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated título",
    "priority": "high"
  }'
```

---

### 10. MOVE TODO

#### PATCH `/api/todos/:id/move`
Move a todo to a different section or reorder within section.

**URL Parameters:**
- `id` (string, UUID) — Todo ID

**Request Body:**
```typescript
{
  sectionId?: string;              // Optional. Move to this section (null = no section)
  boardSectionId?: string;         // Optional. Move to this board section (null = no section)
  newOrder?: number;               // Optional. New position in target section (0-based)
}
```

**Response (200 OK):**
```typescript
{
  id: string;
  userId: string;
  projectId: string;
  sectionId: string | null;       // Updated
  boardSectionId: string | null;  // Updated
  title: string;
  description: string | null;
  isCompleted: boolean;
  order: number;                   // Updated
  dueDate: string | null;
  priority: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
}
```

**Logic (Backend):**
1. Move todo to target sectionId/boardSectionId
2. Insert at position `newOrder` (0-based)
3. Increment `order` for all subsequent todos in that section
4. Decrement `order` for todos that were below old position

**Error Responses:**
- **404 Not Found** — Todo or target section not found
- **400 Bad Request** — Invalid move (e.g., cross-project move)
- **403 Forbidden** — User doesn't own resources

**Example:**
```bash
# Move todo to different section at position 0
curl -X PATCH http://localhost:5000/api/todos/550e8400-e29b-41d4-a716-446655440000/move \
  -H "Content-Type: application/json" \
  -d '{
    "sectionId": "770e8400-e29b-41d4-a716-446655440000",
    "newOrder": 0
  }'

# Reorder within same section
curl -X PATCH http://localhost:5000/api/todos/550e8400-e29b-41d4-a716-446655440000/move \
  -H "Content-Type: application/json" \
  -d '{
    "newOrder": 2
  }'
```

---

### 11. DELETE TODO (Soft Delete)

#### DELETE `/api/todos/:id`
Soft-delete a todo (sets `deletedAt`).

**URL Parameters:**
- `id` (string, UUID) — Todo ID

**Request:**
```
DELETE /api/todos/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```typescript
{
  id: string;
  userId: string;
  projectId: string;
  sectionId: string | null;
  boardSectionId: string | null;
  title: string;
  description: string | null;
  isCompleted: boolean;
  order: number;
  dueDate: string | null;
  priority: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;   // NOW SET (ISO 8601 timestamp)
}
```

---

## 📂 SECTIONS

### 12. CREATE SECTION

#### POST `/api/sections`
Create a new section within a project (list view).

**Request Body:**
```typescript
{
  projectId: string;               // Required. UUID
  name: string;                    // Required. Min 1, Max 100 chars
  description?: string;            // Optional. Max 500 chars
  color?: string;                  // Optional. Hex color
}
```

**Response (201 Created):**
```typescript
{
  id: string;                      // UUID
  userId: string;
  projectId: string;
  name: string;
  description: string | null;
  order: number;                   // Auto-calculated
  isCollapsed: boolean;            // false
  color: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
}
```

---

### 13. UPDATE SECTION

#### PUT `/api/sections/:id`
Update section metadata.

**URL Parameters:**
- `id` (string, UUID) — Section ID

**Request Body (all optional):**
```typescript
{
  name?: string;
  description?: string;
  color?: string;
  isCollapsed?: boolean;
}
```

**Response (200 OK):**
Same as section schema with updated fields.

---

### 14. DELETE SECTION (Soft Delete)

#### DELETE `/api/sections/:id`
Soft-delete a section and all child todos.

**Request with Confirmation:**
```typescript
{
  // Optional: Client can include list of todo IDs being deleted for logging
  affectedTodoCount?: number;
}
```

**Response (200 OK):**
```typescript
{
  id: string;
  userId: string;
  projectId: string;
  name: string;
  description: string | null;
  order: number;
  isCollapsed: boolean;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;   // NOW SET
}
```

**Backend Logic:**
1. Check section ownership
2. Soft-delete section: `UPDATE sections SET deletedAt=NOW() WHERE id=?`
3. Soft-delete all todos: `UPDATE todos SET deletedAt=NOW() WHERE sectionId=?`
4. Reorder remaining sections (decrement order)

---

### 15. BATCH REORDER SECTIONS

#### PATCH `/api/sections/batch/reorder`
Reorder multiple sections atomically.

**Request Body:**
```typescript
{
  reorders: Array<{
    id: string;       // Section ID
    newOrder: number; // New position
  }>
}
```

**Example:**
```json
{
  "reorders": [
    { "id": "550e8400-e29b-41d4-a716-446655440000", "newOrder": 0 },
    { "id": "660e8400-e29b-41d4-a716-446655440000", "newOrder": 1 },
    { "id": "770e8400-e29b-41d4-a716-446655440000", "newOrder": 2 }
  ]
}
```

**Response (200 OK):**
```typescript
{
  updated: Section[];
  total: number;
}
```

---

## 🎯 BOARD SECTIONS

### 16-19. BOARD SECTIONS
Mirrored endpoints for BoardSection (create, update, delete, batch reorder).

Same structure as regular Sections but with additional field:
```typescript
{
  // ... all section fields ...
  wip?: number;      // Work-in-progress limit (optional Kanban feature)
}
```

---

## ✅ Standard Response Patterns

### Success Response (2xx)
```typescript
// Single resource
{
  id: string;
  // ... fields
}

// Multiple resources
{
  data: Array<T>;
  total: number;
  skip?: number;
  take?: number;
}
```

### Error Response (4xx, 5xx)
```typescript
{
  error: string;           // Error code (e.g., "NotFound", "ValidationError")
  message: string;         // Human-readable message
  details?: Record<string, any>;  // Additional validation errors
  timestamp: string;       // ISO 8601 timestamp
}
```

**Common Error Codes:**
- `400` — ValidationError
- `401` — Unauthorized
- `403` — Forbidden
- `404` — NotFound
- `409` — Conflict (e.g., duplicate email)
- `500` — InternalServerError

---

## 🔐 Authentication & Authorization (Phase 5)

**Header Format:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Validation Rules:**
1. JWT token extracted from `Authorization` header
2. Token decoded and userId obtained
3. All queries filtered by `userId` to ensure data isolation
4. Resource ownership verified before CRUD operations

---

## 🧪 Testing Checklist

Test each endpoint with:
1. ✅ Valid request → 200 OK response
2. ✅ Invalid input → 400 Bad Request
3. ✅ Missing resource → 404 Not Found
4. ✅ Unauthorized access → 403 Forbidden (Phase 5)
5. ✅ Soft-delete verification (deletedAt filter in list queries)
6. ✅ Order field consistency after moves/reorders
7. ✅ Cascade deletes work correctly

---

## 📚 Example Usage (Postman Collection)

See [POSTMAN_COLLECTION.json](./POSTMAN_COLLECTION.json) for pre-configured requests (link to be added).

---

**End of API Contract Document**
