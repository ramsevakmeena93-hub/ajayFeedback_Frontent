import { useState } from 'react';
import { X, Save, ArrowRight, ArrowLeft, ThumbsUp, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';

// Minimum word count — filters out "ok", "good", "nice", single words etc.
const MIN_WORDS = 4;

// Exact filler phrases that add no value
const FILLER_PHRASES = new Set([
  'ok', 'okay', 'good', 'nice', 'fine', 'great', 'excellent', 'awesome',
  'bad', 'poor', 'no', 'yes', 'na', 'n/a', 'nothing', 'none', 'nil',
  'satisfactory', 'average', 'moderate', 'alright', 'cool',
  'okay.', 'good.', 'nice.', 'fine.', 'great.',
  'thanks', 'thank you', 'thank', 'no comments', 'no comment',
  'no suggestion', 'no suggestions', 'nothing to say', 'all good',
  'all ok', 'all fine', 'no issues', 'no problem', 'no problems',
]);

function filterSmall(list) {
  return (list || []).filter(l => {
    const trimmed = l.trim().toLowerCase();
    if (!trimmed) return false;
    if (FILLER_PHRASES.has(trimmed)) return false;
    return trimmed.split(/\s+/).length >= MIN_WORDS;
  });
}

export default function CommentEditor({
  comments,
  otherComments,
  title,
  otherTitle,
  color,
  onSave,
  onClose,
}) {
  const [leftList,  setLeftList]  = useState(filterSmall(comments));
  const [rightList, setRightList] = useState(filterSmall(otherComments));
  const [showRight, setShowRight] = useState(false);

  const isGreen       = color === 'green';
  const activeList    = showRight ? rightList    : leftList;
  const setActiveList = showRight ? setRightList : setLeftList;
  const activeTitle   = showRight ? otherTitle   : title;

  const isActiveGreen = isGreen === !showRight;
  const C = {
    header    : isActiveGreen ? 'bg-emerald-600' : 'bg-amber-600',
    bullet    : isActiveGreen ? 'text-emerald-500' : 'text-amber-500',
    rowBorder : isActiveGreen ? 'border-emerald-100' : 'border-amber-100',
    rowHover  : isActiveGreen ? 'hover:bg-emerald-50' : 'hover:bg-amber-50',
    textarea  : isActiveGreen
      ? 'border-emerald-200 focus:border-emerald-400 focus:ring-emerald-100'
      : 'border-amber-200 focus:border-amber-400 focus:ring-amber-100',
    moveBtn   : isActiveGreen
      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200'
      : 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200',
    addBtn    : isActiveGreen
      ? 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
      : 'text-amber-600 hover:bg-amber-50 border-amber-200',
    saveBtn   : isActiveGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700',
  };

  function updateLine(i, value) {
    const updated = [...activeList];
    updated[i] = value;
    setActiveList(updated);
  }

  function deleteLine(i) {
    setActiveList(activeList.filter((_, idx) => idx !== i));
  }

  function addLine() {
    setActiveList([...activeList, '']);
  }

  function moveLine(i) {
    const item = activeList[i];
    setActiveList(activeList.filter((_, idx) => idx !== i));
    if (showRight) setLeftList(prev  => [...prev, item]);
    else           setRightList(prev => [...prev, item]);
  }

  function handleSave() {
    onSave(
      leftList.filter(l => l.trim()),
      rightList.filter(l => l.trim())
    );
  }

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[96vw] max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-6 py-4 ${C.header}`}>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {isActiveGreen ? <ThumbsUp size={16}/> : <AlertTriangle size={16}/>}
            {activeTitle}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 text-white transition-colors">
            <X size={18}/>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-200 px-4 pt-3 gap-2 shrink-0 bg-white">
          <button
            onClick={() => setShowRight(false)}
            className={`px-4 py-1.5 rounded-t-lg text-xs font-bold transition-colors flex items-center gap-1.5
              ${!showRight
                ? (isGreen ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white')
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <ThumbsUp size={11}/> {title} ({leftList.filter(l => l.trim()).length})
          </button>
          <button
            onClick={() => setShowRight(true)}
            className={`px-4 py-1.5 rounded-t-lg text-xs font-bold transition-colors flex items-center gap-1.5
              ${showRight
                ? (!isGreen ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white')
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <AlertTriangle size={11}/> {otherTitle} ({rightList.filter(l => l.trim()).length})
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-5">

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">ONE COMMENT PER LINE</p>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {activeList.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No comments. Click + Add below.
              </p>
            )}

            {activeList.map((line, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 px-3 py-2.5 border-b ${C.rowBorder} last:border-b-0 bg-white ${C.rowHover} transition-colors group`}
              >
                {/* Bullet */}
                <span className={`text-lg font-black shrink-0 leading-6 mt-0.5 ${C.bullet}`}>•</span>

                {/* Auto-growing textarea — wraps long text, no horizontal scroll */}
                <textarea
                  rows={1}
                  value={line}
                  onChange={e => {
                    updateLine(i, e.target.value);
                    // auto-grow
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onFocus={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  placeholder="Type comment here..."
                  className={`flex-1 text-sm text-slate-700 bg-transparent border border-transparent rounded-lg px-2 py-1 resize-none overflow-hidden focus:outline-none focus:border focus:ring-2 leading-relaxed ${C.textarea} transition`}
                  style={{ minHeight: '2rem' }}
                />

                {/* Move button */}
                <button
                  onClick={() => moveLine(i)}
                  title={`Move to ${showRight ? title : otherTitle}`}
                  className={`shrink-0 flex items-center gap-1 px-2 py-1 mt-0.5 rounded-lg text-[10px] font-bold transition-colors ${C.moveBtn}`}
                >
                  {showRight ? <ArrowLeft size={11}/> : <ArrowRight size={11}/>}
                  <span className="hidden sm:inline">{showRight ? title : otherTitle}</span>
                </button>

                {/* Delete button */}
                <button
                  onClick={() => deleteLine(i)}
                  title="Remove this comment"
                  className="shrink-0 p-1.5 mt-0.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>

          {/* Add new comment */}
          <button
            onClick={addLine}
            className={`mt-2 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed rounded-xl text-xs font-semibold transition-colors ${C.addBtn}`}
          >
            <Plus size={13}/> Add Comment
          </button>

        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            {title}: <span className="font-bold text-slate-600">{leftList.filter(l => l.trim()).length}</span>
            &nbsp;·&nbsp;
            {otherTitle}: <span className="font-bold text-slate-600">{rightList.filter(l => l.trim()).length}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-5 py-2 ${C.saveBtn} text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2`}
            >
              <Save size={15}/> Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
