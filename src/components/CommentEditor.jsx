import { useState, useEffect } from 'react';
import { X, Save, ArrowRight, ArrowLeft, ThumbsUp, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

/**
 * CommentEditor – single-page editor with live bullet preview + inline Move buttons.
 * Both editing (textarea) and moving (per-bullet arrow) happen in one place.
 */
export default function CommentEditor({
  comments,       // array  – the "active" side being edited
  otherComments,  // array  – the other side (move target)
  title,          // "Appreciation" | "Need Attention"
  otherTitle,
  color,          // "green" | "orange"
  onSave,
  onClose,
}) {
  // Draft textarea text for each side
  const [leftDraft, setLeftDraft]   = useState(comments.join('\n'));
  const [rightDraft, setRightDraft] = useState(otherComments.join('\n'));
  // Which side is active in the textarea  (false = left, true = right)
  const [showRight, setShowRight]   = useState(false);

  const isGreen = color === 'green';

  // Parse textarea text into bullet list
  function parseLines(text) {
    return text.split('\n').map(l => l.trim()).filter(Boolean);
  }

  // Currently visible draft
  const activeDraft   = showRight ? rightDraft   : leftDraft;
  const setActiveDraft = showRight ? setRightDraft : setLeftDraft;
  const activeTitle   = showRight ? otherTitle   : title;
  const activeColor   = showRight ? (!isGreen ? 'green' : 'orange') : color;

  const leftLines  = parseLines(leftDraft);
  const rightLines = parseLines(rightDraft);
  const previewLines = showRight ? rightLines : leftLines;

  // Move a bullet from left -> right
  function moveToRight(index) {
    const moved = leftLines[index];
    const newLeft  = leftLines.filter((_, i) => i !== index);
    const newRight = [...rightLines, moved];
    setLeftDraft(newLeft.join('\n'));
    setRightDraft(newRight.join('\n'));
  }

  // Move a bullet from right -> left
  function moveToLeft(index) {
    const moved = rightLines[index];
    const newRight = rightLines.filter((_, i) => i !== index);
    const newLeft  = [...leftLines, moved];
    setRightDraft(newRight.join('\n'));
    setLeftDraft(newLeft.join('\n'));
  }

  function handleSave() {
    onSave(leftLines, rightLines);
  }

  // Tab colours
  const tabLeft = {
    active:   isGreen
      ? 'bg-emerald-600 text-white'
      : 'bg-amber-600 text-white',
    inactive: 'bg-slate-100 text-slate-500 hover:bg-slate-200',
    bullet:   isGreen ? 'text-emerald-500' : 'text-amber-500',
    border:   isGreen ? 'border-emerald-300' : 'border-amber-300',
    ring:     isGreen ? 'focus:ring-emerald-200' : 'focus:ring-amber-200',
    preview:  isGreen ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200',
    arrowBtn: isGreen
      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
      : 'bg-amber-100 hover:bg-amber-200 text-amber-700',
    icon: isGreen ? <ThumbsUp size={14}/> : <AlertTriangle size={14}/>,
  };
  const tabRight = {
    active:   !isGreen
      ? 'bg-emerald-600 text-white'
      : 'bg-amber-600 text-white',
    inactive: 'bg-slate-100 text-slate-500 hover:bg-slate-200',
    bullet:   !isGreen ? 'text-emerald-500' : 'text-amber-500',
    border:   !isGreen ? 'border-emerald-300' : 'border-amber-300',
    ring:     !isGreen ? 'focus:ring-emerald-200' : 'focus:ring-amber-200',
    preview:  !isGreen ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200',
    arrowBtn: !isGreen
      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
      : 'bg-amber-100 hover:bg-amber-200 text-amber-700',
    icon: !isGreen ? <ThumbsUp size={14}/> : <AlertTriangle size={14}/>,
  };

  const active = showRight ? tabRight : tabLeft;
  const other  = showRight ? tabLeft  : tabRight;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[96vw] max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 ${isGreen ? 'bg-emerald-600' : 'bg-amber-600'}`}>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {active.icon} {activeTitle}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 text-white transition-colors">
            <X size={18}/>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-4 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setShowRight(false)}
            className={`px-4 py-1.5 rounded-t-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${!showRight ? tabLeft.active : tabLeft.inactive}`}
          >
            <ThumbsUp size={12}/> {title} ({leftLines.length})
          </button>
          <button
            onClick={() => setShowRight(true)}
            className={`px-4 py-1.5 rounded-t-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${showRight ? tabRight.active : tabRight.inactive}`}
          >
            <AlertTriangle size={12}/> {otherTitle} ({rightLines.length})
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Textarea */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ONE COMMENT PER LINE</p>
            <textarea
              className={`w-full border-2 ${active.border} rounded-xl px-4 py-3 text-sm text-slate-700 leading-relaxed resize-none focus:outline-none focus:ring-2 ${active.ring} transition`}
              rows={6}
              value={activeDraft}
              onChange={e => setActiveDraft(e.target.value)}
              placeholder={`Type ${activeTitle} comments here, one per line...`}
            />
            <p className="text-[10px] text-slate-400 mt-1">Each line = one bullet point. Blank lines are ignored.</p>
          </div>

          {/* Preview with Move buttons */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">PREVIEW</p>
            <div className={`border rounded-xl p-3 ${active.preview} max-h-56 overflow-y-auto space-y-1.5`}>
              {previewLines.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No comments yet — type above.</p>
              ) : previewLines.map((line, i) => (
                <div key={i} className="flex items-start gap-2 group">
                  <span className={`mt-1 shrink-0 text-lg leading-none ${active.bullet}`}>•</span>
                  <span className="flex-1 text-sm text-slate-700 leading-relaxed">{line}</span>
                  {/* Inline move button */}
                  <button
                    title={`Move to ${showRight ? title : otherTitle}`}
                    onClick={() => showRight ? moveToLeft(i) : moveToRight(i)}
                    className={`shrink-0 mt-0.5 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${active.arrowBtn} opacity-0 group-hover:opacity-100 transition-all`}
                  >
                    {showRight ? <ArrowLeft size={11}/> : <ArrowRight size={11}/>}
                    <span>{showRight ? title : otherTitle}</span>
                  </button>
                </div>
              ))}
            </div>
            {previewLines.length > 0 && (
              <p className="text-[10px] text-slate-400 mt-1">Hover a bullet then click the arrow to move it to the other section.</p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            {title}: <span className="font-bold text-slate-600">{leftLines.length}</span> &nbsp;·&nbsp;
            {otherTitle}: <span className="font-bold text-slate-600">{rightLines.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className={`px-5 py-2 ${isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'} text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2`}>
              <Save size={15}/> Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
