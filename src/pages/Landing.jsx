import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import mitsLogo from "../assets/mits-logo.png";
import campusImg from "../assets/mits-campus2.png";
import {
  Building2, Users, GraduationCap, Shield,
  ArrowRight, TrendingUp, CheckCircle, BarChart3,
  Zap, Menu, X, Code2, Award, Target, Globe
} from "lucide-react";

const STATS = [
  { value: "200+", label: "Faculty Members", icon: Users, color: "from-blue-500 to-blue-600" },
  { value: "8", label: "Departments", icon: Building2, color: "from-indigo-500 to-indigo-600" },
  { value: "5000+", label: "Students", icon: GraduationCap, color: "from-emerald-500 to-emerald-600" },
  { value: "2024", label: "Current Year", icon: Award, color: "from-amber-500 to-amber-600" }
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "AI-Powered Analytics",
    desc: "Advanced sentiment analysis automatically categorizes feedback into appreciation and areas needing attention with intelligent insights.",
    color: "blue"
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    desc: "Secure multi-role system with Faculty, HOD, Pro-VC, and Admin dashboards. Each role has specific permissions and workflows.",
    color: "indigo"
  },
  {
    icon: Zap,
    title: "Instant Processing",
    desc: "Upload CSV feedback files and get instant AI analysis. Generate comprehensive PDF reports with one click.",
    color: "emerald"
  },
  {
    icon: GraduationCap,
    title: "Pro-VC Approval Flow",
    desc: "Structured approval workflow from Faculty acknowledgment → HOD review → Pro-VC approval with complete audit trail.",
    color: "violet"
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">

      {/* ── NAVBAR ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-lg shadow-sm" : "bg-white/80 backdrop-blur-md"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href="#home" className="flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-sm ring-2 ring-blue-100 flex-shrink-0 bg-white">
                <img src={mitsLogo} alt="MITS" className="w-full h-full object-contain p-2" />
              </div>
              <div>
                <p className="font-black text-lg leading-tight text-slate-800">MITS Gwalior</p>
                <p className="text-xs leading-tight text-blue-600 font-semibold">Faculty Feedback System</p>
              </div>
            </a>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/developer")}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                Developer
              </button>
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all">
                Sign In <ArrowRight size={16} />
              </button>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t bg-white/95 backdrop-blur-md px-4 py-4 space-y-2 shadow-lg">
            <button
              onClick={() => { navigate("/developer"); setMenuOpen(false); }}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Developer Profile
            </button>
            <button
              onClick={() => { navigate("/login"); setMenuOpen(false); }}
              className="w-full py-2.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              Sign In
            </button>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section id="home" className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/80" />
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide mb-6">
                <Globe size={14} />
                MITS Deemed University
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
                Faculty Feedback<br />
                <span className="text-blue-600">Management System</span>
              </h1>

              <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
                A comprehensive AI-powered platform for collecting, analyzing, and managing faculty performance feedback. Streamline evaluations with intelligent insights and structured approval workflows.
              </p>

              <div className="flex justify-center lg:justify-start">
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  Get Started <ArrowRight size={18} />
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-6 mt-8 justify-center lg:justify-start">
                {[
                  "Google OAuth Secured",
                  "AI-Powered Analysis",
                  "MITS Official System",
                ].map(label => (
                  <div key={label} className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <CheckCircle size={16} className="text-emerald-500" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Campus image */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-3xl blur-2xl opacity-30 transform rotate-6" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200">
                  <img
                    src={campusImg}
                    alt="MITS Campus"
                    className="w-full h-96 object-cover"
                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  
                  {/* Floating badge */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <TrendingUp size={24} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-black text-2xl leading-none">4.2</p>
                        <p className="text-slate-600 text-sm">Average FFI Score</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200/50 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <p className="text-3xl font-black text-slate-900 leading-none mb-2">{stat.value}</p>
                <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-xs font-bold uppercase tracking-wide mb-4">
              <Target size={14} />
              Key Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
              Everything You Need for<br />Effective Feedback Management
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Powerful tools designed specifically for academic institutions to streamline faculty evaluation processes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => {
              const colorMap = {
                blue: "from-blue-500 to-blue-600",
                indigo: "from-indigo-500 to-indigo-600",
                emerald: "from-emerald-500 to-emerald-600",
                violet: "from-violet-500 to-violet-600"
              };
              return (
                <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 hover:border-slate-300/50 hover:shadow-lg transition-all duration-200 group">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorMap[feature.color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon size={28} className="text-white" />
                  </div>
                  <h3 className="text-slate-900 font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TEAM SECTION ── */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Developer - Ajay Meena */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-slate-200 hover:shadow-xl hover:border-indigo-300 transition-all duration-300">
              <div className="text-center">
                {/* Badge inside card - LARGER */}
                <div className="flex justify-center mb-6">
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-700 text-base font-bold uppercase tracking-wide shadow-sm">
                    <Code2 size={18} />
                    Developed By
                  </div>
                </div>
                
                <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Code2 size={48} className="text-white" />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-2">Ajay Meena</h3>
                <p className="text-indigo-600 font-bold text-sm mb-1">Full-Stack Developer</p>
                <p className="text-slate-600 text-xs mb-0.5">B.Tech CST</p>
                <p className="text-slate-500 text-xs mb-6">MITS Deemed University</p>
                
                <button
                  onClick={() => navigate("/developer")}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all">
                  View Profile
                </button>
              </div>
            </div>

            {/* Dr. Abhishek Dixit */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-slate-200 hover:shadow-xl hover:border-cyan-300 transition-all duration-300">
              <div className="text-center">
                {/* Badge inside card - LARGER */}
                <div className="flex justify-center mb-6">
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-50 border-2 border-cyan-200 text-cyan-700 text-base font-bold uppercase tracking-wide shadow-sm">
                    <GraduationCap size={18} />
                    Under Guidance
                  </div>
                </div>
                
                <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <GraduationCap size={48} className="text-white" />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-2">Dr. Abhishek Dixit</h3>
                <p className="text-cyan-600 font-bold text-sm mb-1">Assistant Professor & Head</p>
                <p className="text-slate-600 text-xs mb-0.5">Centre for CST</p>
                <p className="text-slate-500 text-xs">MITS Deemed University</p>
              </div>
            </div>

            {/* Atul Chauhan */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-slate-200 hover:shadow-xl hover:border-emerald-300 transition-all duration-300">
              <div className="text-center">
                {/* Badge inside card - LARGER */}
                <div className="flex justify-center mb-6">
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-50 border-2 border-cyan-200 text-cyan-700 text-base font-bold uppercase tracking-wide shadow-sm">
                    <GraduationCap size={18} />
                    Under Guidance
                  </div>
                </div>
                
                <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Users size={48} className="text-white" />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-2">Atul Chauhan</h3>
                <p className="text-emerald-600 font-bold text-sm mb-1">Programmer</p>
                <p className="text-slate-600 text-xs mb-0.5">MITS-DU</p>
                <p className="text-slate-500 text-xs">Technical Guidance</p>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-xl p-2 shadow-lg">
                  <img src={mitsLogo} alt="MITS" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="font-black text-lg">MITS Gwalior</p>
                  <p className="text-blue-400 text-xs">Feedback System</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Madhav Institute of Technology & Science, Gwalior — Deemed to be University
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Quick Links</p>
              <div className="space-y-2">
                {["About MITS", "Privacy Policy", "Contact Us"].map(link => (
                  <a key={link} href="#" className="flex items-center gap-2 text-slate-300 hover:text-white text-sm transition-colors">
                    • {link}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Contact</p>
              <div className="space-y-2 text-slate-300 text-sm">
                <p>MITS Campus, Gwalior</p>
                <p>Madhya Pradesh, India</p>
                <a href="mailto:info@mitsgwl.ac.in" className="text-blue-400 hover:underline">info@mitsgwl.ac.in</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400 text-sm">
            <p>© 2024 MITS Gwalior. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
