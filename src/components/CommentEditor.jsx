import { ArrowRight, ArrowLeft, X } from 'lucide-react';
import { useState } from 'react';

export default function CommentEditor({ 
  comments, 
  otherComments,
  title, 
  color,
  otherTitle,
  onSave, 
  onClose 
}) {
  const [items, setItems] = useState(comments);
  const [otherItems, setOtherItems] = useState(otherComments);

  function moveToOther(index) {
    const comment = items[index];
    setItems(items.filter((_, i) => i !== index));
    setOtherItems([...otherItems, comment]);
  }

  function moveFromOther(index) {
    const comment = otherItems[index];
    setOtherItems(otherItems.filter((_, i) => i !== index));
    setItems([...items, comment]);
  }

  function removeItem(index) {
    if (confirm('Delete this comment?')) {
      setItems(items.filter((_, i) => i !== index));
    }
  }

  function removeOtherItem(index) {
    if (confirm('Delete this comment?')) {
      setOtherItems(otherItems.filter((_, i) => i !== index));
    }
  }

  function handleSave() {
    onSave(items, otherItems);
  }

  const bgColor = color === 'green' ? 'bg-emerald-600' : 'bg-amber-600';
  const hoverBg = color === 'green' ? 'hover:bg-emerald-700' : 'hover:bg-amber-700';
  const itemBg = color === 'green' ? 'bg-emerald-50' : 'bg-amber-50';
  const otherBg = color === 'green' ? 'bg-amber-50' : 'bg-emerald-50';
  const moveIcon = color === 'green' ? <ArrowRight size={14} /> : <ArrowLeft size={14} />;
  const moveFromIcon = color === 'green' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className={`${bgColor} px-5 py-3.5 flex items-center justify-between`}>
          <span className="font-bold text-white text-sm">{title}</span>
          <button onClick={onClose} className="text-white/80 hover:text-white text-lg">✕</button>
        </div>

        {/* Content - Two columns */}
        <div className="flex-1 overflow-auto p-5 grid grid-cols-2 gap-4">
          
          {/* Current Category */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700 mb-3">{title} ({items.length})</h3>
            {items.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">No comments</p>
            ) : (
              items.map((comment, idx) => (
                <div key={idx} className={`${itemBg} p-3 rounded-lg border border-slate-200 group hover:shadow-sm transition-all`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-700 flex-1">{comment}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveToOther(idx)}
                        className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-800"
                        title={`Move to ${otherTitle}`}
                      >
                        {moveIcon}
                      </button>
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1 hover:bg-white rounded text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Other Category */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700 mb-3">{otherTitle} ({otherItems.length})</h3>
            {otherItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">No comments</p>
            ) : (
              otherItems.map((comment, idx) => (
                <div key={idx} className={`${otherBg} p-3 rounded-lg border border-slate-200 group hover:shadow-sm transition-all`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-700 flex-1">{comment}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveFromOther(idx)}
                        className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-800"
                        title={`Move to ${title}`}
                      >
                        {moveFromIcon}
                      </button>
                      <button
                        onClick={() => removeOtherItem(idx)}
                        className="p-1 hover:bg-white rounded text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t bg-slate-50 flex gap-3 justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className={`px-5 py-2 text-sm font-semibold text-white ${bgColor} ${hoverBg} rounded-xl transition`}
          >
            ✓ Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
