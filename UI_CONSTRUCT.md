# UI Construct Specifications
## Todo App - Component Design & Layout Details

**Version:** 1.0  
**Date:** March 27, 2026  
**Format:** Component hierarchy, wireframes, interaction specs, responsive rules

---

## 1. Overall Layout Architecture

### Global Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER WINDOW                             │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                    │
│  SIDEBAR     │             MAIN CONTENT AREA                    │
│  (200-250px) │    (flex-grow, responsive)                       │
│              │                                                    │
│  ┌────────┐  │  ┌─────────────────────────────────────────────┐ │
│  │ LOGO   │  │  │  HEADER (Project Title + Options)           │ │
│  │        │  │  │  ┌───────────────────────────────────────┐  │ │
│  └────────┘  │  │  │ "Angular" | [List/Board toggle] | ⋯   │  │ │
│  ────────────┤  │  └───────────────────────────────────────┘  │ │
│  │ 📥 Todo│5  │  ├─────────────────────────────────────────────┤ │
│  │        │  │  │  VIEW CONTAINER (List/Board/Completed)      │ │
│  ├────────┤  │  │  ┌─────────────────────────────────────────┐ │ │
│  │Projects│  │  │  │                                         │ │ │
│  │────────│  │  │  │  [Content rendered based on viewType]   │ │ │
│  │┌──────┐   │  │  │                                         │ │ │
│  ││Angul.│ 7 │  │  │  • LIST VIEW: Sections + Todos         │ │ │
│  │└──────┘   │  │  │  • BOARD VIEW: Kanban columns          │ │ │
│  │┌──────┐   │  │  │  • COMPLETED VIEW: Grouped tree        │ │ │
│  ││Sprint│ 18│  │  │                                         │ │ │
│  │└──────┘   │  │  │                                         │ │ │
│  │           │  │  └─────────────────────────────────────────┘ │ │
│  │ + Add Pro │  │                                                 │ │
│  ├────────┤  │  └─────────────────────────────────────────────┘ │
│  │✓ Complet│12│                                                  │
│  │        │  │                                                  │
│  └────────┘  │                                                  │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Width | Name | Sidebar | Main Content |
|------------|-------|------|---------|--------------|
| Mobile | <768px | sm | Hamburger drawer | Full width |
| Tablet | 768-1024px | md | Collapsed (icons only) | Adjusted |
| Desktop | >1024px | lg | Full (200-250px) | Full width |

---

## 2. Component Hierarchy & Specifications

### COMPONENT TREE

```
App (Layout wrapper)
├── Sidebar
│   ├── BrandingHeader
│   ├── InboxCard
│   ├── ProjectsList
│   │   ├── ProjectItem (expandable)
│   │   │   └── Badge (count)
│   │   └── AddProjectButton
│   ├── Divider
│   ├── CompletedLink
│   └── HamburgerToggle (mobile only)
│
└── MainContent
    ├── Header
    │   ├── ProjectTitle
    │   ├── ViewToggle (List/Board buttons)
    │   ├── SearchBar (placeholder, future)
    │   └── OptionsMenu (⋯)
    │
    ├── ContentArea (conditional rendering)
    │   ├── ListView
    │   │   ├── AddTaskButton (top)
    │   │   ├── DirectTodosList
    │   │   │   └── TodoItem (draggable, interactive)
    │   │   ├── SectionsList (expandable)
    │   │   │   ├── SectionHeader (with collapse, hover actions)
    │   │   │   │   └── Reorder Icon (hover left)
    │   │   │   │   └── Edit/Delete Icons (hover right)
    │   │   │   ├── TodosList (within section, draggable)
    │   │   │   │   └── TodoItem
    │   │   │   └── AddTaskInSection
    │   │   └── AddSectionButton (bottom)
    │   │
    │   ├── BoardView
    │   │   ├── ColumnContainer (horizontal scroll/grid)
    │   │   │   ├── BoardColumn (repeating)
    │   │   │   │   ├── ColumnHeader (title, count, options)
    │   │   │   │   ├── DropZone (droppable area)
    │   │   │   │   │   └── TodoCard (draggable, interactive)
    │   │   │   │   └── AddCardButton (within column)
    │   │   │   └── AddBoardSectionButton (end of scroll)
    │   │   └── AddBoardSectionButton (top/side)
    │   │
    │   └── CompletedView
    │       ├── TabNavigation (if multiple sections)
    │       ├── GroupedList
    │       │   ├── ProjectSection (collapsible)
    │       │   │   ├── ProjectHeader
    │       │   │   ├── [SectionGroup (if sections exist)]
    │       │   │   │   ├── SectionHeader
    │       │   │   │   └── CompletedTodoItem (strikethrough)
    │       │   │   └── DirectCompletedTodo (if direct todos)
    │       │   └── [Next Project...]
    │       └── ClearCompletedButton (future)
    │
    ├── Modals (conditional)
    │   ├── DeleteConfirmationModal
    │   │   ├── ConfirmButton
    │   │   └── CancelButton
    │   ├── EditTodoModal (future)
    │   └── CreateProjectModal (future)
    │
    └── Toast Notifications (error/success feedback)
```

