import { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Search, Eye, Trash2, Pencil, X as XIcon, Check } from "lucide-react";

import ReportDetailModal from "./ReportDetailModal";
import CommentEditor from "./CommentEditor";
import axios from "axios";

const STATUS_CFG = {
  processed:       { cls:"badge-emerald", label:"Processed" },
  pending:         { cls:"badge-slate",   label:"Pending"   },
  error:           { cls:"badge-red",     label:"Error"     },
  sent_to_faculty: { cls:"badge-indigo",  label:"Sent"      },
  faculty_approved:{ cls:"badge-emerald", label:"Approved"  },
};

function CommentList({ items, color, commentPercentages }) {
  const isApp = color === "red";
  if (isApp) {
    const pcts = commentPercentages || {};
    const entries = Object.entries(pcts).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);
    const longComments = (items || []).filter(c => c.trim().split(/\s+/).length > 4);
    if (entries.length === 0 && longComments.length === 0) return <span className="text-xs text-slate-300 italic">None</span>;
    return (
      <div className="space-y-1">
        {entries.map(([label, pct]) => (
          <span key={label} className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-2 py-0.5 font-semibold inline-block mr-1">
            {label} {pct}%
          </span>
        ))}
        {longComments.slice(0,2).map((t,i) => (
          <div key={i} className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg px-2 py-1 leading-snug">{t}</div>
        ))}
      </div>
    );
  }
  if (!items || items.length === 0) return <span className="text-xs text-slate-300 italic">None</span>;
  return (
    <div className="space-y-1">
      {items.map((t,i) => (
        <div key={i} className="text-xs bg-amber-50 border border-amber-100 text-amber-800 rounded-lg px-2 py-1 leading-snug">{t}</div>
      ))}
    </div>
  );
}

