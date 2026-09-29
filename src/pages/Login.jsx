import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  GraduationCap,
  Shield,
  Award,
  CheckCircle,
  ArrowLeft,
  Globe
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
            theme: "outline",
            size: "large",
            type: "standard",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 320,
          });
        }
      }
    }

    const existingScript = document.querySelector('script[src*="accounts.google.com"]');
    if (existingScript) {
      if (window.google?.accounts?.id) initializeGoogle();
      else existingScript.onload = initializeGoogle;
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    }
  }, []);

  async function handleGoogleSuccess(response) {
    if (!response.credential) {
      toast.error("Google Sign-In failed. Please try again.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Signing in with Google...");

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE || "https://ajayfeedback-backend.onrender.com"}/api/auth/google`,
        { idToken: response.credential }
      );

      login(data.token, data.user);
      toast.success(`Welcome, ${data.user.name || data.user.email}!`, { id: toastId });
      go(data.user.activeWorkspace || data.user.role);
    } catch (err) {
      console.error("Login error:", err);
      const msg = err.response?.data?.error || "Sign-in failed. Please try again.";
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  function go(roleOrWorkspace) {
    const dest = roleOrWorkspace === "vc" || roleOrWorkspace === "provc" ? "/vc"
      : roleOrWorkspace === "faculty" ? "/faculty"
      : roleOrWorkspace === "admin" ? "/admin"
      : "/hod";
    navigate(dest, { replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10">
          {/* Logo & Title */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 bg-white rounded-2xl p-3 shadow-xl">
              <img src={mitsLogo} alt="MITS Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-white font-black text-2xl leading-tight">MITS Gwalior</h1>
              <p className="text-blue-100 text-sm font-medium">Deemed to be University</p>
            </div>
          </div>

          {/* Hero Text */}
          <div className="max-w-md">
            <h2 className="text-white text-4xl font-black leading-tight mb-6">
              Faculty Feedback<br />Management System
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed mb-8">
              A comprehensive digital platform for collecting, analyzing, and managing faculty performance feedback with AI-powered insights.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: Shield, text: "Secure Google OAuth Authentication" },
                { icon: Award, text: "AI-Powered Feedback Analysis" },
                { icon: CheckCircle, text: "Streamlined Approval Workflow" }
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="relative z-10">
          <p className="text-blue-100 text-sm">
            © 2024 Madhav Institute of Technology & Science, Gwalior
          </p>
          <p className="text-blue-200 text-xs mt-1">An initiative towards academic excellence</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl p-2 shadow-lg">
              <img src={mitsLogo} alt="MITS Logo" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <div>
              <h1 className="text-slate-800 font-black text-xl">MITS Gwalior</h1>
              <p className="text-slate-500 text-xs font-medium">Feedback System</p>
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium mb-8 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Welcome Back</h2>
              <p className="text-slate-500 text-sm">Sign in with your MITS Google account to continue</p>
            </div>

            {/* Google Sign-In Button Container */}
            <div className="flex justify-center mb-6">
              <div id="google-login-btn" className="w-full flex justify-center" />
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-slate-500 font-medium">AUTHORIZED USERS ONLY</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Globe size={18} className="text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-blue-900 text-sm font-semibold mb-1">Access Requirements</p>
                  <p className="text-blue-700 text-xs leading-relaxed">
                    Only users with <strong>@mitsgwl.ac.in</strong> or <strong>@mitsgwalior.in</strong> email addresses can access this system.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
              <Shield size={12} />
              <span>Secured by Google OAuth 2.0</span>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-center text-slate-500 text-xs mt-6">
            Having trouble signing in? Contact{" "}
            <a href="mailto:support@mitsgwl.ac.in" className="text-blue-600 hover:underline font-medium">
              support@mitsgwl.ac.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
