'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Hls from 'hls.js';
import { motion } from 'motion/react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { LeadCaptureForm } from './LeadCaptureForm';

const VIDEO_SRC =
  'https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8';
const POSTER_URL =
  'https://images.unsplash.com/photo-1647356191320-d7a1f80ca777?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjB0ZWNobm9sb2d5JTIwbmV1cmFsJTIwbmV0d29ya3xlbnwxfHx8fDE3Njg5NzIyNTV8MA&ixlib=rb-4.1.0&q=80&w=1080';

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
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
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(VIDEO_SRC);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      return () => {
        hls.destroy();
      };
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = VIDEO_SRC;
      const onLoaded = () => {
        video.play().catch(() => {});
      };
      video.addEventListener('loadedmetadata', onLoaded);
      return () => video.removeEventListener('loadedmetadata', onLoaded);
    }
  }, []);

  const reveal = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[var(--shop-ink)]">
      {/* The glass: night footage behind the pane, dimmed and warmed. */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="h-full w-full object-cover opacity-[0.28]"
          muted
          loop
          playsInline
          poster={POSTER_URL}
          aria-hidden
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,13,0.55)_0%,rgba(7,9,13,0.88)_62%,var(--shop-ink)_100%)]" />

      {/* Warm shop-light pooling from above, amber not blue. */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-18%] h-[70vh] w-[90vw] -translate-x-1/2 rounded-[50%] opacity-60 blur-[110px]"
        style={{ background: 'radial-gradient(ellipse at center, var(--shop-brass-glow), transparent 65%)' }}
        aria-hidden
      />

      {/* Pane seams, to read the whole hero as one storefront window. */}
      <div className="pointer-events-none absolute inset-0 glass-seams opacity-40" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pb-20 pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          {/* Esquerda: a mensagem de marca. */}
          <div className="max-w-xl">
            <div className="relative">
              <motion.h1
                {...reveal(0.08)}
                className="font-display text-[2.4rem] font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--shop-ink-text)] sm:text-[3rem] lg:text-[3.4rem]"
              >
                Entre cem chaves,
                <br />a sua já está separada.
              </motion.h1>
              {/* The reflection: just the seam, fading fast — a real glass
                  reflection dies within an inch of the surface, not a full
                  mirrored duplicate of the sign. Clipped short and kept
                  inside the gap before the subcopy, never painted over live
                  text. */}
              {!reduceMotion && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-full h-6 w-full select-none overflow-hidden"
                  style={{
                    maskImage: 'linear-gradient(to bottom, black, transparent 60%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 60%)',
                  }}
                >
                  <p
                    className="font-display text-[2.4rem] font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--shop-brass)] opacity-[0.08] sm:text-[3rem] lg:text-[3.4rem]"
                    style={{ transform: 'scaleY(-1)' }}
                  >
                    Entre cem chaves,
                    <br />a sua já está separada.
                  </p>
                </div>
              )}
            </div>

            <motion.p
              {...reveal(0.18)}
              className="mt-10 max-w-md text-[15px] leading-relaxed text-[var(--shop-text-dim)] sm:mt-12 sm:text-base"
            >
              Converse com a CorreAI sobre o imóvel que você procura. Ela cruza sua busca com o
              catálogo real da imobiliária e já separa as opções certas — antes de um corretor
              entrar na conversa.
            </motion.p>

            <motion.div {...reveal(0.28)} className="mt-9">
              <Link
                href="/assistente"
                className="group inline-flex items-center gap-2.5 rounded-[4px] bg-[var(--shop-signal)] px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-100 hover:bg-[#5c80f4] active:scale-[0.97]"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
                Falar com a IA
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>

            <motion.div {...reveal(0.38)} className="mt-12 flex items-center gap-4">
              <span className="font-display tabular-nums text-3xl font-semibold text-[var(--shop-ink-text)]">
                24/7
              </span>
              <span className="h-8 w-px bg-[var(--shop-brass)]/30" />
              <span className="max-w-[12rem] text-xs leading-snug text-[var(--shop-text-dim)]">
                A IA está sempre na vitrine, pronta pra conversar quando você chegar.
              </span>
            </motion.div>
          </div>

          {/* Direita: a primeira coisa que o visitante pode fazer — deixar o
              cartão atrás do vidro. Sem precisar rolar, sem precisar caçar. */}
          <motion.div {...reveal(0.22)}>
            <LeadCaptureForm />
          </motion.div>
        </div>
      </div>

      {/* The shop's own signage, anchoring the bottom edge of the glass. */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-3 border-t border-[var(--shop-brass)]/20 bg-[var(--shop-ink)]/70 py-2.5 backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--shop-brass)]" aria-hidden />
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--shop-brass)]">
          Aberto agora
        </span>
      </div>
    </section>
  );
}
