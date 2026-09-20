import { useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, X, Check } from 'lucide-react';

export default function SignatureUpload({ token, onSaved, onSkip }) {
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please upload an image file (PNG/JPG)');
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB');

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    try {
      await axios.post('/api/auth/signature', { signatureImage: preview }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Signature saved successfully');
      onSaved && onSaved(preview);
    } catch {
      toast.error('Failed to save signature');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b bg-blue-50 rounded-t-2xl">
          <h2 className="font-bold text-blue-900 text-lg">Upload Your Signature</h2>
          <p className="text-xs text-blue-600 mt-0.5">This will be attached to all approved reports</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Upload area */}
          <div
            onClick={() => fileRef.current.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${preview ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
          >
            {preview ? (
              <div>
                <img src={preview} alt="Signature preview" className="max-h-24 mx-auto object-contain mb-2" />
                <p className="text-xs text-green-600 font-medium">Signature loaded — click to change</p>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-sm font-medium text-gray-600">Click to upload signature image</p>
                <p className="text-xs text-gray-400 mt-1">PNG or JPG · Max 2MB · White background recommended</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          <p className="text-xs text-gray-400 text-center">
            Your signature will appear on all feedback reports sent to VC
          </p>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex gap-3 justify-end">
          <button onClick={onSkip} className="btn-secondary text-sm">
            Skip for now
          </button>
          <button onClick={handleSave} disabled={!preview || saving}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
            <Check size={15} />
            {saving ? 'Saving...' : 'Save Signature'}
          </button>
        </div>
      </div>
    </div>
  );
}
