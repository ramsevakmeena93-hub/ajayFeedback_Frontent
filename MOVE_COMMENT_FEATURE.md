# Move Comment Feature - Implementation Guide

## 🎯 Feature: Move comments between Appreciation ↔ Need Attention

This allows HOD to quickly fix AI misclassifications by clicking a button to move comments.

---

## 📋 **Backend API** (Already Added ✅)

**Endpoint:** `POST /api/reports/:id/move-comment`

**Request Body:**
```json
{
  "comment": "The actual comment text to move",
  "from": "appreciation",  // or "attention"
  "to": "attention"        // or "appreciation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment moved from appreciation to attention",
  "report": { ... updated report ... }
}
```

---

## 🎨 **Frontend Implementation**

### **Option 1: Add Move Button Component**

Add this component to `src/components/MoveCommentButton.jsx`:

```jsx
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function MoveCommentButton({ comment, reportId, from, onMoved }) {
  const [loading, setLoading] = useState(false);
  
  const to = from === 'appreciation' ? 'attention' : 'appreciation';
  const Icon = from === 'appreciation' ? ArrowRight : ArrowLeft;
  const label = from === 'appreciation' ? 'Move to Need Attention' : 'Move to Appreciation';
  const bgColor = from === 'appreciation' ? 'bg-red-50 hover:bg-red-100 text-red-700' : 'bg-green-50 hover:bg-green-100 text-green-700';

  async function handleMove() {
    if (!confirm(`Move this comment to ${to === 'appreciation' ? 'Appreciation' : 'Need Attention'}?`)) {
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
      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${bgColor} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={label}
    >
      <Icon size={12} />
      {loading ? 'Moving...' : 'Move'}
    </button>
  );
}
```

---

### **Option 2: Add to Existing Comment Display**

In your **HODDashboard.jsx** or wherever you display comments, add the button:

**BEFORE:**
```jsx
<div className="comment-item">
  <p>{comment}</p>
</div>
```

**AFTER:**
```jsx
import MoveCommentButton from '../components/MoveCommentButton';

<div className="comment-item flex items-start justify-between gap-2">
  <p className="flex-1">{comment}</p>
  <MoveCommentButton 
    comment={comment}
    reportId={report._id}
    from="appreciation"  // or "attention" depending on which box
    onMoved={(updatedReport) => {
      // Refresh the report in your state
      setReport(updatedReport);
      // OR refetch all reports
      fetchReports();
    }}
  />
</div>
```

---

### **Option 3: Inline Example (No Separate Component)**

If you want to add it directly in your existing code:

```jsx
// Inside your HODDashboard where you map comments:

{report.appreciation?.map((comment, idx) => (
  <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-green-50 rounded mb-2">
    <p className="flex-1 text-sm">{comment}</p>
    <button
      onClick={async () => {
        if (!confirm('Move to Need Attention?')) return;
        try {
          const { data } = await api.post(`/api/reports/${report._id}/move-comment`, {
            comment,
            from: 'appreciation',
            to: 'attention'
          });
          toast.success('Moved!');
          setReport(data.report); // Update your state
        } catch (err) {
          toast.error(err.response?.data?.error || 'Failed');
        }
      }}
      className="bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded text-xs"
    >
      → Move
    </button>
  </div>
))}

{report.commentsNeedingAttention?.map((comment, idx) => (
  <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-yellow-50 rounded mb-2">
    <p className="flex-1 text-sm">{comment}</p>
    <button
      onClick={async () => {
        if (!confirm('Move to Appreciation?')) return;
        try {
          const { data } = await api.post(`/api/reports/${report._id}/move-comment`, {
            comment,
            from: 'attention',
            to: 'appreciation'
          });
          toast.success('Moved!');
          setReport(data.report);
        } catch (err) {
          toast.error(err.response?.data?.error || 'Failed');
        }
      }}
      className="bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
    >
      ← Move
    </button>
  </div>
))}
```

---

## 🎯 **How It Works:**

1. **User clicks "Move" button** on a comment
2. **Confirmation dialog** appears
3. **API call** to `/api/reports/:id/move-comment`
4. **Backend removes** comment from source array
5. **Backend adds** comment to destination array
6. **Backend updates** counts
7. **Frontend receives** updated report
8. **UI refreshes** to show comment in new location

---

## ✅ **Benefits:**

- ✅ **No copy-paste** needed
- ✅ **One-click** operation
- ✅ **Automatic count update**
- ✅ **Undo possible** (just move it back)
- ✅ **Works on any comment**

---

## 🚀 **To Implement:**

1. **Backend is already done** (just deployed to Render)
2. **Add MoveCommentButton component** to your frontend
3. **Add the button** to your comment display code
4. **Test** by moving a comment back and forth

---

## 📝 **Example Screenshot Location:**

```
┌─────────────────────────────────┐
│ 🎉 Appreciation Comments        │
├─────────────────────────────────┤
│ "Great teacher, very helpful"   │ [→ Move]
│ "Explains concepts clearly"     │ [→ Move]
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ⚠️  Need Attention Comments     │
├─────────────────────────────────┤
│ "Should provide more examples"  │ [← Move]
│ "Too fast pace"                 │ [← Move]
└─────────────────────────────────┘
```

---

**Choose Option 1, 2, or 3 above and add to your frontend!** 🎨
