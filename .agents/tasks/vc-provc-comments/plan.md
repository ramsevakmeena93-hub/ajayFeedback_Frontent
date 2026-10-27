# Implementation Plan — Pro-VC Dashboard Improvements

Grounded in the current working-tree state of `src/pages/VCDashboard.jsx`,
`src/pages/SubmissionDetail.jsx`, `backend/routes/*.js`, and
`backend/models/*.js` (read before planning). Verification gate for the whole
task is `npm run build` in the repo root (Vite build) with no errors.

## Key findings & decisions

- **No reusable Pro-VC comment API exists.** `backend/models/HODComment.js` is
  keyed by `{ department, academicYear, session }` (department-level PDF
  remarks). `Submission.js` has a single `vcComment` string (submission-level).
  `FacultyReport.js` has HOD `hodRemarks` / `actionTaken` but no Pro-VC field.
  → Per the task's fallback, add a minimal new model + routes.
- **Keying = `reportId` (the `FacultyReport._id`).** Each FacultyReport is
  exactly one faculty + one course in one academic cycle, and BOTH the
  Analytics chart (`VCDashboard` → `InlineAnalysis` over `sub.reports`) and the
  Full View (`SubmissionDetail` over `submission.reports`) already expose
  `r._id`, `r.facultyName`, `r.subjectCode`, `r.programme`, `r.academicYear`.
  `reportId` is more precise than `{facultyName, subjectCode}` and avoids
  name-collision ambiguity; denormalized name/subject are stored for display.
  Accepted scope: comments live with a specific report (per feedback cycle),
  matching how the dashboard already treats reports per submission.
- **Comment shape = append-only thread.** Task says "view existing saved
  comments" (plural), "write a new comment" (append), "update the displayed
  comments". So store `comments: [{ text, authorName, createdAt }]`; POST
  appends, GET returns the thread. No edit/delete (keeps it minimal).
- **Build a dedicated `ProVCCommentPanel`, do not force `CommentEditor`.**
  `CommentEditor.jsx` is a two-tab dual-list editor (appreciation vs.
  need-attention, move-between-tabs) used by `FeedbackTable.jsx` and
  `ReportDetailModal.jsx` for student-feedback strings. That UX does not fit a
  right-side Pro-VC remark thread with author/timestamps and append behavior.
  "Reuse where possible" → the fit is wrong, so build a new panel and leave
  `CommentEditor` untouched (preserves existing functionality).
- **Full View "Action Taken" gap.** The verbatim task says add the Pro-VC
  Comments button "beside the existing Action Taken button in the Full View
  header/actions row," but `SubmissionDetail.jsx` has only Approve/Reject.
  → Add an Action Taken button (reusing the existing
  `PATCH /api/submissions/:id/action-taken`, already `provc/vc/admin`) AND the
  Pro-VC Comments button beside it, in the actions row.
- **Two FFI charts** (one in `InlineAnalysis`, one in `SubmissionDetail`) use
  `dataKey="name"` (shortened) with a 4-band legend. Switch to `dataKey="full"`
  (full faculty names, ~-45° rotation, `interval={0}`) and replace the legend
  with the requested 2-band: green = FFI ≥ 4.0 (Good), amber = FFI < 4.0
  (Needs Attention). Recolor bars to those two bands; update tooltip color/label
  to match. Keeps the chart clean and professional.
- **Git**: root repo (branch `master`) ignores `backend/`; backend is a
  separate nested git repo (`backend/.git`, also `master`). The working tree
  already has uncommitted modifications to the two target files and backend
  files — build on the current on-disk state (read before editing). `.agents/`
  is NOT gitignored, so stage only specific source files; never `git add .`.

---

## Ordered steps

- [ ] 1. **Create the Pro-VC Comment model.**
      New Mongoose model, collection `provc_comments`. One document per
      `reportId` (unique), holding a `comments` thread. Fields: `reportId`
      (ObjectId ref `FacultyReport`, required, unique, indexed),
      `facultyName`, `subjectCode`, `courseName`, `academicYear` (denormalized
      strings for display), `authorUserId` (ObjectId ref `User`),
      `authorName` (String), `comments: [{ text: String, authorName: String,
      createdAt: Date }]`. Use `{ timestamps: true }`.
      Files: `backend/models/ProVCComment.js` (new)
      Verify: `node --check backend/models/ProVCComment.js` exits 0.

- [ ] 2. **Create the Pro-VC Comment routes.**
      `GET /:reportId` — `authMiddleware` + `requireAnyRole('vc','provc','admin')`
      → return `{ reportId, facultyName, subjectCode, courseName, academicYear,
      comments: [...] }` (empty `comments: []` if none). `POST /:reportId` —
      same auth; body `{ text, facultyName, subjectCode, courseName,
      academicYear }`; validate non-empty `text` (400 otherwise); upsert the
      doc by `reportId` (`$setOnInsert` for denormalized fields,
      `$push { text, authorName: req.user.name || '', createdAt: new Date() }`);
      return the updated thread. Mirror the import style in `reports.js`:
      `const { authMiddleware, requireAnyRole } = require('./middleware');`.
      Files: `backend/routes/provcComments.js` (new)
      Verify: `node --check backend/routes/provcComments.js` exits 0;
      `node -e "require('./backend/routes/provcComments')"` loads without
      throwing (confirms module wiring).

- [ ] 3. **Mount the new route in server.js.**
      Add `app.use('/api/provc-comments', require('./routes/provcComments'));`
      alongside the other `app.use('/api/...', ...)` mounts (after the
      `submissions` mount is a natural spot). Keep server startup route loading
      identical in shape.
      Files: `backend/server.js`
      Verify: `node --check backend/server.js` exits 0.

