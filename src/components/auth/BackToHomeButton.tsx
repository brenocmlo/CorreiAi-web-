import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function BackToHomeButton() {
  return (
    <Link
      href="/"
      className="group fixed left-4 top-4 z-50 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-white/70 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/5 hover:text-white sm:left-6 sm:top-6"
    >
      <ArrowLeft
        className="h-4 w-4 transition-transform group-hover:-translate-x-1"
        strokeWidth={2}
      />
      Voltar ao início
    </Link>
  );
}