---

## 3. Detailed Component Specifications

### 3.1 SIDEBAR

**Desktop (>1024px)**
```
┌─────────────────────┐
│   [Logo/Branding]   │ 40px height, centered
├─────────────────────┤
│ 📥 TODO         [5] │ Inbox card, inline badge
├─────────────────────┤
│ PROJECTS            │ Section label, gray text
│ ────────────────────│
│ ┌──────────────────┐│ Hoverable project item
││ 📊 Angular    [7] ││ Icon + name + badge
│└──────────────────┘│ Padding: 12px, rounded corners
│ ┌──────────────────┐│
││ 📅 Sprint 42  [18]││
│└──────────────────┘│
│ ┌──────────────────┐│
││ 📝 Random Todos[3]││
│└──────────────────┘│
│ ────────────────────│ Divider line
│ + Add Project       │ Primary action, blue text
├─────────────────────┤
│ ✓ Completed   [23] │ Completed section link
│                     │
└─────────────────────┘

Dimensions:
- Width: 200-250px (adjustable)
- Padding: 16px vertical, 12px horizontal
- Font: 14px body, 12px labels
- Background: #F5F5F5 (light) or #2D2D2D (dark)
- Text: #333333 (light) or #FFFFFF (dark)

Hover States:
- Project item: Background -> #EEEEEE (light) or #3D3D3D (dark)
- Cursor: pointer on all interactive elements
- Transition: background 200ms ease

Active State (Current Project):
- Background: #E7856A or accent color (20% opacity)
- Left border: 4px solid accent color
- Font weight: 500 (semi-bold)
```

**Mobile (<768px)**
```
┌──────────┐
│ ≡ Logo   │ Hamburger menu, compact
└──────────┘

← Drawer (slide from left, 100% width on small phones, 80% on larger)
```

### Sidebar Components

#### InboxCard
```javascript
{
  icon: "📥",
  label: "Todo",
  count: 5,            // Number of inbox todos
  onClick: () => navigate("/inbox"),
  isActive: location.pathname === "/inbox"
}

Styling:
- Clickable area: full row width with padding
- Badge: right-aligned, circular, background color (e.g., #E7856A)
- Hover: background color slight tint
```

#### ProjectItem
```javascript
{
  id: "project-123",
  name: "Angular Interview",
  count: 7,
  icon: "📊",              // Optional, can be emoji
  isActive: true,
  onClick: () => navigate("/projects/123"),
  onDelete: () => handleDelete(),  // Hover action
  onEdit: () => handleEdit()        // Hover action
}

Styling:
- Height: 48px
- Padding: 8px
- Border radius: 6px
- Icons: 18px size
- Badge styling: as above
```

---

### 3.2 MAIN HEADER

```
┌──────────────────────────────────────────────────────────────┐
│  Angular            [List] [Board]              🔍  S  ⋮     │
│  ──────────────────────────────────────────────────────────  │
│  Project name (bold, 20px)  View toggle (active underlined)  │
└──────────────────────────────────────────────────────────────┘

Components:
- ProjectTitle: Bold, 24px font weight 600
- ViewToggle: Two buttons (List/Board), active has underline/background
- SearchBar: Magnifying glass icon + input (future feature, grayed out for MVP)
- OptionsMenu: Kebab menu (⋯), opens dropdown
  - Edit Project
  - Delete Project
  - Project Settings (future)
  - Export (future)

Spacing:
- Left padding: 16px
- Right padding: 16px
- Vertical padding: 12px
- Height: 60px (includes underline divider)

Responsive:
- Mobile: Single column, stacked layout
  - Title on line 1
  - Buttons on line 2 (wrapped if space constrained)
```

---

### 3.3 LIST VIEW

