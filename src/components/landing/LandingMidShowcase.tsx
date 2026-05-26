'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

type Card = {
  id: string;
  tipo: 'Casa' | 'Apartamento';
  titulo: string;
  descricao: string;
  preco: string;
  area: string;
  tag: string;
  gradientFrom: string;
  gradientTo: string;
};

const MOCK_CARDS: Card[] = [
  {
    id: 'apt-1',
    tipo: 'Apartamento',
    titulo: 'Apartamento com varanda gourmet',
    descricao: 'Planta inteligente, iluminação natural e localização prática.',
    preco: 'R$ 980.000',
    area: '84 m²',
    tag: 'Ideal para viver bem',
    gradientFrom: 'rgba(48,84,255,0.6)',
    gradientTo: 'rgba(180,192,255,0.7)',
  },
  {
    id: 'house-1',
    tipo: 'Casa',
    titulo: 'Casa com quintal e área gourmet',
    descricao: 'Ambientes integrados, espaço para família e conforto no dia a dia.',
    preco: 'R$ 1.250.000',
    area: '145 m²',
    tag: 'Famílias em expansão',
    gradientFrom: 'rgba(48,84,255,0.35)',
    gradientTo: 'rgba(52,211,153,0.35)',
  },
  {
    id: 'apt-2',
    tipo: 'Apartamento',
    titulo: 'Apartamento perto do metrô',
    descricao: 'Conveniência e mobilidade para quem tem rotina acelerada.',
    preco: 'R$ 690.000',
    area: '62 m²',
    tag: 'Primeiro imóvel',
    gradientFrom: 'rgba(48,84,255,0.45)',
    gradientTo: 'rgba(180,192,255,0.55)',
  },
  {
    id: 'house-2',
    tipo: 'Casa',
    titulo: 'Casa em condomínio com segurança',
    descricao: 'Tranquilidade, lazer e áreas pensadas para crianças e pets.',
    preco: 'R$ 1.480.000',
    area: '170 m²',
    tag: 'Tranquilidade garantida',
    gradientFrom: 'rgba(48,84,255,0.28)',
    gradientTo: 'rgba(99,102,241,0.42)',
  },
  {
    id: 'apt-3',
    tipo: 'Apartamento',
    titulo: 'Apartamento com vista e lazer',
    descricao: 'Varanda ampla, áreas comuns completas e acabamento moderno.',
    preco: 'R$ 1.120.000',
    area: '93 m²',
    tag: 'Casais e lifestyle',
    gradientFrom: 'rgba(180,192,255,0.55)',
    gradientTo: 'rgba(48,84,255,0.4)',
  },
  {
    id: 'house-3',
    tipo: 'Casa',
    titulo: 'Casa térrea com integração total',
    descricao: 'Conforto térmico, circulação fluida e cozinha integrada.',
    preco: 'R$ 1.620.000',
    area: '200 m²',
    tag: 'Começo de vida novo',
    gradientFrom: 'rgba(48,84,255,0.25)',
    gradientTo: 'rgba(52,211,153,0.28)',
  },
  {
    id: 'apt-4',
    tipo: 'Apartamento',
    titulo: 'Apartamento moderno e silencioso',
    descricao: 'Planta bem distribuída com excelente ventilação.',
    preco: 'R$ 740.000',
    area: '70 m²',
    tag: 'Praticidade',
    gradientFrom: 'rgba(48,84,255,0.4)',
    gradientTo: 'rgba(180,192,255,0.55)',
  },
  {
    id: 'house-4',
    tipo: 'Casa',
    titulo: 'Casa com iluminação natural',
    descricao: 'Espaços abertos e um quintal perfeito para receber amigos.',
    preco: 'R$ 1.900.000',
    area: '230 m²',
    tag: 'Receber com estilo',
    gradientFrom: 'rgba(48,84,255,0.28)',
    gradientTo: 'rgba(59,130,246,0.45)',
  },
];

export function LandingMidShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);

  const cardsForRender = useMemo(() => {
    // Duplica para dar sensação de “carrossel” no scroll.
    return [...MOCK_CARDS, ...MOCK_CARDS];
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    const row = rowRef.current;

    if (!section || !panel || !row) return;

    const parent = row.parentElement;
    const getMaxShift = () => {
      const wrapperWidth = parent?.clientWidth ?? 0;
      const rowWidth = row.scrollWidth;
      return Math.max(0, rowWidth - wrapperWidth);
    };

    const ctx = gsap.context(() => {
      // “Dropdown”/reveal do painel conforme o usuário chega na seção.
      gsap.fromTo(
        panel,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            end: 'top 55%',
            scrub: true,
          },
        }
      );

      // Movimento horizontal dos cards no scroll (mesmo conceito do footer).
      const maxShift = getMaxShift();
      gsap.to(row, {
        x: -maxShift,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          end: 'bottom 20%',
          scrub: true,
        },
      });
    }, section);

    // Recalcula ao redimensionar.
    const onResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 mx-auto w-full bg-black"
      aria-label="Opções mockadas de casas e apartamentos"
    >
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div
          ref={panelRef}
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-8"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-[0.25em] text-white/60 uppercase">
                Meio termo
              </p>
              <h2 className="font-[family-name:var(--font-instrument-serif)] text-2xl leading-tight sm:text-3xl">
                Sugestões mockadas para alinhar seu match
              </h2>
              <p className="max-w-2xl text-sm text-white/60">
                Casas e apartamentos que “parecem” com o que a CorreAi entrega ao lead e ao corretor.
                Role para ver as opções mudando.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/55">
              <span>Lead</span>
              <span className="h-px w-10 bg-white/20" />
              <span>Corretor</span>
            </div>
          </div>

          <div className="mt-8">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01]">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black to-transparent" />

              <div className="px-5 py-8">
                <div ref={rowRef} className="flex w-max gap-5">
                  {cardsForRender.map((c, idx) => (
                    <article
                      key={`${c.id}-${idx}`}
                      className="group relative w-[260px] shrink-0 rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.6)] backdrop-blur-lg"
                    >
                      <div
                        className="mb-4 h-32 w-full overflow-hidden rounded-2xl"
                        aria-hidden
                      >
                        <div
                          className="h-full w-full bg-[radial-gradient(circle_at_0%_0%,var(--g1),transparent_58%),radial-gradient(circle_at_100%_100%,var(--g2),transparent_58%)] transition-transform duration-700 group-hover:scale-105"
                          style={
                            {
                              '--g1': c.gradientFrom,
                              '--g2': c.gradientTo,
                            } as CSSProperties
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white/75">
                          {c.tipo}
                        </span>
                        <span className="text-[11px] text-white/50">{c.area}</span>
                      </div>

                      <h3 className="mt-2 text-sm font-semibold leading-snug">{c.titulo}</h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/60">
                        {c.descricao}
                      </p>

                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <p className="text-[11px] text-white/55">{c.tag}</p>
                          <p className="text-sm font-semibold text-white">{c.preco}</p>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-[12px] text-white/70">
                          ↻
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

