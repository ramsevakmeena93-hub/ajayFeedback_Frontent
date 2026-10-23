# Implementation Plan — Pro-VC Dashboard Redesign

## Screenshot reference
`C:\Users\Hp\Downloads\Pro-VC Dashboard Interface.png`
Read it as an image before writing any JSX to match pixel-level details.

---

## Build / Verification command
```
npm run build:vc
```
Defined in `package.json` → `"build:vc": "vite build --config vite.vc.config.js"`.  
A clean exit (exit code 0, no error output) is the passing condition.  
For a faster syntax/JSX check during development: `npm run build` (default Vite build).

---

## Confirmed data variable names (read from the file)

| Variable / Handler | Line range (approx) | Purpose |
|---|---|---|
| `submissions` | state ~line 232 | Array of all HOD submissions |
| `totalReports` | derived ~line 356 | `submissions.reduce(…reports.length…)` |
| `avgFFI` | derived ~line 358 | `(allFFIs.reduce/allFFIs.length).toFixed(2)` — named **`avgFFI`** (NOT avgFEI, NOT avgFFI) — the KPI label says "Avg FEI Score" but the variable is `avgFFI` |
| `pendingCount` | derived ~line 360 | submissions with status in [submitted, conflict, escalated] |
| `approvedCount` | derived ~line 361 | submissions with status === approved |
| `filtered` | derived ~line 349 | search + filterStatus applied to submissions |
| `expandedSub` | state ~line 246 | holds `sub._id` of the inline-expanded row, or null |
| `setExpandedSub` | setter | toggled by Analyse button |
| `setActionModal` | setter ~line 255 | opens Action Taken modal with the sub object |
| `actionModal` | state | the sub object passed to modal |
| `actionComment` | state | textarea content for action taken |
| `setActionComment` | setter | controlled input |
| `navigate` | hook | `useNavigate()` → used for `/vc/submission/${sub._id}` |
| `search` | state | search input value |
| `setSearch` | setter | onChange |
| `filterStatus` | state | dropdown value |
| `setFilterStatus` | setter | onChange |
| `activeTab` | state | "submissions" \| "hod_status" \| "analysis" |
| `setActiveTab` | setter | tab click |
| `user` | from useAuth() | `user?.name` used in banner |
| `handleApproveConfirm` | function | PATCH approval |
| `handleRejectConfirm` | function | PATCH rejection |
| `handleActionTakenSave` | function | PATCH action-taken |
| `handleSignatureSaved` | function | signature modal callback |
| `approveModal` / `setApproveModal` | state | approve modal sub._id |
| `rejectModal` / `setRejectModal` | state | reject modal sub._id |
| `showSignatureModal` / `setShowSignatureModal` | state | signature upload modal |
| `pendingApproveId` / `setPendingApproveId` | state | queued approve after sig |
| `approveComment` / `setApproveComment` | state | approve textarea |
| `rejectComment` / `setRejectComment` | state | reject textarea |
| `actionSaving` / `setActionSaving` | state | loading flag for action save |
| `analytics` | state | analytics API response |
| `analyticsLoading` | state | analytics loading flag |
| `analysisTab` | state | sub-tab in intelligence tab |
| `setAnalysisTab` | setter | sub-tab click |
| `facultyFilter` / `setFacultyFilter` | state | faculty search in intelligence tab |
| `statusFilter` / `setStatusFilter` | state | faculty status filter |
| `filteredFacultyCards` | derived | filtered faculty cards array |
| `allHods` | state | all HOD users |
| `hodStatusMap` | derived | latest submission per HOD id |
| `loading` | state | submissions loading flag |
| `fetchSubmissions` | function | GET /api/submissions/all |
| `fetchAnalytics` | function | GET /api/submissions/analytics |
| `autoNumber` | top-level function | auto-numbers text lines |
| `STATUS_CFG` | top-level const | status badge config map |
| `InlineAnalysis` | component | inline expand panel |
| `FacultyCard` | component | intelligence tab cards |

---

## Exact JSX line ranges to replace

The `return (…)` statement starts at approximately **line 370** (the `<div className="min-h-screen…">` root).

