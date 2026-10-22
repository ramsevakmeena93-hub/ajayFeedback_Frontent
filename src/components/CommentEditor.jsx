import { useState, useRef } from 'react';
import { X, Save, ArrowRight, ArrowLeft, ThumbsUp, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';

/**
 * CommentEditor – Bullet-list editor with live preview + always-visible Move buttons.
 * Each comment = one editable bullet row (no textarea, proper bullet UI).
 */
export default function CommentEditor({
  comments,
  otherComments,
  title,
  otherTitle,
  color,
  onSave,
  onClose,
}) {
  const [leftList,  setLeftList]  = useState([...comments]);
  const [rightList, setRightList] = useState([...otherComments]);
  const [showRight, setShowRight] = useState(false);

  const isGreen  = color === 'green';
  const activeList    = showRight ? rightList    : leftList;
  const setActiveList = showRight ? setRightList : setLeftList;
  const activeTitle   = showRight ? otherTitle   : title;

  // Colours for active side
  const C = {
    header:    isGreen === !showRight ? 'bg-emerald-600' : 'bg-amber-600',
    tabActive: isGreen === !showRight ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white',
    tabOther:  'bg-slate-100 text-slate-500 hover:bg-slate-200',
    bullet:    isGreen === !showRight ? 'text-emerald-500' : 'text-amber-500',
    inputBorder: isGreen === !showRight ? 'border-emerald-200 focus:border-emerald-400 focus:ring-emerald-100' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-100',
    rowHover:  isGreen === !showRight ? 'hover:bg-emerald-50' : 'hover:bg-amber-50',
    previewBg: isGreen === !showRight ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200',
    moveBtn:   isGreen === !showRight ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200' : 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200',
    addBtn:    isGreen === !showRight ? 'text-emerald-600 hover:bg-emerald-50 border-emerald-200' : 'text-amber-600 hover:bg-amber-50 border-amber-200',
    saveBtn:   isGreen === !showRight ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700',
  };

  // Edit a line
  function updateLine(index, value) {
    const updated = [...activeList];
    updated[index] = value;
    setActiveList(updated);
  }

  // Delete a line
  function deleteLine(index) {
    setActiveList(activeList.filter((_, i) => i !== index));
  }

  // Add new empty line
  function addLine() {
    setActiveList([...activeList, '']);
  }

  // Move from left -> right
  function moveToRight(index) {
    const item = leftList[index];
    setLeftList(leftList.filter((_, i) => i !== index));
    setRightList([...rightList, item]);
  }

  // Move from right -> left
  function moveToLeft(index) {
    const item = rightList[index];
    setRightList(rightList.filter((_, i) => i !== index));
    setLeftList([...leftList, item]);
  }

  function handleSave() {
    // Filter out blank entries before saving
    onSave(leftList.filter(l => l.trim()), rightList.filter(l => l.trim()));
  }

  // Preview lines (non-empty only)
  const previewLines = activeList.filter(l => l.trim());

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[96vw] max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 ${C.header}`}>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {isGreen === !showRight ? <ThumbsUp size={16}/> : <AlertTriangle size={16}/>}
            {activeTitle}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 text-white transition-colors">
            <X size={18}/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-4 pt-3 gap-2 shrink-0 bg-white">
          <button
            onClick={() => setShowRight(false)}
            className={`px-4 py-1.5 rounded-t-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${!showRight ? (isGreen ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white') : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <ThumbsUp size={11}/> {title} ({leftList.filter(l=>l.trim()).length})
          </button>
          <button
            onClick={() => setShowRight(true)}
            className={`px-4 py-1.5 rounded-t-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${showRight ? (!isGreen ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white') : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <AlertTriangle size={11}/> {otherTitle} ({rightList.filter(l=>l.trim()).length})
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── Bullet-list editable section ── */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">ONE COMMENT PER LINE</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {activeList.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">No comments. Click + Add below.</p>
              )}
              {activeList.map((line, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2 border-b border-slate-100 last:border-b-0 bg-white ${C.rowHover} transition-colors`}
                >
                  {/* Bullet dot */}
                  <span className={`text-lg font-black shrink-0 leading-none ${C.bullet}`}>•</span>
                  {/* Editable input */}
                  <input
                    type="text"
                    value={line}
                    onChange={e => updateLine(i, e.target.value)}
                    placeholder="Type comment here..."
                    className={`flex-1 text-sm text-slate-700 bg-transparent border border-transparent rounded-lg px-2 py-1 focus:outline-none focus:border focus:ring-2 ${C.inputBorder} transition`}
                  />
                  {/* Delete button */}
                  <button
                    onClick={() => deleteLine(i)}
                    title="Remove this comment"
                    className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13}/>
                  </button>
                </div>
              ))}
            </div>
            {/* Add new line button */}
            <button
              onClick={addLine}
              className={`mt-2 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed rounded-xl text-xs font-semibold transition-colors ${C.addBtn}`}
            >
              <Plus size={13}/> Add Comment
            </button>
          </div>

          {/* ── Preview with always-visible Move buttons ── */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">PREVIEW</p>
            <div className={`border rounded-xl p-3 ${C.previewBg} space-y-2`}>
              {previewLines.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-3">No comments yet.</p>
              ) : previewLines.map((line, i) => {
                // find the actual index in activeList (skip blanks)
                const realIndex = activeList.findIndex((l, idx) => {
                  let count = -1;
                  for (let j = 0; j <= idx; j++) {
                    if (activeList[j].trim()) count++;
                  }
                  return count === i && activeList[idx].trim();
                });
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-base font-black shrink-0 mt-0.5 leading-none ${C.bullet}`}>•</span>
                    <span className="flex-1 text-sm text-slate-700 leading-relaxed">{line}</span>
                    {/* Always-visible Move button */}
                    <button
                      onClick={() => showRight ? moveToLeft(realIndex) : moveToRight(realIndex)}
                      title={`Move to ${showRight ? title : otherTitle}`}
                      className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${C.moveBtn}`}
                    >
                      {showRight ? <ArrowLeft size={11}/> : <ArrowRight size={11}/>}
                      <span className="hidden sm:inline">{showRight ? title : otherTitle}</span>
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Click the arrow button to move any comment to the other section.</p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            {title}: <span className="font-bold text-slate-600">{leftList.filter(l=>l.trim()).length}</span>
            &nbsp;·&nbsp;
            {otherTitle}: <span className="font-bold text-slate-600">{rightList.filter(l=>l.trim()).length}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className={`px-5 py-2 ${C.saveBtn} text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2`}>
              <Save size={15}/> Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
