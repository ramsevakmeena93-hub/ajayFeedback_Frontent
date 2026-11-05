import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function MoveCommentButton({ comment, reportId, from, onMoved }) {
  const [loading, setLoading] = useState(false);
  
  const to = from === 'appreciation' ? 'attention' : 'appreciation';
  const Icon = from === 'appreciation' ? ArrowRight : ArrowLeft;
  const label = from === 'appreciation' ? 'Move to Need Attention' : 'Move to Appreciation';
  const bgColor = from === 'appreciation' 
    ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' 
    : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200';

  async function handleMove() {
    const confirmMsg = to === 'appreciation' 
      ? 'Move this comment to Appreciation?' 
      : 'Move this comment to Need Attention?';
    
    if (!confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Moving comment...');

    try {
      const { data } = await api.post(`/api/reports/${reportId}/move-comment`, {
        comment,
        from,
        to
      });

      toast.success('Comment moved successfully!', { id: toastId });
      
      // Callback to refresh the report data
      if (onMoved) onMoved(data.report);
      
    } catch (err) {
      console.error('Move comment error:', err);
      const msg = err.response?.data?.error || 'Failed to move comment';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleMove}
      disabled={loading}
      className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium transition-all ${bgColor} ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
      title={label}
    >
      <Icon size={12} />
      <span className="hidden sm:inline">{loading ? 'Moving...' : 'Move'}</span>
    </button>
  );
}
