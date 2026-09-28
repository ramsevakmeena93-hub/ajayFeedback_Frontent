import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Upload, User, Building2, FileSignature, CheckCircle, ShieldCheck } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function FacultyOnboardingModal({ user, token, onComplete }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const sigRef = useRef();

  // Form data
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [signature, setSignature] = useState(null);
  const [sigPreview, setSigPreview] = useState(null);

  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  // Check if first time login (no department or no signature)
  useEffect(() => {
    if (!user) return;
    
    const isFirstTime = !user.department || !user.signatureImage;
    
    if (isFirstTime) {
      // Extract name from email (before @)
      const emailName = user.email?.split('@')[0] || "";
      const formattedName = emailName
        .split(/[._-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      setName(formattedName || user.name || "");
      setDepartment(user.department || "");

      // Show modal after 5 seconds
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  function handleSignatureUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setSignature(file);
    const reader = new FileReader();
    reader.onload = () => setSigPreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleComplete() {
    // Validation
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!department.trim()) {
      toast.error("Please select your department");
      return;
    }
    if (!signature) {
      toast.error("Please upload your signature");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Setting up your profile...");

    try {
      // Upload signature
      const formData = new FormData();
      formData.append("signature", signature);
      formData.append("name", name.trim());
      formData.append("department", department);

      const { data } = await api.post("/api/auth/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Profile setup complete!", { id: toastId });
      setShow(false);
      onComplete && onComplete(data.user);
    } catch (err) {
      console.error("Profile setup error:", err);
      toast.error(err.response?.data?.error || "Failed to setup profile", { id: toastId });
    } finally {
      setSaving(false);
    }
  }

  if (!show || !user) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Welcome to MITS Feedback System! 🎉</h2>
              <p className="text-indigo-100 text-sm">Let's complete your profile setup</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-200 text-slate-400'}`}>
                  {step > s ? <CheckCircle size={18} /> : s}
                </div>
                {s < 2 && <div className={`h-1 w-16 rounded transition-all ${step > s ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-blue-50 border-l-4 border-blue-500 px-5 py-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>📧 We've detected your email:</strong> <span className="font-mono">{user.email}</span>
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <User size={16} className="inline mr-1" /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Dr. Rajesh Kumar"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <Building2 size={16} className="inline mr-1" /> Department
                </label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="">Select your department</option>
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Applied Sciences">Applied Sciences (Physics/Chemistry/Maths)</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Management Studies">Management Studies</option>
                </select>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!name.trim() || !department}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Upload Signature →
              </button>
            </div>
          )}

          {/* Step 2: Signature Upload */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-amber-50 border-l-4 border-amber-500 px-5 py-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <ShieldCheck size={20} className="text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-900 mb-1">Why do we need your signature?</p>
                    <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                      <li><strong>Verification Purpose:</strong> Ensures authenticity of your acknowledgments</li>
                      <li><strong>Official Documents:</strong> Your signature appears on approved feedback reports</li>
                      <li><strong>Security:</strong> Prevents unauthorized submissions</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <FileSignature size={16} className="inline mr-1" /> Upload Your Signature
                </label>
                <input
                  ref={sigRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
                <div
                  onClick={() => sigRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group"
                >
                  {sigPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={sigPreview} alt="Signature" className="max-h-32 border border-slate-200 rounded-lg bg-white p-2" />
                      <p className="text-xs text-slate-500">Click to change signature</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload size={32} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      <p className="text-sm font-semibold text-slate-600">Click to upload signature image</p>
                      <p className="text-xs text-slate-400">PNG, JPG (Max 2MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!signature || saving}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Complete Setup
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
