import React from 'react';

export default function Card({
  children,
  className = '',
  hover = true,
  highlight = false,
}) {
  return (
    <div
      className={`bg-white rounded-2xl border ${
        highlight
          ? 'border-blue-400 ring-4 ring-blue-500/10 shadow-md'
          : 'border-slate-200/90 shadow-sm'
      } p-6 sm:p-8 ${
        hover ? 'transition-all duration-200 hover:shadow-lg hover:border-slate-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