```
┌────────────────────────────────────────────────────────────┐
│  + Add task                                                 │
├────────────────────────────────────────────────────────────┤
│  Direct Todos (projectId set, sectionId null):             │
│                                                             │
│  ○ Learn Web Workers for perf   [hover: ⋮  ✎ 🗑]           │
│  ○ Research Service Workers      [hover: ⋮  ✎ 🗑]           │
│                                                             │
├────────────────────────────────────────────────────────────┤
│  ▶ Core Concepts [3]              [hover: ⋮  ✎ 🗑]           │
│  ├─ ○ DI Basics                   [hover: ⋮  ✎ 🗑]           │
│  ├─ ✓ Change Detection           [strikethrough]           │
│  └─ ○ Lifecycle Hooks             [hover: ⋮  ✎ 🗑]           │
│                                                             │
│  ▼ Advanced Patterns [2/4]          [hover: ⋮  ✎ 🗑]        │
│  ├─ ○ Component Communication      [hover: ⋮  ✎ 🗑]           │
│  ├─ ✓ RxJS Patterns              [strikethrough]           │
│  ├─ ○ Form Validation             [hover: ⋮  ✎ 🗑]           │
│  └─ ○ Performance Optimization    [hover: ⋮  ✎ 🗑]           │
│                                                             │
│  + Add Section                                              │
└────────────────────────────────────────────────────────────┘

Styling Rules:
────────────
Todo Item:
- Height: 40px
- Padding: 8px 12px
- Checkbox: 18x18px, left margin 8px
- Title: 14px, left margin 8px from checkbox
- Icons (hover): opacity 0, transition 150ms -> opacity 1 on hover
- Strikethrough class: color #999, text-decoration: line-through

Section Header:
- Height: 44px
- Padding: 8px 12px
- Chevron: 16x16px, rotated 90° collapsed, 180° expanded
- Title: 14px bold, weight 600, left margin 4px
- Badge: (3/4) showing completed/total, small 12px font
- Border: none, subtle background #F9F9F9 on hover
- Full row clickable for expand/collapse

Spacing:
- Between direct todos and sections: 16px gap
- Between sections: 8px gap
- Section nested indent: 16px
- Left edge alignment: todos at x=12px, nested todos at x=28px (12 + 16)

Hover Interactions:
────────────────
TodoItem hover:
- Background: #F5F5F5 (light) or #3D3D3D (dark)
- Reorder icon (left): Fade in from opacity 0
- Edit/delete icons (right): Fade in from opacity 0
- Transition: all 150ms ease

SectionHeader hover:
- Background: #F5F5F5 (light)
- Reorder icon: Appears left of chevron
- Options menu: Emphasizes on right side
- Transition: all 150ms ease

Add Buttons:
- "+ Add task": Primary blue, 14px, clickable
- "+ Add Section": Primary blue, 14px, clickable
- Opens inline form or textarea (expandable)
```

#### TodoItem Component

```javascript
Props: {
  id: string,
  title: string,
  description?: string,
  isCompleted: boolean,
  order: number,
  parentId: string,  // projectId or sectionId
  onToggle: () => void,
  onEdit: () => void,
  onDelete: () => void,
  onReorder: (newOrder) => void
}

States:
- Hover: Show reorder + edit/delete icons
- Editing: Replace with textarea (inline edit mode)
- Dragging: Opacity 0.7, cursor: grabbing
- Completed: Strikethrough text, gray color

Events:
- Click checkbox: Toggle isCompleted
- Drag: Trigger reorder logic
- Hover left icon: Show reorder cursor
- Hover right icons: Show delete confirmation tooltip
```

#### SectionHeader Component

```javascript
Props: {
  id: string,
  name: string,
  count: number,
  completedCount: number,
  isCollapsed: boolean,
  onToggle: () => void,
  onEdit: () => void,
  onDelete: () => void,
  onReorder: () => void
}

Display:
- Always show: chevron (collapse/expand)
- Always show: section name + count badge
- On hover: Reorder icon (left), options menu (right)

Badge Display:
- If completedCount > 0: Show "[completedCount]/[total]" in smaller font
- Else: Show only "total" count

Delete Action:
- onClick delete icon -> modal: "Delete 'Core Concepts' and 3 todos?"
```

---

### 3.4 BOARD VIEW

