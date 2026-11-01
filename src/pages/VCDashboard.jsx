import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SignatureUpload from '../components/SignatureUpload';
import mitsCampusImg from "../assets/mits-campus.png";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
  LabelList,
} from "recharts";
import {
  CheckCircle, XCircle, Eye, TrendingUp, Users, FileText,
  AlertTriangle, Search, ClipboardList, BadgeCheck, ChevronDown,
  ChevronUp, BarChart2, MessageSquare, X, Save, FileDown,
} from "lucide-react";

function autoNumber(text) {
  if (!text) return "";
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return text;
  return lines.map((l, i) => `${i + 1}. ${l.replace(/^\d+[\.\)]\s*/, "")}`).join("\n");
}

const STATUS_CFG = {
  submitted: { bg:"bg-amber-50",  text:"text-amber-700",  border:"border-amber-200",  dot:"bg-amber-400",  label:"Pending Review" },
  escalated: { bg:"bg-orange-50", text:"text-orange-700", border:"border-orange-200", dot:"bg-orange-500", label:"Pending Pro-VC Review" },
  conflict:  { bg:"bg-purple-50", text:"text-purple-700", border:"border-purple-200", dot:"bg-purple-500", label:"Conflict / Review" },
  approved:  { bg:"bg-teal-50",   text:"text-teal-700",   border:"border-teal-200",   dot:"bg-teal-500",   label:"Approved" },
  rejected:  { bg:"bg-rose-50",   text:"text-rose-700",   border:"border-rose-200",   dot:"bg-rose-500",   label:"Rejected" },
  reviewed:  { bg:"bg-slate-50",  text:"text-slate-600",  border:"border-slate-200",  dot:"bg-slate-400",  label:"Reviewed" },
  sent_back: { bg:"bg-yellow-50", text:"text-yellow-700", border:"border-yellow-200", dot:"bg-yellow-400", label:"Sent Back" },
};

const STATUS_COLOR = { critical:"#ef4444", monitor:"#f59e0b", good:"#10b981", excellent:"#6366f1" };
const STATUS_LABEL = { critical:"Critical", monitor:"Monitor", good:"Good", excellent:"Excellent" };