| Section | Approx line range in current file | Action |
|---|---|---|
| Page header (h1 + subtitle) | Does NOT exist currently — add between `<Navbar>` and the Banner div | **INSERT** |
| Banner `<div>` | Lines ~378–418 (the rounded-2xl overflow-hidden banner div incl. HOD status pills and gold bottom bar) | **REPLACE** |
| KPI Cards `<div className="grid cols-2 lg:cols-4…">` | Lines ~420–435 | **REPLACE** |
| Tab Bar `<div className="flex gap-1 bg-slate-100…">` | Lines ~437–447 | **REPLACE** |
| Submissions table rows (inside `activeTab === "submissions"` block) | Lines ~449–635 (the entire submissions tab block) | **REPLACE INNER STRUCTURE** — keep outer `{activeTab === "submissions" && (…)}` wrapper, replace the card inside it |
| HOD Status tab | Lines ~637–680 | **KEEP UNCHANGED** |
| Intelligence / Analysis tab | Lines ~682–1055 | **KEEP UNCHANGED** |
| All modals | Lines ~1057–1100 | **KEEP UNCHANGED** |

---

## Implementation steps

---

- [ ] 1. **Add page header** — insert between `<Navbar>` and the Banner.

  The screenshot shows a plain, unboxed two-line header: `Pro-VC Dashboard` as a large bold `h1` (black, ~text-2xl font-bold) and `MITS Gwalior` as a small gray subtitle directly below it. There is NO card/box/border around it — just plain text sitting on the page background.

  **Replace** (in the `return` block, right after `<Navbar …/>` and before the Banner `<div>`):

  ```jsx
  {/* ── Page Header ── */}
  <div className="px-0 pt-2 pb-0">
    <h1 className="text-2xl font-bold text-slate-900">Pro-VC Dashboard</h1>
    <p className="text-sm text-slate-500 mt-0.5">MITS Gwalior</p>
  </div>
  ```

  Files: `src/pages/VCDashboard.jsx`

  Verify: `npm run build:vc` exits 0.

---