```
┌──────────────────────────────────────────────────────────────────┐
│ ← [Horizontally scrollable] →                                     │
│                                                                   │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │
│ │ To Do      [5]  │ │ In Progress [3] │ │ Done       [2]  │ ... │
│ ├─────────────────┤ ├─────────────────┤ ├─────────────────┤     │
│ │                 │ │                 │ │                 │     │
│ │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │     │
│ │ │ Setup form  │ │ │ │ Add header  │ │ │ │ Deploy to  ✓ │ │     │
│ │ │ validation  │ │ │ │ validation  │ │ │ │ production   │ │     │
│ │ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │     │
│ │ [hover: ✎ 🗑⋮]  │ │ [hover: ✎ 🗑⋮]  │ │ [hover: ✎ 🗑⋮]  │     │
│ │                 │ │                 │ │                 │     │
│ │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │     │
│ │ │ Create test │ │ │ │ Fix mobile  │ │ │ │ Write docs ✓ │ │     │
│ │ │ suite       │ │ │ │ responsive  │ │ │ │              │ │     │
│ │ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │     │
│ │ [hover: ✎ 🗑⋮]  │ │ [hover: ✎ 🗑⋮]  │ │                 │     │
│ │                 │ │                 │ │                 │     │
│ │ + Add card      │ │ + Add card      │ │ + Add card      │     │
│ │                 │ │                 │ │                 │     │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘     │
│                                                                   │
│                  + Add Board Section                              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

Column Dimensions:
─────────────────
Width: 300-350px (fixed or responsive)
Min width: 280px on mobile
Height: Scrollable (flex-grow)

Header:
- Height: 44px
- Padding: 12px
- Title: 14px bold, weight 600
- Badge: right-aligned, 12px font (showing count)
- Background: Slightly darker than cards (#F0F0F0 or #3D3D3D dark)
- Border bottom: 1px solid #E0E0E0

Card (TodoCard):
- Dimensions: ~280x60px (flexible)
- Padding: 12px
- Border radius: 6px
- Background: White (#FFFFFF) or #2D2D2D dark
- Shadow: 0 2px 8px rgba(0,0,0,0.1)
- Margin: 8px 0 (between cards)
- Border: 1px solid #E0E0E0 or transparent

Card Hover:
- Shadow: 0 4px 12px rgba(0,0,0,0.15)
- Transform: translateY(-2px) (subtle lift)
- Icon visibility: Icons appear
- Cursor: grab (for draggable area)

Card Dragging:
- Opacity: 0.7
- Shadow: 0 8px 16px rgba(0,0,0,0.2)
- Cursor: grabbing
- Background: Slightly tint (0.95 opacity)

Card Completed (Strikethrough):
- Color: #999
- Text-decoration: line-through
- Opacity: 0.8

Drop Zone:
- Min height: 100px (when column empty)
- Border: 2px dashed #E0E0E0 (when drag over)
- Color change: Border becomes #3498db when valid drop target
- Transition: 150ms ease

Add Button (in column):
- "+ Add card": 12px font, gray text
- Clicking: Inline form appears (textarea + submit button)
- Padding: 8px

Add Button (create section):
- "+ Add Board Section": Bottom center or end of scroll
- Styled same as "+ Add Section" in list view
```

#### BoardColumn Component

```javascript
Props: {
  id: string,                    // boardSectionId
  name: string,
  todos: Array<TodoObject>,
  onAddTodo: () => void,
  onDeleteTodo: (id) => void,
  onMoveTodo: (todoId, targetSectionId) => void,
  onReorderTodos: (updatedOrders) => void
}

States:
- Normal: Display all todos
- DragOver: Highlight drop zone with border/color
- Empty: Show "Drop todos here" or "+ Add card"

Events:
- Drop: Handle drag-drop from other columns
- Drag start: Set drag data (source column, todo ID)
- Drag end: Finalize reorder or move
```

---

### 3.5 COMPLETED VIEW

```
┌────────────────────────────────────────────────────────┐
│                  COMPLETED TASKS                        │
│ ────────────────────────────────────────────────────── │
│                                                         │
│ ▶ Angular Interview              23 completed         │
│   Project header, clickable to expand/collapse        │
│                                                         │
│   ▶ Core Concepts                (3)                  │
│   │                                                    │
│   ├─ ✓ DI Basics                                       │
│   │  (strikethrough, gray text)                        │
│   ├─ ✓ Change Detection                               │
│   └─ ✓ Lifecycle Hooks                                │
│                                                         │
│   ▼ Advanced Patterns            (2)                  │
│   ├─ ✓ Component Communication                         │
│   └─ ✓ RxJS Patterns                                  │
│                                                         │
│   ▶ Other Section               (1)                   │
│                                                         │
│ ▶ Sprint 42                      5 completed          │
│   Project header                                      │
│                                                         │
│   ├─ ✓ Deploy to production                           │
│   ├─ ✓ Write docs                                     │
│   ├─ ✓ Code review               [via section]        │
│   └─ ...                                              │
│                                                         │
│ ▶ Random Ideas                   1 completed          │
│   ├─ ✓ Brainstorm API design                          │
│                                                         │
│ ────────────────────────────────────────────────────── │
│ 🗑 Clear All Completed (future)   ↓ Export (future)   │
└────────────────────────────────────────────────────────┘

Styling:
─────
ProjectGroup:
- Header height: 48px
- Padding: 12px 16px
- Chevron: 16x16px, left margin 8px
- Title: 14px bold, weight 600
- Badge: (23) completed, right-aligned, gray 12px font
- Background: #F5F5F5 (light), slight hover
- Border: none, underline divider

SectionGroup (nested under project):
- Header height: 40px
- Indent: 24px from left edge (nested level)
- Chevron: 14x14px
- Title: 13px, weight 500
- Badge: (3) count in section
- Background: #FAFAFA (even lighter)

CompletedTodo (nested under section):
- Height: 36px
- Indent: 48px from left edge (double nested)
- Checkbox: ☑ (checked icon)
- Text: Gray (#999), strikethrough, 13px
- Padding: 4px 12px
- Margin: 2px 0

DirectCompletedTodo (not in section, nested under project):
- Indent: 40px from left edge
- Same styling as completed todo

Spacing:
- Between projects: 16px gap
- Between sections within project: 8px gap
- Between todos: 4px gap
```