// ── Faculty Intelligence Card ──────────────────────────────────────────────
function FacultyCard({ f }) {
  const [expanded, setExpanded] = useState(false);
  const color = f.status === "critical" ? "border-red-300 bg-red-50/40"
    : f.status === "monitor"   ? "border-amber-300 bg-amber-50/40"
    : f.status === "excellent" ? "border-indigo-300 bg-indigo-50/40"
    : "border-emerald-300 bg-emerald-50/40";
  const badge = f.status === "critical"
    ? "bg-red-100 text-red-700 border-red-200"
    : f.status === "monitor"
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : f.status === "excellent"
    ? "bg-indigo-100 text-indigo-700 border-indigo-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";
  const ffiColor = !f.avgFFI ? "text-slate-400"
    : f.avgFFI >= 4 ? "text-emerald-600"
    : f.avgFFI >= 3 ? "text-amber-600"
    : "text-red-600";

  return (
    <div className={`rounded-2xl border-2 ${color} overflow-hidden transition-all`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${badge}`}>
                {STATUS_LABEL[f.status]}
              </span>
              {f.totalAttention > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                  {f.totalAttention} concern{f.totalAttention!==1?"s":""}
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-800 text-sm leading-tight">{f.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{f.dept}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-2xl font-black ${ffiColor}`}>{f.avgFFI ?? "—"}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">FFI</p>
          </div>
        </div>

        {/* FFI bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>0</span><span>5.0</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="h-2 rounded-full transition-all"
              style={{
                width: f.avgFFI ? `${Math.min((f.avgFFI/5)*100,100)}%` : "0%",
                background: STATUS_COLOR[f.status] || "#94a3b8"
              }}/>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white/70 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-slate-700">{f.totalReports}</p>
            <p className="text-[10px] text-slate-400">Reports</p>
          </div>
          <div className="bg-white/70 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-emerald-600">{f.totalAppreciation}</p>
            <p className="text-[10px] text-slate-400">Praise</p>
          </div>
          <div className="bg-white/70 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-amber-600">{f.totalAttention}</p>
            <p className="text-[10px] text-slate-400">Issues</p>
          </div>
        </div>

        {/* Top issues */}
        {f.topIssues.length > 0 && (
          <div className="space-y-1 mb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Top Concerns</p>
            {f.topIssues.map((issue, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] bg-white/80 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                  {issue.cat}
                </span>
                <span className="text-[10px] text-slate-400">×{issue.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition pt-1 border-t border-white/50"
        >
          {expanded ? <><ChevronUp size={11}/>Hide comments</> : <><ChevronDown size={11}/>View comments</>}
        </button>
      </div>

      {/* Expanded comments */}
      {expanded && f.topAttentionComments.length > 0 && (
        <div className="px-4 pb-4 space-y-2 border-t border-white/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide pt-3">Student Feedback (Need Attention)</p>
          {f.topAttentionComments.map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-white/60 rounded-lg p-2">
              <span className="text-amber-500 font-bold mt-0.5 shrink-0">•</span>
              <span className="leading-snug">{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Custom tooltip for FFI chart ──────────────────────────────────────────
function FFITooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const ffi = d.FFI;
  const hasScore = ffi != null;
  const color = !hasScore ? "#94a3b8" : ffi >= 4 ? "#10b981" : ffi >= 3.5 ? "#6366f1" : ffi >= 3 ? "#f59e0b" : "#ef4444";
  const label = !hasScore ? "No score yet" : ffi >= 4 ? "Excellent" : ffi >= 3.5 ? "Good" : ffi >= 3 ? "Monitor" : "Critical";
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-[160px]">
      <p className="font-bold text-slate-800 mb-1 leading-snug">{d.full}</p>
      <p className="text-slate-400 mb-1.5">{d.subject}</p>
      <div className="flex items-center gap-2">
        <span className="text-lg font-black" style={{ color }}>{hasScore ? ffi.toFixed(2) : "—"}</span>
        <span className="font-semibold px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: `${color}18`, color }}>
          {label}
        </span>
      </div>
      {d.responseCount && (
        <p className="text-slate-400 mt-1">{d.responseCount} responses · {d.responsePercent?.toFixed(0)}%</p>
      )}
      <p className="text-blue-500 mt-1.5 font-semibold">Click to view full report →</p>
    </div>
  );
}

// ── Pro-VC Comment Panel (slide-in from right) ────────────────────────────
function ProVCCommentPanel({ facultyName, subjectCode, ffi, submissionId, existingComment, token, onClose, onSaved }) {
  const [text, setText] = useState(existingComment || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!text.trim()) return toast.error("Please write a comment first");
    setSaving(true);
    try {
      await axios.post(
        `/api/submissions/${submissionId}/provc-comment`,
        { facultyName, subjectCode, comment: text.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Pro-VC comment saved ✓");
      onSaved(text.trim());
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save comment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-sm h-full bg-white shadow-2xl flex flex-col border-l border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-blue-600 text-white shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold opacity-80 uppercase tracking-wide">Pro-VC Comment</p>
            <p className="font-bold text-sm truncate mt-0.5">{facultyName}</p>
            <p className="text-xs opacity-70 mt-0.5">{subjectCode}{ffi ? ` · FFI ${ffi}` : ""}</p>
          </div>
          <button onClick={onClose} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition ml-3">
            <X size={18} />
          </button>
        </div>

        {/* Existing comment preview */}
        {existingComment && (
          <div className="mx-4 mt-4 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-blue-800">
            <p className="font-semibold mb-1 text-blue-600">Current comment:</p>
            <p className="leading-relaxed">{existingComment}</p>
          </div>
        )}

        {/* Textarea */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-auto">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {existingComment ? "Update comment" : "Write comment"}
          </label>
          <textarea
            className="flex-1 w-full min-h-[180px] text-sm text-slate-700 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 leading-relaxed"
            placeholder={`Write your observation for ${facultyName}…`}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <p className="text-[10px] text-slate-400">{text.trim().split(/\s+/).filter(Boolean).length} words</p>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save Comment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline submission analysis panel ──────────────────────────────────────
function InlineAnalysis({ sub, onNavigate, onOpenComment }) {
  const allComments  = (sub.reports||[]).flatMap(r => r.commentsNeedingAttention||[]);
  const allPraise    = (sub.reports||[]).flatMap(r => r.appreciation||[]);
  const ffis         = (sub.reports||[]).map(r=>r.ffiScore).filter(Boolean);
  const avg          = ffis.length ? (ffis.reduce((s,v)=>s+v,0)/ffis.length).toFixed(2) : null;

  // Chart data — full name, subject code, click-navigable
  const chartData = (sub.reports||[])
    .filter(r => r.ffiScore)
    .map(r => {
      const shortName = (r.facultyName || "Unknown")
        .replace(/^(Dr\.?|Prof\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, "").trim();
      const code = (r.subjectCode || "").split("-")[0].trim();
      const name = code ? `${shortName} (${code})` : shortName;
      return {
        name,
        full: r.facultyName || "Unknown",
        subject: r.subjectCode || "",
        FFI: r.ffiScore != null ? parseFloat(r.ffiScore.toFixed(2)) : null,
        reportId: r._id,
        responseCount: r.responseCount,
        responsePercent: r.responsePercent,
        attention: (r.commentsNeedingAttention||[]).length,
        noScore: r.ffiScore == null,
      };
    });

  // Dynamic Y-axis: zoom in on actual score range for more realistic look
  // Dynamic Y-axis: only use reports that actually have a score
  const scoredFFIs = chartData.map(d => d.FFI).filter(v => v != null);
  const minFFI = scoredFFIs.length ? Math.max(0, Math.min(...scoredFFIs) - 0.5) : 0;
  const maxFFI = scoredFFIs.length ? Math.min(5, Math.max(...scoredFFIs) + 0.3) : 5;
  const avgNum = avg ? parseFloat(avg) : null;

  // Dynamic bar height: more bars → shorter height, fewer → taller
  const chartHeight = Math.max(180, Math.min(300, 160 + chartData.length * 4));
  // Bottom margin for angled labels — full names need more room
  const bottomMargin = chartData.length > 10 ? 100 : chartData.length > 5 ? 85 : 65;

  const handleBarClick = (data) => {
    const payload = data?.activePayload?.[0]?.payload;
    if (payload?.reportId && onNavigate) {
      onNavigate(sub._id, payload.reportId);
    }
  };

  return (
    <div className="bg-slate-50 border-t border-slate-100 px-5 py-4 space-y-4">
      {/* Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Avg FFI",    value: avg ? <span className={parseFloat(avg)>=4?"text-teal-600":parseFloat(avg)>=3?"text-amber-600":"text-red-600"}>{avg}</span> : "—", icon:"📊" },
          { label:"Reports",    value: sub.reports?.length||0, icon:"📋" },
          { label:"Issues",     value: allComments.length, icon:"⚠️" },
          { label:"Praise",     value: allPraise.length, icon:"⭐" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <p className="text-base">{icon}</p>
            <p className="text-lg font-black text-slate-800">{value}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* FFI Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">FFI Score by Faculty</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Click any bar to view full report</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              {avgNum && (
                <span className={`px-2 py-0.5 rounded-full ${avgNum>=4?"bg-emerald-100 text-emerald-700":avgNum>=3?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}>
                  Avg: {avg}
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block"/>≥4.0</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block"/>3.5–4.0</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500 inline-block"/>3.0–3.5</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block"/>&lt;3.0</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-300 inline-block"/>No score</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 10, left: 0, bottom: bottomMargin }}
              onClick={handleBarClick}
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
              <Tooltip content={<FFITooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
              {/* Average reference line */}
              {avgNum && (
                <ReferenceLine
                  y={avgNum}
                  stroke="#6366f1"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{ value: `avg ${avg}`, position: "right", fontSize: 9, fill: "#6366f1" }}
                />
              )}
              <Bar dataKey="FFI" radius={[5, 5, 0, 0]} maxBarSize={40}>
                {chartData.map((e, i) => (
                  <Cell
                    key={i}
                    fill={e.FFI == null ? "#cbd5e1" : e.FFI >= 4 ? "#10b981" : e.FFI >= 3.5 ? "#6366f1" : e.FFI >= 3 ? "#f59e0b" : "#ef4444"}
                    opacity={e.FFI == null ? 0.6 : 0.88}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Need Attention — by Faculty with Pro-VC Comments buttons */}
      {(sub.reports||[]).filter(r=>(r.commentsNeedingAttention||[]).length>0).length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-b border-amber-200">
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Need Attention — By Faculty</p>
          </div>
          <div className="divide-y divide-slate-100">
            {(sub.reports||[]).filter(r=>(r.commentsNeedingAttention||[]).length>0).map((r,i)=>{
              const savedComment = (sub._provcCommentsLocal||sub.provcComments||[]).find(
                c => c.facultyName === (r.facultyName||"—") && c.subjectCode === (r.subjectCode||"")
              )?.comment || "";
              return (
                <div key={i} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <p className="text-sm font-bold text-slate-800">{r.facultyName||"—"}</p>
                        <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                          {r.subjectCode} · FFI {r.ffiScore?.toFixed(2)||"—"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {(r.commentsNeedingAttention||[]).filter(c => c && c.trim().split(/\s+/).length >= 5).slice(0,3).map((c,j)=>(
                          <div key={j} className="flex items-start gap-1.5 text-xs text-slate-600">
                            <span className="text-amber-500 font-bold mt-0.5 shrink-0">•</span>
                            <span className="leading-relaxed">{c}</span>
                          </div>
                        ))}
                        {r.commentsNeedingAttention.length > 3 && (
                          <p className="text-[10px] text-slate-400 pl-4">+{r.commentsNeedingAttention.length-3} more</p>
                        )}
                      </div>
                      {savedComment && (
                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs text-blue-800">
                          <span className="font-semibold text-blue-600">Pro-VC: </span>{savedComment}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPARTMENT ANALYTICS — FFI Bar + Response % Ranking
// ═══════════════════════════════════════════════════════════════════════════

function DeptFFITooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const ffi = d.ffi;
  const color = ffi >= 4 ? "#16a34a" : ffi >= 3 ? "#f59e0b" : "#ef4444";
  const statusLabel = { approved: "Approved", submitted: "Pending Review", conflict: "Conflict", escalated: "Escalated", rejected: "Rejected", sent_back: "Sent Back" };
  return (
    <div className="bg-slate-900 text-white rounded-xl shadow-xl px-3 py-2 text-xs min-w-[160px]">
      <p className="font-bold mb-0.5">{d.fullDept || d.dept}</p>
      {d.status && <p className="text-slate-400 mb-1">{statusLabel[d.status] || d.status}</p>}
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span>Average FFI: <strong>{ffi.toFixed(2)}</strong></span>
      </div>
    </div>
  );
}

// Custom Y-axis tick — splits "Dept Name (date)" into up to 3 lines so nothing clips
function YAxisDeptTick({ x, y, payload }) {
  const full = payload.value || "";

  // Separate the trailing "(date)" part if present
  const dateMatch = full.match(/^(.*?)(\s*\(\d.+\))$/);
  const deptPart = dateMatch ? dateMatch[1].trim() : full;
  const datePart = dateMatch ? dateMatch[2].trim() : "";

  // Split dept name at ~22 chars on a word boundary
  const words = deptPart.split(" ");
  let line1 = "", line2 = "";
  for (const w of words) {
    const test = line1 ? line1 + " " + w : w;
    if (!line1 || test.length <= 22) { line1 = test; }
    else { line2 = line2 ? line2 + " " + w : w; }
  }

  const lines = [line1, line2, datePart].filter(Boolean);
  const lineH = 14;
  const totalH = lines.length * lineH;
  const startY = -totalH / 2 + lineH / 2;

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((l, i) => (
        <text
          key={i}
          x={-8}
          y={startY + i * lineH}
          textAnchor="end"
          fontSize={i === lines.length - 1 && datePart ? 10 : 11}
          fill={i === lines.length - 1 && datePart ? "#94a3b8" : "#475569"}
          dominantBaseline="middle"
        >
          {l}
        </text>
      ))}
    </g>
  );
}

function DeptChartsSection({ submissions }) {
  const [filterYear, setFilterYear]     = React.useState("all");
  const [filterSem,  setFilterSem]      = React.useState("all");
  const [filterSession, setFilterSession] = React.useState("all");

  // Collect all unique years / semesters / sessions from submissions
  const allYears    = [...new Set((submissions||[]).map(s => s.academicYear).filter(Boolean))].sort().reverse();
  const allSems     = [...new Set((submissions||[]).flatMap(s => (s.reports||[]).map(r => r.semester)).filter(v => v != null && v !== ""))].sort((a,b) => Number(a)-Number(b));
  const allSessions = [...new Set((submissions||[]).map(s => s.session).filter(Boolean))].sort();

  // Filter submissions by year / session, then reports by semester
  const filteredSubs = (submissions || []).filter(sub => {
    if (filterYear    !== "all" && sub.academicYear !== filterYear)    return false;
    if (filterSession !== "all" && sub.session      !== filterSession) return false;
    return true;
  });

  // Build per-submission stats (one bar per submission, not per dept).
  // This ensures two submissions from the same department both appear as separate bars.
  const deptMap = {};
  filteredSubs.forEach(sub => {
    const dept = sub.hodId?.department || sub.department || "Unknown";
    const subId = String(sub._id);
    // Label: dept name + submission date so bars are distinguishable
    const dateStr = sub.createdAt
      ? new Date(sub.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "";
    const label = dateStr ? `${dept} (${dateStr})` : dept;

    if (!deptMap[subId]) deptMap[subId] = { dept: label, fullDept: dept, submissionId: subId, status: sub.status, ffis: [], semRespMap: {}, reports: 0 };
    (sub.reports || []).forEach(r => {
      if (filterSem !== "all" && String(r.semester) !== String(filterSem)) return;
      deptMap[subId].reports++;
      if (r.ffiScore != null) deptMap[subId].ffis.push(Number(r.ffiScore));

      // Get the response percent for this report
      let pct = null;
      if (r.responsePercent != null) {
        pct = Number(r.responsePercent);
      } else if (r.responseCount != null) {
        const base = r.linkSent ?? r.registeredStudents;
        if (base && Number(base) > 0) pct = (Number(r.responseCount) / Number(base)) * 100;
      }
      if (pct == null) return;

      // Group by semester so we can average per-semester first
      const semKey = filterSem !== "all" ? "selected" : String(r.semester ?? "unknown");
      if (!deptMap[subId].semRespMap[semKey]) deptMap[subId].semRespMap[semKey] = [];
      deptMap[subId].semRespMap[semKey].push(pct);
    });
  });

  // For each entry: compute average per semester, then average those semester-averages
  Object.values(deptMap).forEach(d => {
    const semAvgs = Object.values(d.semRespMap).map(
      arr => arr.reduce((s, v) => s + v, 0) / arr.length
    );
    d.respPcts = semAvgs; // each entry = one semester's average
  });

  const deptList = Object.values(deptMap).filter(d => d.reports > 0 || d.respPcts.length > 0);

  // ── Chart 1: Average FFI per submission ───────────────────────────────
  const ffiData = deptList
    .map(d => ({
      dept:     d.dept,
      fullDept: d.fullDept,
      status:   d.status,
      ffi: d.ffis.length ? parseFloat((d.ffis.reduce((s, v) => s + v, 0) / d.ffis.length).toFixed(2)) : 0,
    }))
    .filter(d => d.ffi > 0)
    .sort((a, b) => b.ffi - a.ffi);

  const avgFFIAll = ffiData.length
    ? parseFloat((ffiData.reduce((s, d) => s + d.ffi, 0) / ffiData.length).toFixed(2))
    : 0;

  // ── Chart 2: Avg response % per submission ────────────────────────────
  const respData = deptList
    .map(d => ({
      dept:     d.dept,
      fullDept: d.fullDept,
      status:   d.status,
      pct: d.respPcts.length
        ? parseFloat((d.respPcts.reduce((s, v) => s + v, 0) / d.respPcts.length).toFixed(1))
        : 0,
    }))
    .filter(d => d.pct > 0)
    .sort((a, b) => b.pct - a.pct);

  const ffiColor  = (v) => v >= 4 ? "#16a34a" : v >= 3 ? "#f59e0b" : "#ef4444";
  const respColor = (v) => v >= 80 ? "#16a34a" : v >= 60 ? "#f59e0b" : "#ef4444";

  const sessionLabel = (s) => s === "jan-may" ? "Jan – Jun (Even)" : s === "jul-dec" ? "Jul – Dec (Odd)" : s;

  const noData = ffiData.length === 0 && respData.length === 0;

  // Shared filter bar
  const FilterBar = (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Academic Year */}
      {allYears.length > 0 && (
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-700 font-medium"
        >
          <option value="all">All Years</option>
          {allYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      )}
      {/* Semester */}
      {allSems.length > 0 && (
        <select
          value={filterSem}
          onChange={e => setFilterSem(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-700 font-medium"
        >
          <option value="all">All Semesters</option>
          {allSems.map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      )}
      {/* Session */}
      {allSessions.length > 0 && (
        <select
          value={filterSession}
          onChange={e => setFilterSession(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-700 font-medium"
        >
          <option value="all">All Sessions</option>
          {allSessions.map(s => <option key={s} value={s}>{sessionLabel(s)}</option>)}
        </select>
      )}
      {/* Clear */}
      {(filterYear !== "all" || filterSem !== "all" || filterSession !== "all") && (
        <button
          onClick={() => { setFilterYear("all"); setFilterSem("all"); setFilterSession("all"); }}
          className="text-xs text-red-400 hover:text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition"
        >
          ✕ Clear
        </button>
      )}
      {/* Active filter pills */}
      {filterYear    !== "all" && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{filterYear}</span>}
      {filterSem     !== "all" && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">Sem {filterSem}</span>}
      {filterSession !== "all" && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{sessionLabel(filterSession)}</span>}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      {/* Section heading + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <p className="text-base font-bold text-slate-800">Department Analytics</p>
        {FilterBar}
      </div>

      {noData ? (
        <div className="py-12 text-center text-slate-400 text-sm">No data for selected filters</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-2">

          {/* ── Card 1: FFI Bar Chart ──────────────────────────────────── */}
          {ffiData.length > 0 && (
            <div>
              <p className="text-sm font-bold text-slate-700 mb-2">Department ranking by average FFI</p>
              {/* Legend */}
              <div className="flex items-center gap-4 mb-1 flex-wrap">
                {[["bg-green-600","4.00 and above (good)"],["bg-amber-400","3.00 to 3.99 (average)"],["bg-red-500","Below 3.00 (needs attention)"]].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className={`w-3 h-3 rounded-sm inline-block ${c}`} /> {l}
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={Math.max(280, ffiData.length * 56)}>
                <BarChart data={ffiData} layout="vertical" margin={{ top: 4, right: 52, left: 12, bottom: 20 }}>
                  <XAxis type="number" domain={[0, 5]} tickCount={6}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    label={{ value: "Average FFI (out of 5)", position: "insideBottom", offset: -10, fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis dataKey="dept" type="category" width={260} tick={<YAxisDeptTick />} />
                  <Tooltip content={<DeptFFITooltip />} cursor={{ fill: "#f1f5f9" }} />
                  <Bar dataKey="ffi" radius={[0, 5, 5, 0]} maxBarSize={22}>
                    {ffiData.map((d) => <Cell key={d.dept} fill={ffiColor(d.ffi)} />)}
                    <LabelList dataKey="ffi" position="right" formatter={v => v.toFixed(2)}
                      style={{ fontSize: 11, fontWeight: 700, fill: "#334155" }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Card 2: Response % Ranking ─────────────────────────────── */}
          {respData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-xs font-semibold text-slate-500">Department ranking by average response</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {[["#16a34a","80% and above"],["#f59e0b","60% to 79%"],["#ef4444","Below 60%"]].map(([c,l]) => (
                    <div key={l} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="w-3 h-3 rounded-sm inline-block" style={{ background: c }} /> {l}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2.5">
                {respData.map((d, i) => (
                  <div key={d.dept} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-5 shrink-0 text-right">{i + 1}</span>
                    <span className="text-xs text-slate-700 w-48 shrink-0" title={d.dept}>{d.dept}</span>
                    <div className="flex-1 relative h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="absolute top-0 bottom-0 w-px bg-slate-300"
                        style={{ left: `${Math.min((80 / 100) * 100, 100)}%` }} />
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(d.pct, 100)}%`, background: respColor(d.pct) }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-12 shrink-0 text-right">{d.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export default function VCDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [submissions, setSubmissions]   = useState([]);
  const [allHods, setAllHods]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch]             = useState("");
  const [activeTab, setActiveTab]       = useState("submissions");
  const [expandedSub, setExpandedSub]   = useState(null);

  // Modals
  const [rejectModal, setRejectModal]         = useState(null);
  const [rejectComment, setRejectComment]     = useState("");
  const [approveModal, setApproveModal]       = useState(null);
  const [approveComment, setApproveComment]   = useState("");
  const [actionModal, setActionModal]         = useState(null);
  const [actionComment, setActionComment]     = useState("");
  const [actionSaving, setActionSaving]       = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pendingApproveId, setPendingApproveId]     = useState(null);

  // Analysis sub-tab (unused — intelligence tab removed)

  // Pro-VC comment panel state (for analytics view)
  const [provcPanel, setProvcPanel]       = useState(null); // { sub, facultyName, subjectCode, ffi, existingComment }
  const [provcLocalComments, setProvcLocalComments] = useState({}); // { [subId]: [{ facultyName, subjectCode, comment }] }

  // Pro-VC report history state
  const [provcReports, setProvcReports]       = useState({}); // { [subId]: ProVCReport[] }
  const [reportsLoading, setReportsLoading]   = useState({}); // { [subId]: bool }
  const [genLoading, setGenLoading]           = useState({}); // { [subId]: bool }
  const [genFacultyModal, setGenFacultyModal] = useState(null); // submissionId or null
  const [genFacultyName, setGenFacultyName]   = useState('');
  const [deptCommentModal, setDeptCommentModal] = useState(null); // submissionId or null
  const [deptCommentText, setDeptCommentText]   = useState('');

  function getProvcLocalComment(subId, facultyName, subjectCode) {
    const arr = provcLocalComments[subId] || [];
    return arr.find(c => c.facultyName === facultyName && c.subjectCode === subjectCode)?.comment || "";
  }

  function handleProvcCommentSaved(subId, facultyName, subjectCode, comment) {
    setProvcLocalComments(prev => {
      const arr = [...(prev[subId] || [])];
      const idx = arr.findIndex(c => c.facultyName === facultyName && c.subjectCode === subjectCode);
      if (idx >= 0) arr[idx] = { ...arr[idx], comment };
      else arr.push({ facultyName, subjectCode, comment });
      return { ...prev, [subId]: arr };
    });
  }

  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => { fetchSubmissions(); fetchAllHods(); }, []);

  async function fetchSubmissions() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/submissions/all");
      setSubmissions(data);
    } catch (err) {
      if (err.response?.status === 401) { logout(); return; }
      toast.error("Failed to load submissions");
    } finally { setLoading(false); }
  }

  async function fetchAllHods() {
    try {
      const { data } = await api.get("/api/admin/users");
      setAllHods((data||[]).filter(u => u.role==="hod"||(u.roles||[]).includes("hod")));
    } catch {
      try {
        const { data: subs } = await api.get("/api/submissions/all");
        const m = {};
        (subs||[]).forEach(s => { const h=s.hodId; if(h&&h._id&&!m[h._id]) m[h._id]=h; });
        setAllHods(Object.values(m));
      } catch {}
    }
  }

  async function fetchProvcReports(subId) {
    setReportsLoading(prev => ({ ...prev, [subId]: true }));
    try {
      const { data } = await api.get(`/api/provc-reports/submission/${subId}`);
      setProvcReports(prev => ({ ...prev, [subId]: data }));
    } catch {}
    finally { setReportsLoading(prev => ({ ...prev, [subId]: false })); }
  }

  async function handleApproveConfirm() {
    if (!approveModal) return;
    if (!user?.signatureImage) return toast.error("❌ Please upload your signature before approving", { duration:5000, icon:"✋" });
    try {
      await api.patch(`/api/submissions/${approveModal}/status`, { status:"approved", vcComment:approveComment||"" });
      toast.success("Submission Approved ✓");
      setApproveModal(null); setApproveComment("");
      fetchSubmissions();
    } catch (err) {
      if (err.response?.data?.needSignature) { setPendingApproveId(approveModal); setApproveModal(null); setShowSignatureModal(true); }
      else toast.error(err.response?.data?.error || "Failed to approve");
    }
  }

  const handleSignatureSaved = () => {
    setShowSignatureModal(false);
    if (pendingApproveId) { setApproveModal(pendingApproveId); setApproveComment(""); setPendingApproveId(null); toast.success("Signature saved! Confirm approval."); }
  };

  async function handleRejectConfirm() {
    if (!rejectModal) return;
    try {
      await api.patch(`/api/submissions/${rejectModal}/status`, { status:"rejected", vcComment:rejectComment });
      toast.success("Submission rejected");
      setRejectModal(null); setRejectComment(""); fetchSubmissions();
    } catch { toast.error("Failed to reject"); }
  }

  async function handleActionTakenSave() {
    if (!actionModal) return;
    if (!actionComment.trim()) return toast.error("Please enter an action comment");
    setActionSaving(true);
    try {
      await api.patch(`/api/submissions/${actionModal._id}/action-taken`, { actionTaken: autoNumber(actionComment) });
      toast.success("Action taken saved ✓");
      setActionModal(null); setActionComment(""); fetchSubmissions();
    } catch { toast.error("Failed to save action"); }
    finally { setActionSaving(false); }
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const filtered = submissions.filter(sub => {
    const ms = !search || (sub.hodId?.name||"").toLowerCase().includes(search.toLowerCase()) || (sub.hodId?.department||"").toLowerCase().includes(search.toLowerCase());
    const mf = !filterStatus || sub.status===filterStatus;
    return ms && mf;
  });

  const totalReports  = submissions.reduce((s,sub)=>s+(sub.reports?.length||0),0);
  const allFFIs       = submissions.flatMap(sub=>(sub.reports||[]).map(r=>r.ffiScore).filter(Boolean));
  const avgFFI        = allFFIs.length ? (allFFIs.reduce((s,v)=>s+v,0)/allFFIs.length).toFixed(2) : "—";
  const pendingCount  = submissions.filter(s=>["submitted","conflict","escalated"].includes(s.status)).length;
  const approvedCount = submissions.filter(s=>s.status==="approved").length;

  const hodStatusMap = {};
  submissions.forEach(sub => {
    const id = sub.hodId?._id||sub.hodId;
    if (!id) return;
    if (!hodStatusMap[id] || new Date(sub.createdAt)>new Date(hodStatusMap[id].createdAt)) hodStatusMap[id]=sub;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col text-slate-800">
      <Navbar title="Pro-VC Dashboard" subtitle="MITS Gwalior" />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Pro-VC Comment Panel (global, renders over everything) ── */}
        {provcPanel && (
          <ProVCCommentPanel
            facultyName={provcPanel.facultyName}
            subjectCode={provcPanel.subjectCode}
            ffi={provcPanel.ffi}
            submissionId={provcPanel.subId}
            existingComment={provcPanel.existingComment}
            token={token}
            onClose={() => setProvcPanel(null)}
            onSaved={(comment) => {
              handleProvcCommentSaved(provcPanel.subId, provcPanel.facultyName, provcPanel.subjectCode, comment);
              setProvcPanel(null);
            }}
          />
        )}

        {/* ── Page Header ── */}
        {/* ── Welcome Banner ── */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-md"
          style={{ background: "linear-gradient(135deg, #1a2f5e 0%, #1e3f7a 60%, #162550 100%)", minHeight: "180px" }}
        >
          {/* MITS campus photo — right side, clipped with a diagonal mask */}
          <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none select-none overflow-hidden"
            style={{ clipPath: "polygon(18% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
          >
            <img
              src={mitsCampusImg}
              alt="MITS Campus"
              className="w-full h-full object-cover object-center"
              style={{ opacity: 0.72 }}
            />
            {/* subtle dark overlay on left edge so text stays readable */}
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to right, #1a2f5e 0%, transparent 35%)" }}
            />
          </div>
          {/* Content */}
          <div className="relative z-10 px-8 py-8">
            <p className="text-blue-300 text-xs font-medium tracking-wide">Pro-Vice-Chancellor Portal</p>
            <h2 className="text-white text-3xl font-bold mt-2">Welcome, {user?.name || "Pro-VC"}</h2>
            <p className="text-blue-300 text-sm mt-1.5">MITS Gwalior - Madhav Institute of Technology &amp; Science</p>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Submissions", value: submissions.length, icon: FileText,      iconBg: "bg-blue-50",   iconColor: "text-blue-600"   },
            { label: "Total Reports",     value: totalReports,       icon: Users,         iconBg: "bg-green-50",  iconColor: "text-green-600"  },
            { label: "Avg FFI Score",     value: avgFFI,             icon: TrendingUp,    iconBg: "bg-orange-50", iconColor: "text-orange-500" },
            { label: "Pending Review",    value: pendingCount,       icon: AlertTriangle, iconBg: "bg-red-50",    iconColor: "text-red-500"    },
          ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`rounded-xl flex items-center justify-center shrink-0 ${iconBg}`} style={{ width: 52, height: 52 }}>
                <Icon size={24} className={iconColor} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 leading-tight">{value}</p>
                <p className="text-slate-500 text-sm mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Department Analytics Charts ── */}
        <DeptChartsSection submissions={submissions} />

        {/* ── Tab Bar ── */}
        <div className="border-b border-slate-200">
          <div className="flex gap-0">
            {[
              { id: "submissions", label: "📋 Submissions" },
              { id: "hod_status",  label: "👥 HOD Status"  },
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
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                      {["HOD / Department", "Academic Year", "Reports", "Avg FFI Score", "Avg Response", "Submission Date", "Status", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(sub => {
                      const ffis           = (sub.reports || []).map(r => r.ffiScore).filter(Boolean);
                      const avg            = ffis.length ? (ffis.reduce((s, v) => s + v, 0) / ffis.length).toFixed(2) : "—";
                      const avgN           = parseFloat(avg);
                      const sc             = STATUS_CFG[sub.status] || STATUS_CFG.submitted;
                      const hodName        = sub.hodId?.name || "—";
                      const initials       = hodName.split(" ").map(w => w[0] || "").join("").toUpperCase().slice(0, 2) || "H";
                      const isExpanded     = expandedSub === sub._id;
                      const attentionTotal = (sub.reports || []).reduce((s, r) => s + (r.attentionCount || 0), 0);
                      const submittedDate  = sub.createdAt
                        ? new Date(sub.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : "—";

                      return (
                        <React.Fragment key={sub._id}>
                          <tr className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
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

                            {/* Avg FFI Score */}
                            <td className="px-4 py-4">
                              {avg !== "—" ? (
                                <span className={`text-sm font-bold ${avgN >= 4 ? "text-teal-600" : avgN >= 3 ? "text-orange-500" : "text-rose-600"}`}>
                                  {avg}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>

                            {/* Avg Response */}
                            <td className="px-4 py-4">
                              {(() => {
                                // Simple average of per-report responsePercent
                                const pcts = (sub.reports || []).flatMap(r => {
                                  if (r.responsePercent != null) return [Number(r.responsePercent)];
                                  if (r.responseCount != null) {
                                    const base = r.linkSent ?? r.registeredStudents;
                                    if (base && Number(base) > 0)
                                      return [(Number(r.responseCount) / Number(base)) * 100];
                                  }
                                  return [];
                                });
                                if (!pcts.length) return <span className="text-slate-300 text-sm">—</span>;
                                const avgResp = (pcts.reduce((s, v) => s + v, 0) / pcts.length).toFixed(1);
                                const color = avgResp >= 80 ? "text-teal-600" : avgResp >= 60 ? "text-orange-500" : "text-rose-600";
                                return <span className={`text-sm font-bold ${color}`}>{avgResp}%</span>;
                              })()}
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
                                  onClick={() => {
                                    const expanding = isExpanded ? null : sub._id;
                                    setExpandedSub(expanding);
                                    if (expanding) fetchProvcReports(expanding);
                                  }}
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

                                {/* Summary — generate MITS Department Summary PDF */}
                                <button
                                  onClick={async () => {
                                    try {
                                      toast.loading('Generating summary PDF…', { id: 'summary' });
                                      const response = await api.get(`/api/department-summary/${sub._id}`, {
                                        responseType: 'blob',
                                      });
                                      toast.success('Summary PDF generated', { id: 'summary' });
                                      const blob = new Blob([response.data], { type: 'application/pdf' });
                                      const url = window.URL.createObjectURL(blob);
                                      window.open(url, '_blank');
                                    } catch (err) {
                                      let msg = 'Failed to generate summary';
                                      if (err.response?.data instanceof Blob) {
                                        try {
                                          const text = await err.response.data.text();
                                          msg = JSON.parse(text).error || msg;
                                        } catch {}
                                      } else {
                                        msg = err.response?.data?.error || msg;
                                      }
                                      toast.error(msg, { id: 'summary' });
                                    }
                                  }}
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
                            <tr>
                              <td colSpan={8} className="p-0">
                                <InlineAnalysis
                                  sub={{
                                    ...sub,
                                    _provcCommentsLocal: [
                                      ...(sub.provcComments || []),
                                      ...(provcLocalComments[sub._id] || [])
                                        .filter(lc => !(sub.provcComments||[]).some(
                                          dc => dc.facultyName === lc.facultyName && dc.subjectCode === lc.subjectCode
                                        ))
                                    ].map(c => {
                                      const local = (provcLocalComments[sub._id]||[]).find(
                                        lc => lc.facultyName === c.facultyName && lc.subjectCode === c.subjectCode
                                      );
                                      return local ? { ...c, comment: local.comment } : c;
                                    }),
                                  }}
                                  onNavigate={(id, reportId) => navigate(`/vc/submission/${id}${reportId ? `?report=${reportId}` : ""}`)}
                                  onOpenComment={(info) => setProvcPanel({
                                    subId: sub._id,
                                    facultyName: info.facultyName,
                                    subjectCode: info.subjectCode,
                                    ffi: info.ffi,
                                    existingComment: getProvcLocalComment(sub._id, info.facultyName, info.subjectCode) || info.existingComment,
                                  })}
                                />
                                {/* Pro-VC Report History */}
                                <div className="bg-slate-50 border-t border-slate-100 px-5 py-4">
                                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Pro-VC Report History</p>
                                    {reportsLoading[sub._id] ? (
                                      <p className="text-xs text-slate-400">Loading…</p>
                                    ) : (provcReports[sub._id] || []).length === 0 ? (
                                      <p className="text-xs text-slate-400 italic">No reports saved yet — use the Faculty Report or Save Dept Report buttons above to generate and save.</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {(provcReports[sub._id] || []).map(r => (
                                          <div key={r._id} className="flex items-center justify-between gap-2 text-xs">
                                            <div>
                                              <span className={`inline-block px-2 py-0.5 rounded-full font-semibold mr-2 ${r.reportType === 'faculty-wise' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {r.reportType === 'faculty-wise' ? 'Pro-VC Comments Report' : 'Overall Pro-VC Report'}
                                              </span>
                                              {r.facultyName && <span className="text-slate-600">{r.facultyName} · </span>}
                                              <span className="text-slate-400">{new Date(r.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                            <button
                                              onClick={async () => {
                                                try {
                                                  const res = await api.get(`/api/provc-reports/${r._id}/download`, { responseType: 'blob' });
                                                  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                                                  window.open(url, '_blank');
                                                } catch { toast.error('Failed to download report'); }
                                              }}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-700 text-white rounded-lg"
                                            >
                                              <FileDown size={11} /> Download
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            HOD STATUS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "hod_status" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h2 className="font-bold text-slate-800 text-base">HOD Submission Status</h2>
              <p className="text-xs text-slate-400 mt-0.5">All registered HODs — submitted, pending, and outstanding</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    {["#","HOD Name","Department","Status","Reports","Submitted","Avg FFI","Action"].map(h=>(
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allHods.map((hod, idx) => {
                    const hodSubs = submissions.filter(s=>(s.hodId?._id||s.hodId)?.toString()===hod._id?.toString()).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
                    const latest = hodSubs[0];
                    const status = latest?.status;
                    const ffis   = (latest?.reports||[]).map(r=>r.ffiScore).filter(Boolean);
                    const avg    = ffis.length?(ffis.reduce((s,v)=>s+v,0)/ffis.length).toFixed(2):"—";
                    let badge;
                    if (!latest)                                                badge = <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200"><span className="w-1.5 h-1.5 rounded-full bg-red-400"/>Not Submitted</span>;
                    else if (status==="approved")                               badge = <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200"><span className="w-1.5 h-1.5 rounded-full bg-teal-500"/>Approved</span>;
                    else if (["submitted","conflict","escalated"].includes(status)) badge = <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"/>Pending Review</span>;
                    else if (status==="rejected")                               badge = <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200"><span className="w-1.5 h-1.5 rounded-full bg-rose-400"/>Rejected</span>;
                    else badge = <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"/>{status}</span>;
                    return (
                      <tr key={hod._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4 text-slate-400 text-xs">{idx+1}</td>
                        <td className="px-5 py-4"><p className="font-semibold text-slate-800 text-sm">{hod.name}</p><p className="text-xs text-slate-400">{hod.email}</p></td>
                        <td className="px-5 py-4 text-xs text-slate-600">{hod.department||"—"}</td>
                        <td className="px-5 py-4">{badge}</td>
                        <td className="px-5 py-4 text-center">{latest?<span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">{latest.reports?.length||0}</span>:<span className="text-slate-300">—</span>}</td>
                        <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{latest?.createdAt?new Date(latest.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}</td>
                        <td className="px-5 py-4 text-center">{avg!=="—"?<span className={`text-sm font-bold ${parseFloat(avg)>=4?"text-teal-600":parseFloat(avg)>=3?"text-amber-600":"text-rose-600"}`}>{avg}</span>:<span className="text-slate-300">—</span>}</td>
                        <td className="px-5 py-4">{latest?<button onClick={()=>navigate(`/vc/submission/${latest._id}`)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"><Eye size={11}/> View</button>:<span className="text-slate-300 text-xs">No submission</span>}</td>
                      </tr>
                    );
                  })}
                  {allHods.length===0&&<tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-sm">No HODs registered yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Intelligence tab removed */}
        {false && (
          <div className="space-y-5">

            {analyticsLoading ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"/>
                <p className="text-slate-400 text-sm">Analysing feedback intelligence...</p>
              </div>
            ) : !analytics ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center">
                <p className="text-slate-400">No analytics data available</p>
                <button onClick={fetchAnalytics} className="mt-4 px-5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl">Retry</button>
              </div>
            ) : (
              <>
                {/* Sub-tab nav */}
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
                  {[
                    { id:"summary",   label:"📌 Executive Summary" },
                    { id:"faculty",   label:"👤 Faculty Intelligence" },
                    { id:"issues",    label:"⚠️ Need Attention" },
                    { id:"dept",      label:"🏢 Department View" },
                  ].map(t => (
                    <button key={t.id} onClick={()=>setAnalysisTab(t.id)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${analysisTab===t.id?"bg-white shadow text-slate-800":"text-slate-500 hover:text-slate-700"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* ── EXECUTIVE SUMMARY ── */}
                {analysisTab === "summary" && (
                  <div className="space-y-5">
                    {/* KPI grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[
                        { label:"Faculty Evaluated",  value:analytics.summary.totalFaculty,      icon:Users,       color:"#1e3a5f" },
                        { label:"Total Reports",       value:analytics.summary.totalReports,       icon:FileText,    color:"#0f766e" },
                        { label:"Overall Avg FFI",     value:analytics.summary.overallAvgFFI,      icon:TrendingUp,  color:"#92400e" },
                        { label:"Departments",         value:analytics.summary.totalDepts,         icon:Shield,      color:"#7c3aed" },
                        { label:"Faculty Critical",    value:analytics.summary.criticalCount,      icon:AlertTriangle,color:"#9f1239" },
                        { label:"Need Monitoring",     value:analytics.summary.monitorCount,       icon:Activity,    color:"#b45309" },
                      ].map(({ label, value, icon:Icon, color }) => (
                        <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{background:`${color}18`}}>
                            <Icon size={16} style={{color}}/>
                          </div>
                          <p className="text-xl font-black text-slate-800">{value}</p>
                          <p className="text-slate-400 text-[11px] font-medium mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Executive Summary Points */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center gap-2">
                        <Lightbulb size={16} className="text-amber-300"/>
                        <h2 className="font-bold text-white text-sm">AI Executive Summary</h2>
                        <span className="ml-auto text-[10px] text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">Based on {analytics.summary.totalReports} reports</span>
                      </div>
                      <div className="p-6 space-y-3">
                        {analytics.executiveSummary.map((point, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div>
                            <p className="text-sm text-slate-700 leading-relaxed">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FFI Distribution bar chart */}
                    {analytics.deptHeatmap.length > 0 && (
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h2 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><BarChart2 size={14}/> Department FFI Overview</h2>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={analytics.deptHeatmap.map(d=>({ name: d.dept.length>15?d.dept.substring(0,15)+"…":d.dept, FFI:d.avgFFI||0, fullDept:d.dept }))} margin={{top:0,right:0,left:-25,bottom:40}}>
                            <XAxis dataKey="name" tick={{fontSize:10}} angle={-25} textAnchor="end" interval={0}/>
                            <YAxis domain={[0,5]} tick={{fontSize:10}}/>
                            <Tooltip formatter={(v,_,p)=>[v,p.payload.fullDept]}/>
                            <Bar dataKey="FFI" radius={[5,5,0,0]}>
                              {analytics.deptHeatmap.map((d,i)=>(
                                <Cell key={i} fill={d.avgFFI>=4?"#10b981":d.avgFFI>=3.5?"#6366f1":d.avgFFI>=3?"#f59e0b":"#ef4444"}/>
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Top issues summary */}
                    {analytics.issueBreakdown.length > 0 && (
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h2 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><Target size={14}/> Top Recurring Student Concerns</h2>
                        <div className="space-y-3">
                          {analytics.issueBreakdown.slice(0,6).map((issue, i) => {
                            const pct = analytics.issueBreakdown[0]?.count ? Math.round((issue.count/analytics.issueBreakdown[0].count)*100) : 0;
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-600 w-36 shrink-0">{issue.category}</span>
                                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                  <div className="h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all" style={{width:`${pct}%`}}/>
                                </div>
                                <span className="text-xs font-bold text-slate-600 w-8">{issue.count}</span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{issue.facultiesAffected} faculty</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── FACULTY INTELLIGENCE ── */}
                {analysisTab === "faculty" && (
                  <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 items-center bg-white rounded-2xl border border-slate-100 px-5 py-3 shadow-sm">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input type="text" placeholder="Search faculty or department..."
                          className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          value={facultyFilter} onChange={e=>setFacultyFilter(e.target.value)}/>
                      </div>
                      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                        {[{id:"all",label:"All"},{id:"critical",label:"Critical"},{id:"monitor",label:"Monitor"},{id:"good",label:"Good"},{id:"excellent",label:"Excellent"}].map(s=>(
                          <button key={s.id} onClick={()=>setStatusFilter(s.id)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${statusFilter===s.id?"bg-white shadow text-slate-800":"text-slate-500 hover:text-slate-700"}`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">{filteredFacultyCards.length} faculty</span>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 text-xs font-semibold">
                      {[["critical","bg-red-100 text-red-700","Critical (FFI < 3.0) — Immediate attention required"],["monitor","bg-amber-100 text-amber-700","Monitor (FFI 3.0–3.5) — HOD follow-up needed"],["good","bg-emerald-100 text-emerald-700","Good (FFI 3.5–4.0)"],["excellent","bg-indigo-100 text-indigo-700","Excellent (FFI ≥ 4.0)"]].map(([s,c,l])=>(
                        <span key={s} className={`px-3 py-1 rounded-full border ${c} border-current`}>{l}</span>
                      ))}
                    </div>

                    {/* Cards grid */}
                    {filteredFacultyCards.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                        <p className="text-slate-400">No faculty match your filters</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredFacultyCards.map((f, i) => <FacultyCard key={i} f={f}/>)}
                      </div>
                    )}
                  </div>
                )}

                {/* ── NEED ATTENTION BREAKDOWN ── */}
                {analysisTab === "issues" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Issue breakdown table */}
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                          <h2 className="font-bold text-slate-800 text-sm">Issue Category Breakdown</h2>
                          <p className="text-xs text-slate-400 mt-0.5">University-wide — all faculty</p>
                        </div>
                        <div className="p-5 space-y-3">
                          {analytics.issueBreakdown.map((issue, i) => {
                            const max = analytics.issueBreakdown[0]?.count||1;
                            const pct = Math.round((issue.count/max)*100);
                            return (
                              <div key={i}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold text-slate-700">{issue.category}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400">{issue.facultiesAffected} faculty</span>
                                    <span className="text-xs font-bold text-rose-600">{issue.count}</span>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                  <div className="h-2 rounded-full bg-gradient-to-r from-rose-400 to-amber-400" style={{width:`${pct}%`}}/>
                                </div>
                                {/* Sample comment */}
                                {issue.examples[0] && (
                                  <p className="text-[10px] text-slate-400 mt-1 pl-1 italic line-clamp-1">"{issue.examples[0]}"</p>
                                )}
                              </div>
                            );
                          })}
                          {analytics.issueBreakdown.length===0 && <p className="text-slate-400 text-sm text-center py-6">No issues detected across all reports.</p>}
                        </div>
                      </div>

                      {/* Faculty with most concerns */}
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                          <h2 className="font-bold text-slate-800 text-sm">Faculty Requiring Attention</h2>
                          <p className="text-xs text-slate-400 mt-0.5">Sorted by concern count — highest first</p>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {analytics.facultyCards.filter(f=>f.totalAttention>0).slice(0,10).map((f, i) => (
                            <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                              <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${f.status==="critical"?"bg-red-100 text-red-700":f.status==="monitor"?"bg-amber-100 text-amber-700":"bg-slate-100 text-slate-600"}`}>{i+1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{f.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{f.dept}</p>
                                {f.topIssues[0] && (
                                  <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Top: {f.topIssues[0].cat}</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-sm font-black ${!f.avgFFI?"text-slate-400":f.avgFFI>=4?"text-teal-600":f.avgFFI>=3?"text-amber-600":"text-red-600"}`}>{f.avgFFI??'—'}</p>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${f.status==="critical"?"bg-red-100 text-red-700":f.status==="monitor"?"bg-amber-100 text-amber-700":"bg-slate-100 text-slate-500"}`}>
                                  {f.totalAttention} issues
                                </span>
                              </div>
                            </div>
                          ))}
                          {analytics.facultyCards.filter(f=>f.totalAttention>0).length===0 && (
                            <div className="p-10 text-center text-slate-400 text-sm">No faculty have reported concerns — excellent performance!</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed attention comments per faculty */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                        <h2 className="font-bold text-slate-800 text-sm">Student Comments Needing Action</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Anonymised — top 5 comments per faculty</p>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {analytics.facultyCards.filter(f=>f.topAttentionComments.length>0).slice(0,8).map((f,i)=>(
                          <div key={i} className="px-6 py-4">
                            <div className="flex items-center gap-3 mb-3">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${f.status==="critical"?"bg-red-500":f.status==="monitor"?"bg-amber-400":"bg-emerald-400"}`}/>
                              <p className="text-xs font-bold text-slate-800">{f.name}</p>
                              <span className="text-[10px] text-slate-400">{f.dept}</span>
                              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${f.avgFFI>=4?"bg-emerald-100 text-emerald-700":f.avgFFI>=3?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}>FFI {f.avgFFI??'—'}</span>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {f.topAttentionComments.map((c,j)=>(
                                <div key={j} className="flex items-start gap-2 text-xs text-slate-700 bg-amber-50/60 border border-amber-100 rounded-lg p-2.5">
                                  <span className="text-amber-500 font-bold mt-0.5 shrink-0">•</span>
                                  <span className="leading-snug">{c}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── DEPARTMENT VIEW ── */}
                {analysisTab === "dept" && (
                  <div className="space-y-5">
                    {/* Department cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analytics.deptHeatmap.map((d, i) => {
                        const statusColor = d.status==="excellent"?"border-indigo-300 bg-indigo-50/40":d.status==="good"?"border-emerald-300 bg-emerald-50/40":d.status==="monitor"?"border-amber-300 bg-amber-50/40":"border-red-300 bg-red-50/40";
                        const ffiColor = !d.avgFFI?"text-slate-400":d.avgFFI>=4?"text-emerald-600":d.avgFFI>=3?"text-amber-600":"text-red-600";
                        return (
                          <div key={i} className={`rounded-2xl border-2 ${statusColor} p-4`}>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div>
                                <p className="font-bold text-slate-800 text-sm leading-tight">{d.dept}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{d.totalFaculty} faculty · {d.totalReports} reports</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-2xl font-black ${ffiColor}`}>{d.avgFFI??'—'}</p>
                                <p className="text-[10px] text-slate-400">FFI</p>
                              </div>
                            </div>
                            {/* FFI bar */}
                            <div className="w-full bg-white/60 rounded-full h-2 mb-3">
                              <div className="h-2 rounded-full transition-all" style={{width:d.avgFFI?`${Math.min((d.avgFFI/5)*100,100)}%`:"0%",background:STATUS_COLOR[d.status]||"#94a3b8"}}/>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-center mb-3">
                              <div className="bg-white/60 rounded-lg p-2">
                                <p className="text-sm font-bold text-emerald-600">{d.appreciation}</p>
                                <p className="text-[10px] text-slate-400">Praise</p>
                              </div>
                              <div className="bg-white/60 rounded-lg p-2">
                                <p className="text-sm font-bold text-amber-600">{d.attention}</p>
                                <p className="text-[10px] text-slate-400">Issues</p>
                              </div>
                            </div>
                            {d.topIssue && (
                              <div className="bg-white/60 rounded-lg px-3 py-2">
                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Top Concern</p>
                                <p className="text-xs font-bold text-slate-700 mt-0.5">{d.topIssue}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Department comparison table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                        <h2 className="font-bold text-slate-800 text-sm">Department Comparison</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50/40 border-b border-slate-100">
                            <tr>
                              {["Department","Faculty","Reports","Avg FFI","Praise","Issues","Top Concern","Status"].map(h=>(
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {analytics.deptHeatmap.map((d,i)=>{
                              const fc = !d.avgFFI?"text-slate-400":d.avgFFI>=4?"text-emerald-600":d.avgFFI>=3?"text-amber-600":"text-red-600";
                              const sc = d.status==="critical"?"bg-red-100 text-red-700":d.status==="monitor"?"bg-amber-100 text-amber-700":d.status==="excellent"?"bg-indigo-100 text-indigo-700":"bg-emerald-100 text-emerald-700";
                              return (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 font-semibold text-slate-800 text-xs max-w-[160px] truncate">{d.dept}</td>
                                  <td className="px-4 py-3 text-slate-600 text-xs">{d.totalFaculty}</td>
                                  <td className="px-4 py-3 text-slate-600 text-xs">{d.totalReports}</td>
                                  <td className={`px-4 py-3 font-bold text-sm ${fc}`}>{d.avgFFI??'—'}</td>
                                  <td className="px-4 py-3 text-emerald-600 font-semibold text-xs">{d.appreciation}</td>
                                  <td className="px-4 py-3 text-amber-600 font-semibold text-xs">{d.attention}</td>
                                  <td className="px-4 py-3 text-xs text-slate-500">{d.topIssue||'—'}</td>
                                  <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc} uppercase`}>{d.status}</span></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </main>
      <Footer />

      {/* ── Signature Modal ── */}
      {showSignatureModal && <SignatureUpload token={token} onSaved={handleSignatureSaved} onSkip={()=>setShowSignatureModal(false)}/>}

      {/* ── Approve Modal ── */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100"><BadgeCheck size={20} className="text-teal-600"/></div>
              <div><h2 className="text-base font-bold text-slate-800">Approve Submission</h2><p className="text-xs text-slate-400">Optional comment before approving</p></div>
            </div>
            <textarea rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-200" placeholder="Optional comment..." value={approveComment} onChange={e=>setApproveComment(e.target.value)}/>
            <div className="flex gap-3 justify-end">
              <button onClick={()=>setApproveModal(null)} className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleApproveConfirm} className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors flex items-center gap-2"><BadgeCheck size={14}/> Confirm Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Taken Modal ── */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100"><ClipboardList size={20} className="text-indigo-600"/></div>
              <div><h2 className="text-base font-bold text-slate-800">Action Taken</h2><p className="text-xs text-slate-400">{actionModal.hodId?.name||"HOD"} · {actionModal.hodId?.department||actionModal.department||""}</p></div>
            </div>
            <textarea rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Enter each point on a new line — auto-numbered on save..." value={actionComment} onChange={e=>setActionComment(e.target.value)}/>
            <div className="flex gap-3 justify-end">
              <button onClick={()=>{setActionModal(null);setActionComment("");}} className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
              <button onClick={handleActionTakenSave} disabled={actionSaving} className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 disabled:opacity-60"><ClipboardList size={14}/> {actionSaving?"Saving...":"Save Action"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100"><XCircle size={20} className="text-rose-500"/></div>
              <div><h2 className="text-base font-bold text-slate-800">Reject Submission</h2><p className="text-xs text-slate-400">Provide a reason (optional)</p></div>
            </div>
            <textarea rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-200" placeholder="Rejection reason..." value={rejectComment} onChange={e=>setRejectComment(e.target.value)}/>
            <div className="flex gap-3 justify-end">
              <button onClick={()=>setRejectModal(null)} className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
              <button onClick={handleRejectConfirm} className="px-5 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl flex items-center gap-2"><XCircle size={14}/> Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate Faculty Pro-VC Report Modal ── */}
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
                <option value="">— select faculty —</option>
                {faculties.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => { setGenFacultyModal(null); setGenFacultyName(''); }}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  disabled={!genFacultyName || genLoading[genFacultyModal]}
                  onClick={async () => {
                    setGenLoading(prev => ({ ...prev, [genFacultyModal]: true }));
                    try {
                      await api.post('/api/provc-reports/generate-faculty', {
                        submissionId: genFacultyModal,
                        facultyName: genFacultyName,
                      });
                      toast.success('Faculty Pro-VC Report saved ✓');
                      fetchProvcReports(genFacultyModal);
                      if (expandedSub !== genFacultyModal) setExpandedSub(genFacultyModal);
                      setGenFacultyModal(null);
                      setGenFacultyName('');
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

      {/* ── Generate Department Pro-VC Report Modal ── */}
      {deptCommentModal && (
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 mb-1">Generate Overall Pro-VC Report</h3>
            <p className="text-xs text-slate-500 mb-3">Review or update the overall department comments:</p>
            <textarea
              className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-teal-300 mb-4"
              placeholder="Enter overall observations, recommendations, and action details…"
              value={deptCommentText}
              onChange={e => setDeptCommentText(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setDeptCommentModal(null)}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={genLoading[deptCommentModal]}
                onClick={async () => {
                  setGenLoading(prev => ({ ...prev, [deptCommentModal]: true }));
                  try {
                    await api.post('/api/provc-reports/generate-department', {
                      submissionId: deptCommentModal,
                      overallComments: deptCommentText,
                    });
                    toast.success('Overall Pro-VC Report saved ✓');
                    fetchProvcReports(deptCommentModal);
                    if (expandedSub !== deptCommentModal) setExpandedSub(deptCommentModal);
                    fetchSubmissions();
                    setDeptCommentModal(null);
                  } catch (err) {
                    toast.error(err.response?.data?.error || 'Generation failed');
                  } finally {
                    setGenLoading(prev => ({ ...prev, [deptCommentModal]: false }));
                  }
                }}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl"
              >
                {genLoading[deptCommentModal] ? 'Generating…' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
