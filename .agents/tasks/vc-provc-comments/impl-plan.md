# Implementation Plan — Pro-VC Comments & Reports System

## Codebase findings (grounded in actual file reads)

### What already exists (do NOT duplicate)

| Existing artifact | Location |
|---|---|
| Per-faculty Pro-VC comment storage | `Submission.provcComments[]` — array of `{facultyName, subjectCode, comment, savedAt}` |
| Save/upsert a per-faculty comment | `POST /api/submissions/:id/provc-comment` in `backend/routes/submissions.js` (lines 612–646) |
| Action-taken endpoint | `PATCH /api/submissions/:id/action-taken` in `backend/routes/submissions.js` (lines 649–760) |
| On-demand dept-level PDF generator | `GET /api/submissions/:id/provc-department-report` (submissions.js lines 769–830) |
| PDF generator service (both report types) | `backend/services/provcReportGenerator.js` — exports `generateProVCReport` (faculty-wise) and `generateDepartmentProVCReport` (department-level) |
| MITS logo / header | `backend/assets/mits-header.png` (confirmed present) |
| ProVCCommentPanel UI | Inline component in `VCDashboard.jsx` (`ProVCCommentPanel` function, calls `POST /api/submissions/:id/provc-comment`) |
| "Overall Pro-VC Report" button | Already in `VCDashboard.jsx` actions column — calls `GET /api/submissions/:id/provc-department-report` |
| Pro-VC comment panel in SubmissionDetail | Inline in `SubmissionDetail.jsx` — calls `POST /api/submissions/:id/provc-comment` |

### What is missing (what this plan builds)

- **`ProVCReport` model**: stores generated PDF binary + metadata in MongoDB so history persists after logout.
- **`backend/routes/provcReports.js`**: routes to generate-and-save both report types, download a saved PDF, list reports for a submission, and list reports for a department (HOD view).
- **Mount** in `server.js`.
- **Report history UI** in `VCDashboard.jsx` (near existing Download/Summary buttons) and `HODDashboard.jsx` (near existing Export PDF button) — "Pro-VC Comments Report" (faculty) and "Overall Pro-VC Report" (department) buttons.
- **NO new `ProVCComment` model** — the `Submission.provcComments[]` field already handles per-faculty comments and is what the existing PDF generator reads. Adding a second model would duplicate data and break the generator.

### Key decisions

- **Store PDF binary in MongoDB (`pdfData: Buffer`)**: the project already uses MongoDB for all data; no cloud storage is needed for Pro-VC reports. The `ProVCReport` doc will hold the rendered PDF blob so HODs and Pro-VC can download at any time without regenerating.
- **Generate-then-save pattern**: POST /generate-department and POST /generate-faculty call the existing `provcReportGenerator.js` functions, save the result to `ProVCReport`, and return `{ reportId }`. The client then fetches `/api/provc-reports/:id/download` to get the PDF.
- **Append-only history**: each generate call creates a new `ProVCReport` document with a `generatedAt` timestamp rather than overwriting, satisfying requirement 6 (preserve history, show updated timestamp).
- **HOD access control**: HODs may only call `GET /api/provc-reports/department/:department` for their own `user.department` (checked against `req.user.departmentScope` or `req.user.department` from JWT), mirroring the existing `requireDepartmentScope` pattern.
- **Faculty-wise report**: reuses `generateProVCReport` from `provcReportGenerator.js`; groups reports by faculty name scoped to the submission (same faculty can have multiple course reports in one submission).
- **Department report**: reuses `generateDepartmentProVCReport`. No changes to the generator — it already reads `submission.provcComments` correctly.

---

## Ordered implementation steps

