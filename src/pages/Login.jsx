import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  GraduationCap,
  Shield,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  Brain,
  Zap,
  Lock
} from "lucide-react";
import mitsLogo from "../assets/mits-logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Already logged in → redirect to dashboard
  useEffect(() => {
    if (user) go(user.activeWorkspace || user.role);
  }, [user]);

  // Google Identity Services Sign-In
  useEffect(() => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "32902780570-ltgii8ds5cf6pp8elj3uapsao7a78u88.apps.googleusercontent.com";

    function initializeGoogle() {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSuccess,
          auto_select: false,
        });

        const btnContainer = document.getElementById("google-login-btn");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "filled_blue",
            size: "large",
            type: "standard",
            text: "signin_with",
            shape: "pill",
            logo_alignment: "left",
            width: 340,
          });
        }
        return true;
      }
      return false;
    }

    if (!initializeGoogle()) {
      const interval = setInterval(() => {
        if (initializeGoogle()) clearInterval(interval);
      }, 300);
      return () => clearInterval(interval);
    }
  }, []);

  async function handleGoogleSuccess(response) {
    if (!response?.credential) return;
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/google", {
        credential: response.credential,
      });
      login(data.user, data.token);
      toast.success(`Welcome, ${data.user.name || "User"}! 🎉`);
      go(data.user.activeWorkspace || data.user.role);
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "Sign-in failed. Please try again or contact support."
      );
    } finally {
      setLoading(false);
    }
  }

  function go(role) {
    const dest =
      role === "vc"
        ? "/vc"
        : role === "faculty"
        ? "/faculty"
        : role === "admin"
        ? "/admin"
        : "/hod";
    navigate(dest, { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-[#0a0f1e] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] animate-float-slow" />
      </div>

      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col relative overflow-hidden border-r border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-violet-600/20" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/20 rounded-full blur-[100px] animate-float-slow" />

        <div className="relative flex flex-col h-full p-12 justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/10 shrink-0 shadow-xl p-1">
              <img src={mitsLogo} alt="MITS" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">MITS Gwalior</p>
              <p className="text-blue-300 text-xs leading-tight">Faculty Feedback System</p>
            </div>
          </div>

          {/* Center Content */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold mb-8 w-fit">
              <Sparkles size={14} className="text-blue-400 animate-pulse" />
              AI-Powered Academic Platform
            </div>

            <h2 className="text-5xl font-black text-white mb-4 leading-tight">
              Welcome to<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
                Smart Feedback
              </span>
            </h2>
            
            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-md">
              Secure institutional access for faculty evaluation and academic excellence tracking.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: Brain, title: "AI-Powered Analysis", desc: "Advanced sentiment detection & insights" },
                { icon: Shield, title: "Secure Access", desc: "Google OAuth institutional authentication" },
                { icon: Zap, title: "Real-Time Reports", desc: "Instant PDF generation & processing" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Icon size={20} className="text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-base mb-1">{title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span>© 2025 MITS Gwalior</span>
            <span>Deemed University</span>
          </div>
        </div>
      </div>

      {/* ── Right Login Form Panel ── */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Navigation */}
        <div className="px-6 lg:px-10 py-6 flex items-center justify-between relative z-10">
          <button
            onClick={() => navigate("/landing")}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-all duration-200 hover:-translate-x-1"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Lock size={12} className="text-emerald-400" />
            <span>Secure Login</span>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="flex-1 flex items-center justify-center px-4 pb-16">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 p-2">
                <img src={mitsLogo} alt="MITS" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-white mb-2">Sign In</h1>
              <p className="text-slate-400 text-sm">
                Access your dashboard with institutional credentials
              </p>
            </div>

            {/* Main Login Card */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
              {/* Badge */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 rounded-full text-blue-300 text-xs font-bold mb-4">
                  <Shield size={14} className="text-blue-400" />
                  Google OAuth 2.0 Secured
                </div>
                <h2 className="text-white text-lg font-bold mb-1">Institute Single Sign-On</h2>
                <p className="text-slate-400 text-xs">
                  Use your MITS Google Workspace account
                </p>
              </div>

              {/* Google Button Container */}
              <div className="flex justify-center w-full min-h-[48px] mb-6">
                <div id="google-login-btn" className="w-full flex justify-center" />
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-blue-400 bg-blue-500/5 rounded-xl border border-blue-500/10">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              )}

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-slate-900 text-slate-500 font-medium">Authorized Domain</span>
                </div>
              </div>

              {/* Domain Badge */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <span className="text-blue-300 font-mono text-sm font-bold">Google Account</span>
                </div>
                <p className="text-slate-500 text-xs mt-3">
                  Sign in with any Google Workspace account
                </p>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-6 mt-8">
              {[
                { icon: Shield, label: "Encrypted" },
                { icon: GraduationCap, label: "Institutional" },
                { icon: CheckCircle, label: "Verified" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                  <Icon size={16} className="text-slate-400" />
                  <span className="text-slate-500 text-xs font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