#### CompletedView Component

```javascript
Props: {
  completedTodos: Array<TodoObject>,
  allProjects: Array<ProjectObject>,
  onToggleTodo: (todoId) => void,  // Uncheck to mark incomplete
}

Data Structure:
{
  project: ProjectObject,
  sections: [
    {
      section: SectionObject,
      todos: [
        { ...TodoObject, isCompleted: true },
        ...
      ]
    },
    ...
  ],
  directTodos: [
    { ...TodoObject, isCompleted: true },
    ...
  ]
}

State:
- expandedProjects: Set<projectId>  // Track which projects expanded
- expandedSections: Set<sectionId>  // Track which sections expanded

Events:
- Click project header: Toggle expandedProjects
- Click section header: Toggle expandedSections
- Click todo checkbox: Uncheck -> toggle isCompleted to false
```

---

### 3.6 MODALS & OVERLAYS

#### Delete Confirmation Modal

```
┌──────────────────────────────────────┐
│  ⚠ Delete Section                    │
├──────────────────────────────────────┤
│                                      │
│  Delete "Core Concepts"              │
│  and 3 todos? This cannot be undone. │
│                                      │
│  [Cancel]             [Delete]       │
│                                      │
└──────────────────────────────────────┘

Styling:
- Width: 90% on mobile, max 400px on desktop
- Backdrop: rgba(0, 0, 0, 0.5), dark overlay behind
- Border radius: 8px
- Box shadow: 0 8px 32px rgba(0,0,0,0.2)
- Padding: 24px
- Title: 16px bold, weight 600
- Message: 14px, line height 1.5
- Buttons: Side-by-side, 24px gap
- Cancel button: Gray outline
- Delete button: Red background (#E74C3C or #D32F2F), white text
- Button sizing: 44px height (touch-friendly)

Animation:
- Entrance: Fade in + scale from 0.9 to 1 (200ms)
- Exit: Fade out + scale to 0.9 (200ms)
```

### Confirmation Modal Component

```javascript
Props: {
  title: string,           // "Delete Section"
  message: string,         // "Delete X and 3 todos?..."
  cancelText: string,      // "Cancel"
  confirmText: string,     // "Delete"
  onConfirm: () => void,
  onCancel: () => void,
  isDangerous: boolean     // true = red button, false = blue
}

Events:
- onConfirm: Execute action
- onCancel: Close modal
- Escape key: Close modal (onCancel)
- Click backdrop: Close modal (onCancel)
```

---

### 3.7 INLINE FORMS & EDITING

#### Add Todo Form (Inline)

```
+ Add task

[Textarea with placeholder]
│ Type todo title here...             │
└─────────────────────────────────────┘

[Cancel]  [Add task]

Styling:
- Textarea: Min height 40px, max height 120px, auto-expand
- Padding: 8px 12px
- Border: 1px solid #E0E0E0, focus: #3498db
- Buttons: Appear when focused
- Cancel: Gray text link
- Add task: Primary button color
```

#### Edit Todo Form (Inline or Modal)

```
Title: [Input field: "Learn Components"]

Description:
[Textarea with markdown support (future)]
│ This covers component basics...     │
└─────────────────────────────────────┘

[Cancel]  [Save]

Styling:
- Input fields: Full width, 36px height
- Labels: 12px gray text (#666)
- Spacing between fields: 12px
- Focus: Blue border + shadow
```

