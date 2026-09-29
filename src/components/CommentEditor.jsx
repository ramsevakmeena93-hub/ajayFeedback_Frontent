import { useState } from 'react';
import { X, ArrowRight, Save } from 'lucide-react';
import { createPortal } from 'react-dom';

/**
 * CommentEditor - Two-column editor with move buttons
 * Edit comments and move them between categories (Appreciation ↔ Need Attention)
 */
export default function CommentEditor({ comments, otherComments, title, otherTitle, color, onSave, onClose }) {
  const [leftList, setLeftList] = useState([...comments]);
  const [rightList, setRightList] = useState([...otherComments]);
  const [selectedLeft, setSelectedLeft] = useState(new Set());
  const [selectedRight, setSelectedRight] = useState(new Set());

  const colorClasses = {
    green: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      button: 'bg-emerald-600 hover:bg-emerald-700'
    },
    orange: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      button: 'bg-amber-600 hover:bg-amber-700'
    }
  };

  const colors = colorClasses[color] || colorClasses.green;

  // Move selected items from left to right
  function moveLeftToRight() {
    const toMove = leftList.filter((_, i) => selectedLeft.has(i));
    setRightList([...rightList, ...toMove]);
    setLeftList(leftList.filter((_, i) => !selectedLeft.has(i)));
    setSelectedLeft(new Set());
  }

  // Move selected items from right to left
  function moveRightToLeft() {
    const toMove = rightList.filter((_, i) => selectedRight.has(i));
    setLeftList([...leftList, ...toMove]);
    setRightList(rightList.filter((_, i) => !selectedRight.has(i)));
    setSelectedRight(new Set());
  }

  // Toggle selection
  function toggleLeft(index) {
    const newSet = new Set(selectedLeft);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedLeft(newSet);
  }

  function toggleRight(index) {
    const newSet = new Set(selectedRight);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedRight(newSet);
  }

  function handleSave() {
    onSave(leftList, rightList);
  }

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-lg font-bold text-slate-800">Edit Comments - {title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
            <X size={18}/>
          </button>
        </div>

        {/* Two-column editor */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="grid grid-cols-2 gap-6 h-full">
            
            {/* Left column - Main category */}
            <div className="flex flex-col h-full">
              <div className={`${colors.bg} ${colors.border} border-l-4 rounded-xl p-4 mb-3`}>
                <h4 className={`font-bold ${colors.text} mb-1`}>{title}</h4>
                <p className="text-xs text-slate-500">{leftList.length} comments · Click to select</p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                {leftList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-8">No comments here</p>
                ) : leftList.map((comment, i) => (
                  <div
                    key={i}
                    onClick={() => toggleLeft(i)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-sm leading-relaxed ${
                      selectedLeft.has(i)
                        ? 'border-blue-400 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {comment}
                  </div>
                ))}
              </div>
              <button
                onClick={moveLeftToRight}
                disabled={selectedLeft.size === 0}
                className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Move to {otherTitle} <ArrowRight size={16}/>
              </button>
            </div>

            {/* Right column - Other category */}
            <div className="flex flex-col h-full">
              <div className="bg-slate-100 border-l-4 border-slate-400 rounded-xl p-4 mb-3">
                <h4 className="font-bold text-slate-700 mb-1">{otherTitle}</h4>
                <p className="text-xs text-slate-500">{rightList.length} comments · Click to select</p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                {rightList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-8">No comments here</p>
                ) : rightList.map((comment, i) => (
                  <div
                    key={i}
                    onClick={() => toggleRight(i)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-sm leading-relaxed ${
                      selectedRight.has(i)
                        ? 'border-blue-400 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {comment}
                  </div>
                ))}
              </div>
              <button
                onClick={moveRightToLeft}
                disabled={selectedRight.size === 0}
                className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowRight size={16} className="rotate-180"/> Move to {title}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className={`px-4 py-2 ${colors.button} text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2`}>
            <Save size={16}/> Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
