# اقرأ — MVP Project Plan

> A small, focused web app for reading books and building community-made question sets directly around the book.
>
> **Core idea:** One book can have many independent question sets. A question set is like a separate "server" for the same map: users read the same book/page/chapter, but can choose which author's question set they want to play through.

---

## 1. Product Goal

**اقرأ** helps people read books, track their reading progress, and test their understanding without separating the questions from the book itself.

The first version should answer four simple questions:

1. Can I upload and read a book?
2. Can I create questions attached to the exact part of that book?
3. Can I choose another person's question set and take it?
4. Can I see my reading and question progress over time?

Keep everything else secondary until these four flows work well.

---

## 2. MVP Scope

### Must have

- Email/password signup and login
- User profile
- Book upload
- Book library / **My Books**
- Explore page for discovering books
- Book reader
- Reading progress
- Chapter/section/page navigation
- Create a named question set
- Attach questions to a chapter, section, or page
- Multiple question sets on the same book/location
- Choose a question set to take
- Track question score and progress per user
- Track completion of a book
- Scrubbable chapter/section timeline for navigation
- Basic search

### Nice to have later

- Public/private question sets
- Likes/favorites
- Book ratings
- Comments/discussions
- Social following
- Achievements
- Daily streaks
- AI-generated questions
- Highlights and notes
- Reading statistics
- Mobile/PWA improvements

Do **not** build these into the first MVP unless the core experience is already solid.

---

## 3. Core Mental Model

The most important design decision is separating the **book content** from the **question sets**.

### Book

The original reading material.

Example:

`Atomic Habits`

### Book location

A place inside the book where content lives.

Examples:

- Chapter 1
- Chapter 1 → Section 2
- Page 37

Use a flexible location model so the same system can support EPUB/PDF parsing later without redesigning the whole database.

### Question set

A named collection of questions created by one user for a particular book.

Examples:

- `Chapter 1 — Beginner`
- `My Revision Set`
- `Important Concepts`
- `Exam Questions`

A question set can contain questions attached to different locations in the book.

### Question

A single question belonging to a question set.

### Attempt / progress

A user's personal progress through a question set.

This is important: **question-set content is shared, but answers/progress are personal.**

---

## 4. Example User Flow

### Reading

1. User signs up.
2. User uploads a book.
3. Book is processed.
4. User opens the book.
5. Reader shows chapter/section/page navigation.
6. User reads.
7. Reading position is automatically saved.
8. Progress updates continuously.

### Creating questions

1. User opens a chapter/page.
2. User selects **Create Question Set**.
3. User gives it a name.
4. User adds questions.
5. Each question is linked to the current book location.
6. The set is saved.

### Taking another user's set

1. User opens the book.
2. User sees available question sets.
3. User chooses one.
4. User starts answering.
5. Each answer updates their personal score/progress.
6. The user can leave and continue later.

---

## 5. Navigation

### Top Navbar

Keep it simple:

- **Explore**
- **My Books**
- **Search**
- **Profile**

On mobile, collapse navigation into a compact menu.

### Main pages

```text
/
├── /login
├── /signup
├── /explore
├── /search
├── /books
├── /books/:bookId
├── /books/:bookId/read
├── /books/:bookId/question-sets
├── /books/:bookId/question-sets/:setId
├── /books/:bookId/question-sets/:setId/take
├── /books/:bookId/question-sets/:setId/manage
├── /profile/:username
└── /settings
```

Do not create separate frontend pages for every tiny state. Prefer reusable panels/modals/drawers.

---

## 6. Reader Experience

The reader is the heart of the application.

### Reader layout

```text
┌─────────────────────────────────────┐
│ Book title            Progress 42%  │
├─────────────────────────────────────┤
│                                     │
│             BOOK CONTENT            │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ Chapter 4  ─────●───────────────   │
│           Scrubbable timeline       │
└─────────────────────────────────────┘
```

### Timeline / scrubber

Represent chapters/sections as points along a horizontal navigation track.

Example:

```text
Intro ●──────●─────●────────●──────●
      Ch1   Ch2    Ch3      Ch4    Ch5
```

When question sets exist around a location, show a small marker on the timeline.

The user can drag/scrub across the timeline to navigate.

### Important distinction

The timeline is primarily a **navigation tool**, not a replacement for normal scrolling/page controls.

