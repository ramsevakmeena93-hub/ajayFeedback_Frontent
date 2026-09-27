import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import mitsLogo from "../assets/mits-logo.png";
import campusImg from "../assets/mits-campus2.png";
import {
  Building2, Users, GraduationCap, Shield, Sparkles,
  MapPin, Phone, Mail, ArrowRight, Code2,
  Star, TrendingUp, CheckCircle, BarChart3,
  Zap, Menu, X, ChevronRight, Award, Target, Brain
} from "lucide-react";

const STATS = [
  { value: "500+", label: "Faculty Evaluated",  icon: Users,      color: "text-blue-400"   },
  { value: "14",   label: "Departments",         icon: Building2,  color: "text-violet-400" },
  { value: "98%",  label: "Response Rate",       icon: TrendingUp, color: "text-emerald-400"},
  { value: "4.2",  label: "Avg FFI Score",       icon: Star,       color: "text-amber-400"  }
];

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Powered Analytics",
    description: "Advanced sentiment analysis and smart categorization of feedback using transformers",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Shield,
    title: "Role-Based Security",
    description: "Multi-tier access control with HOD, Pro-VC, Faculty, and Admin dashboards",
    color: "from-violet-500 to-purple-500"
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description: "Real-time PDF extraction and automated report generation in seconds",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: Target,
    title: "Pro-VC Approval Flow",
    description: "Streamlined submission and approval workflow with digital signatures",
    color: "from-amber-500 to-orange-500"
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [counted, setCounted] = useState(false);

  useEffect(() => {
    if (user) {
      const dest = user.role === "vc" ? "/vc"
        : user.role === "faculty" ? "/faculty"
        : user.role === "admin" ? "/admin" : "/hod";
      navigate(dest, { replace: true });
    }
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setCounted(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-900/95 backdrop-blur-xl shadow-lg border-b border-slate-800/80"
          : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#home" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg bg-white/10 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <img src={mitsLogo} alt="MITS" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight text-white">MITS Gwalior</p>
                <p className="text-[10px] leading-tight text-blue-300">Faculty Feedback System</p>
              </div>
            </a>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/developer")}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-500/20 border border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.6)] hover:shadow-[0_0_25px_rgba(99,102,241,0.9)] hover:bg-indigo-500/40 transition-all duration-300">
                <span className="flex items-center gap-1.5"><Code2 size={16} /> Developer</span>
              </button>
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:-translate-y-0.5">
                Sign In <ArrowRight size={14} />
              </button>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-4 py-3 space-y-2">
            <button
              onClick={() => { navigate("/developer"); setMenuOpen(false); }}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-white transition-colors">
              Developer Profile
            </button>
            <button
              onClick={() => { navigate("/login"); setMenuOpen(false); }}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-white transition-colors">
              Sign In
            </button>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px] animate-float-slow" />
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-emerald-600/15 rounded-full blur-[80px] animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — Content */}
            <div className="animate-fade-up space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold backdrop-blur-sm">
                <Sparkles size={14} className="text-blue-400 animate-pulse" />
                MITS Deemed University — AI-Powered Feedback Platform
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
                Transform<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
                  Faculty Excellence
                </span>
              </h1>

              <p className="text-slate-400 text-lg sm:text-xl leading-relaxed max-w-xl">
                Empower academic growth with intelligent feedback analysis. Real-time insights, 
                automated reporting, and seamless collaboration — all powered by cutting-edge AI.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate("/login")}
                  className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:-translate-y-1">
                  Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
                  Explore Features
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-4 pt-4">
                {[
                  { icon: Shield, text: "Google OAuth" },
                  { icon: Brain, text: "AI-Powered" },
                  { icon: CheckCircle, text: "MITS Official" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                    <Icon size={14} className="text-emerald-400" />
                    <span className="text-white/80 text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Campus image + Stats */}
            <div className="hidden lg:block animate-fade-up relative" style={{ animationDelay: "200ms" }}>
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-500 hover:scale-105 hover:rotate-1">
                  <img
                    src={campusImg}
                    alt="MITS Campus"
                    className="w-full h-96 object-cover"
                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e]/80 via-transparent to-transparent" />
                </div>

                {/* Floating stat cards */}
                <div className="absolute -bottom-6 -left-6 bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <TrendingUp size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white leading-none">98%</p>
                      <p className="text-slate-400 text-xs mt-0.5">Response Rate</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-6 -right-6 bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl animate-float-slow max-w-[200px]">
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-white/90 text-xs leading-snug font-medium">
                    "Transforming feedback into excellence."
                  </p>
                  <p className="text-blue-400 text-[10px] font-bold mt-2">❤️ MITS Gwalior</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-60">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce" />
          </div>
          <p className="text-white/40 text-[10px] font-semibold">Scroll Down</p>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-slate-900/50 backdrop-blur-sm border-y border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="flex items-center gap-4 group animate-fade-up hover:scale-105 transition-transform duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <stat.icon size={22} className={stat.color} />
                </div>
                <div>
                  <p className="text-3xl font-black text-white leading-none">{counted ? stat.value : "—"}</p>
                  <p className="text-slate-500 text-xs font-semibold mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold mb-6">
              <Award size={14} className="text-violet-400" />
              Platform Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              Everything You Need,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                Built for Excellence
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Comprehensive feedback management powered by advanced AI and designed for academic institutions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((feature, i) => (
              <div key={i} 
                className="group p-8 bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 hover:border-slate-700 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-base leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEVELOPED BY SECTION ── */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-[#0a0f1e] to-[#0d1326] border-t border-slate-800">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/20 rounded-full blur-[150px]" />
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold mb-6">
              <Code2 size={14} className="text-indigo-400" />
              The Architect
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Developer</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Crafted with precision and passion by an elite full-stack developer dedicated to academic excellence.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-2">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-1 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden">
                      <img 
                        src="/ajay-meena.png" 
                        alt="Ajay Meena"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML='<div class="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black">A</div>'; }}
                      />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
                    Lead Dev
                  </div>
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-3xl font-black text-white mb-2">Ajay Meena</h3>
                  <p className="text-indigo-400 font-bold text-base mb-3">Elite Full Stack Developer & AI Innovator</p>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Specialized in modern web technologies, AI integration, and scalable system architecture.
                  </p>
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <a href="mailto:25tc1aj7@mitsgwl.ac.in" className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-indigo-500/20 flex items-center justify-center transition-all border border-slate-700 hover:border-indigo-500 group">
                      <Mail size={18} className="text-slate-400 group-hover:text-indigo-400" />
                    </a>
                    <a href="#" className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-purple-500/20 flex items-center justify-center transition-all border border-slate-700 hover:border-purple-500 group">
                      <Code2 size={18} className="text-slate-400 group-hover:text-purple-400" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => navigate("/developer")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 hover:-translate-y-1 group">
                View Full Profile <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── UNDER GUIDANCE SECTION ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-900/5 to-transparent pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold mb-6">
              <GraduationCap size={14} className="text-cyan-400" />
              Expert Mentorship
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              Under the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Guidance of</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Guided by distinguished faculty and technical experts from MITS Gwalior's esteemed academic community.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Dr. Abhishek Dixit */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10">
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-1 shadow-2xl hover:scale-110 transition-transform duration-500">
                  <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden">
                    <img 
                      src="/sir.png" 
                      alt="Dr. Abhishek Dixit"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: '50% 15%' }}
                      onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML='<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black">D</div>'; }}
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Dr. Abhishek Dixit</h3>
              <p className="text-purple-400 font-bold text-sm mb-3">Assistant Professor & Head, CCST</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Leading expert in Computer Science & Technology with extensive research and teaching experience.
              </p>
            </div>

            {/* Atul Chauhan */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center hover:border-cyan-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10">
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 p-1 shadow-2xl hover:scale-110 transition-transform duration-500">
                  <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden">
                    <img 
                      src="/atul-chauhan.png" 
                      alt="Atul Chauhan"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML='<div class="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-4xl font-black">A</div>'; }}
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Atul Chauhan</h3>
              <p className="text-cyan-400 font-bold text-sm mb-3">Programmer, MITS-DU</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Technical expert with deep knowledge of institutional systems and academic workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 relative overflow-hidden border-t border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-violet-600/10 to-emerald-600/10 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold mb-8">
            <Zap size={12} className="text-emerald-400" />
            Secure · Instant · AI-Powered
          </div>

          <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight">
            Ready to Transform<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
              Faculty Feedback?
            </span>
          </h2>

          <p className="text-slate-400 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Join MITS Gwalior's official digital feedback platform. Sign in with your institute Google account and get started instantly.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:from-blue-500 hover:via-cyan-500 hover:to-emerald-500 text-white font-black text-lg rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:-translate-y-2 hover:scale-105">
            Get Started Now <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </button>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-12">
            {[
              { icon: BarChart3, label: "AI Analytics" },
              { icon: Shield, label: "Secure Access" },
              { icon: Zap, label: "Instant Reports" },
              { icon: GraduationCap, label: "Academic Flow" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                <Icon size={16} className="text-blue-400" />
                <span className="text-slate-300 text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
}
