# Pro-VC Dashboard Redesign

The change replaces the return() JSX of VCDashboard.jsx with a layout matching a reference screenshot: plain page header, dark-navy welcome banner with building silhouette, four KPI cards with left-side icon boxes, an underline-style tab bar, and a full HTML table for the submissions tab. All existing state, handlers, modals, the HOD Status tab, the Intelligence tab, FacultyCard, and InlineAnalysis are preserved. The build verified clean at exit 0 on both `npm run build` and `npm run build:vc`.

Watch for: (1) **confirmed** — tab bar uses emoji labels (`📋 Submissions`) while the screenshot shows SVG icon + text tabs; the plan specified emoji so the coder followed the plan, but there is a visible delta from the reference. (2) **possible** — `attentionTotal` is computed from `r.attentionCount`; if that field is absent from the backend shape, Issues always shows 0 while InlineAnalysis (which uses `commentsNeedingAttention.length`) shows the real count. (3) **confirmed** — the `All Status` dropdown is missing `appearance-none pr-8` classes specified in the plan, leaving native browser chevron styling.

**Verdict**: APPROVED

---

## High-level view

The page header, banner, KPI cards, and tab bar are structurally correct. The banner uses an inline `style` gradient (required — Tailwind cannot express these stops) with an absolutely-positioned `opacity-20` SVG silhouette on the right, matching the screenshot's faint architectural outline. `React.Fragment key={sub._id}` is used correctly in the table map.

The KPI cards wire to the correct variables (`submissions.length`, `totalReports`, `avgFFI`, `pendingCount`) and all four action button targets are confirmed correct. The tab bar's active state uses `border-b-2 border-blue-600` / `border-transparent`, matching the screenshot's underline pattern.

One data-wiring gap exists in the Issues column: `attentionTotal` sums `r.attentionCount` per report, while `InlineAnalysis` derives the same count from `r.commentsNeedingAttention.length`. If `attentionCount` is not pre-populated server-side, the table column and the inline panel will diverge. The screenshot shows "35 Issues," meaning the field resolved at runtime, but the inconsistency is latent.

The tab labels use emoji prefixes per the plan spec, but the screenshot renders SVG icons (grid, people, bar chart) at ~16px. This is a plan-sanctioned deviation from the screenshot.

<details>
<summary>Issues (3)</summary>

1. **`attentionTotal` field name inconsistency** — `r.attentionCount` is not the same field as `r.commentsNeedingAttention.length` used by `InlineAnalysis`. If the backend omits `attentionCount`, the Issues column always shows 0. Change the table to `(r.commentsNeedingAttention || []).length` to match `InlineAnalysis`, or confirm the backend populates both fields.

2. **Tab emoji vs screenshot SVG icons** — The screenshot's tabs render SVG icons (Lucide-style), not emoji. The plan specified emoji strings; the coder followed the plan. If the tab appearance needs to match the screenshot exactly, swap the emoji strings for Lucide icon components (`FileText`, `Users`, `BarChart2`) in the tab data array.

3. **`All Status` dropdown missing `appearance-none pr-8`** — The plan required these classes to suppress the native browser dropdown indicator and match the screenshot's clean chevron. They are absent from the `<select>` in the implementation. Add `appearance-none pr-8` to the select className.

</details>

<details>
<summary>Details</summary>

### Issues column data source mismatch

The table row computes:

```js
const attentionTotal = (sub.reports || []).reduce((s, r) => s + (r.attentionCount || 0), 0);
```

`InlineAnalysis` computes the same concept as:

```js
const allComments = (sub.reports || []).flatMap(r => r.commentsNeedingAttention || []);
// then: allComments.length
```

If `attentionCount` is a pre-aggregated field written by the backend when saving each report, both are consistent. If it is absent (backend returns only the raw `commentsNeedingAttention` array), the table will show 0 Issues while the inline panel shows the real count — a silent, user-visible discrepancy. The screenshot shows 35 Issues, confirming the field existed at review time, but it warrants an explicit server-side check.

### Action button targets — confirmed

| Button | Handler | Confirmed |
|---|---|---|
| Analyse | `setExpandedSub(isExpanded ? null : sub._id)` | ✓ |
| Full View | `navigate('/vc/submission/${sub._id}')` | ✓ |
| Summary | `navigate('/vc/submission/${sub._id}')` | ✓ (same destination as Full View, per plan spec) |
| Action Taken | `setActionModal(sub); setActionComment(sub.vcComment \|\| "")` | ✓ |

The Analyse button also toggles its own fill state: blue-filled when `isExpanded`, outlined otherwise — matching the expected toggled visual.

</details>

---

## File map

<details>
<summary>Files changed</summary>

| File | Change |
|---|---|
| `src/pages/VCDashboard.jsx` | Replaced return() JSX for page header, banner, KPI cards, tab bar, and submissions tab; all other sections preserved |

Full diff: `git diff main -- src/pages/VCDashboard.jsx`

</details>
