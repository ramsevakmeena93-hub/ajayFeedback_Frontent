import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SignatureUpload from '../components/SignatureUpload';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  CheckCircle, XCircle, Eye, TrendingUp, Users, FileText,
  AlertTriangle, Search, ClipboardList, BadgeCheck, ChevronDown,
  ChevronUp, Lightbulb, Activity, Star, Target, BookOpen,
  TrendingDown, Zap, Shield, BarChart2,
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

// ── Inline submission analysis panel ──────────────────────────────────────
function InlineAnalysis({ sub }) {
  const allComments  = (sub.reports||[]).flatMap(r => r.commentsNeedingAttention||[]);
  const allPraise    = (sub.reports||[]).flatMap(r => r.appreciation||[]);
  const ffis         = (sub.reports||[]).map(r=>r.ffiScore).filter(Boolean);
  const avg          = ffis.length ? (ffis.reduce((s,v)=>s+v,0)/ffis.length).toFixed(2) : null;
  const chartData    = (sub.reports||[]).filter(r=>r.ffiScore).map(r=>({
    name: (r.facultyName||"").split(" ").slice(-1)[0],
    FFI: r.ffiScore,
    full: r.facultyName,
  }));

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
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">FFI by Faculty</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={chartData} margin={{top:0,right:0,left:-25,bottom:0}}>
              <XAxis dataKey="name" tick={{fontSize:10}}/>
              <YAxis domain={[0,5]} tick={{fontSize:10}}/>
              <Tooltip formatter={(v,_,p)=>[v,p.payload.full]}/>
              <Bar dataKey="FFI" radius={[4,4,0,0]}>
                {chartData.map((e,i)=>(
                  <Cell key={i} fill={e.FFI>=4?"#10b981":e.FFI>=3?"#f59e0b":"#ef4444"}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-faculty attention comments */}
      {(sub.reports||[]).filter(r=>(r.commentsNeedingAttention||[]).length>0).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Need Attention — by Faculty</p>
          <div className="space-y-2">
            {(sub.reports||[]).filter(r=>(r.commentsNeedingAttention||[]).length>0).map((r,i)=>(
              <div key={i} className="bg-white rounded-xl border border-amber-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-700">{r.facultyName||"—"}</p>
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                    {r.subjectCode} · FFI {r.ffiScore?.toFixed(2)||"—"}
                  </span>
                </div>
                <div className="space-y-1">
                  {(r.commentsNeedingAttention||[]).filter(c => c && c.trim().split(/\s+/).length >= 5).slice(0,3).map((c,j)=>(
                    <div key={j} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <span className="text-amber-500 font-bold mt-0.5 shrink-0">•</span>
                      <span>{c}</span>
                    </div>
                  ))}
                  {r.commentsNeedingAttention.length > 3 && (
                    <p className="text-[10px] text-slate-400 pl-4">+{r.commentsNeedingAttention.length-3} more</p>
                  )}
                </div>
              </div>
            ))}
          </div>
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
  const [analytics, setAnalytics]       = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
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

  // Analysis sub-tab
  const [analysisTab, setAnalysisTab] = useState("summary");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");

  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => { fetchSubmissions(); fetchAllHods(); }, []);
  useEffect(() => { if (activeTab === "analysis" && !analytics) fetchAnalytics(); }, [activeTab]);

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

  async function fetchAnalytics() {
    setAnalyticsLoading(true);
    try {
      const { data } = await api.get("/api/submissions/analytics");
      setAnalytics(data);
    } catch (err) {
      toast.error("Failed to load analytics");
    } finally { setAnalyticsLoading(false); }
  }

  async function handleApproveConfirm() {
    if (!approveModal) return;
    if (!user?.signatureImage) return toast.error("❌ Please upload your signature before approving", { duration:5000, icon:"✋" });
    try {
      await api.patch(`/api/submissions/${approveModal}/status`, { status:"approved", vcComment:approveComment||"" });
      toast.success("Submission Approved ✓");
      setApproveModal(null); setApproveComment("");
      fetchSubmissions(); fetchAnalytics();
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

  // Filtered faculty cards
  const filteredFacultyCards = (analytics?.facultyCards||[]).filter(f => {
    const matchName = !facultyFilter || f.name.toLowerCase().includes(facultyFilter.toLowerCase()) || f.dept.toLowerCase().includes(facultyFilter.toLowerCase());
    const matchStatus = statusFilter==="all" || f.status===statusFilter;
    return matchName && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col text-slate-800">
      <Navbar title="Pro-VC Dashboard" subtitle="MITS Gwalior" />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Banner ── */}
        <div className="rounded-2xl overflow-hidden shadow-md" style={{background:"linear-gradient(120deg,#1e3a5f 0%,#1e4d8c 60%,#1a3a6e 100%)"}}>
          <div className="px-8 py-6 flex flex-col gap-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-blue-200 text-sm font-medium">Pro-Vice-Chancellor Portal</p>
                <h1 className="text-white text-2xl font-bold mt-0.5">Welcome, {user?.name||"Pro-VC"}</h1>
                <p className="text-blue-300 text-xs mt-1">MITS Gwalior · Madhav Institute of Technology & Science</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                  <p className="text-white text-xl font-black">{approvedCount}</p>
                  <p className="text-blue-200 text-xs">Approved</p>
                </div>
                <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                  <p className="text-amber-300 text-xl font-black">{pendingCount}</p>
                  <p className="text-blue-200 text-xs">Pending</p>
                </div>
                {analytics && (
                  <>
                    <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                      <p className="text-red-300 text-xl font-black">{analytics.summary.criticalCount}</p>
                      <p className="text-blue-200 text-xs">Critical</p>
                    </div>
                    <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                      <p className="text-emerald-300 text-xl font-black">{analytics.summary.overallAvgFFI}</p>
                      <p className="text-blue-200 text-xs">Avg FFI</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* HOD status pills */}
            {allHods.length > 0 && (
              <div>
                <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-2">HOD Submission Status</p>
                <div className="flex flex-wrap gap-2">
                  {allHods.map(hod => {
                    const sub = hodStatusMap[hod._id?.toString()];
                    const isApproved = sub?.status==="approved";
                    const isPending  = sub&&["submitted","conflict","escalated"].includes(sub.status);
                    const isRejected = sub?.status==="rejected";
                    return (
                      <div key={hod._id} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium"
                        style={{
                          background: isApproved?"rgba(20,184,166,0.15)":isPending?"rgba(251,191,36,0.15)":isRejected?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.08)",
                          border: isApproved?"1px solid rgba(20,184,166,0.4)":isPending?"1px solid rgba(251,191,36,0.4)":isRejected?"1px solid rgba(239,68,68,0.4)":"1px solid rgba(255,255,255,0.15)",
                        }}>
                        <div className="w-2 h-2 rounded-full" style={{background:isApproved?"#14b8a6":isPending?"#fbbf24":isRejected?"#ef4444":"#94a3b8"}}/>
                        <div>
                          <p className="text-white font-semibold truncate max-w-[120px]">{hod.name}</p>
                          <p className="text-blue-300 text-[10px] truncate max-w-[120px]">{hod.department||"—"}</p>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{
                          background:isApproved?"rgba(20,184,166,0.3)":isPending?"rgba(251,191,36,0.3)":isRejected?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.1)",
                          color:isApproved?"#5eead4":isPending?"#fde68a":isRejected?"#fca5a5":"#94a3b8",
                        }}>
                          {isApproved?"✓ Approved":isPending?"⏳ Pending":isRejected?"✗ Rejected":"Not Sent"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="h-1" style={{background:"linear-gradient(90deg,#d4a017,#f0c040,#d4a017)"}}/>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:"Total Submissions", value:submissions.length, icon:FileText, accent:"#1e3a5f" },
            { label:"Total Reports",     value:totalReports,       icon:Users,    accent:"#0f766e" },
            { label:"Avg FFI Score",     value:avgFFI,             icon:TrendingUp,accent:"#92400e" },
            { label:"Pending Review",    value:pendingCount,       icon:AlertTriangle,accent:"#9f1239" },
          ].map(({ label, value, icon:Icon, accent }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:`${accent}18`}}>
                <Icon size={18} style={{color:accent}}/>
              </div>
              <p className="text-2xl font-black text-slate-800">{value}</p>
              <p className="text-slate-500 text-xs font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
          {[
            { id:"submissions", label:"📋 Submissions" },
            { id:"hod_status",  label:"👥 HOD Status" },
            { id:"analysis",    label:"🧠 Intelligence" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab===t.id?"bg-white shadow text-slate-800":"text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SUBMISSIONS TAB — with inline analysis expand
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "submissions" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
              <div>
                <h2 className="font-bold text-slate-800 text-base">HOD Submissions</h2>
                <p className="text-xs text-slate-400 mt-0.5">{filtered.length} record{filtered.length!==1?"s":""}</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input type="text" placeholder="Search HOD or dept..."
                    className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 w-48"
                    value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="">All Status</option>
                  <option value="submitted">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                {(search||filterStatus) && <button onClick={()=>{setSearch("");setFilterStatus("");}} className="text-xs text-red-400 hover:text-red-600 font-medium">Clear</button>}
              </div>
            </div>

            {loading ? (
              <div className="p-20 text-center">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"/>
                <p className="text-slate-400 text-sm">Loading submissions...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-20 text-center">
                <FileText size={28} className="text-slate-300 mx-auto mb-3"/>
                <p className="text-slate-500 font-semibold">{submissions.length===0?"No submissions yet":"No results found"}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filtered.map(sub => {
                  const ffis = (sub.reports||[]).map(r=>r.ffiScore).filter(Boolean);
                  const avg  = ffis.length ? (ffis.reduce((s,v)=>s+v,0)/ffis.length).toFixed(2) : "—";
                  const avgN = parseFloat(avg);
                  const sc   = STATUS_CFG[sub.status]||STATUS_CFG.submitted;
                  const hodName  = sub.hodId?.name||"—";
                  const initials = hodName.split(" ").map(w=>w[0]||"").join("").toUpperCase().slice(0,2)||"H";
                  const isPending  = ["submitted","conflict","escalated"].includes(sub.status);
                  const isApproved = sub.status==="approved";
                  const isExpanded = expandedSub===sub._id;
                  const attentionTotal = (sub.reports||[]).reduce((s,r)=>s+(r.attentionCount||0),0);

                  return (
                    <div key={sub._id}>
                      <div className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                        {/* HOD */}
                        <div className="flex items-center gap-3 min-w-[180px] flex-1">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{background:"linear-gradient(135deg,#1e3a5f,#2563eb)"}}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{hodName}</p>
                            <p className="text-xs text-slate-400">{sub.hodId?.department||sub.department||"—"}</p>
                          </div>
                        </div>

                        {/* Session */}
                        <div className="text-xs text-slate-500 whitespace-nowrap">
                          <p>{sub.session==="jan-may"?"Jan–Jun":sub.session==="jul-dec"?"Jul–Dec":sub.session||"—"}</p>
                          {sub.academicYear&&<p className="text-slate-400">{sub.academicYear}</p>}
                        </div>

                        {/* Reports count */}
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                          {sub.reports?.length||0}
                        </span>

                        {/* Avg FFI */}
                        {avg!=="—" ? (
                          <span className={`text-sm font-bold ${avgN>=4?"text-teal-600":avgN>=3?"text-amber-600":"text-rose-600"}`}>{avg}</span>
                        ) : <span className="text-slate-300 text-sm">—</span>}

                        {/* Attention count */}
                        {attentionTotal > 0 && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {attentionTotal} issues
                          </span>
                        )}

                        {/* Submitted date */}
                        <span className="text-xs text-slate-400 whitespace-nowrap hidden sm:block">
                          {sub.createdAt?new Date(sub.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}
                        </span>

                        {/* Status */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>
                          {sc.label}
                        </span>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-1.5 ml-auto">
                          {/* Inline Analysis toggle */}
                          <button
                            onClick={() => setExpandedSub(isExpanded ? null : sub._id)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${isExpanded?"bg-indigo-600 text-white border-indigo-600":"bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"}`}>
                            <BarChart2 size={11}/> {isExpanded ? "Close" : "Analyse"}
                          </button>

                          {/* Navigate to full detail */}
                          <button onClick={() => navigate(`/vc/submission/${sub._id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors">
                            <Eye size={11}/> Full View
                          </button>

                          {isPending && (
                            <button onClick={() => { setApproveModal(sub._id); setApproveComment(""); }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors">
                              <BadgeCheck size={11}/> Approve
                            </button>
                          )}
                          {isPending && (
                            <button onClick={() => { setRejectModal(sub._id); setRejectComment(""); }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors">
                              <XCircle size={11}/> Reject
                            </button>
                          )}
                          <button onClick={() => { setActionModal(sub); setActionComment(sub.vcComment||""); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200 transition-colors">
                            <ClipboardList size={11}/> Action
                          </button>
                        </div>
                      </div>

                      {/* Inline analysis panel */}
                      {isExpanded && <InlineAnalysis sub={sub}/>}
                    </div>
                  );
                })}
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

        {/* ══════════════════════════════════════════════════════════════════
            INTELLIGENCE / ANALYSIS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "analysis" && (
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
    </div>
  );
}