For MVP:

- chapter markers
- section markers when available
- current reading position
- question-set markers

Avoid making it overly visual or game-like initially.

---

## 7. Question Set System

This is the feature that makes اقرأ different.

### Question set list

On a book page, show something like:

```text
Question Sets

My Chapter 1 Review       12 questions   82%
Exam Prep                 25 questions   64%
Important Ideas           18 questions   91%
```

The score shown here should be the **current user's** score when available.

For sets the user has never attempted, show something like:

`Not started`

### Multiple sets for the same location

Example:

```text
Book: The Psychology of Money
Chapter 3

Question Sets
├── Chapter 3 — Ahmed       15 questions
├── Chapter 3 — Sara        10 questions
└── Exam Revision — Omar    20 questions
```

All are attached to the same chapter but are independent sets.

### Section-bound Question Sets & Reader Integration

To make question sets seamlessly connected to reading:

- **In-Reader Discovery**: The reader header includes an **"الأسئلة"** button showing the count of question sets for the active section/chapter. Clicking it smoothly scrolls the viewport down to the question sets list.
- **Direct Creation**: An **"+ إضافة أسئلة"** button in the reader header pre-fills the current section and allows immediate creation of a question set tied to that section.
- **Section Linkage**: Question sets can be linked to a specific `book_node` (chapter/section) or general to the whole book, enabling filtered exploration.

### Question Sets Visibility & Progress

- **Visibility**: Each set can be marked as `public` (shared with community) or `private` (author only).
- **Progress Metrics**: For each question set, the interface calculates:
  - User completion percentage (0% to 100%)
  - Number of answered questions and correct answers
  - Status badge: `مكتملة` (Completed), `قيد الحل` (In progress), or `لم تبدأ بعد` (Not started)

### Avoid duplicated question progress

Question-set progress should belong to:

`user + question_set`

Not to the question itself globally.

That means:

- The question is shared.
- The user's answer is private.
- Everyone can have a different score on the same question.

---

## 8. Question Types for MVP

Start with only a few types.

### 1. Multiple choice

Best first type because it is easy to render and grade automatically.

### 2. True / False

Very simple and useful for factual reading checks.

### 3. Short answer

Store the answer for now, but do not require sophisticated automatic grading in the MVP.

### Later

- Multiple-select
- Fill in the blank
- Ordering
- Matching
- Image questions
- Free-response grading

Keeping the initial types small will make the database, UI, and testing much easier.

---

## 9. Progress System

There are two different kinds of progress.

### Reading progress

Tracks how far the user has read in a book.

Suggested fields:

- current chapter
- current section/page
- reading position
- percentage
- started at
- last read at
- completed at

### Question progress

Tracks how far the user has progressed through a specific question set.

Suggested values:

- not started
- in progress
- completed

And metrics:

- questions attempted
- correct answers
- total questions
- score percentage
- last question
- last attempted at

### Book completion

A book should be considered completed when the user reaches the end, but allow the user to manually mark it as finished too.

---

## 10. Database Model — Supabase

Keep the schema relational and simple.

### `profiles`

```text
id                 uuid PK, references auth.users
username           text unique
avatar_url         text nullable
bio                text nullable
created_at         timestamp
```

### `books`

```text
id                 uuid PK
owner_id           uuid -> profiles.id
title              text
author              text nullable
cover_url           text nullable
description        text nullable
file_path          text
file_type          text
status             text
created_at         timestamp
```

Suggested `status` values:

- processing
- ready
- failed

### `book_nodes`

Use this instead of hard-coding only chapters.

```text
id                 uuid PK
book_id            uuid -> books.id
parent_id          uuid nullable -> book_nodes.id
type               text
label              text
order_index        integer
start_position     numeric nullable
end_position       numeric nullable
created_at         timestamp
```

Possible `type` values:

- chapter
- section
- page

This gives the app room to evolve without changing the whole model later.

### `question_sets`

```text
id                 uuid PK
book_id            uuid -> books.id
creator_id         uuid -> profiles.id
name               text
description        text nullable
visibility         text
total_questions    integer
created_at         timestamp
updated_at         timestamp
```

Suggested visibility:

- public
- private

MVP can default to public and private without building a full sharing system.

### `questions`

