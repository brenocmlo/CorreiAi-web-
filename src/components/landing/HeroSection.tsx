'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Hls from 'hls.js';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

const VIDEO_SRC =
  'https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8';
const POSTER_URL =
  'https://images.unsplash.com/photo-1647356191320-d7a1f80ca777?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjB0ZWNobm9sb2d5JTIwbmV1cmFsJTIwbmV0d29ya3xlbnwxfHx8fDE3Njg5NzIyNTV8MA&ixlib=rb-4.1.0&q=80&w=1080';

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(VIDEO_SRC);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.log('Auto-play prevented:', e));
      });
      return () => {
        hls.destroy();
      };
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = VIDEO_SRC;
      const onLoaded = () => {
        video.play().catch((e) => console.log('Auto-play prevented:', e));
      };
      video.addEventListener('loadedmetadata', onLoaded);
      return () => video.removeEventListener('loadedmetadata', onLoaded);
    }
  }, []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="h-full w-full object-cover opacity-60"
          muted
          loop
          playsInline
          poster={POSTER_URL}
          aria-hidden
        />
      </div>

      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      <div
        className="pointer-events-none absolute top-[-20%] left-[20%] h-[600px] w-[600px] bg-blue-900/20 blur-[120px] mix-blend-screen"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[20%] bottom-[-10%] h-[500px] w-[500px] bg-indigo-900/20 blur-[120px] mix-blend-screen"
        aria-hidden
      />

      <div className="relative z-10 mx-auto mt-20 flex max-w-5xl flex-col items-center space-y-12 px-6 pb-24 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-[family-name:var(--font-instrument-serif)] text-3xl leading-[1.1] text-white sm:text-5xl lg:text-[48px]"
        >
          O imóvel certo, no seu ritmo
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-gradient-to-b from-white via-white to-[#b4c0ff] bg-clip-text font-[family-name:var(--font-instrument-sans)] text-6xl font-semibold tracking-tighter text-transparent sm:text-8xl lg:text-[136px] leading-[0.9]"
        >
          Seu Lar Ideal
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="max-w-xl font-[family-name:var(--font-instrument-sans)] text-lg leading-[1.65] text-white sm:text-[20px]"
        >
          Chega de perder horas em anúncios que não combinam com você. A CorreAi aprende
          seu estilo, filtra o que importa e te guia até o imóvel certo — simples, rápido e
          feito sob medida.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col items-center gap-6 sm:flex-row"
        >
          <Link
            href="/cadastro/lead"
            className="group flex items-center rounded-full bg-white py-2 pl-6 pr-2 transition hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <span className="font-[family-name:var(--font-instrument-sans)] text-lg font-medium text-[#0a0400]">
              Encontrar Meu Imóvel
            </span>
            <span className="ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#3054ff] transition-colors group-hover:bg-[#2040e0]">
              <ArrowRight className="h-5 w-5 text-white" strokeWidth={2} />
            </span>
          </Link>

          <Link
            href="/login"
            className="group flex items-center gap-2 rounded-lg px-4 py-2 font-[family-name:var(--font-instrument-sans)] text-white/70 backdrop-blur-sm transition hover:bg-white/5 hover:text-white"
          >
            Já tenho conta
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
