'use client';

import Link from 'next/link';
import { SunburstIcon } from './SunburstIcon';

export function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-[#D9BB4C]/15 bg-[#07090d]/70 px-6 py-3.5 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#F3EFE6]"
          aria-label="CorreAI — início"
        >
          <SunburstIcon className="text-[#D9BB4C]" />
          <span className="font-display text-[17px] font-semibold tracking-tight">CorreAI</span>
        </Link>

        <Link
          href="/cadastro"
          className="rounded-[4px] border border-[#D9BB4C]/70 bg-[#D9BB4C] px-5 py-2 text-sm font-semibold text-[#161107] transition-transform duration-100 hover:bg-[#e8cc6c] active:scale-[0.97]"
        >
          Começar agora
        </Link>
      </div>
    </nav>
  );
}
