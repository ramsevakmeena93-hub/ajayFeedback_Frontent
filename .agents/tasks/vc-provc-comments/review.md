# Pro-VC Comments Reports System

The change adds persistent Pro-VC report history to the MITS feedback application. A `ProVCReport` Mongoose model stores generated PDF binaries in MongoDB, a new `provcReports` router handles generate-and-save for both faculty-wise and department-level reports, and history panels are added to VCDashboard, SubmissionDetail, and HODDashboard. The implementation deliberately reuses the existing `provcReportGenerator.js` service and the existing `Submission.provcComments[]` storage, so no data duplication was introduced. The `ProVCComment` model and `provcComments.js` route from a prior planning pass were correctly identified as unneeded and were not created.

Watch for: (1) **confirmed** — the download endpoint contains a gap where a non-HOD, non-privileged authenticated user (e.g. a plain `faculty` role) receives no access check and gets the PDF; (2) **confirmed** — `vcUser` lookup uses `findOne` with a `$or` across `vc` and `provc` roles — whichever MongoDB returns first is used in both report types, which can mean an incorrect signatory name/signature appears if both role types exist in the database; (3) **confirmed** — two missing files listed in the task spec (`ProVCComment.js`, `provcComments.js`) were intentionally skipped per the impl-plan, but the task spec still references them in the "Files to review" checklist; (4) **possible** — `pdfData` stored as a MongoDB Buffer on every generate call will bloat the `provc_reports` collection quickly for active deployments without a TTL or size cap.

**Verdict**: NEEDS_CHANGES

## High-level view

The `ProVCReport` model is a clean, append-only store with a compound index that supports the history query pattern. The `actionTaken` field exists on the model but is never populated in either generate endpoint — it is always saved as an empty string while the plan specified it should carry the action-taken snapshot.

The `provcReports.js` router correctly places `/submission/:submissionId` and `/department/:department` routes before `/:id/download` to prevent Express matching the string literals as ObjectId params. Auth guards for the generate endpoints (vc/provc/admin only) and the HOD department check on both list and download are implemented as specified. However, the download endpoint's access-control logic has a confirmed gap: the check reads `if (!isPrivileged && callerRoles.has('hod'))`, meaning any authenticated user whose role is neither privileged nor `hod` skips the department check entirely and receives the PDF. In practice this could be a faculty user who has a valid JWT.

VCDashboard, SubmissionDetail, and HODDashboard all use `api.get(..., { responseType: 'blob' })` with the Authorization header for downloads, consistent with the rest of the app. The HOD department-scope check on the backend fires before serving the binary. The `fetchProvcReports` call is correctly wired to the Analyse button expansion.

The `vcUser` lookup (`User.findOne({ $or: [{role:'vc'},{role:'provc'}] })`) is undeterministic when both roles exist. The PDF generator uses `vcUser.name` and `vcUser.signatureImage` for the signatory block, so whichever document MongoDB returns will be the signer on the generated report — a hard-to-diagnose signature mismatch if a second vc/provc account is ever created.

<details>
<summary>Issues (4)</summary>

1. **Download endpoint authorization gap** — Non-HOD, non-privileged authenticated users (e.g. `faculty` role) pass the `if (!isPrivileged && callerRoles.has('hod'))` branch without any check and receive the PDF binary. Add an explicit allowlist: only `vc`, `provc`, `admin`, and `hod` (with department match) should reach `res.send`. Return 403 for all other roles.

2. **`actionTaken` field never written** — `ProVCReport.create(...)` in both `generate-faculty` and `generate-department` hardcodes `actionTaken: ''` (generate-faculty) or omits it (generate-department). The model field and the plan both describe it as a snapshot of the VC's action-taken text. Populate it from `submission.vcComment` or the per-report `actionTaken` field before saving.

3. **`vcUser` lookup is undeterministic** — `User.findOne({ $or: [{ role: 'vc' }, { role: 'provc' }] })` returns whichever document MongoDB scans first. If both a `vc` and a `provc` account exist the wrong name/signature could appear on the PDF. Add a `.sort({ role: 1 })` or filter specifically by `provc` first: `User.findOne({ role: 'provc' }) || User.findOne({ role: 'vc' })`.

4. **Binary PDF storage without size guard** — Every `generate-*` call appends a full PDF buffer to MongoDB. The `MongoServerError code 11000` catch in the route was placed for uniqueness errors and won't fire for document-too-large (BSON 16 MB limit). A department report with many faculty and embedded images could exceed the limit and throw an unhandled `BSONError`. Add a size check before `ProVCReport.create` and return a 413 with a clear message.

</details>

<details>
<summary>Details</summary>

### Download endpoint access gap

The guard in `GET /:id/download` reads:

```js
if (!isPrivileged && callerRoles.has('hod')) {
  // department check
}
```

Any authenticated user who is neither in `{vc, provc, admin}` nor in `hod` skips this block entirely and reaches `res.send(report.pdfData)`. A faculty user with a valid JWT satisfies `authMiddleware` and lands here unchecked. The fix is to invert the logic: explicitly allow only the expected roles, and 403 everything else.

### `actionTaken` never written to history record

`generate-faculty` saves `ProVCReport` with no `actionTaken` field (it's absent from the create call, so MongoDB stores the schema default `''`). `generate-department` also omits it. The model's `actionTaken` field was designed to capture a snapshot of the action-taken text at generation time so it appears in the report history list without re-fetching the submission. Currently the list API returns `actionTaken: ''` for every record.

### Undeterministic `vcUser` lookup

Both generate endpoints use:
```js
const vcUser = await User.findOne({ $or: [{ role: 'vc' }, { role: 'provc' }] })
  .select('name signatureImage').lean();
```
MongoDB returns the first document in natural collection order. In a database where a `vc` account was created before a `provc` account, the VC's name appears on Pro-VC-signed reports. The preferred fix is to query `provc` first: `User.findOne({ role: 'provc' }).select(...)` with a fallback to `{ role: 'vc' }`.

### Test coverage

No automated tests were added for the new routes. The plan's verification step was a manual `node --check` and `npm run build`. Missing test surface includes: the HOD department-mismatch 403 on download, the non-HOD non-privileged gap, the `generate-faculty` 400 for a facultyName that matches nothing, and the `generate-department` path that updates `vcComment` in the database before generating. These should be covered by integration tests before shipping.

</details>

## File map

<details>
<summary>Changed files</summary>

| File | What changed |
|---|---|
| `backend/models/ProVCReport.js` | New Mongoose model for persistent report history |
| `backend/routes/provcReports.js` | New router: generate-faculty, generate-department, list by submission, list by department, download |
| `backend/server.js` | Added `app.use('/api/provc-reports', ...)` mount |
| `src/pages/VCDashboard.jsx` | Added report history state, `fetchProvcReports`, Faculty Report modal, Save Dept Report modal, inline history panel |
| `src/pages/SubmissionDetail.jsx` | Added `savedReports` state, Pro-VC Report History card, Faculty/Dept generate modals |
| `src/pages/HODDashboard.jsx` | Added `hodProvcReports` state, `fetchHodProvcReports`, Pro-VC Reports card with download |

Files listed in the task review spec but intentionally absent:
- `backend/models/ProVCComment.js` — not needed; `Submission.provcComments[]` already fulfils this role (confirmed in impl-plan)
- `backend/routes/provcComments.js` — not needed for the same reason
- `src/components/ProVCCommentPanel.jsx` — the panel was implemented inline inside `VCDashboard.jsx` in a prior pass and was not extracted to a separate file; the impl-plan confirms it already exists inline

</details>
