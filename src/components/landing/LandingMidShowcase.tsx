'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

type Card = {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  preco: string;
  area: string;
  tag: string;
  imagem: string;
};

interface ImovelPublico {
  id: string;
  tipo: string;
  endereco: string;
  bairro: string;
  valor: number;
  metragem?: number | null;
  quartos?: number | null;
  status: string;
  imagem_url?: string | null;
  descricao?: string | null;
}

const ROTULOS_TIPO: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Comercial',
};

function imovelParaCard(imovel: ImovelPublico): Card {
  const rotuloTipo = ROTULOS_TIPO[imovel.tipo] ?? imovel.tipo;
  return {
    id: imovel.id,
    tipo: rotuloTipo,
    titulo: `${rotuloTipo} em ${imovel.bairro}`,
    descricao: imovel.descricao?.trim() || `${imovel.endereco}, ${imovel.bairro}`,
    preco: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.valor),
    area: imovel.metragem ? `${imovel.metragem} m²` : '—',
    tag: imovel.quartos ? `${imovel.quartos} quartos` : 'Em destaque',
    imagem: imovel.imagem_url || ILLUSTRATIVE_CARDS[0].imagem,
  };
}

// Cada imobiliária tem catálogo próprio e privado (isolamento multi-tenant).
// A vitrine só mostra imóveis que o corretor marcou explicitamente como
// "destaque na landing" (GET /api/imoveis/destaque, público). Sem nenhum
// destaque cadastrado ainda, cai nestas fichas ilustrativas.
const ILLUSTRATIVE_CARDS: Card[] = [
  {
    id: 'apt-1',
    tipo: 'Apartamento',
    titulo: 'Apartamento com varanda gourmet',
    descricao: 'Planta inteligente, iluminação natural e localização prática.',
    preco: 'R$ 980.000',
    area: '84 m²',
    tag: 'Ideal para viver bem',
    imagem: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'house-1',
    tipo: 'Casa',
    titulo: 'Casa com quintal e área gourmet',
    descricao: 'Ambientes integrados, espaço para família e conforto no dia a dia.',
    preco: 'R$ 1.250.000',
    area: '145 m²',
    tag: 'Famílias em expansão',
    imagem: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'apt-2',
    tipo: 'Apartamento',
    titulo: 'Apartamento perto do metrô',
    descricao: 'Conveniência e mobilidade para quem tem rotina acelerada.',
    preco: 'R$ 690.000',
    area: '62 m²',
    tag: 'Primeiro imóvel',
    imagem: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'house-2',
    tipo: 'Casa',
    titulo: 'Casa em condomínio com segurança',
    descricao: 'Tranquilidade, lazer e áreas pensadas para crianças e pets.',
    preco: 'R$ 1.480.000',
    area: '170 m²',
    tag: 'Tranquilidade garantida',
    imagem: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'apt-3',
    tipo: 'Apartamento',
    titulo: 'Apartamento com vista e lazer',
    descricao: 'Varanda ampla, áreas comuns completas e acabamento moderno.',
    preco: 'R$ 1.120.000',
    area: '93 m²',
    tag: 'Casais e lifestyle',
    imagem: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'house-3',
    tipo: 'Casa',
    titulo: 'Casa térrea com integração total',
    descricao: 'Conforto térmico, circulação fluida e cozinha integrada.',
    preco: 'R$ 1.620.000',
    area: '200 m²',
    tag: 'Começo de vida novo',
    imagem: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'apt-4',
    tipo: 'Apartamento',
    titulo: 'Apartamento moderno e silencioso',
    descricao: 'Planta bem distribuída com excelente ventilação.',
    preco: 'R$ 740.000',
    area: '70 m²',
    tag: 'Praticidade',
    imagem: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'house-4',
    tipo: 'Casa',
    titulo: 'Casa com iluminação natural',
    descricao: 'Espaços abertos e um quintal perfeito para receber amigos.',
    preco: 'R$ 1.900.000',
    area: '230 m²',
    tag: 'Receber com estilo',
    imagem: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
  },
];

// Ângulos e quedas fixos (não aleatórios) para a fileira não parecer uma
// grade impressa — cada ficha pende como se alguém tivesse colado à mão.
const ROTATIONS = [-2.5, 1.5, -1, 2, -1.5, 1, -2, 1.5];
const DROPS = [0, 10, -4, 14, 2, -8, 8, 0];