---

## 4. Interactive Behaviors

### 4.1 Drag-Drop Interactions

#### Drag in List View

```
1. Hover over todo -> reorder icon (⋮) appears
2. User hovers over reorder icon -> cursor: grab
3. User clicks + drags reorder icon
4. Todo being dragged:
   - Opacity: 0.6
   - Shadow: Elevated
   - Cursor: grabbing
   - Placeholder: Gap appears in original position

5. Drag over target position:
   - Drop zone: Subtle highlight (border 1px solid #3498db)
   - Target section: Background tint #F0F8FF

6. User releases (drops):
   - Todo snaps to new position
   - Order recalculates
   - API call: PATCH /api/todos/[id]/move
   - Optimistic UI: Update immediately
   - On error: Revert with toast notification
```

#### Drag in Board View

```
1. Hover over card -> icons appear (edit/delete, no reorder)
2. User hovers anywhere on card body -> cursor: grab
3. User clicks + drags card
4. Card being dragged:
   - Opacity: 0.7
   - Shadow: 0 12px 24px rgba(0,0,0,0.2), elevated
   - Cursor: grabbing
   - Placeholder: Fades out
   - Ghost image: Semi-transparent copy follows cursor

5. Drag over target column:
   - Column border: 2px solid #3498db
   - Column background: #F0F8FF (0.1 opacity tint)
   - Drop zone: Active visual state

6. Drag within same column (reorder):
   - Cards shift down to show insertion point
   - Visual cue: 2px solid line between cards

7. User releases (drops):
   - If different column: Reorder in target
   - If same column: Reorder within column
   - API call: PATCH /api/todos/[id]/move OR batch reorder
   - Optimistic update: Card moves immediately
```

### 4.2 Hover Interactions

#### Todo Item Hover (List)

```
Initial: ○ Learn Components

Hover: 
   Left side (reorder):   ⋮ ○ Learn Components   Right side (actions):  ✎ 🗑
   
Timing: Icons fade in over 150ms
Icon opacity: 0 -> 1 on hover, 1 -> 0 on leave
```

#### Section Header Hover (List)

```
Initial:
   ▶ Core Concepts [3]      

Hover:
   ⋮ ▶ Core Concepts [3]    ✎ ⋯   (delete via ⋯ menu or x)

Icons spacing:
- Reorder icon: Left side, before chevron
- Edit icon: Right side, before options menu
- Options menu (⋯): Far right, shows dropdown
  - Edit
  - Delete
  - Duplicate (future)
```

#### Card Hover (Board)

```
Initial: 
┌────────────────┐
│ Setup form     │
│ validation     │
└────────────────┘

Hover:
┌────────────────┐
│ Setup form     │ [✎] [🗑]   <- Icons appear right side
│ validation     │
└────────────────┘
Icons opacity: 0 -> 1 over 150ms
Background: Slight tint
Shadow: Elevated
```

### 4.3 Click Actions

| Target | Click Action | Result |
|--------|--------------|--------|
| Todo checkbox | Check/uncheck | Toggle `isCompleted`, strikethrough appears/disappears |
| Todo (text area) | Click to edit | Opens inline editor or modal |
| Todo delete icon | Click | Shows confirmation modal |
| Section chevron | Click | Collapse/expand section |
| Section edit | Click | Opens inline editor for section name |
| Section delete | Click | Shows confirmation modal |
| Direct todo reorder icon | Click + drag | Reorder within project |
| Board card | Click | Open todo detail (future feature) |
| Board card reorder (drag body) | Click + drag | Move/reorder card |
| "+ Add task" | Click | Opens inline form |
| "+ Add Section" | Click | Opens inline form (not modal) |

---

## 5. Color Palette & Theming

### Light Theme (Default)

```javascript
{
  primary: "#E7856A",              // Accent color (from mockup)
  primaryHover: "#D66A50",         // Darker on hover
  primaryLight: "#F5DDD6",         // Light tint for backgrounds
  
  text: {
    primary: "#333333",            // Main text
    secondary: "#666666",          // Labels, hints
    tertiary: "#999999",           // Disabled, completed
  },
  
  background: {
    primary: "#FFFFFF",            // Section backgrounds
    secondary: "#F5F5F5",          // Alternate/section headers
    tertiary: "#FAFAFA",           // Tertiary backgrounds (nested sections)
  },
  
  border: "#E0E0E0",               // Dividers, borders
  
  feedback: {
    success: "#27AE60",            // Green
    error: "#E74C3C",              // Red
    warning: "#F39C12",            // Orange
    info: "#3498DB",               // Blue
  },
  
  shadow: "0 2px 8px rgba(0,0,0,0.1)",  // Default shadow
  shadowElevated: "0 8px 16px rgba(0,0,0,0.15)",
  
  opacity: {
    disabled: 0.5,
    dragging: 0.7,
    hover: 0.95,
  }
}
```

