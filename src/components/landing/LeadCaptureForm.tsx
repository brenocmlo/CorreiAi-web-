'use client';
import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';
import { useAssistant } from '@/contexts/AssistantContext';
import { DEMO_AGENCIES } from '@/lib/assistant-demo';

export function LeadCaptureForm() {
  const [selected, setSelected] = useState('horizonte');
  const { startDemo } = useAssistant();
  return (
    <section
      aria-label="Demonstração do CorreAI"
      className="relative rounded-[3px] border border-[var(--shop-brass)]/25 bg-[var(--shop-panel)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] sm:p-6"
    >
      <div
        className="pin-tape absolute left-1/2 -translate-x-1/2"
        aria-hidden
      />
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--shop-brass)]">
        Experimente antes de contratar
      </p>
      <h2 className="font-display mt-3 text-xl font-semibold text-[var(--shop-ink-text)]">
        Veja a IA atendendo um cliente.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[var(--shop-text-dim)]">
        Escolha uma imobiliária de exemplo e converse como um visitante. A IA
        usa os imóveis, fotos e preços daquele catálogo.
      </p>
      <div className="mt-5 space-y-3" aria-label="Imobiliárias de exemplo">
        {DEMO_AGENCIES.map((agency) => (
          <button
            key={agency.slug}
            type="button"
            aria-pressed={selected === agency.slug}
            onClick={() => setSelected(agency.slug)}
            className={`flex w-full items-center gap-3 rounded-[4px] border p-3 text-left transition-colors ${selected === agency.slug ? 'border-[var(--shop-brass)]/70 bg-[var(--shop-brass)]/5' : 'border-white/10 bg-black/20 hover:border-white/25'}`}
          >
            <Image
              unoptimized
              src={agency.imagem}
              width={68}
              height={68}
              alt="Foto ilustrativa de imóvel"
              className="h-[68px] w-[68px] shrink-0 rounded-[3px] object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--shop-ink-text)]">
                {agency.nome}
              </span>
              <span className="mt-1 block text-xs text-[var(--shop-text-dim)]">
                {agency.cidade} · {agency.imoveis.length} imóveis fictícios
              </span>
            </span>
            {selected === agency.slug && (
              <Check
                aria-label="Selecionada"
                className="h-4 w-4 shrink-0 text-[var(--shop-brass)]"
              />
            )}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => startDemo(selected)}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-[var(--shop-signal)] px-4 py-3 text-sm font-semibold text-white hover:brightness-110"
      >
        Testar a assistente
        <ArrowRight aria-hidden className="h-4 w-4" />
      </button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--shop-text-dim)]">
        Sem login e sem dados pessoais. Empresas, imóveis e valores são
        fictícios; fotos são ilustrativas.
      </p>
    </section>
  );
}