function EditableComments({ reportId, field, items, color, commentPercentages, onSave, allItems }) {
  const [open, setOpen] = useState(false);

  const isAtt      = color === "red";
  const bulletColor = isAtt ? "text-amber-500" : "text-emerald-500";
  const pcts = !isAtt && commentPercentages
    ? Object.entries(commentPercentages).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1])
    : [];

  // The "other" list — appreciation if editing attention, and vice versa
  const otherItems = allItems || [];

  return (
    <>
      {/* Table cell display — click to open popup */}
      <div className="group relative cursor-pointer" onClick={() => setOpen(true)}>
        <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto scrollbar-thin pr-1">
          {!isAtt && pcts.map(([k,v],i) => (
            <div key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-2 py-0.5 text-xs font-medium">{k}: {v}%</div>
          ))}
          {items && items.length > 0
            ? items.map((c,i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs leading-snug">
                <span className={`mt-0.5 font-bold shrink-0 ${bulletColor}`}>•</span>
                <span className="text-slate-700">{c}</span>
              </div>
            ))
            : <span className="text-slate-400 italic text-xs">No suggestion</span>
          }
        </div>
        <span className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition">
          <Pencil size={10} className="text-slate-400"/>
        </span>
      </div>

      {/* New CommentEditor popup — tabs + bullet inputs + move button */}
      {open && (
        <CommentEditor
          comments={items || []}
          otherComments={otherItems}
          title={isAtt ? "Need Attention" : "Appreciation"}
          otherTitle={isAtt ? "Appreciation" : "Need Attention"}
          color={isAtt ? "orange" : "green"}
          onSave={(thisList, otherList) => {
            // Save the edited field
            onSave && onSave(reportId, field, thisList);
            // Save the other field too (items may have been moved)
            const otherField = isAtt ? "appreciation" : "commentsNeedingAttention";
            onSave && onSave(reportId, otherField, otherList);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ActionTakenCell({ reportId, value, onSave, commentsNeedingAttention, token }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(value || "");
  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState(null); // stores last AI suggestion

  function openModal() {
    setVal(value || "");
    setSuggested(null);
    setOpen(true);
  }

  function save() {
    onSave && onSave(reportId, "actionTaken", val);
    setOpen(false);
  }

  async function handleSuggest() {
    setSuggesting(true);
    try {
      const comments = (commentsNeedingAttention || []).filter(Boolean);

      if (comments.length === 0) {
        const suggestion = 'Ensure consistent delivery of quality lectures and maintain active student engagement throughout the semester.';
        setSuggested(suggestion);
        setVal(suggestion);
        return;
      }

      // Smart rule-based suggestions — unique per faculty based on actual comment content
      const combined = comments.join(' ').toLowerCase();
      const lines = [];

      // Detect subject from comments for specificity
      const subjectMatch = combined.match(/\b(os|dbms|java|python|c\+\+|data structure|network|web|algorithm|mathematics|physics|chemistry|english|cloud|machine learning|ai|cn|se|toc|flat|dsa)\b/i);
      const subject = subjectMatch ? subjectMatch[1].toUpperCase() : null;
      const subjectHint = subject ? ` for ${subject}` : '';

      if (/notes?|slides?|material|ppt|pdf|upload|share|provide/.test(combined)) {
        const late = /late|not (on )?time|delay|after class/.test(combined);
        lines.push(late
          ? `Upload lecture notes and slides${subjectHint} to the portal at least one day before the class, not after.`
          : `Provide complete notes, slides, and reference material${subjectHint} to students on the portal regularly.`);
      }

      if (/too fast|very fast|fast pace|speak.*fast|teach.*fast|rushing|jaldi/.test(combined)) {
        lines.push(`Slow down the lecture delivery${subjectHint} — students are unable to keep up with the current pace of teaching.`);
      } else if (/too slow|very slow|slow pace/.test(combined)) {
        lines.push(`Increase the lecture pace${subjectHint} to ensure the syllabus is covered within the scheduled timeline.`);
      } else if (/fast|slow|pace|speed/.test(combined)) {
        lines.push(`Moderate the teaching pace${subjectHint} so that all students can follow the lectures comfortably.`);
      }

      if (/not clear|unclear|don.?t understand|difficult to (follow|understand)|concept.*not|confus/.test(combined)) {
        lines.push(`Explain concepts${subjectHint} step by step from basics — multiple students have reported difficulty in understanding.`);
      }

      if (/doubt|question.*not|not.*answer|hesitat|fear|scared|can.?t ask/.test(combined)) {
        lines.push(`Conduct regular doubt-clearing sessions${subjectHint} and create an open environment where students feel comfortable asking questions.`);
      }

      if (/boring|monoton|not interact|one.?way|no interact|dull|no discussion/.test(combined)) {
        lines.push(`Make classes${subjectHint} more interactive by incorporating discussions, real-world examples, and student participation.`);
      }

      if (/lab|practical|coding|hands.?on|program|implement|run|debug/.test(combined)) {
        lines.push(`Ensure lab sessions${subjectHint} include hands-on practice — students should write and execute code themselves, not just observe.`);
      }

      if (/voice|loud|audible|hear|mic|sound|volume/.test(combined)) {
        lines.push(`Speak at a higher volume and more clearly${subjectHint} so that students at the back of the room can hear properly.`);
      }

      if (/read.*slide|only slide|just read|reads? (the )?(ppt|slide|screen|pdf)/.test(combined)) {
        lines.push(`Avoid reading directly from slides${subjectHint} — explain concepts in your own words with examples and board work.`);
      }

      if (/syllabus|not.*complet|incomplete|behind|rush.*end/.test(combined)) {
        lines.push(`Ensure the ${subject || 'course'} syllabus is completed well before examinations — plan and follow a weekly schedule.`);
      }

      if (/quiz|marks?|assessment|unfair|criteria|answer key/.test(combined)) {
        lines.push(`Share assessment criteria and quiz answers with students${subjectHint} to ensure transparency in evaluation.`);
      }

      if (/2.?way|two.?way|interact|communicate|discuss/.test(combined)) {
        lines.push(`Encourage two-way communication${subjectHint} by asking questions, taking student input, and making classes participatory.`);
      }

      // Last resort — use actual comment text
      if (lines.length === 0) {
        lines.push(`Address the student concern: "${comments[0].trim()}".`);
        if (comments.length > 1) lines.push(`Also resolve: "${comments[1].trim()}".`);
      }

      const suggestion = lines.slice(0, 4).join('\n');
      setSuggested(suggestion);
      setVal(suggestion);
    } finally {
      setSuggesting(false);
    }
  }

  const hasAttention = commentsNeedingAttention && commentsNeedingAttention.length > 0;

  return (
    <>
      {/* Table cell display — click to open popup */}
      <div className="group relative cursor-pointer" onClick={openModal}>
        <div className="min-w-[110px] max-w-[200px] min-h-[36px] rounded-xl border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 px-2.5 py-1.5 transition-all">
          {value ? (
            <p className="text-xs text-slate-700 leading-snug line-clamp-3">{value}</p>
          ) : (
            <p className="text-xs text-slate-400 italic">Click to add...</p>
          )}
        </div>
        <span className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition">
          <Pencil size={10} className="text-slate-400"/>
        </span>
      </div>

      {/* Popup Modal */}
      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">

            {/* Header */}
            <div className="px-5 py-3.5 flex items-center justify-between bg-indigo-600 text-white">
              <span className="font-bold text-sm tracking-wide">✍️ Action Taken by HOD</span>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg leading-none">✕</button>
            </div>

            <div className="p-5 space-y-3">

              {/* AI Suggest Banner */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                <span className="text-xl shrink-0">🤖</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-indigo-800">
                    {hasAttention
                      ? `AI can analyse ${commentsNeedingAttention.length} need-attention comment${commentsNeedingAttention.length > 1 ? 's' : ''} and draft an action for you`
                      : 'No need-attention comments — AI will write a default positive action'}
                  </p>
                  <p className="text-[10px] text-indigo-500 mt-0.5">You can edit the suggestion before saving</p>
                </div>
                <button
                  onClick={handleSuggest}
                  disabled={suggesting}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-all"
                >
                  {suggesting ? (
                    <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block"/>Generating...</>
                  ) : (
                    <>✨ {suggested ? 'Regenerate' : 'Suggest'}</>
                  )}
                </button>
              </div>

              {/* Edit area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Action Taken</p>
                  {val.trim() && (
                    <button onClick={() => setVal("")} className="text-[10px] text-red-400 hover:text-red-600 font-medium">Clear</button>
                  )}
                </div>
                <textarea
                  autoFocus
                  rows={7}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 leading-relaxed"
                  value={val}
                  onChange={e => { setVal(e.target.value); if (suggested && e.target.value !== suggested) setSuggested(null); }}
                  placeholder="Click '✨ Suggest' to let AI draft an action, or write your own here..."
                />
                <p className="text-[10px] text-slate-400">
                  {suggested && val === suggested
                    ? '✅ AI suggestion applied — you can edit before saving'
                    : 'Describe the corrective steps taken to address student feedback.'}
                </p>
              </div>

              {/* Live Preview */}
              {val.trim() && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Preview</p>
                  <div className="border border-indigo-200 rounded-xl px-4 py-3 bg-indigo-50 max-h-[160px] overflow-y-auto">
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{val.trim()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t bg-slate-50 flex gap-3 justify-end">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition">Cancel</button>
              <button onClick={save} className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition bg-indigo-600 hover:bg-indigo-700">
                ✓ Save Action
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function EditableCell({ reportId, field, value, onEdit, cls }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  function save() { onEdit && onEdit(reportId, field, val); setEditing(false); }
  if (editing) return (
    <div className="flex gap-1 items-center">
      <input autoFocus className="input text-xs w-28 py-1" value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} />
      <button onClick={save} className="text-emerald-600 text-xs font-bold hover:text-emerald-700">✓</button>
      <button onClick={() => setEditing(false)} className="text-red-400 text-xs hover:text-red-600">✕</button>
    </div>
  );
  return (
    <span className={"cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 rounded-lg px-1.5 py-0.5 transition-colors text-xs leading-snug break-words inline-block " + (cls || "")}
      title="Click to edit" onClick={() => { setVal(value || ""); setEditing(true); }}>
      {value || <span className="text-slate-300 italic text-xs">—</span>}
    </span>
  );
}

const PAGE_SIZE = 40;

export default function FeedbackTable({ reports, selected, onSelect, okReviewed, onInlineOk, onSendToFaculty, onHODApprove, onFieldEdit, onDeleteReport, hodUser, vcUser, submittedIds, token }) {
  const reviewed = okReviewed || new Set();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewReport, setViewReport] = useState(null);

  const filtered = reports.filter(r =>
    !search || r.facultyName?.toLowerCase().includes(search.toLowerCase()) || r.subjectCode?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const isSubmitted = (reportId) => submittedIds && submittedIds.has(String(reportId));
  const selectableIds = reports.filter(r => (r.status === "processed" || r.status === "faculty_approved") && !isSubmitted(r._id)).map(r => r._id);

  function toggleAll() { onSelect(selected.length === selectableIds.length ? [] : selectableIds); }
  function toggleSelect(id) { onSelect(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }

  function parseCodeBatch(subjectCode) {
    if (!subjectCode) return { code:"—", batch:"—" };
    const m = subjectCode.match(/^([A-Za-z0-9]+)[-\s]+(Batch[-\s]*[A-Za-z0-9]+|[A-Za-z][-\s]*[A-Za-z0-9]*)$/i);
    if (m) return { code: m[1].trim(), batch: m[2].trim() };
    const parts = subjectCode.split("-");
    if (parts.length >= 2) {
      return { code: parts[0].trim(), batch: parts.slice(1).join("-").trim() };
    }
    return { code: subjectCode.trim(), batch: "—" };
  }

  // Clean course name - remove "submitted answer" and similar unwanted text
  function cleanCourseName(name) {
    if (!name) return "";
    return name
      .replace(/\bsubmitted\s+answers?\s*:?\s*-?\s*/gi, "") // Remove "submitted answer(s):-" or variations
      .replace(/\bsubmitted\s+responses?\s*:?\s*-?\s*/gi, "")
      .replace(/\bstudent\s+feedback\s*:?\s*-?\s*/gi, "")
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  // Can delete: not faculty_approved, not submitted
  function canDelete(report) {
    if (report.status === "faculty_approved") return false;
    if (isSubmitted(report._id)) return false;
    return true;
  }

  if (reports.length === 0) return (
    <div className="card p-20 text-center animate-fade-in">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">📋</span>
      </div>
      <p className="text-slate-700 font-semibold text-base">No reports yet</p>
      <p className="text-slate-400 text-sm mt-1">Upload a CSV file to get started</p>
    </div>
  );

  return (
    <div className="card overflow-hidden animate-slide-up">
      {/* Search + pagination header */}
      <div className="px-5 py-3.5 border-b bg-slate-50/80 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search faculty or subject..."
            className="input input-search max-w-xs text-xs py-2 pl-9"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">{filtered.length} records</span>
          <span className="text-slate-300">·</span>
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="btn-icon btn-ghost p-1 disabled:opacity-30"><ChevronLeft size={14}/></button>
          <span>Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="btn-icon btn-ghost p-1 disabled:opacity-30"><ChevronRight size={14}/></button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="px-3 py-3 w-8"><input type="checkbox" checked={selected.length===selectableIds.length && selectableIds.length>0} onChange={toggleAll} className="rounded accent-indigo-600" /></th>
              <th className="px-3 py-3 text-left w-12">S.No</th>
              <th className="px-3 py-3 text-left min-w-[120px]">Faculty Name</th>
              <th className="px-3 py-3 text-left min-w-[110px]">Subject Code</th>
              <th className="px-3 py-3 text-left w-36 min-w-[130px]">Course Name</th>
              <th className="px-3 py-3 text-center w-12">Sem</th>
              <th className="px-3 py-3 text-center w-14">FFI</th>
              <th className="px-3 py-3 text-center w-16">Resp. %</th>
              <th className="px-3 py-3 text-left min-w-[200px]">Needs Attention</th>
              <th className="px-3 py-3 text-left min-w-[200px]">Appreciation</th>
              <th className="px-3 py-3 text-left min-w-[120px]">Action Taken</th>
              <th className="px-3 py-3 text-center w-16">View</th>
              {onDeleteReport && <th className="px-3 py-3 text-center w-12">Del</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((report, idx) => {
              const { code, batch } = parseCodeBatch(report.subjectCode);
              const deletable = canDelete(report);
              return (
                <tr key={report._id} className={`table-row align-top ${selected.includes(report._id) ? "bg-indigo-50/60" : ""}`}>
                  <td className="px-3 py-3 w-8"><input type="checkbox" checked={selected.includes(report._id)} onChange={() => toggleSelect(report._id)} disabled={(report.status!=="processed" && report.status!=="faculty_approved") || isSubmitted(report._id)} className="rounded accent-indigo-600" /></td>
                  <td className="px-3 py-3 text-slate-400 text-xs font-medium w-12">{(page-1)*PAGE_SIZE+idx+1}</td>
                  <td className="px-3 py-3 font-semibold text-slate-800 text-xs min-w-[120px] whitespace-normal">
                    <EditableCell reportId={report._id} field="facultyName" value={report.facultyName} onEdit={onFieldEdit} cls="font-semibold" />
                  </td>
                  <td className="px-3 py-3 text-xs font-mono text-slate-600 min-w-[110px] whitespace-normal">
                    <EditableCell reportId={report._id} field="subjectCode" value={report.subjectCode} onEdit={onFieldEdit} />
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600 w-36 min-w-[130px] whitespace-normal break-words leading-snug">
                    <EditableCell reportId={report._id} field="programme" value={cleanCourseName(report.programme)} onEdit={onFieldEdit} />
                  </td>
                  <td className="px-3 py-3 text-center text-xs w-12">
                    <EditableCell reportId={report._id} field="semester" value={report.semester} onEdit={onFieldEdit} />
                  </td>
                  <td className="px-3 py-3 text-center w-14">
                    {report.ffiScore!=null ? (
                      <span className={`text-sm font-bold ${report.ffiScore>=4?"text-emerald-600":report.ffiScore>=3?"text-amber-600":"text-red-600"}`}>
                        {report.ffiScore.toFixed(2)}
                      </span>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-3 py-3 text-center w-16">
                    <span className="text-xs font-semibold text-slate-500">
                      {report.responsePercent != null ? `${Number(report.responsePercent).toFixed(2)}%` : (report.responseCount != null ? String(report.responseCount) : "-")}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs min-w-[200px] whitespace-normal">
                    <EditableComments
                      reportId={report._id}
                      field="commentsNeedingAttention"
                      items={report.commentsNeedingAttention}
                      color="red"
                      allItems={report.appreciation || []}
                      onSave={onFieldEdit}
                    />
                  </td>
                  <td className="px-3 py-3 text-xs min-w-[200px] whitespace-normal">
                    <EditableComments
                      reportId={report._id}
                      field="appreciation"
                      items={report.appreciation}
                      color="green"
                      allItems={report.commentsNeedingAttention || []}
                      commentPercentages={report.commentPercentages}
                      onSave={onFieldEdit}
                    />
                  </td>
                  <td className="px-3 py-3 min-w-[120px]"><ActionTakenCell reportId={report._id} value={report.actionTaken} onSave={onFieldEdit} commentsNeedingAttention={report.commentsNeedingAttention} token={token} /></td>
                  <td className="px-3 py-3 w-16">
                    <button onClick={() => setViewReport(report)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors border border-indigo-200">
                      <Eye size={12}/> View
                    </button>
                  </td>
                  {onDeleteReport && (
                    <td className="px-3 py-3 text-center w-12">
                      {deletable ? (
                        <button
                          onClick={() => onDeleteReport(report._id)}
                          className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors border border-red-100 mx-auto"
                          title="Delete report"
                        >
                          <Trash2 size={12}/>
                        </button>
                      ) : (
                        <span className="text-slate-200 text-xs">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Signature section at bottom — HOD and VC only */}
      <div className="border-t-2 border-slate-200 bg-white mx-0">
        <div className="flex items-stretch divide-x divide-slate-200">

          {/* HOD Signature */}
          <div className="flex-1 flex flex-col items-center justify-between px-10 py-6 gap-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">HOD Signature</p>
            <div className="w-full flex items-center justify-center min-h-[56px]">
              {hodUser?.signatureImage ? (
                <img src={hodUser.signatureImage} alt="HOD Signature"
                  className="max-h-14 max-w-[180px] object-contain" />
              ) : (
                <div className="w-48 border-b-2 border-slate-400"></div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">{hodUser?.name || "Head of Department"}</p>
              <p className="text-xs text-slate-400 mt-0.5">HOD</p>
            </div>
          </div>

          {/* Pro-VC Signature */}
          <div className="flex-1 flex flex-col items-center justify-between px-10 py-6 gap-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pro-VC Signature</p>
            <div className="w-full flex items-center justify-center min-h-[56px]">
              {vcUser?.signatureImage ? (
                <img src={vcUser.signatureImage} alt="Pro-VC Signature"
                  className="max-h-14 max-w-[180px] object-contain" />
              ) : (
                <div className="w-48 border-b-2 border-slate-400"></div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">{vcUser?.name || "Dr. Manjuree Pandit"}</p>
              <p className="text-xs text-slate-400 mt-0.5">Pro-VC</p>
            </div>
          </div>

        </div>
      </div>

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1">
            {Array.from({length:Math.min(totalPages,7)},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${p===page?"bg-indigo-600 text-white shadow-sm":"hover:bg-slate-200 text-slate-600"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {viewReport && (
        <ReportDetailModal
          report={viewReport}
          onClose={() => setViewReport(null)}
          onSendToFaculty={onSendToFaculty ? (id) => { onSendToFaculty(id); } : null}
          onHODApprove={onHODApprove ? (id, reason) => { onHODApprove(id, reason); } : null}
          onFieldEdit={onFieldEdit}
        />
      )}
    </div>
  );
}