```text
id                 uuid PK
question_set_id    uuid -> question_sets.id
book_node_id       uuid -> book_nodes.id nullable
type               text
prompt             text
options            jsonb nullable
correct_answer     jsonb
explanation        text nullable
order_index        integer
created_at         timestamp
```

`book_node_id` lets a question belong to a chapter, section, or page.

### `question_attempts`

```text
id                 uuid PK
question_id        uuid -> questions.id
user_id            uuid -> profiles.id
answer             jsonb
is_correct         boolean
attempt_count      integer
tested_at           timestamp
```

Add a unique constraint on `(question_id, user_id)` if the MVP should store the user's latest state rather than unlimited attempt history.

### `question_set_progress`

```text
id                 uuid PK
question_set_id    uuid -> question_sets.id
user_id            uuid -> profiles.id
current_question  integer
attempted_count   integer
correct_count     integer
status            text
last_attempted_at timestamp
```

Unique constraint:

`(question_set_id, user_id)`

### `reading_progress`

```text
id                 uuid PK
book_id            uuid -> books.id
user_id            uuid -> profiles.id
current_node_id   uuid nullable -> book_nodes.id
position           numeric nullable
percent            numeric default 0
completed         boolean default false
started_at        timestamp
last_read_at      timestamp
completed_at      timestamp nullable
```

Unique constraint:

`(book_id, user_id)`

---

## 11. Supabase Storage

Use Supabase Storage for uploaded book files and covers.

Suggested buckets:

```text
books
covers
avatars
```

Keep original files private when appropriate and serve them through authenticated access.

Do not expose raw storage paths directly in the UI.

---

## 12. Authentication

Use Supabase Auth with:

- email
- password

MVP flow:

```text
Signup
  ↓
Create auth user
  ↓
Create profile
  ↓
Redirect to Explore / My Books
```

Protect authenticated routes in React.

Public pages:

- login
- signup
- explore (depending on privacy choice)

Private pages:

- my books
- reader
- question management
- profile editing

---

## 13. File Processing

Book upload is potentially the most technically difficult part, so keep the first implementation narrow.

### Recommended MVP approach

Support **one book format first**.

Prefer EPUB if the goal is structured reading, because chapters/sections can be represented more naturally.

PDF can be added later, but PDF text/layout parsing is more complicated.

### Processing pipeline

```text
Upload file
   ↓
Supabase Storage
   ↓
Create book record
   ↓
Processing step
   ↓
Extract metadata + structure
   ↓
Create book_nodes
   ↓
Book status = ready
```

For the first prototype, even a simplified parser is acceptable.

Do not build a massive document-processing system before the reader itself is proven.

---

## 14. React Architecture

Suggested structure:

```text
src/
├── app/
│   ├── router.tsx
│   └── providers.tsx
├── components/
│   ├── layout/
│   ├── ui/
│   ├── books/
│   ├── reader/
│   └── questions/
├── pages/
│   ├── auth/
│   ├── explore/
│   ├── books/
│   ├── reader/
│   ├── question-sets/
│   └── profile/
├── hooks/
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── services/
│   ├── books.ts
│   ├── questions.ts
│   ├── progress.ts
│   └── profile.ts
├── types/
└── main.tsx
```

Keep database access out of UI components where practical.

---

## 15. UI Stack

### React + Vite

Primary application framework/build tool.

### Tailwind CSS

Use for layout, spacing, responsive behavior, typography, and utility styling.

### Headless UI

Use for accessible interactive primitives such as:

- menus
- dialogs
- popovers
- tabs
- dropdowns

### Hugeicons — Sharp Stroke

Use consistently for navigation and actions.

Keep icon usage restrained. Icons should support meaning, not decorate every element.

---

## 16. Design Direction

The product should feel like a **modern reading tool**, not an LMS or a social-media feed.

Suggested characteristics:

- clean
- quiet
- content-first
- excellent typography
- generous spacing
- subtle borders
- minimal animation
- strong reading focus

The question system can be slightly more interactive, but the reading experience should remain calm.

### Important UI principle

Do not turn every feature into a card.

Especially in the reader, prioritize the book itself.

---

## 17. Explore Page

Keep Explore simple.

Possible sections:

```text
Explore

Search books...

Popular Books
[ book ][ book ][ book ]

Recently Added
[ book ][ book ][ book ]

Interesting Question Sets
[ set ][ set ][ set ]
```