- [ ] 2. **Replace the Welcome Banner** — remove the current banner (including stats boxes and HOD pills) and implement the dark-navy card with building silhouette.

  The screenshot shows:
  - Dark navy gradient card, rounded corners (`rounded-2xl`), ~180–200px tall, full width
  - Background: `linear-gradient(135deg, #1a2f5e 0%, #1e3f7a 60%, #162550 100%)`
  - Top-left: small label `Pro-Vice-Chancellor Portal` (light blue, `text-blue-300 text-xs font-medium`)
  - Large bold white heading: `Welcome, {user?.name || "Pro-VC"}` (`text-white text-3xl font-bold mt-2`)
  - Subtitle: `MITS Gwalior - Madhav Institute of Technology & Science` (`text-blue-300 text-sm mt-1`)
  - Right side: a campus/building silhouette — implement as an absolutely-positioned SVG or pseudo-element. Use a simple CSS clip-path or SVG buildings shape in a dark-blue tint (`opacity-20` or `opacity-30`) that overlaps the right third of the card.
  - NO stats boxes, NO HOD pills, NO gold bottom bar.
  - The card has `relative overflow-hidden` so the silhouette can be positioned absolutely.

  **New JSX to replace the entire current Banner `<div>` block:**

  ```jsx
  {/* ── Welcome Banner ── */}
  <div
    className="relative rounded-2xl overflow-hidden shadow-md"
    style={{ background: "linear-gradient(135deg, #1a2f5e 0%, #1e3f7a 60%, #162550 100%)", minHeight: "180px" }}
  >
    {/* Building silhouette — right side decoration */}
    <div className="absolute inset-y-0 right-0 w-72 flex items-end justify-end pointer-events-none select-none overflow-hidden opacity-20">
      <svg viewBox="0 0 300 180" className="w-full h-full" fill="currentColor" style={{ color: "#93c5fd" }}>
        {/* Main tall building */}
        <rect x="160" y="40" width="50" height="140" rx="2"/>
        {/* Windows on main building */}
        <rect x="168" y="50" width="10" height="12" rx="1" fill="#1e3f7a"/>
        <rect x="184" y="50" width="10" height="12" rx="1" fill="#1e3f7a"/>
        <rect x="168" y="70" width="10" height="12" rx="1" fill="#1e3f7a"/>
        <rect x="184" y="70" width="10" height="12" rx="1" fill="#1e3f7a"/>
        <rect x="168" y="90" width="10" height="12" rx="1" fill="#1e3f7a"/>
        <rect x="184" y="90" width="10" height="12" rx="1" fill="#1e3f7a"/>
        <rect x="168" y="110" width="10" height="12" rx="1" fill="#1e3f7a"/>
        <rect x="184" y="110" width="10" height="12" rx="1" fill="#1e3f7a"/>
        {/* Left shorter building */}
        <rect x="110" y="70" width="40" height="110" rx="2"/>
        <rect x="118" y="80" width="8" height="10" rx="1" fill="#1e3f7a"/>
        <rect x="132" y="80" width="8" height="10" rx="1" fill="#1e3f7a"/>
        <rect x="118" y="98" width="8" height="10" rx="1" fill="#1e3f7a"/>
        <rect x="132" y="98" width="8" height="10" rx="1" fill="#1e3f7a"/>
        <rect x="118" y="116" width="8" height="10" rx="1" fill="#1e3f7a"/>
        <rect x="132" y="116" width="8" height="10" rx="1" fill="#1e3f7a"/>
        {/* Right smaller building */}
        <rect x="220" y="80" width="35" height="100" rx="2"/>
        <rect x="227" y="90" width="8" height="8" rx="1" fill="#1e3f7a"/>
        <rect x="239" y="90" width="8" height="8" rx="1" fill="#1e3f7a"/>
        <rect x="227" y="106" width="8" height="8" rx="1" fill="#1e3f7a"/>
        <rect x="239" y="106" width="8" height="8" rx="1" fill="#1e3f7a"/>
        {/* Far right tall spire */}
        <rect x="262" y="30" width="25" height="150" rx="2"/>
        <polygon points="274,10 262,30 286,30"/>
        <rect x="267" y="45" width="7" height="8" rx="1" fill="#1e3f7a"/>
        <rect x="267" y="61" width="7" height="8" rx="1" fill="#1e3f7a"/>
        <rect x="267" y="77" width="7" height="8" rx="1" fill="#1e3f7a"/>
        {/* Ground line */}
        <rect x="80" y="178" width="220" height="2"/>
      </svg>
    </div>

    {/* Content */}
    <div className="relative z-10 px-8 py-8">
      <p className="text-blue-300 text-xs font-medium tracking-wide">Pro-Vice-Chancellor Portal</p>
      <h2 className="text-white text-3xl font-bold mt-2">Welcome, {user?.name || "Pro-VC"}</h2>
      <p className="text-blue-300 text-sm mt-1.5">MITS Gwalior - Madhav Institute of Technology & Science</p>
    </div>
  </div>
  ```

  Files: `src/pages/VCDashboard.jsx`

  Verify: `npm run build:vc` exits 0.

---

- [ ] 3. **Replace the KPI Cards row** — match the screenshot exactly.

  Screenshot shows 4 cards in a horizontal row. Each card:
  - White background, subtle rounded border, light shadow
  - On the **left**: a square icon box (~52×52px) with a very light tinted background and a colored icon inside
  - On the **right of the icon**: the large bold number on top, and a small gray label below
  - Card 1: blue tint icon box (`bg-blue-50`), `FileText` icon (`text-blue-600`), value = `submissions.length`, label = `Total Submissions`
  - Card 2: green tint icon box (`bg-green-50`), `Users` icon (`text-green-600`), value = `totalReports`, label = `Total Reports`
  - Card 3: orange/amber tint icon box (`bg-orange-50`), `TrendingUp` icon (`text-orange-500`), value = `avgFFI`, label = `Avg FEI Score`
  - Card 4: red/pink tint icon box (`bg-red-50`), `AlertTriangle` icon (`text-red-500`), value = `pendingCount`, label = `Pending Review`

  **New JSX to replace the existing `<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">` KPI block:**

  ```jsx
  {/* ── KPI Cards ── */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[
      { label: "Total Submissions", value: submissions.length, icon: FileText,      iconBg: "bg-blue-50",   iconColor: "text-blue-600"   },
      { label: "Total Reports",     value: totalReports,       icon: Users,         iconBg: "bg-green-50",  iconColor: "text-green-600"  },
      { label: "Avg FEI Score",     value: avgFFI,             icon: TrendingUp,    iconBg: "bg-orange-50", iconColor: "text-orange-500" },
      { label: "Pending Review",    value: pendingCount,       icon: AlertTriangle, iconBg: "bg-red-50",    iconColor: "text-red-500"    },
    ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
      <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className={`w-13 h-13 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`} style={{ width: 52, height: 52 }}>
          <Icon size={24} className={iconColor} />
        </div>
        <div>
          <p className="text-2xl font-black text-slate-800 leading-tight">{value}</p>
          <p className="text-slate-500 text-sm mt-0.5">{label}</p>
        </div>
      </div>
    ))}
  </div>
  ```

  Files: `src/pages/VCDashboard.jsx`

  Verify: `npm run build:vc` exits 0.

