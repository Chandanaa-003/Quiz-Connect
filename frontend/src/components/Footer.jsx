import React from 'react';
import { GraduationCap, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900">QuizConnect</span>
              <p className="text-xs text-slate-500 font-medium">Learn. Attend. Achieve.</p>
            </div>
          </div>

          {/* Tech Stack Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
            <span className="px-2.5 py-1 bg-slate-100 rounded-md">React + Vite</span>
            <span className="text-slate-300">•</span>
            <span className="px-2.5 py-1 bg-slate-100 rounded-md">Tailwind CSS</span>
            <span className="text-slate-300">•</span>
            <span className="px-2.5 py-1 bg-slate-100 rounded-md">FastAPI</span>
            <span className="text-slate-300">•</span>
            <span className="px-2.5 py-1 bg-slate-100 rounded-md">SQLite</span>
          </div>

          {/* Status info */}
          <div className="text-center md:text-right">
            <p className="text-xs text-slate-500">
              © {currentYear} QuizConnect Platform. All rights reserved.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Phase 1: Project Initialization & Architecture Baseline
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
