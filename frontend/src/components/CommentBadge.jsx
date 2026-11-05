import React from 'react';

const STYLES = {
  good: 'bg-blue-100 text-blue-700',
  bad: 'bg-yellow-100 text-yellow-700',
  attention: 'bg-red-100 text-red-700',
  appreciation: 'bg-green-100 text-green-700'
};

const LABELS = {
  good: 'Good',
  bad: 'Bad',
  attention: 'Attention',
  appreciation: 'Appreciation'
};

export default function CommentBadge({ type, count }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[type]}`}>
      {LABELS[type]}: {count}
    </span>
  );
}
