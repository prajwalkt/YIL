import React from 'react';

export default function SkeletonLoader({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded-xl w-full"></div>
      ))}
    </div>
  );
}
