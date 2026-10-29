'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const STYLES = `
@keyframes footer-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.footer-marquee {
  animation: footer-marquee 42s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .footer-marquee { animation: none; }
}
`;

export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = 'button', ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === 'undefined') return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.3,
            y: y * 0.3,
            ease: 'power2.out',
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, { x: 0, y: 0, ease: 'elastic.out(1, 0.4)', duration: 1 });
        };

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
          element.removeEventListener('mousemove', handleMouseMove);
          element.removeEventListener('mouseleave', handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement | null) => {
          (localRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        className={cn('cursor-pointer active:scale-[0.97] transition-transform duration-100', className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = 'MagneticButton';

const MARQUEE_ITEMS = [
  'CRM Imobiliário',
  'Assistente com IA',
  'Catálogo real',
  'Funil de leads',
  'Corretores em campo',
];

const MarqueeRow = () => (
  <div className="flex items-center gap-10 px-5">
    {MARQUEE_ITEMS.map((item) => (
      <span key={item} className="flex items-center gap-10">
        {item}
        <span className="text-[var(--shop-brass)]/50">·</span>
      </span>
    ))}
  </div>
);

export function CinematicFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduceMotion(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!wrapperRef.current || reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: 'top 75%',
            end: 'top 35%',
            scrub: 0.6,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <footer
        ref={wrapperRef}
        className="relative w-full overflow-hidden border-t border-[var(--shop-brass)]/15 bg-[var(--shop-ink)]"
      >
        {/* The shop's hanging sign, lit from inside. */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[40vh] w-[70vw] -translate-x-1/2 rounded-[50%] opacity-50 blur-[100px]"
          style={{ background: 'radial-gradient(ellipse at center, var(--shop-brass-glow), transparent 65%)' }}
          aria-hidden
        />

        <div className="overflow-hidden border-b border-white/10 bg-black/40 py-3.5">
          <div className="footer-marquee flex w-max text-xs font-semibold uppercase tracking-[0.25em] text-[var(--shop-text-dim)]">
            <MarqueeRow />
            <MarqueeRow />
          </div>
        </div>

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center">
          <h2
            ref={headingRef}
            className="font-display max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--shop-ink-text)] sm:text-6xl"
          >
            A vitrine está aberta.
          </h2>

          <div ref={linksRef} className="mt-10 flex w-full flex-col items-center gap-5">
            <div className="flex w-full flex-wrap justify-center gap-3">
              <MagneticButton
                as={Link}
                href="/cadastro"
                className="flex items-center gap-2.5 rounded-[4px] bg-[var(--shop-brass)] px-8 py-4 text-sm font-semibold text-[#171206] hover:bg-[#e8cc6c]"
              >
                Começar grátis
              </MagneticButton>
              <MagneticButton
                as={Link}
                href="/login"
                className="flex items-center gap-2.5 rounded-[4px] border border-white/15 px-8 py-4 text-sm font-semibold text-[var(--shop-ink-text)]/85 hover:border-white/30 hover:text-[var(--shop-ink-text)]"
              >
                Entrar na plataforma
              </MagneticButton>
            </div>

            <div className="mt-1 flex flex-wrap justify-center gap-2 text-xs text-[var(--shop-text-dim)]">
              <a href="#" className="rounded-[3px] px-3 py-2 hover:text-[var(--shop-ink-text)]">
                Privacidade
              </a>
              <a href="#" className="rounded-[3px] px-3 py-2 hover:text-[var(--shop-ink-text)]">
                Termos de uso
              </a>
              <a href="mailto:suporte@correai.com" className="rounded-[3px] px-3 py-2 hover:text-[var(--shop-ink-text)]">
                Suporte
              </a>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex w-full flex-col items-center justify-between gap-4 border-t border-white/10 px-6 py-6 text-[11px] text-[var(--shop-text-dim)] md:flex-row md:px-12">
          <span className="tabular-nums tracking-wide">
            <span style={{ fontFamily: 'system-ui, sans-serif' }}>©</span> {new Date().getFullYear()} CorreAI. Todos os direitos reservados.
          </span>

          <MagneticButton
            as="button"
            type="button"
            onClick={scrollToTop}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[var(--shop-text-dim)] hover:border-[var(--shop-brass)]/40 hover:text-[var(--shop-ink-text)]"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2} />
          </MagneticButton>
        </div>
      </footer>
    </>
  );
}