### Dark Theme (CSS Variables)

```css
:root {
  /* Light theme (default) */
  --color-primary: #E7856A;
  --color-text-primary: #333333;
  --color-bg-primary: #FFFFFF;
  --color-border: #E0E0E0;
  --color-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

[data-theme="dark"] {
  --color-primary: #F09080;         /* Slightly lighter for contrast */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #E0E0E0;
  --color-bg-primary: #1A1A1A;
  --color-bg-secondary: #2D2D2D;
  --color-bg-tertiary: #383838;
  --color-border: #404040;
  --color-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* Applied globally */
body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: background-color 300ms ease, color 300ms ease;
}
```

---

## 6. Typography

### Font Stack

```css
/* System fonts for performance */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Font Sizes & Weights

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page title (Project name) | 24px | 600 | 1.2 |
| Section header | 14px | 600 | 1.4 |
| Todo title | 14px | 400 | 1.4 |
| Button text | 14px | 500 | 1.2 |
| Label | 12px | 500 | 1.4 |
| Helper text | 12px | 400 | 1.4 |
| Body text | 14px | 400 | 1.6 |

---

## 7. Spacing System

### Spacing Scale (in pixels)

```
4:   2px    (minimal gaps)
1:   4px    (very small)
2:   8px    (small)
3:   12px   (medium-small)
4:   16px   (medium)
5:   20px   (medium-large)
6:   24px   (large)
8:   32px   (extra large)
10:  40px   (huge)
12:  48px   (very huge)
```

### Component Spacing Examples

| Component | Padding | Margin |
|-----------|---------|--------|
| Sidebar | 16px | 0 |
| Todo item | 8px 12px | 0 4px |
| Section header | 8px 12px | 0 0 |
| Board column | 12px | 0 8px |
| Button | 8px 16px | 0 4px |
| Modal | 24px | N/A |

---

## 8. Border Radius & Corners

```css
--radius-sm: 4px;      /* Inputs, buttons, small cards */
--radius-md: 6px;      /* Cards, sections, moderate elements */
--radius-lg: 8px;      /* Modals, larger components */
--radius-full: 9999px; /* Pills, badges */
```

---

## 9. Icons & Iconography

### Icon Set: Feather Icons (or Heroicons)

| Action | Icon | Size | Usage |
|--------|------|------|-------|
| Add | `+` or `plus` icon | 18px | "+ Add task", "+ Add section" |
| Edit | `edit-2` (pencil) | 16px | Edit todo/section |
| Delete | `trash-2` (trash can) | 16px | Delete todo/section |
| Reorder | `grip-vertical` | 16px | Drag handle |
| Collapse | `chevron-down` | 16px | Expanded state |
| Expand | `chevron-right` | 16px | Collapsed state |
| Checkbox | `check-square` (checked) | 18px | Completed state |
| Checkbox unchecked | `square` | 18px | Uncompleted state |
| Menu | `more-vertical` (⋯) | 18px | Options menu |
| Search | `search` (magnifying glass) | 18px | Search bar |
| Inbox | `inbox` | 18px | Inbox navigation |
| Completed | `check-circle` or `flag` | 18px | Completed tab |

### Icon Styling

```css
.icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  vertical-align: middle;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon-sm {
  width: 14px;
  height: 14px;
}

.icon-lg {
  width: 20px;
  height: 20px;
}

/* Hover animations */
.icon-reorder:hover {
  cursor: grab;
}

.icon-reorder:active {
  cursor: grabbing;
}
```

---

## 10. Responsive Design Rules

### Mobile (<768px)

```
Layout:
- Sidebar: Hamburger drawer (100% width or 80% on tablets)
- Main content: Full width
- Header: Stacked (title on line 1, buttons on line 2)

Adjustments:
- Padding: 12px (reduced from 16px)
- Font sizes: -1px on labels
- Touch targets: Minimum 44x44px
- Cards: Reduced width, flexbox wrapping
- Board: Horizontal scroll with scrollbar visible

Sidebar Drawer:
- Position: Fixed, left: 0, z-index: 1000
- Overlay: Backdrop when open
- Animation: Slide from left 300ms ease
- Close: Click backdrop or nav away
```

### Tablet (768px - 1024px)

```
Layout:
- Sidebar: Collapsed to icons only (60px width)
- Show tooltip on hover (project names visible on hover)
- Main content: Adjusted for narrower viewport

