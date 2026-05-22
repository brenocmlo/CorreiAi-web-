'use client';

import Link from 'next/link';
import { SunburstIcon } from './SunburstIcon';

export function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-transparent px-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-white" aria-label="CorreAi — início">
          <SunburstIcon className="text-white" />
        </Link>

        <Link
          href="/cadastro"
          className="rounded-full bg-white px-5 py-2.5 font-[family-name:var(--font-instrument-sans)] text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Começar Agora
        </Link>
      </div>
    </nav>
  );
}
