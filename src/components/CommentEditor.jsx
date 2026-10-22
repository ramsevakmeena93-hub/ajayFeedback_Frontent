import { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Save } from 'lucide-react';
import { createPortal } from 'react-dom';

/**
 * CommentEditor - Two-column editor with move buttons
 * Edit comments and move them between categories (Appreciation <=> Need Attention)
 * Move option: inline arrow button per comment row (no selection required)
 */
export default function CommentEditor({ comments, otherComments, title, otherTitle, color, onSave, onClose }) {
  const [leftList, setLeftList] = useState([...comments]);
  const [rightList, setRightList] = useState([...otherComments]);

  const colorClasses = {
    green: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      rowHover: 'hover:bg-emerald-50',
      arrowBtn: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700',
    },
    orange: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      button: 'bg-amber-600 hover:bg-amber-700',
      rowHover: 'hover:bg-amber-50',
      arrowBtn: 'bg-amber-100 hover:bg-amber-200 text-amber-700',
    }
  };

  const colors = colorClasses[color] || colorClasses.green;

  // Move one item from left -> right instantly
  function moveSingleLeft(index) {
    const item = leftList[index];
    setRightList(prev => [...prev, item]);
    setLeftList(prev => prev.filter((_, i) => i !== index));
  }

  // Move one item from right -> left instantly
  function moveSingleRight(index) {
    const item = rightList[index];
    setLeftList(prev => [...prev, item]);
    setRightList(prev => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    onSave(leftList, rightList);
  }

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[96vw] max-w-7xl max-h-[92vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white shrink-0">
          <h3 className="text-lg font-bold text-slate-800">Edit Comments — {title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
            <X size={18}/>
          </button>
        </div>

        {/* Two-column editor */}
        <div className="flex-1 overflow-hidden p-5">
          <div className="grid grid-cols-2 gap-5 h-full">
            
            {/* Left column - Main category */}
            <div className="flex flex-col h-full min-h-0">
              <div className={`${colors.bg} ${colors.border} border-l-4 rounded-xl px-4 py-3 mb-2 shrink-0`}>
                <h4 className={`font-bold ${colors.text}`}>{title}</h4>
                <p className="text-xs text-slate-500">{leftList.length} comments · click <ArrowRight size={11} className="inline"/> to move</p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50 min-h-0">
                {leftList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-8">No comments here</p>
                ) : leftList.map((comment, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-3 rounded-lg border border-slate-200 bg-white ${colors.rowHover} transition-colors group`}
                  >
                    <span className="flex-1 text-sm leading-relaxed text-slate-700">{comment}</span>
                    <button
                      title={`Move to ${otherTitle}`}
                      onClick={() => moveSingleLeft(i)}
                      className={`shrink-0 mt-0.5 p-1.5 rounded-lg ${colors.arrowBtn} transition-colors opacity-60 group-hover:opacity-100`}
                    >
                      <ArrowRight size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column - Other category */}
            <div className="flex flex-col h-full min-h-0">
              <div className="bg-slate-100 border-l-4 border-slate-400 rounded-xl px-4 py-3 mb-2 shrink-0">
                <h4 className="font-bold text-slate-700">{otherTitle}</h4>
                <p className="text-xs text-slate-500">{rightList.length} comments · click <ArrowLeft size={11} className="inline"/> to move back</p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50 min-h-0">
                {rightList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-8">No comments here</p>
                ) : rightList.map((comment, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors group"
                  >
                    <button
                      title={`Move back to ${title}`}
                      onClick={() => moveSingleRight(i)}
                      className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors opacity-60 group-hover:opacity-100"
                    >
                      <ArrowLeft size={14}/>
                    </button>
                    <span className="flex-1 text-sm leading-relaxed text-slate-700">{comment}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-400">Click the arrow icon on any comment to move it instantly.</p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className={`px-4 py-2 ${colors.button} text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2`}>
              <Save size={16}/> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