---

- [ ] 4. **Replace the Tab Bar** — active tab gets blue text + blue bottom underline, NO pill background.

  Screenshot shows:
  - No background container box — just tabs sitting on the page background with a bottom border on the active tab
  - Tab icons visible in screenshot: `📋 Submissions` (active, blue text, blue underline), `👥 HOD Status` (gray), `📊 Intelligence` (gray) — the screenshot uses bar-chart icon for Intelligence tab label but the task spec says `📊 Intelligence`
  - The underline is a 2px solid blue line (`border-b-2 border-blue-600`) under the active tab only
  - The container has a bottom border line (`border-b border-slate-200`) spanning the full width

  **New JSX to replace the existing `<div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">` block:**

  ```jsx
  {/* ── Tab Bar ── */}
  <div className="border-b border-slate-200">
    <div className="flex gap-0">
      {[
        { id: "submissions", label: "📋 Submissions" },
        { id: "hod_status",  label: "👥 HOD Status"  },
        { id: "analysis",    label: "📊 Intelligence" },
      ].map(t => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === t.id
              ? "text-blue-600 border-blue-600"
              : "text-slate-500 border-transparent hover:text-slate-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  </div>
  ```

  Files: `src/pages/VCDashboard.jsx`

  Verify: `npm run build:vc` exits 0.

---

