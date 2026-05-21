'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { SunburstIcon } from './SunburstIcon';

const navLinks = [
  { label: 'Soluções', hasChevron: true },
  { label: 'Cases de Sucesso', hasChevron: false },
  { label: 'Recursos', hasChevron: false },
  { label: 'Planos', hasChevron: false },
];

export function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-transparent px-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-white" aria-label="CorreAi — início">
          <SunburstIcon className="text-white" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href="#"
              className="flex items-center gap-1 font-[family-name:var(--font-instrument-sans)] text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              {link.label}
              {link.hasChevron && <ChevronDown className="h-4 w-4" />}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <a
            href="#"
            className="hidden font-[family-name:var(--font-instrument-sans)] text-sm font-medium text-white/80 transition-colors hover:text-white sm:block"
          >
            Agendar Demonstração
          </a>
          <Link
            href="/cadastro"
            className="rounded-full bg-white px-5 py-2.5 font-[family-name:var(--font-instrument-sans)] text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Começar Agora
          </Link>
        </div>
      </div>
    </nav>
  );
}