Cards & List:
- Board columns: 280px width (narrower)
- Todo items: Adjusted padding
- Section headers: More compact

Spacing:
- Margins: Slightly reduced
- Padding: 12px standard
```

### Desktop (>1024px)

```
Layout:
- Full sidebar (200-250px)
- Main content: Full flex-grow
- All components full-featured

Typography:
- All sizes as designed
- Full spacing

Interactions:
- All hover states fully visible
- Tooltips enabled

Performance:
- Load full-resolution assets
- Animations enabled
```

---

## 11. Animation & Transitions

### Global Transition Timings

```css
--transition-fast: 150ms ease;      /* Hover states, icon fades */
--transition-default: 200ms ease;   /* Modal entrance, page transitions */
--transition-slow: 300ms ease;      /* Drawer open/close, major layout shifts */
```

### Animation Examples

#### Icon Fade In/Out (on Hover)

```css
.icon-hidden {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.todo-item:hover .icon-hidden {
  opacity: 1;
}
```

#### Card Elevation (Drag)

```css
.card-dragging {
  box-shadow: 0 12px 24px rgba(0,0,0,0.2);
  transform: translateY(-2px);
  transition: all var(--transition-fast);
}
```

#### Modal Entrance

```css
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal {
  animation: modalSlideIn var(--transition-default);
}
```

#### Section Collapse/Expand

```css
.section-content {
  max-height: 1000px;
  overflow: hidden;
  transition: max-height var(--transition-default);
}

.section.collapsed .section-content {
  max-height: 0;
}
```

---

## 12. Accessibility (a11y)

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move focus through interactive elements |
| Shift+Tab | Move focus backwards |
| Enter | Activate button, submit form |
| Escape | Close modal, cancel edit mode |
| Space | Toggle checkbox |
| Arrow Up | Move focus to previous todo (in list) |
| Arrow Down | Move focus to next todo (in list) |
| Arrow Left | Close menu, collapse section |
| Arrow Right | Open menu, expand section |

### ARIA Labels

```html
<!-- Reorder icon -->
<button aria-label="Reorder todo. Use drag handle to move.">
  <Icon name="grip-vertical" />
</button>

<!-- Delete action -->
<button aria-label="Delete this todo">
  <Icon name="trash" />
</button>

<!-- Collapse button -->
<button aria-label="Collapse Core Concepts section" aria-expanded="true">
  <Icon name="chevron-down" />
</button>

<!-- Checkbox -->
<input type="checkbox" aria-checked="false" />
```

### Color Contrast

- **Normal text & backgrounds:** 4.5:1 minimum (WCAG AA)
- **Large text (18px+):** 3:1 minimum (WCAG AA)
- **Links:** Underlined or distinct color

### Focus Indicators

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

## 13. Error & Loading States

### Loading State (Skeleton/Placeholder)

```
Skeleton cards (pulsing animation):
┌──────────────────────────┐
│ ████████ ████████ (pulse)│
│ ████████ ████████        │
└──────────────────────────┘

Applies to:
- Project loading
- Todo list loading
- Completed tab loading
```

### Error Toast Notification

```
┌──────────────────────────────────────┐
│ ❌ Error saving todo. Try again?     │
│                               [Retry] │
└──────────────────────────────────────┘

Styling:
- Background: #FFE5E5 (light red)
- Text: #D32F2F (dark red)
- Duration: 5 seconds, then auto-dismiss
- Position: Bottom right, above keyboard on mobile
```

### Success Notification

```
✓ Todo completed!

Styling:
- Background: #D4EDDA (light green)
- Text: #155724 (dark green)
- Duration: 3 seconds
- Position: Bottom right
```

---

## 14. Empty States

### Empty Inbox

```
📥 Your inbox is empty

Start adding tasks or move todos from projects here.

[+ Add Task]
```

### Empty Project (List)

```
Add your first task

[+ Add task]

Or create sections to organize:
[+ Add Section]
```

### Empty Section

```
No tasks in this section.

[+ Add task]
```

### Empty Board Section (Column)

```
No cards yet.

Drop todos here or tap to add.

[+ Add card]
```

---

End of UI Construct Specifications

---

## Next Steps

1. Use this comprehensive UI spec with AI tool to generate visual mockups or coded components
2. Create Figma file from these specifications for design review
3. Build React components following component hierarchy in Section 2
4. Implement responsive design progressively (mobile-first approach)
5. Test accessibility and keyboard navigation against Section 12 specs