For the MVP, popularity can simply mean:

- most opened
- most question-set attempts
- newest

No sophisticated recommendation algorithm is necessary.

---

## 18. Book Page

Before entering the reader, show:

```text
[Cover]

Book Title
Author

Continue Reading
██████████░░░ 72%

Question Sets
- Set A
- Set B
- Set C

Chapters
- Chapter 1
- Chapter 2
- Chapter 3
```

Actions:

- Continue reading
- Start from beginning
- Choose question set
- Create question set

---

## 19. Question Set Builder

Aim for very fast creation.

```text
New Question Set

Name: __________________

Chapter / Section / Page

Question:
________________________

Type: Multiple Choice

A. ________
B. ________
C. ________
D. ________

Correct answer: B

[ Add Question ]
```

Questions should be reorderable.

Save the entire set when the user is finished.

For MVP, auto-save is not necessary if it complicates implementation.

---

## 20. Taking a Question Set

The player experience should be very simple:

```text
Question 4 / 15

What is the main idea of this section?

○ A
○ B
○ C
○ D

[ Submit ]
```

After answering:

- show correct/incorrect
- optionally show explanation
- update progress
- move to next question

Allow:

- exit and resume later
- restart set
- finish set

---

## 21. Permissions / RLS

Supabase Row Level Security is important from the beginning.

Basic rules:

### Profiles

- users can read public profile information
- users can edit their own profile

### Books

- users can create their own books
- owners can edit/delete their books
- readable books are visible according to visibility rules

### Question sets

- users can create their own sets
- creators can edit/delete their sets
- public sets can be read by other users
- private sets are visible only to the creator

### Attempts / progress

A user can only read/write their own attempts and progress.

Do not rely only on frontend checks for permissions.

---

## 22. Search

Start with simple PostgreSQL search.

Search fields:

- book title
- author
- question-set name
- username

Do not introduce a separate search engine for the MVP.

Later, PostgreSQL full-text search or an external service can be added if needed.

---

## 23. Important Edge Cases

The first version should handle these cleanly:

- user closes the reader during a chapter
- user refreshes the page during a question
- user uploads the same file twice
- book processing fails
- question set contains zero questions
- question is deleted from a set
- creator deletes a question set that someone already attempted
- user reaches the end of a book
- two users create sets with the same name
- book has no detectable chapters

Do not over-engineer these; just ensure they do not corrupt user progress.

---

## 24. Analytics Worth Tracking

Keep analytics minimal.

Useful events:

- signup
- book_uploaded
- book_opened
- reading_started
- reading_completed
- question_set_created
- question_set_started
- question_answered
- question_set_completed

This will tell you whether users actually use the core loop.

---

## 25. Core Product Loop

The product should encourage this loop:

```text
Discover / Upload Book
        ↓
      Read
        ↓
  See Question Sets
        ↓
 Choose a Question Set
        ↓
   Test Yourself
        ↓
 Learn / Review
        ↓
      Read More
        ↓
      Repeat
```

The loop is more important than having many features.

---

## 26. MVP Development Order

### Phase 1 — Foundation

- Vite + React
- Tailwind
- Headless UI
- Hugeicons
- Supabase project
- Auth
- Basic routing
- App layout

### Phase 2 — Books

- upload
- storage
- books table
- My Books
- book details
- basic processing

### Phase 3 — Reader

- reader UI
- chapters/sections
- current location
- reading progress
- resume reading
- timeline navigation

### Phase 4 — Question Sets

- create set
- create question
- question list
- question set page
- attach questions to book locations

### Phase 5 — Question Taking

- choose a set
- answer questions
- automatic scoring
- save attempts
- resume progress
- completion state

### Phase 6 — Explore

- search
- public books
- public question sets
- simple discovery

### Phase 7 — Polish

- responsive design
- empty states
- loading states
- error states
- RLS review
- basic analytics
- performance cleanup

---

## 27. What NOT to Build Yet

Avoid these during the initial startup stage:

- real-time multiplayer
- complex recommendation algorithms
- chat
- direct messaging
- followers/following
- AI tutor
- AI-generated summaries
- complicated social feeds
- advanced gamification
- subscriptions/payments
- multiple storage providers
- separate backend server unless actually needed
- microservices