- [ ] 4. **Create the `ProVCCommentPanel` component.**
      Right-side slide-over panel rendered via `createPortal(..., document.body)`
      (same portal pattern as `CommentEditor`). Props: `open`, `onClose`,
      `reportId`, `facultyName`, `subjectCode`, `courseName`, `academicYear`.
      Use the shared `api` client from `../api` (auto JWT + correct `baseURL`).
      On `open`/`reportId` change: `GET /api/provc-comments/:reportId` and store
      the `comments` thread. Header shows faculty name + course (subjectCode /
      courseName) at the top. Body lists existing comments (text, authorName,
      relative date). Footer has a `<textarea>` + "Save" button. Save: POST
      `/api/provc-comments/:reportId` with `{ text, facultyName, subjectCode,
      courseName, academicYear }`; on success `toast.success("Comment saved")`
      and refresh the list; on error `toast.error`. No hardcoded/dummy data.
      Include a small badge count so callers can show "Pro-VC Comments (n)".
      Files: `src/components/ProVCCommentPanel.jsx` (new)
      Verify: `npm run build` passes (component compiles).

- [ ] 5. **VCDashboard — full names + 2-band legend in the FFI chart.**
      In `InlineAnalysis` (`src/pages/VCDashboard.jsx`): change the chart
      `<XAxis dataKey="name" .../>` to `dataKey="full"`; set `angle={-45}` and
      increase `bottomMargin` so full names fit (e.g. `chartData.length > 10
      ? 80 : chartData.length > 5 ? 62 : 46`). Recolor `<Cell fill>` to two
      bands: `e.FFI >= 4 ? "#10b981" : "#f59e0b"`. Update `FFITooltip` color +
      label to the same two bands ("Good" ≥4.0 / "Needs Attention" <4.0).
      Replace the 4-swatch legend with a 2-swatch legend: green = "FFI ≥ 4.0
      (Good)", amber = "FFI < 4.0". Keep tooltip using `d.full` (already does).
      Files: `src/pages/VCDashboard.jsx`
      Verify: `npm run build` passes.

- [ ] 6. **VCDashboard — Pro-VC Comments button per faculty row in "Need
      Attention — by Faculty".**
      In `InlineAnalysis`, the "Need Attention — by Faculty" rows iterate
      `sub.reports` filtered by attention comments. Add a "Pro-VC Comments"
      button on the RIGHT side of each row's header (next to the
      `{r.subjectCode} · FFI` chip). Add state `commentReport` in
      `InlineAnalysis`; clicking a row's button sets it to that report's
      `{ _id, facultyName, subjectCode, programme, academicYear }`. Render
      `<ProVCCommentPanel open={!!commentReport} onClose={...}
      reportId={commentReport?._id} facultyName={...} subjectCode={...}
      courseName={commentReport?.programme} academicYear={...} />`. Import
      `ProVCCommentPanel` and `toast` (already imported). Show the comment
      count badge on the button (fetch count on open or lazy).
      Files: `src/pages/VCDashboard.jsx`
      Verify: `npm run build` passes.

- [ ] 7. **Full View redesign + chart full names/legend + Action Taken + Pro-VC
      Comments buttons.**
      In `src/pages/SubmissionDetail.jsx`:
      (a) Redesign: improve card styling, spacing, typography, color use, and
      overall layout for a modern/professional look. Keep using the existing
      `.card` / `.section-title` / `.table-header` / `.scrollbar-thin` utility
      classes (defined in `src/index.css`) and add Tailwind refinements
      (rounded corners, shadows, gradient header, better spacing). Preserve
      ALL existing data, columns, and behavior.
      (b) FFI chart: same change as step 5 (`dataKey="full"`, `-45°`, larger
      `bottomMargin`, 2-band colors, 2-band legend, updated tooltip).
      (c) Actions row (the Approve/Reject row): add an "Action Taken" button
      that reuses the existing endpoint — on click, open a small modal/prompt
      and `PATCH /api/submissions/${id}/action-taken` with `{ actionTaken:
      autoNumber(comment) }` (mirror `VCDashboard.handleActionTakenSave`),
      `toast.success` on success, refresh state. Add a "Pro-VC Comments"
      button beside it that opens `ProVCCommentPanel` for the first report in
      `submission.reports` (prefilled with that report's faculty/course).
      (d) Reports table: add a per-row "Pro-VC Comments" button (each row = one
      faculty+course) so comments are linkable to the exact faculty+course;
      it opens `ProVCCommentPanel` for that row's `r._id`. Both buttons share
      the single panel instance (state `commentReport`).
      Files: `src/pages/SubmissionDetail.jsx`
      Verify: `npm run build` passes.

- [ ] 8. **Full build + integration verification.**
      Run `npm run build` in the repo root and confirm zero errors/warnings
      that fail the build. Run `node --check` on the new/modified backend files
      (`backend/models/ProVCComment.js`, `backend/routes/provcComments.js`,
      `backend/server.js`) and a `require` smoke test of the route module.
      Confirm no existing dashboard feature was removed (Submissions tab,
      HOD Status tab, Summary PDF, approve/reject, analyse expand, signature
      upload all still present).
      Verify: `npm run build` exits 0; backend `node --check`/`require` exits 0.

## Wiring summary

- Backend: `POST/GET /api/provc-comments/:reportId`, keyed by `reportId`
  (= `FacultyReport._id`), denormalized `facultyName`/`subjectCode`/
  `courseName`/`academicYear` for display; append-only `comments` thread.
- Frontend: `ProVCCommentPanel` calls those endpoints via the shared `api`
  client. Analytics opens it per faculty row (Need-Attention section); Full
  View opens it from the header button (first report) and per table row.
- Comments are saved to and loaded from MongoDB only — no dummy data.
