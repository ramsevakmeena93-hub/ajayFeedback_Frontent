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
        `${import.meta.env.VITE_API_BASE || "https://ajayfeedback-backend-5jk8.onrender.com"}/api/auth/google`,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      
      {/* Centered Login Card */}
      <div className="w-full max-w-md">
        
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white rounded-2xl p-3 shadow-xl border-2 border-blue-100">
              <img src={mitsLogo} alt="MITS Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <h1 className="text-slate-800 font-black text-3xl mb-2">MITS Gwalior</h1>
          <p className="text-slate-600 text-sm font-medium">Faculty Feedback Management System</p>
          <p className="text-slate-500 text-xs mt-1">Deemed to be University</p>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium mb-6 transition-colors group mx-auto">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-800 mb-2">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Sign in with your MITS Google account</p>
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
              <span className="bg-white px-4 text-slate-500 font-medium uppercase tracking-wide">Authorized Users Only</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Globe size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-blue-900 text-sm font-bold mb-1">Access Requirements</p>
                <p className="text-blue-700 text-xs leading-relaxed">
                  Only <strong>@mitsgwl.ac.in</strong> or <strong>@mitsgwalior.in</strong> email addresses are allowed.
                </p>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-6 space-y-3">
            {[
              { icon: Shield, text: "Secure Google OAuth" },
              { icon: Award, text: "AI-Powered Analysis" },
              { icon: CheckCircle, text: "Streamlined Workflow" }
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-slate-600" />
                </div>
                <span className="text-xs font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Security Note */}
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <Shield size={12} />
            <span>Secured by Google OAuth 2.0</span>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Need help? Contact{" "}
          <a href="mailto:support@mitsgwl.ac.in" className="text-blue-600 hover:underline font-semibold">
            support@mitsgwl.ac.in
          </a>
        </p>
      </div>
    </div>
  );
}