Supabase + React is enough for the first version.

---

## 28. Future Ideas That Fit the Concept

These can become strong features later without changing the core model.

### Shared question libraries

A user can make a high-quality question set and others can use it.

### Question-set forks

A user could duplicate another user's set and make their own version.

This fits the "multiple servers of the same map" idea extremely well.

Example:

```text
Original Set
     ↓
  Fork / Copy
   ↙      ↘
Version A  Version B
```

### Question-set difficulty

Users could mark sets as:

- Easy
- Medium
- Hard

### Book-specific leaderboards

Later, users could compare scores on public question sets.

### Reading notes

Attach private notes to locations in a book.

### Highlights

Highlight passages and optionally turn a highlight into a question.

### Public profiles

A profile could eventually show:

- books read
- question sets created
- question sets completed
- favorite books

### AI assistance

Later, AI could help users draft questions from selected text, but the user should remain the author/editor.

---

## 29. Technical Principle for the MVP

**Make the database model flexible, but keep the product surface small.**

The database should support chapters, sections, pages, multiple question sets, and personal progress.

The UI should initially expose only the simplest version of those concepts.

This prevents an early rewrite while keeping the startup understandable.

---

## 30. Definition of Done — MVP

The first release is successful when this complete scenario works reliably:

```text
User signs up
   ↓
Uploads a book
   ↓
Book becomes readable
   ↓
User reads Chapter 1
   ↓
Progress is saved
   ↓
User creates "Chapter 1 Review"
   ↓
Adds 10 questions
   ↓
Another user opens the same book
   ↓
Sees the question set
   ↓
Starts it
   ↓
Answers questions
   ↓
Score is saved
   ↓
Leaves the app
   ↓
Returns later
   ↓
Book + question-set progress resume correctly
```

If this loop feels fast, reliable, and pleasant, **اقرأ has a real MVP.**

---

## 31. Suggested First Milestone

Before implementing public discovery, build a private end-to-end prototype for only:

**Auth → Upload one book → Read → Create question set → Take question set → Save progress**

Once that works, expand outward into Explore, search, profiles, and social features.

That keeps the startup focused on proving the core idea rather than building a large platform before knowing whether the core loop works.

---

## 32. UI Component System

Build a small reusable component layer before creating many pages. The goal is **clean code, consistent behavior, accessibility, and responsive layouts** without turning the project into a large design-system project.

All reusable UI components should live under:

```text
src/components/ui/
```

Suggested structure:

```text
src/components/ui/
├── button/
├── input/
├── textarea/
├── select/
├── checkbox/
├── radio-group/
├── switch/
├── file-upload/
├── date-time-picker/
├── dropdown-menu/
├── tabs/
├── modal/
├── dialog/
├── badge/
├── table/
├── avatar/
├── chip/
├── accordion/
└── filter/
```

Do not create a separate component for every page-specific variation. Prefer a small primitive with props/variants.

### Component principles

- Prefer **Headless UI** for accessible interactive behavior where it provides a primitive.
- Use **Tailwind CSS** for presentation and responsive layout.
- Use **Hugeicons Sharp Stroke** consistently for actions and navigation.
- Components should support keyboard navigation and visible focus states.
- Avoid hard-coded widths whenever possible.
- Interactive controls should work well with touch targets on mobile.
- Keep components controlled where state matters to the parent.
- Keep server/data logic out of UI components.
- Use composition instead of deeply nested prop APIs.
- Use semantic HTML first, then enhance it with Headless UI.

### Suggested naming convention

Use simple, predictable component names:

```tsx
<Button />
<Input />
<Textarea />
<Select />
<Checkbox />
<RadioGroup />
<Switch />
<FileUpload />
<DropdownMenu />
<Tabs />
<Modal />
<Dialog />
<Badge />
<Table />
<Avatar />
<Chip />
<Accordion />
<Filter />
```

For complex components, expose small subcomponents when useful:

```tsx
<Table>
  <Table.Header />
  <Table.Body />
  <Table.Row />
  <Table.Cell />
  <Table.Pagination />
</Table>
```

Avoid creating APIs that are harder to understand than the HTML they replace.

---

### 32.1 Button

Use one base `Button` component with a small number of variants.

Suggested variants:

