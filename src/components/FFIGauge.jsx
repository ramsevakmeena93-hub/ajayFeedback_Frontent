import React from 'react';

export default function FFIGauge({ score }) {
  const pct = Math.min((score / 10) * 100, 100);
  const color = score >= 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1 min-w-24">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="40" cy="40" r="32"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${2 * Math.PI * 32}`}
          strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
        />
        <text x="40" y="44" textAnchor="middle" fontSize="16" fontWeight="bold" fill={color}>
          {score?.toFixed(1) || '0'}
        </text>
      </svg>
      <span className="text-xs text-gray-500">FFI Score</span>
    </div>
  );
}