- [ ] 5. **Replace the Submissions Tab content** — full table layout matching the screenshot.

  The screenshot shows a proper HTML table with:
  - **Header bar**: "HOD Submissions" (bold, ~text-lg) + "1 record" (small gray) on the LEFT; search box + "All Status" dropdown on the RIGHT
  - **Table columns** (header row, gray uppercase small text, left-aligned): `HOD / Department` | `Academic Year` | `Reports` | `Avg FEI Score` | `Issues` | `Submission Date` | `Status` | `Actions`
  - **Row data** (one row shown per submission):
    - `HOD / Department`: dark navy circle avatar with white initials (e.g. "AD") + name bold + department text below, all in one cell
    - `Academic Year`: plain text `2026-2027` (use `sub.academicYear || "2026-2027"`)
    - `Reports`: small blue pill badge (`bg-blue-100 text-blue-700 rounded-full px-3 py-1 font-bold text-sm`)
    - `Avg FEI Score`: colored number — amber/orange for ~3.83 (`text-orange-500 font-bold`)
    - `Issues`: red/orange pill badge — e.g. `35 Issues` (`bg-red-100 text-red-600 border border-red-200 rounded-full px-3 py-1 font-bold text-xs`) — use `attentionTotal` variable; if 0 show a dash
    - `Submission Date`: formatted as `30 Sept 2026` — use `new Date(sub.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})` which gives "30 Sept 2026" format
    - `Status`: existing status badge (reuse `STATUS_CFG[sub.status]` pill, same as current)
    - `Actions`: 4 buttons in a row:
      1. **Analyse**: outlined blue button (`border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1`), `BarChart2` icon — toggles `setExpandedSub(isExpanded ? null : sub._id)`
      2. **Full View**: filled black button (`bg-slate-900 hover:bg-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1`), `Eye` icon — `navigate('/vc/submission/${sub._id}')`
      3. **Summary**: outlined blue button (same style as Analyse), `FileText` icon — also `navigate('/vc/submission/${sub._id}')` (same destination per task spec)
      4. **Action Taken**: outlined amber/orange button (`border border-amber-500 text-amber-600 bg-white hover:bg-amber-50 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1`), `ClipboardList` icon — calls `setActionModal(sub); setActionComment(sub.vcComment || "")`
  - After each row, if `isExpanded`, render `<InlineAnalysis sub={sub}/>` spanning full width (existing component — unchanged)
  - Keep the existing loading spinner block and empty-state block exactly as they are inside the tab

  **Replace the entire `{activeTab === "submissions" && (…)}` block** with:

  ```jsx
  {/* ══════════════════════════════════════════════════════════════════
      SUBMISSIONS TAB — table layout
  ══════════════════════════════════════════════════════════════════ */}
  {activeTab === "submissions" && (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-800 text-lg">HOD Submissions</h2>
          <p className="text-xs text-slate-400 mt-0.5">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search HOD or department..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 w-56"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none pr-8"
          >
            <option value="">All Status</option>
            <option value="submitted">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          {(search || filterStatus) && (
            <button onClick={() => { setSearch(""); setFilterStatus(""); }} className="text-xs text-red-400 hover:text-red-600 font-medium">
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading submissions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-20 text-center">
          <FileText size={28} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">{submissions.length === 0 ? "No submissions yet" : "No results found"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {["HOD / Department", "Academic Year", "Reports", "Avg FEI Score", "Issues", "Submission Date", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => {
                const ffis          = (sub.reports || []).map(r => r.ffiScore).filter(Boolean);
                const avg           = ffis.length ? (ffis.reduce((s, v) => s + v, 0) / ffis.length).toFixed(2) : "—";
                const avgN          = parseFloat(avg);
                const sc            = STATUS_CFG[sub.status] || STATUS_CFG.submitted;
                const hodName       = sub.hodId?.name || "—";
                const initials      = hodName.split(" ").map(w => w[0] || "").join("").toUpperCase().slice(0, 2) || "H";
                const isExpanded    = expandedSub === sub._id;
                const attentionTotal = (sub.reports || []).reduce((s, r) => s + (r.attentionCount || 0), 0);
                const submittedDate = sub.createdAt
                  ? new Date(sub.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : "—";

                return (
                  <>
                    <tr key={sub._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      {/* HOD / Department */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{hodName}</p>
                            <p className="text-xs text-slate-400">{sub.hodId?.department || sub.department || "—"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Academic Year */}
                      <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {sub.academicYear || "2026-2027"}
                      </td>

                      {/* Reports */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold border border-blue-200">
                          {sub.reports?.length || 0}
                        </span>
                      </td>

                      {/* Avg FEI Score */}
                      <td className="px-4 py-4">
                        {avg !== "—" ? (
                          <span className={`text-sm font-bold ${avgN >= 4 ? "text-teal-600" : avgN >= 3 ? "text-orange-500" : "text-rose-600"}`}>
                            {avg}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Issues */}
                      <td className="px-4 py-4">
                        {attentionTotal > 0 ? (
                          <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-600 border border-red-200 rounded-full text-xs font-bold">
                            {attentionTotal} Issues
                          </span>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </td>

                      {/* Submission Date */}
                      <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {submittedDate}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 flex-nowrap">
                          {/* Analyse */}
                          <button
                            onClick={() => setExpandedSub(isExpanded ? null : sub._id)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                              isExpanded
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            <BarChart2 size={12} /> Analyse
                          </button>

                          {/* Full View */}
                          <button
                            onClick={() => navigate(`/vc/submission/${sub._id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-900 transition-colors"
                          >
                            <Eye size={12} /> Full View
                          </button>

                          {/* Summary */}
                          <button
                            onClick={() => navigate(`/vc/submission/${sub._id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 text-xs font-semibold rounded-lg transition-colors"
                          >
                            <FileText size={12} /> Summary
                          </button>

                          {/* Action Taken */}
                          <button
                            onClick={() => { setActionModal(sub); setActionComment(sub.vcComment || ""); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-amber-600 border border-amber-500 hover:bg-amber-50 text-xs font-semibold rounded-lg transition-colors"
                          >
                            <ClipboardList size={12} /> Action Taken
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline analysis expand row */}
                    {isExpanded && (
                      <tr key={`${sub._id}-analysis`}>
                        <td colSpan={8} className="p-0">
                          <InlineAnalysis sub={sub} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )}
  ```

  **Important notes for the implementer:**
  - The `<>…</>` fragment inside `.map()` requires a `key` prop on the fragment itself. Use `<React.Fragment key={sub._id}>` instead of `<>` to avoid React warnings:
    ```jsx
    import React from "react"; // ensure React is imported at top
    // inside .map():
    return (
      <React.Fragment key={sub._id}>
        <tr className="...">…</tr>
        {isExpanded && <tr key={`${sub._id}-analysis`}><td colSpan={8}…>…</td></tr>}
      </React.Fragment>
    );
    ```
  - Remove the `key` prop from `<tr>` when using `React.Fragment key`.
  - The `isPending` / `isApproved` variables from the old card layout are no longer needed in this tab (Approve/Reject buttons are removed from the submissions table per the screenshot — only the 4 specified action buttons remain). The approve/reject modals still exist and still work — they are just no longer triggered from this table. **Do NOT remove the modal JSX or the handlers.**
  - `React` must be in scope — add `import React from "react";` at the top of the file if not already present (check line 1; currently only `{ useEffect, useState }` is imported from "react").

  Files: `src/pages/VCDashboard.jsx`

  Verify: `npm run build:vc` exits 0.

---

## Summary of what is NOT changed

- All imports (lines 1–20)
- `autoNumber()` function
- `STATUS_CFG`, `STATUS_COLOR`, `STATUS_LABEL` constants
- `FacultyCard` component
- `InlineAnalysis` component
- All state declarations (lines ~232–271)
- All `useEffect` hooks
- `fetchSubmissions`, `fetchAllHods`, `fetchAnalytics` functions
- `handleApproveConfirm`, `handleSignatureSaved`, `handleRejectConfirm`, `handleActionTakenSave` handlers
- All derived data (`filtered`, `totalReports`, `allFFIs`, `avgFFI`, `pendingCount`, `approvedCount`, `hodStatusMap`, `filteredFacultyCards`)
- HOD Status tab JSX (the full `{activeTab === "hod_status" && (…)}` block)
- Intelligence/Analysis tab JSX (the full `{activeTab === "analysis" && (…)}` block)
- All modal JSX (SignatureUpload, Approve, ActionTaken, Reject modals)
- `<Footer />` at bottom

---

## Change summary (what the implementer must do, in order)

1. Add `import React from "react";` as the very first import if not present.
2. In the `return(…)` block, immediately after `<Navbar title="Pro-VC Dashboard" subtitle="MITS Gwalior" />`, insert the plain page header `<div>` (step 1).
3. Replace the entire banner `<div>` (from `{/* ── Banner ── */}` to and including the closing `</div>`) with the new banner (step 2).
4. Replace the entire KPI cards `<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">` block with the new layout (step 3).
5. Replace the entire tab bar `<div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">` block with the new underline-style tab bar (step 4).
6. Replace the entire `{activeTab === "submissions" && (…)}` block with the new table layout (step 5).
7. Run `npm run build:vc` — must exit 0 with no errors.

---

## Verification record (iteration 1)

**Date**: First implementation pass

**Commands run**:
1. `npm run build` (default Vite build) → **exit 0**, 2288 modules transformed, built in 24.52s, no JSX/TypeScript errors. Chunk size warning is pre-existing and unrelated.
2. `npx vite build --config vite.vc.config.js` (`build:vc`) → **exit 0**, 2288 modules transformed, built in 5.40s, no errors.

**Changes made**:
- Added `import React` (required for `React.Fragment`)
- Replaced old banner (with stats boxes, HOD pills, gold bar) → new dark navy gradient banner with building SVG silhouette, no stats
- Inserted plain page header (`Pro-VC Dashboard` h1 + `MITS Gwalior` subtitle) above banner
- Replaced KPI cards (icon above number) → new layout with square icon box on the LEFT + number/label on the right, using `bg-blue-50/green-50/orange-50/red-50` tint boxes and label "Avg FEI Score"
- Replaced pill-style tab bar → underline-style tab bar with `border-b-2 border-blue-600` on active tab
- Replaced submissions card/flex layout → full `<table>` with columns: HOD/Department, Academic Year, Reports, Avg FEI Score, Issues, Submission Date, Status, Actions; rows use `React.Fragment` for inline expand; 4 action buttons: Analyse, Full View, Summary, Action Taken
- All existing state, handlers, modals, HOD Status tab, Intelligence tab, Footer preserved unchanged
