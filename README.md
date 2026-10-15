# LearnFlow — Frontend (v2, polished UI)

A React 19 + Vite frontend for the `lms-backend2` Spring Boot API, redesigned
with a more premium, real-world-platform look and feel.

## What changed in this pass

The previous version used a generic indigo/purple gradient "AI SaaS" look.
This version is a deliberate design upgrade toward something closer to
Coursera / LinkedIn Learning:

- **Typography**: Fraunces (serif, editorial headlines) paired with IBM Plex
  Sans (structured, technical body/UI text) — replacing the generic Inter-only setup.
- **Color**: Deep navy + warm gold accent, evoking an academic institution
  rather than a generic gradient dashboard. Teal is used sparingly as a
  secondary data-viz color.
- **Course cards** now show a deterministic duotone thumbnail (color keyed
  to category), instructor avatar, and rating stars — matching real course
  marketplace card anatomy instead of a flat solid block.
- **Skeleton loaders** (shimmering placeholder cards/rows) replace bare
  spinners on list-heavy pages (My Courses, Grading, Students, Admin Panel),
  so the layout doesn't jump once data arrives.
- **Sidebar** uses a left accent bar for the active link instead of a full
  background fill, with a dark navy backdrop instead of a light one.
- **Tables and lists** are hairline-bordered rather than wrapped in another
  identical white card, so there's real visual hierarchy instead of every
  section looking the same.
- **Course management** (creating assessments and the course-level question
  bank) is now handled inline on the course page itself — the old dead link
  to a nonexistent `/assessments/:id` route has been removed and replaced
  with a design that matches how the backend actually models data
  (questions belong to a *course*, not a specific assessment).

## Getting started

```bash
npm install
npm run dev      # http://localhost:8081 (npm start also works)
npm test         # 52 unit tests
npm run build
```

Expects the Spring Boot backend at `http://localhost:8080` (see
`src/api/client.js`), matching `app.cors.allowed-origins=http://localhost:8081`.

## Known limitations (backend doesn't expose these yet)

- No user-directory endpoint — Admin Panel's roster is built from people
  visible through course/enrollment records, not a true user list.
- No profile-update or change-password endpoint — Profile Info is read-only,
  Change Password is shown but disabled.
- No parent-to-student linkage — Parent accounts get a read-only catalog.
- Per-lesson completion isn't tracked, only one overall `progressPercent`.
- Only INSTRUCTOR can create a course; only STUDENT can enroll/submit —
  both enforced server-side, mirrored here in the permission matrix.