```text
primary
secondary
ghost
danger
```

Suggested sizes:

```text
sm
md
lg
```

Support:

- icon-only buttons
- loading state
- disabled state
- `type="button" | "submit" | "reset"`
- optional `as`/link usage when appropriate

Example use:

```tsx
<Button>Continue Reading</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>
<Button aria-label="Search" icon={<SearchIcon />} />
```

Do not create dozens of button colors. Keep the visual language small.

---

### 32.2 Switch / Toggle

Use **Headless UI Switch**.

Use it for binary settings such as:

- public/private question set
- reading preferences
- notifications
- optional reader settings

It should support:

- label
- description
- disabled state
- checked state
- keyboard interaction

The visual switch can remain compact on mobile.

---

### 32.3 Text Input

Create one reusable `Input` wrapper for normal text fields.

Support:

- label
- description/help text
- error text
- leading icon
- trailing action
- disabled/read-only states
- required state
- invalid state

Example:

```tsx
<Input
  label="Question set name"
  placeholder="Chapter 1 Review"
  error={errors.name}
/>
```

Use the same wrapper for most text fields rather than making separate components for every form.

---

### 32.4 Textarea

Use the same form-field conventions as `Input`.

Useful for:

- book description
- question prompt
- answer explanations
- profile bio
- private notes later

Support automatic minimum/maximum height where appropriate, but avoid aggressive auto-resizing that makes long forms difficult to use.

---

### 32.5 Password Input

Build this from the reusable `Input` primitive.

Add:

- show/hide password button
- password autocomplete attributes
- validation/error state

Use a Hugeicons eye/eye-off icon for the visibility toggle.

Do not duplicate all input logic into a separate password implementation.

---

### 32.6 Search Input

Create a reusable search field with:

- search icon
- clear button
- loading state
- optional keyboard shortcut indicator later
- responsive width

Used in:

- top navbar
- Explore
- book discovery
- question-set selection
- large tables

On small screens the navbar search should collapse into a dedicated search view instead of squeezing everything into one row.

---

### 32.7 Number Input

Use a reusable number field for settings such as:

- question limits
- ordering values when necessary
- future reading targets

Validate the actual value before submission. Do not depend only on the browser `min`/`max` attributes.

---

### 32.8 Email Input

Use the same `Input` primitive with:

```html
<input type="email" />
```

Support browser autocomplete and proper validation.

Used mainly for authentication and profile/account settings.

---

### 32.9 Date & Time Picker

This is not important to the core MVP, so keep it lightweight.

Use it later for:

- scheduling reminders
- optional reading goals
- future question-set publishing/scheduling

Prefer a small accessible Headless UI-based popover/calendar composition rather than introducing a large date library unless the MVP actually requires it.

On mobile, native date/time inputs are acceptable when they provide a better touch experience.

---

### 32.10 Checkbox

Use **Headless UI Checkbox**.

Use for:

- selecting multiple filters
- confirmation options
- multi-select question answers later
- settings

The checkbox should include a visible label and support disabled/indeterminate states where useful.

---

### 32.11 Radio Group

Use **Headless UI Radio Group**.

Primary uses:

- question type selection
- visibility choice
- sorting mode
- single-choice question answers

For question answering, make the selected state visually obvious without depending only on color.

---

### 32.12 Select

For simple native-like selection, use a reusable `Select` component.

Use **Headless UI Listbox/Select-style behavior** where custom UI is required.

Examples:

- question type
- sort order
- book status
- page size

Do not replace every native `<select>` with a complicated custom dropdown. Use the simplest control that works.

---

### 32.13 Multi-Select

Build from **Headless UI Combobox/Listbox** patterns when custom searchable selection is needed.

Useful for:

- filtering Explore
- assigning multiple tags
- future collaborative categories

For long option lists, support search inside the control.

Selected items should appear as compact chips/tags.

---

### 32.14 File Upload

Create a reusable `FileUpload` component for books, covers, and avatars.

Support:

- drag and drop on desktop
- normal file picker
- accepted file types
- maximum size
- progress state
- upload state
- processing state
- error state
- retry action
- preview when appropriate
- remove/reset action

For the MVP, clearly show supported book formats before upload.

Example states:

```text
Choose a book
      ↓
Uploading 64%
      ↓
Processing book…
      ↓
Ready
```

