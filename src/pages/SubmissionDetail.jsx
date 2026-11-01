import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { getPdfUrl } from "../api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp, ExternalLink, MessageSquare, X, Save, FileDown, BarChart2, FileText, Plus, Eye } from "lucide-react";

// Helper: auto-number lines in a comment block
function autoNumber(text) {
  if (!text) return "";
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return text;
  return lines.map((l, i) => {
    // strip existing leading number like "1." or "1)"
    const clean = l.replace(/^\d+[\.\)]\s*/, "");
    return `${i + 1}. ${clean}`;
  }).join("\n");
}

// Expandable comment list cell
function CommentCell({ items, color }) {
  const [expanded, setExpanded] = useState(false);
  if (!items || items.length === 0) return <span className="text-xs text-slate-400 italic">No suggestions</span>;
  const bg = color === "green"
    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
    : "bg-amber-50 border-amber-200 text-amber-800";
  const bullet = color === "green" ? "text-emerald-500" : "text-amber-500";
  const visible = expanded ? items : items.slice(0, 2);
  return (
    <div className="space-y-1">
      {visible.map((c, i) => (
        <div key={i} className="flex items-start gap-1.5 text-xs leading-relaxed">
          <span className={`mt-0.5 font-bold shrink-0 ${bullet}`}>•</span>
          <span className="text-slate-700">{c}</span>
        </div>
      ))}
      {items.length > 2 && (
        <button onClick={() => setExpanded(e => !e)}
          className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5 mt-0.5">
          {expanded ? <><ChevronUp size={11}/> Show less</> : <><ChevronDown size={11}/> +{items.length - 2} more</>}
        </button>
      )}
    </div>
  );
}

