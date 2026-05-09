'use client';

import { Suspense } from 'react';
import TemplateBuilder from '@/components/admin/TemplateBuilder';

export default function BuildTemplatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-lime-500 rounded-full"></div>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400">LOADING STUDIO CANVAS...</p>
        </div>
      </div>
    }>
      <TemplateBuilder />
    </Suspense>
  );
}
