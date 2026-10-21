import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AssistantChat } from '@/components/assistant/AssistantChat';

export default function AssistentePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-3 py-5 text-slate-100 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Voltar ao início</Link>
        <AssistantChat />
      </div>
    </main>
  );
}