Do not tightly couple the component to Supabase. `FileUpload` should handle UI state while a service/hook performs the actual upload.

---

### 32.15 Dropdown Menu

Use **Headless UI Menu**.

Common uses:

- profile menu
- book actions
- question-set actions
- sort controls
- row actions in tables

Example:

```text
⋯
├── Edit
├── Duplicate
├── Make Private
└── Delete
```

Destructive actions should be visually separated and require confirmation when necessary.

---

### 32.16 Tabs

Use **Headless UI Tabs**.

Useful locations:

- book details
- question sets
- profile
- settings
- analytics later

Example:

```text
Overview | Chapters | Question Sets | Progress
```

Tabs should become horizontally scrollable on narrow screens instead of wrapping into multiple rows.

---

### 32.17 Modal

Use a reusable modal for focused tasks that do not need a separate page.

Good uses:

- create question set
- rename question set
- edit metadata
- upload cover
- small forms

Use **Headless UI Dialog** internally.

Rules:

- trap focus correctly
- close with Escape
- restore focus when closed
- avoid very large multi-step flows in modals
- on mobile, allow the modal to become a near-full-screen sheet when necessary

---

### 32.18 Dialog — Alerts, Confirmations, Errors

Use **Headless UI Dialog** for important interruptions.

Examples:

```text
Delete this question set?
This cannot be undone.

[Cancel] [Delete]
```

Other uses:

- upload failed
- book processing failed
- unsaved changes
- session/authentication problems
- destructive actions

Do not use dialogs for every small notification. Simple success/error feedback should generally use an inline message or toast system later.

---

### 32.19 Badge

Small status indicator.

Examples:

```text
Ready
Processing
Private
Public
Completed
In Progress
```

Use badges sparingly. They should communicate state, not become decorative labels everywhere.

---

### 32.20 Table

Create a reusable table designed to handle large datasets from the beginning, without implementing an enterprise-grade data-grid.

The component should support:

- column definitions
- sorting
- pagination
- selectable rows when needed
- empty state
- loading state
- error state
- responsive row actions
- icons inside cells
- buttons/links inside cells
- badges/chips inside cells
- custom cell renderers

Suggested API concept:

```tsx
<Table
  columns={columns}
  data={books}
  pagination={pagination}
  onPageChange={setPage}
/>
```

For large data, prefer **server-side pagination and filtering** rather than downloading everything to the browser.

Potential table uses:

- My Books
- question sets
- questions inside a set
- future admin/moderation tools

On mobile, do not force a giant horizontal table when the information can be represented as stacked rows/cards. The same data model should power both views.

---

### 32.21 Avatar

Reusable avatar with:

- image
- fallback initials
- optional size
- optional online/status indicator later

Suggested sizes:

```text
xs
sm
md
lg
xl
```

Always provide useful `alt` text when an actual profile image exists.

---

### 32.22 Chip / Tag

Use compact chips for:

- genres
- categories
- selected filters
- question-set metadata
- selected multi-select values

Support:

- removable
- clickable
- disabled
- icon + label

Avoid using chips for information that should simply be normal text.

---

### 32.23 Accordion & Accordion Tree

Use an accessible accordion pattern for content that benefits from progressive disclosure.

Good uses:

- **Book Chapter & Section Tree**: Nested outline with expandable chapters, indented sections, chevron indicators, section counts, and auto-expanding the active reading position.
- **Progressive Navigation**: Expand all / Collapse all controls, search filtering that auto-reveals matching tree branches.
- **Question Explanations & Answers**: Expandable answer justifications in question cards.
- **FAQ / Help**: Progressive answers without visual clutter.
- **Advanced Filters**: Collapsible criteria panels.
- **Settings Sections**: Grouped preference controls.

Avoid putting the primary reading content inside accordions.

---

### 32.24 Filter / Sort Controls

Create a reusable `Filter` composition rather than separate filter implementations for every page.

Support:

- search
- checkbox filters
- radio filters
- select filters
- multi-select filters
- sort order
- clear all
- applied filter chips

Example:

```text
Search books…     Filter     Sort

Filters
├── Author
├── Status
├── Difficulty
└── Created

Applied:
[Public ×] [Newest ×]
```

On desktop, filters can appear in a sidebar or popover. On mobile, open them in a dialog/sheet.