export function LandingMidShowcase() {
  const [cards, setCards] = useState<Card[]>(ILLUSTRATIVE_CARDS);
  const [isolatedId, setIsolatedId] = useState<string | null>(null);

  const sectionRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelado = false;
    fetch('/api/imoveis/destaque')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { imoveis: ImovelPublico[] }) => {
        if (cancelado) return;
        const destaques = data.imoveis ?? [];
        if (destaques.length === 0) return;
        setCards(destaques.map(imovelParaCard));
      })
      .catch(() => {
        // Sem destaques cadastrados ou API indisponível: mantém as fichas ilustrativas.
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // A vitrine nunca trava o scroll da página: a fileira de fichas é uma
  // faixa com scroll/arrasto horizontal próprio (mouse, trackpad ou dedo),
  // e o visitante sempre circula livremente pelo resto da página por cima
  // dela. Só o painel ganha uma entrada suave ao chegar na viewport.
  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    if (!section || !panel) return;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(panel, { y: 0, opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        panel,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: 'power3.out',
          duration: 0.7,
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 mx-auto w-full bg-[var(--shop-ink)]"
      aria-label="Imóveis em destaque"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div
          ref={panelRef}
          className="rounded-[3px] border border-[var(--shop-brass)]/20 bg-[var(--shop-panel)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.6)] sm:p-8"
        >
          <h2 className="font-display max-w-xl text-2xl font-semibold leading-tight text-[var(--shop-ink-text)] sm:text-3xl">
            Fichas coladas no vidro.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--shop-text-dim)]">
            Imóveis que corretores escolheram destacar na vitrine. O catálogo completo de cada
            imobiliária fica no link de atendimento que ela compartilha com você. Arraste para o
            lado para ver todas as fichas.
          </p>

          <div className="mt-8">
            <div className="relative overflow-x-auto rounded-[3px] border border-white/10 bg-[linear-gradient(180deg,rgba(0,0,0,0.3),rgba(0,0,0,0.1))]">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[var(--shop-panel)] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[var(--shop-panel)] to-transparent" />

              <div className="snap-x snap-mandatory px-6 py-12">
                <div className="flex w-max items-start gap-0">
                  {cards.map((c, idx) => {
                    const isolated = isolatedId === c.id;
                    const dimmed = isolatedId !== null && !isolated;
                    // Fichas coladas à mão, não impressas numa grade: cada
                    // uma pende num ângulo levemente diferente e invade a
                    // margem da vizinha.
                    const rotation = ROTATIONS[idx % ROTATIONS.length];
                    const drop = DROPS[idx % DROPS.length];
                    return (
                      <article
                        key={c.id}
                        onClick={() => setIsolatedId((prev) => (prev === c.id ? null : c.id))}
                        style={{
                          transform: isolated
                            ? 'rotate(0deg) translateY(-10px)'
                            : `rotate(${rotation}deg) translateY(${drop}px)`,
                          marginLeft: idx === 0 ? 0 : -22,
                          zIndex: isolated ? 30 : idx,
                        }}
                        className={`pin-tape group relative w-[250px] shrink-0 cursor-pointer snap-start rounded-[2px] bg-[var(--shop-paper)] p-3.5 text-[#1b1710] shadow-[0_14px_32px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-300 ease-out hover:z-20 ${
                          dimmed ? 'opacity-35' : 'opacity-100'
                        }`}
                      >
                        <div className="relative mb-3 h-28 w-full overflow-hidden rounded-[1px]" aria-hidden>
                          <img
                            src={c.imagem}
                            alt={c.titulo}
                            className="h-full w-full object-cover grayscale-[15%] transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b5f3f]">
                            {c.tipo}
                          </span>
                          <span className="tabular-nums text-[10px] text-[#6b5f3f]">{c.area}</span>
                        </div>

                        <h3 className="mt-1.5 text-[13px] font-semibold leading-snug text-[#1b1710]">
                          {c.titulo}
                        </h3>
                        <p className="mt-1 text-[11px] leading-relaxed text-[#3c3627]">{c.descricao}</p>

                        <div className="mt-3 flex items-end justify-between border-t border-[#1b1710]/10 pt-2.5">
                          <div>
                            <p className="text-[10px] text-[#6b5f3f]">{c.tag}</p>
                            <p className="font-display tabular-nums text-sm font-semibold text-[#1b1710]">
                              {c.preco}
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-[#6b5f3f] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
