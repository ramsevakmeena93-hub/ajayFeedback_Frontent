import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import mitsLogo from "../assets/mits-logo.png";
import campusImg from "../assets/mits-campus2.png";
import ajayMeenaImg from "../assets/ajay-meena.png";
import abhishekDixitImg from "../assets/abhishek-dixit.png";
import {
  Building2, Users, GraduationCap, Shield,
  ArrowRight, TrendingUp, CheckCircle, BarChart3,
  Zap, Menu, X, Code2, Award, Target, Globe
} from "lucide-react";

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
      const dest = user.role === "vc" || user.role === "provc" ? "/vc"
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
          <div className="flex items-center justify-between h-16">
            <a href="#home" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm ring-2 ring-blue-100 flex-shrink-0 bg-white">
                <img src={mitsLogo} alt="MITS" className="w-full h-full object-contain p-1.5" />
              </div>
              <div>
                <p className="font-black text-base leading-tight text-slate-800">MITS Gwalior</p>
                <p className="text-xs leading-tight text-blue-600 font-semibold">Feedback System</p>
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

      {/* ── HERO ── COMPACT */}
      <section id="home" className="relative pt-24 pb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/80" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6 items-center">

            {/* Left — Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide mb-3">
                <Globe size={12} />
                MITS Deemed University
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-3">
                Faculty Feedback<br />
                <span className="text-blue-600">Management System</span>
              </h1>

              <p className="text-slate-600 text-base leading-relaxed mb-4 max-w-2xl mx-auto lg:mx-0">
                AI-powered platform for managing faculty performance feedback with intelligent insights and structured approval workflows.
              </p>

              <div className="flex justify-center lg:justify-start mb-3">
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm">
                  Get Started <ArrowRight size={16} />
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start">
                {[
                  "Google OAuth",
                  "AI-Powered",
                  "MITS Official",
                ].map(label => (
                  <div key={label} className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <CheckCircle size={14} className="text-emerald-500" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Campus image - SMALLER */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200">
                  <img
                    src={campusImg}
                    alt="MITS Campus"
                    className="w-full h-48 object-cover"
                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── REMOVED - Keeping page compact */}

      {/* ── TEAM SECTION - COMPACT ── */}
      <section className="py-8 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            
            {/* Developer - Ajay Meena */}
            <div className="bg-white rounded-xl p-4 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                {/* Badge - COMPACT */}
                <div className="flex justify-center mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wide">
                    <Code2 size={14} />
                    Developer
                  </div>
                </div>
                
                <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden shadow-lg ring-2 ring-indigo-100">
                  <img src={ajayMeenaImg} alt="Ajay Meena" className="w-full h-full object-cover" />
                </div>
                
                <h3 className="text-base font-black text-slate-900 mb-1">Ajay Meena</h3>
                <p className="text-indigo-600 font-bold text-xs mb-0.5">Full-Stack Developer</p>
                <p className="text-slate-600 text-xs mb-3">B.Tech CST, MITS</p>
                
                <button
                  onClick={() => navigate("/developer")}
                  className="w-full py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-lg shadow-md hover:shadow-lg transition-all">
                  View Profile
                </button>
              </div>
            </div>

            {/* Dr. Abhishek Dixit */}
            <div className="bg-white rounded-xl p-4 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold uppercase tracking-wide">
                    <GraduationCap size={14} />
                    Guidance
                  </div>
                </div>
                
                <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden shadow-lg ring-2 ring-cyan-100">
                  <img src={abhishekDixitImg} alt="Dr. Abhishek Dixit" className="w-full h-full object-cover" />
                </div>
                
                <h3 className="text-base font-black text-slate-900 mb-1">Dr. Abhishek Dixit</h3>
                <p className="text-cyan-600 font-bold text-xs mb-0.5">Asst. Professor & Head</p>
                <p className="text-slate-600 text-xs">Centre for CST, MITS</p>
              </div>
            </div>

            {/* Atul Chauhan */}
            <div className="bg-white rounded-xl p-4 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold uppercase tracking-wide">
                    <GraduationCap size={14} />
                    Guidance
                  </div>
                </div>
                
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Users size={32} className="text-white" />
                </div>
                
                <h3 className="text-base font-black text-slate-900 mb-1">Atul Chauhan</h3>
                <p className="text-cyan-600 font-bold text-xs mb-0.5">Programmer</p>
                <p className="text-slate-600 text-xs">Technical Guidance</p>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ── FOOTER - COMPACT ── */}
      <footer className="bg-slate-900 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-6">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-white rounded-lg p-1.5 shadow-lg">
                  <img src={mitsLogo} alt="MITS" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="font-black text-sm">MITS Gwalior</p>
                  <p className="text-blue-400 text-xs">Feedback System</p>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                MITS Deemed University, Gwalior
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Quick Links</p>
              <div className="space-y-1">
                {["About MITS", "Privacy", "Contact"].map(link => (
                  <a key={link} href="#" className="block text-slate-300 hover:text-white text-xs transition-colors">
                    {link}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Contact</p>
              <div className="space-y-1 text-slate-300 text-xs">
                <p>Gwalior, Madhya Pradesh</p>
                <a href="mailto:info@mitsgwl.ac.in" className="text-blue-400 hover:underline block">info@mitsgwl.ac.in</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-4 pt-3 text-center text-slate-400 text-xs">
            <p>© MITS Gwalior - Deemed to be University</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