- [ ] 1. **Create `backend/models/ProVCReport.js`** — Mongoose model that stores generated Pro-VC reports.

  Fields:
  ```
  reportType:       String, enum: ['faculty-wise', 'department-overall'], required
  department:       String, default: ''
  programme:        String, default: ''
  academicYear:     String, default: ''
  session:          String, default: ''
  facultyName:      String, default: ''          // faculty-wise only; empty for department reports
  submissionId:     ObjectId, ref: 'Submission', required, index
  generatedAt:      Date, default: Date.now
  generatedBy:      ObjectId, ref: 'User'
  generatedByName:  String, default: ''
  pdfData:          Buffer, required             // raw PDF bytes
  reportTitle:      String, default: ''
  overallComments:  String, default: ''          // vcComment snapshot at generation time
  ```
  Schema options: `{ timestamps: true }`.
  Add compound index `{ submissionId: 1, reportType: 1, generatedAt: -1 }` for efficient history queries.
  Collection name: `provc_reports` (set via `mongoose.model('ProVCReport', schema, 'provc_reports')`).

  Files: `backend/models/ProVCReport.js` (new)

  Verify: `node --check backend/models/ProVCReport.js` exits 0.

---

- [ ] 2. **Create `backend/routes/provcReports.js`** — express router with 5 endpoints.

  Import pattern (match existing routes):
  ```js
  const express = require('express');
  const router  = express.Router();
  const { authMiddleware, requireAnyRole } = require('./middleware');
  const Submission  = require('../models/Submission');
  const FacultyReport = require('../models/FacultyReport');
  const ProVCReport = require('../models/ProVCReport');
  const { generateProVCReport, generateDepartmentProVCReport } = require('../services/provcReportGenerator');
  const User = require('../models/User');
  ```

  ### Endpoint A — `POST /generate-faculty`
  Auth: `authMiddleware` + `requireAnyRole('vc','provc','admin')`
  Body: `{ submissionId, facultyName }`
  Logic:
  1. Find Submission by `submissionId`, populate `hodId` (`name email department signatureImage`) and `reports` (all FacultyReport fields needed by generator: `facultyName subjectCode programme semester ffiScore responseCount responsePercent registeredStudents linkSent appreciation commentsNeedingAttention hodRemarks actionTaken academicYear`).
  2. Return 404 if not found.
  3. Filter `submission.reports` to those where `r.facultyName === facultyName` (exact match; fallback: case-insensitive). Return 400 if no matching reports.
  4. Fetch vcUser: `User.findOne({ $or: [{ role:'vc' },{ role:'provc' }] }).select('name signatureImage').lean()`.
  5. Compute `dfi` (avg FFI of all submission reports), `avgResponse` (avg responsePercent of all submission reports), both as numbers or null.
  6. Call:
     ```js
     const pdfBuffer = await generateProVCReport({
       faculty: { name: facultyName, designation: 'Faculty', department: submission.department || submission.hodId?.department || '' },
       submission,
       reports: matchedReports,
       hodUser: submission.hodId,
       vcUser,
       approvedDate: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
       avgResponse,
       dfi,
     });
     ```
  7. Create `ProVCReport` document:
     ```js
     const saved = await ProVCReport.create({
       reportType: 'faculty-wise',
       department: submission.department || submission.hodId?.department || '',
       programme: matchedReports[0]?.programme || '',
       academicYear: submission.academicYear || '',
       session: submission.session || '',
       facultyName,
       submissionId: submission._id,
       generatedBy: req.user.id,
       generatedByName: req.user.name || '',
       pdfData: pdfBuffer,
       reportTitle: `Pro-VC Comments Report — ${facultyName}`,
       overallComments: '',
     });
     ```
  8. Return `{ reportId: saved._id, message: 'Faculty report generated' }`.

  ### Endpoint B — `POST /generate-department`
  Auth: `authMiddleware` + `requireAnyRole('vc','provc','admin')`
  Body: `{ submissionId, overallComments }` — `overallComments` is optional; if provided, patch `submission.vcComment` before generating (use `findByIdAndUpdate` with `{ vcComment: overallComments }` + `{ new: true }`) so the generator sees the new value.
  Logic:
  1. Load Submission (same populate as above; also populate all `reports`).
  2. Return 404 if not found.
  3. If `overallComments && overallComments.trim()`, patch `submission.vcComment = overallComments` in DB AND locally so the generator receives it.
  4. Fetch vcUser same as endpoint A.
  5. Compute `dfi`, `avgResponse` from all submission reports.
  6. Call:
     ```js
     const pdfBuffer = await generateDepartmentProVCReport({
       submission,
       reports: submission.reports,
       hodUser: submission.hodId,
       vcUser,
       approvedDate: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
       avgResponse,
       dfi,
       programme: submission.reports[0]?.programme || '',
     });
     ```
  7. Create `ProVCReport` document:
     ```js
     const saved = await ProVCReport.create({
       reportType: 'department-overall',
       department: submission.department || submission.hodId?.department || '',
       programme: submission.reports[0]?.programme || '',
       academicYear: submission.academicYear || '',
       session: submission.session || '',
       facultyName: '',
       submissionId: submission._id,
       generatedBy: req.user.id,
       generatedByName: req.user.name || '',
       pdfData: pdfBuffer,
       reportTitle: `Overall Pro-VC Report — ${submission.department || ''} (${submission.academicYear || ''})`,
       overallComments: overallComments || submission.vcComment || '',
     });
     ```
  8. Return `{ reportId: saved._id, message: 'Department report generated' }`.

  ### Endpoint C — `GET /:id/download`
  Auth: `authMiddleware`
  Access: Any authenticated user; HOD can only download if `report.department === req.user.department` (from JWT) or caller has vc/provc/admin role. If HOD role and department mismatch, return 403.
  Logic:
  1. Find `ProVCReport.findById(req.params.id).lean()`. Return 404 if not found.
  2. Department check (for HOD): check `req.user.role === 'hod'` and `!callerRoles.has('vc') && !callerRoles.has('provc') && !callerRoles.has('admin')`. If HOD and `report.department !== (req.user.departmentScope || req.user.department || '')`, return 403.
  3. Stream: `res.setHeader('Content-Type', 'application/pdf')`, `res.setHeader('Content-Disposition', ...)`, `res.send(report.pdfData)`.
  4. Filename pattern: `ProVC_${report.reportType === 'faculty-wise' ? report.facultyName.replace(/\s+/g,'_') : 'Dept_' + report.department.replace(/\s+/g,'_')}_${report.academicYear || 'Report'}.pdf`.

  ### Endpoint D — `GET /submission/:submissionId`
  Auth: `authMiddleware` + `requireAnyRole('vc','provc','admin')`
  Logic: `ProVCReport.find({ submissionId: req.params.submissionId }).select('-pdfData').sort({ generatedAt: -1 }).lean()`. Return the array (each doc includes `_id, reportType, reportTitle, facultyName, department, academicYear, session, generatedAt, generatedByName`).

  ### Endpoint E — `GET /department/:department`
  Auth: `authMiddleware`
  Access: HOD can only query their own department. vc/provc/admin unrestricted.
  Logic:
  1. Caller roles check: if HOD and `req.params.department !== (req.user.departmentScope || req.user.department || '')`, return 403.
  2. `ProVCReport.find({ department: req.params.department }).select('-pdfData').sort({ generatedAt: -1 }).lean()`.
  3. Return the array.

  All endpoints: wrap in try/catch, return `res.status(500).json({ error: err.message })` on error.

  Files: `backend/routes/provcReports.js` (new)

  Verify: `node --check backend/routes/provcReports.js` exits 0; `node -e "require('./backend/routes/provcReports')"` from the backend directory loads without error.