export default function SubmissionDetail() {
  const { id }    = useParams();
  const { token, user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [submission, setSubmission] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [highlightId, setHighlightId] = useState(null);
  const rowRefs = useRef({});   // { [reportId]: DOM element }

  // Pro-VC per-faculty comment panel
  const [provcPanel, setProvcPanel] = useState(null);
  const [localProvcComments, setLocalProvcComments] = useState([]);

  // Comments full-view modal (Appreciation / Needs Attention)
  const [commentsModal, setCommentsModal] = useState(null); // { title, items, color }

  // Action Taken modal (view only)
  const [actionModal, setActionModal] = useState(null); // { report, current }

  // Pro-VC Report history
  const [savedReports, setSavedReports]             = useState([]);
  const [genFacultyModal, setGenFacultyModal]       = useState(false);
  const [genFacultyName, setGenFacultyName]         = useState('');
  const [genDeptModal, setGenDeptModal]             = useState(false);
  const [genDeptComment, setGenDeptComment]         = useState('');
  const [generating, setGenerating]                 = useState(false);

  function getComment(facultyName, subjectCode) {
    // prefer local (freshly saved) over DB data
    const local = localProvcComments.find(c => c.facultyName === facultyName && c.subjectCode === subjectCode);
    if (local) return local.comment;
    return (submission?.provcComments || []).find(c => c.facultyName === facultyName && c.subjectCode === subjectCode)?.comment || "";
  }

  function handleProvcSaved(facultyName, subjectCode, comment) {
    setLocalProvcComments(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(c => c.facultyName === facultyName && c.subjectCode === subjectCode);
      if (idx >= 0) arr[idx] = { ...arr[idx], comment };
      else arr.push({ facultyName, subjectCode, comment });
      return arr;
    });
  }

  // Read ?report= param from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rId = params.get("report");
    if (rId) setHighlightId(rId);
  }, [location.search]);

  useEffect(() => {
    axios.get(`/api/reports/submission/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        if (data.reports) {
          const seen = new Set();
          data.reports = data.reports.filter(r => {
            const key = r._id?.toString();
            if (seen.has(key)) return false;
            seen.add(key); return true;
          });
        }
        setSubmission(data);
        // Also load saved Pro-VC reports for this submission
        axios.get(`/api/provc-reports/submission/${id}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(({ data: rpts }) => setSavedReports(rpts))
          .catch(() => {});
      })
      .catch(() => toast.error("Failed to load submission"))
      .finally(() => setLoading(false));
  }, [id]);

  // Scroll to highlighted row once data + refs are ready
  useEffect(() => {
    if (!highlightId || !submission) return;
    const el = rowRefs.current[highlightId];
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [highlightId, submission]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );
  if (!submission) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-500">Submission not found</p>
    </div>
  );

  const seen2 = new Set();
  const uniqueReports = (submission.reports || []).filter(r => {
    const k = r._id?.toString(); if (seen2.has(k)) return false; seen2.add(k); return true;
  });

  const ffis   = uniqueReports.map(r => r.ffiScore).filter(Boolean);
  const avgFFI = ffis.length ? (ffis.reduce((s,v)=>s+v,0)/ffis.length).toFixed(2) : "—";
  const chartData = uniqueReports.map(r => ({
    name: (r.facultyName||"Faculty")
      .replace(/^(Dr\.?|Prof\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, "")
      .trim(),
    full: r.facultyName || "Faculty",
    FFI:  parseFloat((r.ffiScore||0).toFixed(2)),
    reportId: r._id?.toString(),
    subject: r.subjectCode || "",
    responsePercent: r.responsePercent,
  }));
  const minFFI = ffis.length ? Math.max(0, Math.min(...ffis) - 0.5) : 0;
  const maxFFI = ffis.length ? Math.min(5, Math.max(...ffis) + 0.3) : 5;
  const avgNum = avgFFI !== "—" ? parseFloat(avgFFI) : null;
  const chartHeight = Math.max(220, Math.min(320, 170 + chartData.length * 5));
  const bottomMargin = chartData.length > 10 ? 100 : chartData.length > 5 ? 85 : 65;

  const handleChartClick = (data) => {
    const rId = data?.activePayload?.[0]?.payload?.reportId;
    if (!rId) return;
    setHighlightId(rId);
    const el = rowRefs.current[rId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  async function handleApprove() {
    try {
      await api.patch(`/api/submissions/${id}/status`, { status: "approved", vcComment: "" });
      toast.success("Submission approved");
      setSubmission(s => ({ ...s, status: "approved" }));
    } catch { toast.error("Failed to approve"); }
  }

  async function handleReject() {
    const reason = prompt("Enter rejection reason (optional):");
    try {
      await api.patch(`/api/submissions/${id}/status`, { status: "rejected", vcComment: reason || "" });
      toast.success("Submission rejected");
      setSubmission(s => ({ ...s, status: "rejected", vcComment: reason || "" }));
    } catch { toast.error("Failed to reject"); }
  }

  // Session label — covers both stored values and legacy empty sessions
  const [sessionLabel, setSessionLabelState] = useState(
    submission.session === "jan-may" ? "Jan – Jun (Even Sem)"
    : submission.session === "jul-dec" ? "Jul – Dec (Odd Sem)"
    : submission.session ? submission.session
    : null
  );
  const [editingSession, setEditingSession] = useState(false);
  const [sessionValue, setSessionValue] = useState(submission.session || '');

  // Clean course name — strip "Submitted Answer" / "Submitted Answers" suffix
  function cleanProgramme(name) {
    if (!name) return "—";
    return String(name)
      .replace(/\s*[-:–]\s*submitted\s+answers?/gi, "")
      .replace(/\bsubmitted\s+answers?\b/gi, "")
      .replace(/\bsubmitted\s+responses?\b/gi, "")
      .replace(/\bstudent\s+feedback\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim() || "—";
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar title="Submission Detail" subtitle="Pro-VC Review" />
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Pro-VC Comment Panel */}
        {provcPanel && (
          <div className="fixed inset-0 z-[9999] flex justify-end" onClick={() => setProvcPanel(null)}>
            <div
              className="w-full max-w-sm h-full bg-white shadow-2xl flex flex-col border-l border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 bg-blue-600 text-white shrink-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold opacity-80 uppercase tracking-wide">Pro-VC Comment</p>
                  <p className="font-bold text-sm truncate mt-0.5">{provcPanel.facultyName}</p>
                  <p className="text-xs opacity-70 mt-0.5">{provcPanel.subjectCode}{provcPanel.ffi ? ` · FFI ${provcPanel.ffi}` : ""}</p>
                </div>
                <button onClick={() => setProvcPanel(null)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition ml-3">
                  <X size={18} />
                </button>
              </div>
              {provcPanel.existingComment && (
                <div className="mx-4 mt-4 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-blue-800">
                  <p className="font-semibold mb-1 text-blue-600">Current comment:</p>
                  <p className="leading-relaxed">{provcPanel.existingComment}</p>
                </div>
              )}
              <div className="flex-1 p-4 flex flex-col gap-3 overflow-auto">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {provcPanel.existingComment ? "Update comment" : "Write comment"}
                </label>
                <textarea
                  className="flex-1 w-full min-h-[180px] text-sm text-slate-700 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 leading-relaxed"
                  placeholder={`Write your observation for ${provcPanel.facultyName}…`}
                  value={provcPanel.draftText !== undefined ? provcPanel.draftText : (provcPanel.existingComment || "")}
                  onChange={e => setProvcPanel(prev => ({ ...prev, draftText: e.target.value }))}
                />
                <p className="text-[10px] text-slate-400">
                  {(provcPanel.draftText !== undefined ? provcPanel.draftText : (provcPanel.existingComment || "")).trim().split(/\s+/).filter(Boolean).length} words
                </p>
              </div>
              <div className="px-4 py-4 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
                <button onClick={() => setProvcPanel(null)} className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const text = provcPanel.draftText !== undefined ? provcPanel.draftText : (provcPanel.existingComment || "");
                    if (!text.trim()) return toast.error("Please write a comment first");
                    try {
                      await api.post(`/api/submissions/${id}/provc-comment`, {
                        facultyName: provcPanel.facultyName,
                        subjectCode: provcPanel.subjectCode,
                        comment: text.trim(),
                      });
                      toast.success("Pro-VC comment saved ✓");
                      handleProvcSaved(provcPanel.facultyName, provcPanel.subjectCode, text.trim());
                      setProvcPanel(null);
                    } catch (err) {
                      toast.error(err.response?.data?.error || "Failed to save comment");
                    }
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Save size={14} />
                  Save Comment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back & Actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            <ArrowLeft size={16}/> Back to Dashboard
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            {submission.status !== "approved" && submission.status !== "rejected" && (
              <>
                <button onClick={handleApprove} className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow transition">
                  <CheckCircle size={14}/> Approve
                </button>
                <button onClick={handleReject} className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl shadow transition">
                  <XCircle size={14}/> Reject
                </button>
              </>
            )}
            <button
              onClick={() => { setGenFacultyModal(true); setGenFacultyName(''); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-purple-600 border border-purple-500 hover:bg-purple-50 text-xs font-semibold rounded-xl shadow transition"
            >
              <FileText size={14}/> Faculty Report
            </button>
            <button
              onClick={() => { setGenDeptModal(true); setGenDeptComment(submission.vcComment || ''); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-teal-600 border border-teal-500 hover:bg-teal-50 text-xs font-semibold rounded-xl shadow transition"
            >
              <BarChart2 size={14}/> Dept Report
            </button>
          </div>
        </div>

        {/* ── Comments Full-View Modal ── */}
        {commentsModal && (
          <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCommentsModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className={`flex items-center justify-between px-5 py-4 rounded-t-2xl ${commentsModal.color === 'green' ? 'bg-emerald-600' : 'bg-amber-500'} text-white`}>
                <p className="font-bold text-sm">{commentsModal.title}</p>
                <button onClick={() => setCommentsModal(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition"><X size={16}/></button>
              </div>
              <div className="overflow-y-auto p-5 space-y-2">
                {commentsModal.items.map((c, i) => (
                  <div key={i} className={`flex items-start gap-2 text-sm rounded-xl px-3 py-2.5 border ${commentsModal.color === 'green' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    <span className={`font-bold mt-0.5 shrink-0 ${commentsModal.color === 'green' ? 'text-emerald-500' : 'text-amber-500'}`}>•</span>
                    <span className="leading-relaxed">{c}</span>
                  </div>
                ))}
                {commentsModal.items.length === 0 && <p className="text-slate-400 text-sm text-center py-6">No comments available</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Action Taken Modal (read-only for all roles) ── */}
        {actionModal && (
          <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActionModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 bg-amber-500 text-white rounded-t-2xl">
                <div>
                  <p className="font-bold text-sm">Pro-VC Action Taken</p>
                  <p className="text-xs opacity-80 mt-0.5">{actionModal.report.facultyName} · {actionModal.report.subjectCode}</p>
                </div>
                <button onClick={() => setActionModal(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition"><X size={16}/></button>
              </div>
              <div className="p-5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 leading-relaxed min-h-[80px]">
                  {actionModal.current
                    ? actionModal.current.split(/\n+/).map(l => l.trim()).filter(Boolean).map((l, i) => (
                        <div key={i} className="flex items-start gap-2 mb-1.5">
                          <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                          <span>{l}</span>
                        </div>
                      ))
                    : <span className="text-slate-400 italic">No action taken recorded yet.</span>
                  }
                </div>
                <button onClick={() => setActionModal(null)} className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pro-VC Report History */}
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
                  <span className="text-xs text-slate-400">{new Date(r.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <button
                    onClick={async () => {
                      try {
                        const res = await api.get(`/api/provc-reports/${r._id}/download`, { responseType: 'blob' });
                        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                        window.open(url, '_blank');
                      } catch { toast.error('Failed to download report'); }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
                  >
                    <FileDown size={11} /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submission info card */}
        <div className="card p-5">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-sm">
            <div><p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">HOD</p><p className="font-semibold text-slate-800">{submission.hodId?.name || "—"}</p></div>
            <div><p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Department</p><p className="font-semibold text-slate-800">{submission.hodId?.department || submission.department || "—"}</p></div>
            <div><p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Academic Year</p><p className="font-semibold text-slate-800">{submission.academicYear || "—"}</p></div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Session</p>
              {editingSession ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { value: 'jul-dec', label: 'Jul–Dec' },
                    { value: 'jan-may', label: 'Jan–May' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={async () => {
                        try {
                          await api.patch(`/api/submissions/${id}/session`, { session: opt.value });
                          setSessionLabelState(opt.value === 'jan-may' ? 'Jan – Jun (Even Sem)' : 'Jul – Dec (Odd Sem)');
                          setSessionValue(opt.value);
                          setEditingSession(false);
                          toast.success('Session updated ✓');
                        } catch { toast.error('Failed to update session'); }
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                        sessionValue === opt.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-indigo-600 border-indigo-400 hover:bg-indigo-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button onClick={() => setEditingSession(false)} className="text-xs text-slate-400 hover:text-slate-600 px-1">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-slate-800">{sessionLabel || '—'}</p>
                  <button
                    onClick={() => setEditingSession(true)}
                    className="text-[10px] text-indigo-500 hover:text-indigo-700 border border-indigo-300 rounded px-1.5 py-0.5 font-semibold hover:bg-indigo-50 transition"
                  >
                    {sessionLabel ? 'Edit' : '+ Set'}
                  </button>
                </div>
              )}
            </div>
            <div><p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Form No.</p><p className="font-semibold text-slate-800">{submission.feedbackFormNo ? `Feedback Form ${submission.feedbackFormNo}` : "—"}</p></div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Status</p>
              <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                submission.status==="approved"?"bg-emerald-100 text-emerald-700":submission.status==="rejected"?"bg-red-100 text-red-700":"bg-indigo-100 text-indigo-700"}`}>
                {submission.status}
              </span>
            </div>
          </div>
          {submission.vcComment && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800">
              <span className="font-semibold">Pro-VC Comment:</span>
              <div className="mt-1 space-y-1">
                {autoNumber(submission.vcComment).split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FFI Chart */}
        {chartData.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="section-title">FFI Score by Faculty</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click any bar to jump to that faculty's report</p>
              </div>
              <div className="flex items-center gap-3">
                {avgNum && (
                  <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${avgNum>=4?"bg-emerald-100 text-emerald-700":avgNum>=3?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}>
                    Avg: {avgFFI}
                  </span>
                )}
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block"/>≥4.0</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block"/>3.5–4</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500 inline-block"/>3–3.5</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block"/>&lt;3</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 16, left: 0, bottom: bottomMargin }}
                onClick={handleChartClick}
                style={{ cursor: "pointer" }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#475569" }}
                  angle={-40}
                  textAnchor="end"
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  domain={[minFFI, maxFFI]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => v.toFixed(1)}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: "rgba(99,102,241,0.07)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const color = d.FFI>=4?"#10b981":d.FFI>=3.5?"#6366f1":d.FFI>=3?"#f59e0b":"#ef4444";
                    const label = d.FFI>=4?"Excellent":d.FFI>=3.5?"Good":d.FFI>=3?"Monitor":"Critical";
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-[160px]">
                        <p className="font-bold text-slate-800 mb-0.5">{d.full}</p>
                        <p className="text-slate-400 mb-1.5">{d.subject}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black" style={{color}}>{d.FFI?.toFixed(2)}</span>
                          <span className="font-semibold px-1.5 py-0.5 rounded-full text-[10px]" style={{background:`${color}18`,color}}>{label}</span>
                        </div>
                        {d.responsePercent != null && (
                          <p className="text-slate-400 mt-1">{d.responsePercent?.toFixed(0)}% response rate</p>
                        )}
                        <p className="text-blue-500 mt-1.5 font-semibold">Click to jump to report ↓</p>
                      </div>
                    );
                  }}
                />
                {avgNum && (
                  <ReferenceLine
                    y={avgNum}
                    stroke="#6366f1"
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                    label={{ value: `avg ${avgFFI}`, position: "right", fontSize: 9, fill: "#6366f1" }}
                  />
                )}
                <Bar dataKey="FFI" radius={[5,5,0,0]} maxBarSize={44}>
                  {chartData.map((e,i) => (
                    <Cell
                      key={i}
                      fill={e.FFI>=4?"#10b981":e.FFI>=3.5?"#6366f1":e.FFI>=3?"#f59e0b":"#ef4444"}
                      opacity={highlightId && highlightId !== e.reportId ? 0.45 : 0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Reports table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b bg-slate-50 flex items-center justify-between">
            <p className="section-title">Faculty Reports</p>
            <span className="text-xs text-slate-400">{uniqueReports.length} report{uniqueReports.length!==1?"s":""}</span>
          </div>
          {uniqueReports.length === 0 ? (
            <div className="p-16 text-center"><p className="text-slate-400">No reports in this submission</p></div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left">S.No</th>
                    <th className="px-4 py-3 text-left">Faculty Name</th>
                    <th className="px-4 py-3 text-left">Subject Code</th>
                    <th className="px-4 py-3 text-left">Course Name</th>
                    <th className="px-4 py-3 text-center">Sem</th>
                    <th className="px-4 py-3 text-center">Year</th>
                    <th className="px-4 py-3 text-center">FFI</th>
                    <th className="px-4 py-3 text-center">Resp. %</th>
                    <th className="px-4 py-3 text-left">Appreciation</th>
                    <th className="px-4 py-3 text-left">Needs Attention</th>
                    <th className="px-4 py-3 text-left">Action Taken</th>
                    <th className="px-4 py-3 text-left">Pro-VC Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {uniqueReports.map((r, idx) => {
                    const pcts    = r.commentPercentages || {};
                    const pctList = Object.entries(pcts).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
                    const appAll  = (r.appreciation || []).filter(c => c && c.trim().split(/\s+/).length >= 5);
                    const attList = (r.commentsNeedingAttention || []).filter(c => c && c.trim().split(/\s+/).length >= 5);
                    const isHighlighted = highlightId && highlightId === r._id?.toString();
                    return (
                      <tr
                        key={r._id}
                        ref={el => { if (el) rowRefs.current[r._id?.toString()] = el; }}
                        className={`align-top transition-all ${isHighlighted ? "bg-indigo-50 ring-2 ring-inset ring-indigo-400" : "hover:bg-slate-50"}`}
                      >
                        <td className="px-4 py-3 text-slate-400 text-xs">{idx+1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                          {r.facultyName||"—"}
                          {r._id && (
                            <a href={getPdfUrl(r)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-0.5">
                              <ExternalLink size={10}/> View PDF
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-600 whitespace-nowrap">{r.subjectCode||"—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{cleanProgramme(r.programme)}</td>
                        <td className="px-4 py-3 text-center text-xs font-medium">{r.semester||"—"}</td>
                        <td className="px-4 py-3 text-center text-xs">{r.academicYear||"—"}</td>
                        <td className="px-4 py-3 text-center">
                          {r.ffiScore!=null
                            ? <span className={`text-sm font-bold ${r.ffiScore>=4?"text-emerald-600":r.ffiScore>=3?"text-amber-600":"text-red-600"}`}>{r.ffiScore.toFixed(2)}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-semibold text-slate-600">
                            {r.responsePercent != null ? `${Number(r.responsePercent).toFixed(2)}%` : (r.responseCount ?? r.totalResponses ?? "—")}
                          </span>
                        </td>
                        {/* Appreciation — full, scrollable */}
                        <td className="px-4 py-3 min-w-[200px] max-w-[260px]">
                          <div className="space-y-0.5 mb-1">
                            {pctList.map(([label,pct])=>(
                              <span key={label} className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-2 py-0.5 inline-block mr-1 mb-0.5">{label} {pct}%</span>
                            ))}
                          </div>
                          <CommentCell items={appAll} color="green"/>
                          {appAll.length > 0 && (
                            <button
                              onClick={() => setCommentsModal({ title: `Appreciation — ${r.facultyName}`, items: appAll, color: 'green' })}
                              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 border border-emerald-300 rounded-lg px-2 py-0.5 hover:bg-emerald-50 transition"
                            >
                              <Plus size={10}/> View all {appAll.length}
                            </button>
                          )}
                        </td>
                        {/* Needs Attention — full, scrollable */}
                        <td className="px-4 py-3 min-w-[200px] max-w-[260px]">
                          <CommentCell items={attList} color="amber"/>
                          {attList.length > 0 && (
                            <button
                              onClick={() => setCommentsModal({ title: `Needs Attention — ${r.facultyName}`, items: attList, color: 'amber' })}
                              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-800 border border-amber-300 rounded-lg px-2 py-0.5 hover:bg-amber-50 transition"
                            >
                              <Plus size={10}/> View all {attList.length}
                            </button>
                          )}
                        </td>
                        {/* Action Taken — preview with +N more, view-only for all roles */}
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[150px] leading-relaxed">
                          {(() => {
                            const fullText = r.actionTaken || submission.vcComment || '';
                            // Split into lines/sentences for preview
                            const lines = fullText
                              .split(/\n+/)
                              .map(l => l.trim())
                              .filter(Boolean);
                            const preview = lines.slice(0, 2);
                            const extra = lines.length - 2;
                            return (
                              <div className="flex flex-col gap-1">
                                {lines.length === 0
                                  ? <span className="text-slate-300">—</span>
                                  : preview.map((l, i) => (
                                      <div key={i} className="flex items-start gap-1.5 text-xs leading-relaxed">
                                        <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                                        <span className="text-slate-700">{l}</span>
                                      </div>
                                    ))
                                }
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  {extra > 0 && (
                                    <button
                                      onClick={() => setActionModal({ report: r, current: fullText })}
                                      className="text-xs text-amber-500 hover:text-amber-700 flex items-center gap-0.5"
                                    >
                                      <ChevronDown size={11}/> +{extra} more
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setActionModal({ report: r, current: fullText })}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold rounded-lg px-2 py-0.5 border border-slate-200 text-slate-500 hover:bg-slate-50 transition w-fit"
                                  >
                                    <Eye size={10}/> View
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const savedCmt = getComment(r.facultyName || "—", r.subjectCode || "");
                            return (
                              <div className="flex flex-col gap-1.5">
                                {savedCmt && (
                                  <p className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 leading-relaxed max-w-[160px]">{savedCmt}</p>
                                )}
                                {(() => {
                                  const userRoles = new Set([...(user?.roles || []), ...(user?.role ? [user.role] : [])]);
                                  const canWrite = userRoles.has('provc') || userRoles.has('vc') || userRoles.has('admin');
                                  return canWrite ? (
                                    <button
                                      onClick={() => setProvcPanel({
                                        facultyName: r.facultyName || "—",
                                        subjectCode: r.subjectCode || "",
                                        ffi: r.ffiScore?.toFixed(2),
                                        existingComment: savedCmt,
                                      })}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                                        savedCmt
                                          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                          : "bg-white text-blue-600 border-blue-400 hover:bg-blue-50"
                                      }`}
                                    >
                                      <Plus size={11}/>{savedCmt ? "Edit" : "Add"}
                                    </button>
                                  ) : savedCmt ? (
                                    <span className="text-xs text-blue-700 font-medium flex items-center gap-1"><MessageSquare size={10}/> Commented</span>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">No comment</span>
                                  );
                                })()}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer/>

      {/* ── Generate Faculty Pro-VC Report Modal ── */}
      {genFacultyModal && (
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">Generate Faculty Pro-VC Report</h3>
            <p className="text-xs text-slate-500 mb-3">Select the faculty member:</p>
            <select
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={genFacultyName}
              onChange={e => setGenFacultyName(e.target.value)}
            >
              <option value="">— select faculty —</option>
              {[...new Set(uniqueReports.map(r => r.facultyName).filter(Boolean))].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => { setGenFacultyModal(false); setGenFacultyName(''); }}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={!genFacultyName || generating}
                onClick={async () => {
                  setGenerating(true);
                  try {
                    await api.post('/api/provc-reports/generate-faculty', {
                      submissionId: id,
                      facultyName: genFacultyName,
                    });
                    toast.success('Faculty Pro-VC Report saved ✓');
                    const { data } = await api.get(`/api/provc-reports/submission/${id}`);
                    setSavedReports(data);
                    setGenFacultyModal(false);
                    setGenFacultyName('');
                  } catch (err) {
                    toast.error(err.response?.data?.error || 'Generation failed');
                  } finally { setGenerating(false); }
                }}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl"
              >
                {generating ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate Department Pro-VC Report Modal ── */}
      {genDeptModal && (
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 mb-1">Generate Overall Pro-VC Report</h3>
            <p className="text-xs text-slate-500 mb-3">Review or update the overall department comments:</p>
            <textarea
              className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-teal-300 mb-4"
              placeholder="Enter overall observations, recommendations, and action details…"
              value={genDeptComment}
              onChange={e => setGenDeptComment(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setGenDeptModal(false)}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={generating}
                onClick={async () => {
                  setGenerating(true);
                  try {
                    await api.post('/api/provc-reports/generate-department', {
                      submissionId: id,
                      overallComments: genDeptComment,
                    });
                    toast.success('Overall Pro-VC Report saved ✓');
                    const { data } = await api.get(`/api/provc-reports/submission/${id}`);
                    setSavedReports(data);
                    setGenDeptModal(false);
                  } catch (err) {
                    toast.error(err.response?.data?.error || 'Generation failed');
                  } finally { setGenerating(false); }
                }}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl"
              >
                {generating ? 'Generating…' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