---

## 33. Responsive UI Rules

Responsiveness should be part of the component design rather than a final polishing step.

### Breakpoint mindset

Design for:

```text
mobile → tablet → desktop
```

Do not design desktop first and simply shrink everything.

### Navbar

Desktop:

```text
[اقرأ]  Explore  My Books       Search...       Profile
```

Mobile:

```text
[☰] [اقرأ]                         [Search]
```

The mobile menu should contain primary navigation and account actions.

### Reader

On desktop, the reader can use a centered reading column with supporting navigation around it.

On mobile:

- prioritize book content
- keep controls reachable
- use a compact bottom/edge navigation control for the timeline
- prevent the timeline from consuming too much vertical space
- preserve reading position after rotation/resizing

### Forms

Desktop forms can use a constrained width.

Mobile forms should become one column by default.

Avoid multi-column forms unless two fields naturally belong together.

### Tables

Desktop:

```text
full table + pagination
```

Mobile:

```text
compact rows / stacked data
```

Keep the same table component responsible for the data and allow responsive rendering when needed.

### Modals / Dialogs

Desktop:

```text
centered dialog
```

Mobile:

```text
near-fullscreen / bottom sheet style
```

The interaction remains the same; only layout changes.

---

## 34. Form Architecture

Use reusable field wrappers so forms stay consistent.

Suggested form structure:

```tsx
<form>
  <Input />
  <Textarea />
  <Select />
  <Checkbox />
  <Button type="submit">Save</Button>
</form>
```

Keep validation close to the form/domain rather than inside generic UI components.

A generic `Input` should know how to display an error, but it should not know what makes a username or question valid.

For question creation, use a domain-specific form component built from the generic primitives:

```text
QuestionForm
├── Input
├── Select
├── RadioGroup
├── Textarea
└── Button
```

This keeps reusable UI separate from product-specific logic.

---

## 35. Loading, Empty, and Error States

Every major reusable component/page should consider three states:

```text
Loading
Empty
Error
```

Examples:

### Book list

```text
Loading → skeleton rows/cards
Empty   → "No books yet" + Upload Book
Error   → retry action
```

### Question sets

```text
Loading → skeleton list
Empty   → "No question sets yet" + Create Set
Error   → retry action
```

### Table

Show a proper empty state instead of rendering an empty header with no explanation.

Avoid excessive spinners. Prefer skeletons for content that is expected to appear shortly and explicit progress for long-running operations such as book processing.

---

## 36. Accessibility Baseline

Accessibility is part of the component layer from the beginning.

Minimum requirements:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- useful error messages
- sufficient contrast
- buttons must have accessible names
- icon-only actions require `aria-label`
- dialogs must manage focus correctly
- form errors should be associated with their fields

Headless UI should handle interaction behavior where possible; Tailwind should handle the visual states.

Do not use color as the only indicator of success, failure, selection, or status.

---

## 37. UI State vs Server State

Keep UI state and server state separate.

### UI state

Examples:

- dialog open/closed
- selected tab
- current filter panel
- input values before submission
- mobile menu state

Keep these local to the component/page when practical.

### Server state

Examples:

- books
- question sets
- questions
- reading progress
- attempts
- profiles

Keep database access inside services/hooks rather than directly inside presentational components.

This keeps the UI components reusable and makes the app easier to test.

---

## 38. Suggested UI Build Order

Do not build every component before building the application.

Build them as they become necessary:

### First

```text
Button
Input
Textarea
Password Input
Search Input
Checkbox
Radio Group
Select
Switch
Modal/Dialog
```

### Next

```text
File Upload
Dropdown Menu
Tabs
Badge
Avatar
Chip
Accordion
Filter
```

### Then

```text
Table + pagination
Date & Time Picker
```

The first group supports the core product loop. The rest can be added when the relevant page needs them.

---

## 39. UI Rule — Keep the MVP Small

The existence of a reusable component should not become a reason to add a feature.

The component system exists to make the core product easier to build:

```text
Read
 ↓
Create questions
 ↓
Choose a question set
 ↓
Take questions
 ↓
Track progress
```

Every new UI component should either improve this loop or support a necessary part of the platform around it.

Avoid building a large design system, theme engine, animation framework, or advanced data-grid before the core **اقرأ** experience works.