---

- [ ] 3. **Mount `provcReports` in `backend/server.js`**.

  In the route-loading block (after the `assignments` mount, before the `audit` mount — keeping the VC/Pro-VC routes grouped), add:
  ```js
  app.use('/api/provc-reports', require('./routes/provcReports'));
  ```

  Files: `backend/server.js`

  Verify: `node --check backend/server.js` exits 0.

---

- [ ] 4. **Add report history fetch + "Generate" + download buttons to `VCDashboard.jsx`**.

  ### State additions (add to main `VCDashboard` component state):
  ```js
  const [provcReports, setProvcReports]     = useState({});  // { [subId]: ProVCReport[] }
  const [reportsLoading, setReportsLoading] = useState({});  // { [subId]: bool }
  const [genLoading, setGenLoading]         = useState({});  // { [subId]: bool }
  const [deptCommentModal, setDeptCommentModal] = useState(null); // subId or null
  const [deptCommentText, setDeptCommentText]   = useState('');
  ```

  ### New helper `fetchProvcReports(subId)`:
  ```js
  async function fetchProvcReports(subId) {
    setReportsLoading(prev => ({ ...prev, [subId]: true }));
    try {
      const { data } = await api.get(`/api/provc-reports/submission/${subId}`);
      setProvcReports(prev => ({ ...prev, [subId]: data }));
    } catch {}
    finally { setReportsLoading(prev => ({ ...prev, [subId]: false })); }
  }
  ```
  Call this when a row is expanded (in the `onClick` for the Analyse button: if expanding, call `fetchProvcReports(sub._id)`).

  ### In the Actions column of the submissions table, **add two new buttons after the existing "Overall Pro-VC Report" button**:

  **"Generate Faculty Report" button** (per-submission, open a small selector):
  - Opening: set a state `genFacultyModal = sub._id` (new state var). This opens a modal/dropdown that lists unique faculty names from `sub.reports` as a `<select>` or radio list.
  - On confirm (faculty selected): call `POST /api/provc-reports/generate-faculty` with `{ submissionId: sub._id, facultyName: selectedFaculty }`. On success, `toast.success('Faculty report generated')`, `fetchProvcReports(sub._id)`.
  - Button label: `Generate Faculty Report`, icon: `FileText`, style: `bg-white text-purple-600 border-purple-500 hover:bg-purple-50`.

  **"Generate Dept Report" button**:
  - Opening: `setDeptCommentModal(sub._id); setDeptCommentText(sub.vcComment || '')`. Opens a modal with a textarea pre-filled with existing `vcComment` and a "Generate Overall Report" confirm button.
  - On confirm: call `POST /api/provc-reports/generate-department` with `{ submissionId: sub._id, overallComments: deptCommentText }`. On success, `toast.success('Department report generated')`, `fetchProvcReports(sub._id)`, `fetchSubmissions()` (to refresh vcComment in table).
  - Button label: `Generate Dept Report`, icon: `BarChart2`, style: `bg-white text-emerald-600 border-emerald-500 hover:bg-emerald-50`.

  ### In the inline analysis expand row (`isExpanded` true), **add a "Report History" section at the bottom of `InlineAnalysis`**:

  Below the "Need Attention — by Faculty" section, add:
  ```jsx
  {/* Report History */}
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Pro-VC Report History</p>
    {reportsLoading[sub._id] ? (
      <p className="text-xs text-slate-400">Loading...</p>
    ) : (provcReports[sub._id] || []).length === 0 ? (
      <p className="text-xs text-slate-400 italic">No reports generated yet</p>
    ) : (
      <div className="space-y-2">
        {(provcReports[sub._id] || []).map(r => (
          <div key={r._id} className="flex items-center justify-between gap-2 text-xs">
            <div>
              <span className={`inline-block px-2 py-0.5 rounded-full font-semibold mr-2 ${r.reportType === 'faculty-wise' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {r.reportType === 'faculty-wise' ? 'Pro-VC Comments Report' : 'Overall Pro-VC Report'}
              </span>
              {r.facultyName && <span className="text-slate-600">{r.facultyName} · </span>}
              <span className="text-slate-400">{new Date(r.generatedAt).toLocaleDateString('en-IN')}</span>
            </div>
            <a
              href={`/api/provc-reports/${r._id}/download`}
              target="_blank" rel="noopener noreferrer"
              onClick={e => { e.preventDefault(); window.open(`/api/provc-reports/${r._id}/download`, '_blank'); }}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-700 text-white rounded-lg"
            >
              <FileDown size={11} /> Download
            </a>
          </div>
        ))}
      </div>
    )}
  </div>
  ```

  Pass `reportsLoading` and `provcReports` into `InlineAnalysis` as props, or lift by reading directly via closure (the generate buttons are in the outer `VCDashboard`, so `provcReports[sub._id]` is accessible in the expanded row).

  ### Modals to add (at the end of the main JSX, before `<Footer/>`):

  **Faculty Report Generation Modal**:
  ```jsx
  {genFacultyModal && (() => {
    const sub = submissions.find(s => s._id === genFacultyModal);
    const faculties = [...new Set((sub?.reports || []).map(r => r.facultyName).filter(Boolean))];
    return (
      <div className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">Generate Faculty Pro-VC Report</h3>
          <p className="text-xs text-slate-500 mb-3">Select the faculty member:</p>
          <select
            className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-purple-300"
            value={genFacultyName}
            onChange={e => setGenFacultyName(e.target.value)}
          >
            <option value="">— select —</option>
            {faculties.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={() => { setGenFacultyModal(null); setGenFacultyName(''); }}
              className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl">Cancel</button>
            <button
              disabled={!genFacultyName || genLoading[genFacultyModal]}
              onClick={async () => {
                setGenLoading(prev => ({ ...prev, [genFacultyModal]: true }));
                try {
                  await api.post('/api/provc-reports/generate-faculty', { submissionId: genFacultyModal, facultyName: genFacultyName });
                  toast.success('Faculty report generated ✓');
                  fetchProvcReports(genFacultyModal);
                  setGenFacultyModal(null); setGenFacultyName('');
                } catch (err) {
                  toast.error(err.response?.data?.error || 'Generation failed');
                } finally {
                  setGenLoading(prev => ({ ...prev, [genFacultyModal]: false }));
                }
              }}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl"
            >
              {genLoading[genFacultyModal] ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>
      </div>
    );
  })()}
  ```
  Add state: `const [genFacultyModal, setGenFacultyModal] = useState(null)` and `const [genFacultyName, setGenFacultyName] = useState('')`.

  **Department Report Generation Modal**:
  ```jsx
  {deptCommentModal && (
    <div className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="font-bold text-slate-800 mb-1">Generate Overall Pro-VC Report</h3>
        <p className="text-xs text-slate-500 mb-3">Review or update the overall department comments:</p>
        <textarea
          className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-emerald-300 mb-4"
          placeholder="Enter overall observations, recommendations, and action details…"
          value={deptCommentText}
          onChange={e => setDeptCommentText(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={() => setDeptCommentModal(null)}
            className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl">Cancel</button>
          <button
            disabled={genLoading[deptCommentModal]}
            onClick={async () => {
              setGenLoading(prev => ({ ...prev, [deptCommentModal]: true }));
              try {
                await api.post('/api/provc-reports/generate-department', { submissionId: deptCommentModal, overallComments: deptCommentText });
                toast.success('Department report generated ✓');
                fetchProvcReports(deptCommentModal);
                fetchSubmissions();
                setDeptCommentModal(null);
              } catch (err) {
                toast.error(err.response?.data?.error || 'Generation failed');
              } finally {
                setGenLoading(prev => ({ ...prev, [deptCommentModal]: false }));
              }
            }}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl"
          >
            {genLoading[deptCommentModal] ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  )}
  ```

  Add import `FileDown` to the existing Lucide imports (it's already imported).

  Files: `src/pages/VCDashboard.jsx`

  Verify: `npm run build` in repo root exits 0.

---

- [ ] 5. **Add report history to `SubmissionDetail.jsx`** — show saved Pro-VC reports near the top of the page.

  ### State additions:
  ```js
  const [savedReports, setSavedReports]     = useState([]);
  const [savedReportsLoading, setSavedReportsLoading] = useState(false);
  const [genFacultyModal, setGenFacultyModal] = useState(false);
  const [genFacultyName, setGenFacultyName]   = useState('');
  const [genDeptModal, setGenDeptModal]         = useState(false);
  const [genDeptComment, setGenDeptComment]     = useState('');
  const [generating, setGenerating]             = useState(false);
  ```

  ### Fetch saved reports on load:
  In the main `useEffect` that fetches the submission, after setting `setSubmission(data)`, also call:
  ```js
  axios.get(`/api/provc-reports/submission/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(({ data }) => setSavedReports(data))
    .catch(() => {});
  ```

  ### "Generate Faculty Report" / "Generate Overall Report" buttons:
  In the Back & Actions row (`flex items-center justify-between`), add two more buttons alongside Approve/Reject:
  ```jsx
  <button
    onClick={() => { setGenFacultyModal(true); setGenFacultyName(''); }}
    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-purple-600 border border-purple-500 hover:bg-purple-50 text-xs font-semibold rounded-xl shadow transition"
  >
    <FileText size={14}/> Faculty Report
  </button>
  <button
    onClick={() => { setGenDeptModal(true); setGenDeptComment(submission.vcComment || ''); }}
    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-emerald-600 border border-emerald-500 hover:bg-emerald-50 text-xs font-semibold rounded-xl shadow transition"
  >
    <BarChart2 size={14}/> Dept Report
  </button>
  ```
  Import `BarChart2` from `lucide-react` (add to existing destructured import).

  ### Pro-VC Report History card — add between the Back row and the Submission info card:
  ```jsx
  {savedReports.length > 0 && (
    <div className="card p-4">
      <p className="section-title mb-3">Pro-VC Report History</p>
      <div className="flex flex-wrap gap-3">
        {savedReports.map(r => (
          <div key={r._id} className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${r.reportType === 'faculty-wise' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {r.reportType === 'faculty-wise' ? 'Pro-VC Comments Report' : 'Overall Pro-VC Report'}
            </span>
            {r.facultyName && <span className="text-xs text-slate-600">{r.facultyName}</span>}
            <span className="text-xs text-slate-400">{new Date(r.generatedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
            <a
              href="#"
              onClick={async e => {
                e.preventDefault();
                try {
                  const res = await axios.get(`/api/provc-reports/${r._id}/download`, {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                  });
                  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                  window.open(url, '_blank');
                } catch { toast.error('Failed to download report'); }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
            >
              <FileDown size={11} /> Download
            </a>
          </div>
        ))}
      </div>
    </div>
  )}
  ```
  Import `FileDown, BarChart2` from lucide-react.

  ### Faculty Report Generation Modal (add before `</div>` closing the page):
  Similar to the VCDashboard modal. Lists unique `facultyName` values from `uniqueReports`. On confirm: `POST /api/provc-reports/generate-faculty` with `{ submissionId: id, facultyName: genFacultyName }`, on success refresh `savedReports`.

  ### Department Report Generation Modal:
  Same pattern as VCDashboard's dept modal. On confirm: `POST /api/provc-reports/generate-department` with `{ submissionId: id, overallComments: genDeptComment }`, on success refresh `savedReports`.

  Files: `src/pages/SubmissionDetail.jsx`

  Verify: `npm run build` in repo root exits 0.

---

- [ ] 6. **Add Pro-VC report history to `HODDashboard.jsx`** — near the existing Export PDF / submission history section.

  ### State additions:
  ```js
  const [hodProvcReports, setHodProvcReports] = useState([]);
  const [hodProvcReportsLoading, setHodProvcReportsLoading] = useState(false);
  ```

  ### Fetch on mount — add a `fetchHodProvcReports` function and call it in the `useEffect`:
  ```js
  async function fetchHodProvcReports() {
    if (!user?.department) return;
    setHodProvcReportsLoading(true);
    try {
      const encoded = encodeURIComponent(user.department);
      const { data } = await api.get(`/api/provc-reports/department/${encoded}`);
      setHodProvcReports(data);
    } catch {}
    finally { setHodProvcReportsLoading(false); }
  }
  ```
  Call `fetchHodProvcReports()` alongside `fetchReports()` and `fetchSubmissions()` in the existing `useEffect`.

  ### UI — add a new "Pro-VC Reports" card in the HOD dashboard, immediately after the submission history section (find the section that renders `submissions.map(...)` — the HOD's submission list, which already has the "View & Download PDF" link in the VC decision popup).

  Add a new card section below the reports toolbar (before `<FeedbackTable ...>`):
  ```jsx
  {hodProvcReports.length > 0 && (
    <div className="card p-4 mt-4">
      <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
        <FileText size={15} className="text-purple-600" />
        Pro-VC Reports for {user?.department}
      </p>
      {hodProvcReportsLoading ? (
        <p className="text-xs text-slate-400">Loading...</p>
      ) : (
        <div className="space-y-2">
          {hodProvcReports.map(r => (
            <div key={r._id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl px-4 py-2 bg-slate-50 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-semibold px-2.5 py-0.5 rounded-full ${r.reportType === 'faculty-wise' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {r.reportType === 'faculty-wise' ? 'Pro-VC Comments Report' : 'Overall Pro-VC Report'}
                </span>
                {r.facultyName && <span className="text-slate-600">{r.facultyName}</span>}
                <span className="text-slate-400">{new Date(r.generatedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                <span className="text-slate-400">{r.generatedByName}</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await api.get(`/api/provc-reports/${r._id}/download`, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                    window.open(url, '_blank');
                  } catch { toast.error('Failed to download report'); }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-700 text-white rounded-lg shrink-0"
              >
                <Download size={11} /> Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )}
  ```
  `Download` is already imported from `lucide-react` in `HODDashboard.jsx`. `FileText` is also already imported.

  Files: `src/pages/HODDashboard.jsx`

  Verify: `npm run build` in repo root exits 0.

---

- [ ] 7. **Full build + integration smoke test**.

  Run `npm run build` in the repo root (Vite build); confirm zero errors or fatal warnings.
  Run from `backend/`:
  ```
  node --check models/ProVCReport.js
  node --check routes/provcReports.js
  node --check server.js
  node -e "require('./routes/provcReports')"
  ```
  All must exit 0.

  Confirm no existing features were removed:
  - VCDashboard Submissions tab, HOD Status tab, Summary PDF button, Analyse expand, Action Taken modal, existing "Overall Pro-VC Report" button, Pro-VC Comments panel (the inline textarea that calls `/api/submissions/:id/provc-comment`) — all still present and untouched.
  - SubmissionDetail Approve/Reject buttons, per-row Pro-VC comment panel, FFI chart — all still present.
  - HODDashboard: Upload, Send to VC, Export PDF, Faculty table, submission history — all unchanged.

  Files: none changed in this step (verify only)

  Verify: `npm run build` exits 0; all `node --check` exits 0; `node -e "require('./backend/routes/provcReports')"` exits 0.

---

## Edge cases and failure handling

| Scenario | Handling |
|---|---|
| MITS logo/header PNG missing | `provcReportGenerator.js` already checks `fs.existsSync(MITS_HEADER_PNG)` and falls back to text header — no change needed |
| Submission has no Pro-VC comments for a faculty | `generateProVCReport` renders `'—'` in the Pro-VC column — already handled in generator |
| Faculty name not found in submission reports (POST /generate-faculty) | Return 400: `"No reports found for faculty '{facultyName}' in this submission"` |
| Empty `overallComments` on dept generate | Allowed — generator uses `submission.vcComment` if `overallComments` is empty; if both are empty, generates report with a note ("No overall VC comments recorded") — already handled in `drawOverallComments()` |
| `pdfData` Buffer exceeds MongoDB document limit (16MB) | Landscape A4 PDFs from PDFKit with text only are typically <500KB. If a submission has >100 faculty rows and the buffer approaches 15MB, the create will fail with a MongoServerError. Handle in route: catch the error, return 500 with `"PDF too large to store; use the direct download instead"`. This is unlikely in practice for MITS class sizes. |
| HOD requests report for wrong department | `GET /department/:department` returns 403 if `req.params.department !== user.department` |
| ProVCReport `_id` not found on download | Return 404: `"Report not found"` |
| `Buffer` not serialized properly by Mongoose | The `Buffer` type in mongoose schemas stores as BSON Binary; no special handling needed. When reading back: `report.pdfData` will be a `Buffer` instance that `res.send()` accepts directly. |

## API shape summary

```
POST   /api/provc-reports/generate-faculty    body:{submissionId,facultyName}          → {reportId}
POST   /api/provc-reports/generate-department body:{submissionId,overallComments?}     → {reportId}
GET    /api/provc-reports/:id/download                                                  → PDF stream
GET    /api/provc-reports/submission/:submissionId                                      → ProVCReport[]  (no pdfData)
GET    /api/provc-reports/department/:department                                        → ProVCReport[]  (no pdfData)
```

## Wiring summary

- All PDF generation reuses the existing `provcReportGenerator.js` — no changes to the generator.
- Comments data source: `Submission.provcComments[]` (unchanged) — the generator already reads these.
- PDF history stored in `provc_reports` collection via `ProVCReport` model.
- Frontend: three pages updated — `VCDashboard.jsx` (generate + history in expanded row), `SubmissionDetail.jsx` (generate + history card), `HODDashboard.jsx` (read-only history with download, HOD cannot generate).
- Auth: generate routes restricted to `vc/provc/admin`; download/list restricted to own department for HODs; vc/provc/admin are unrestricted.
