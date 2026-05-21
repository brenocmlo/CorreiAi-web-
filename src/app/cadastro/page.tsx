'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowRight, Circle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BackToHomeButton } from '@/components/auth/BackToHomeButton';

type TipoPerfil = 'corretor' | 'lead';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Cadastro() {
  const [tipoPerfil, setTipoPerfil] = useState<TipoPerfil | null>(null);
  const [primeiroNome, setPrimeiroNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [creci, setCreci] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const { user, loading, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso(false);

    if (!tipoPerfil) {
      setErro('Selecione o tipo de perfil: Lead ou Corretor.');
      return;
    }

    const nomeCompleto = `${primeiroNome.trim()} ${sobrenome.trim()}`.trim();
    if (!primeiroNome.trim() || !sobrenome.trim()) {
      setErro('Preencha nome e sobrenome.');
      return;
    }

    if (senha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (!cpf) {
      setErro('Por favor, preencha o CPF.');
      return;
    }

    if (tipoPerfil === 'corretor' && !creci) {
      setErro('Corretores devem informar o CRECI.');
      return;
    }

    setCarregando(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: nomeCompleto,
          email,
          cpf,
          creci: tipoPerfil === 'corretor' ? creci : null,
          senha,
          role: tipoPerfil,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? 'Ocorreu um erro ao criar a conta. Tente novamente.');
        return;
      }

      setSucesso(true);
      await refreshProfile();
      router.replace('/dashboard');
    } catch {
      setErro('Ocorreu um erro ao criar a conta. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-brand-primary" />
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen w-full bg-black selection:bg-brand-primary/30 p-2 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4">
      <BackToHomeButton />
      {/* Coluna esquerda — Hero */}
      <section className="relative hidden lg:flex w-[52%] flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        <div
          className="pointer-events-none absolute top-[-20%] left-[20%] h-[600px] w-[600px] bg-blue-900/20 blur-[120px] mix-blend-screen"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-[20%] bottom-[-10%] h-[500px] w-[500px] bg-indigo-900/20 blur-[120px] mix-blend-screen"
          aria-hidden
        />

        <motion.div
          className="relative z-10 w-full max-w-xs space-y-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeSlideUp} className="flex items-center gap-2">
            <Circle className="h-6 w-6 fill-white text-white" />
            <span className="text-xl font-semibold tracking-tight">CorreAI</span>
          </motion.div>

          <motion.div variants={fadeSlideUp} className="space-y-3 text-center">
            <h1 className="text-4xl font-medium tracking-tight whitespace-nowrap">
              Junte-se à CorreAI
            </h1>
            <p className="text-white/60 text-sm leading-relaxed px-4">
              Siga estas 2 etapas rápidas para ativar seu espaço.
            </p>
          </motion.div>

          <motion.div variants={fadeSlideUp} className="space-y-3">
            <StepItem number={1} text="Cadastre sua identidade" active />
            <StepItem number={2} text="Finalize seu perfil" />
          </motion.div>
        </motion.div>
      </section>

      {/* Coluna direita — Formulário */}
      <section className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden">
        <motion.div
          className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-medium tracking-tight">Criar novo perfil</h2>
            <p className="text-white/40 text-sm">
              Informe seus dados básicos para começar a jornada.
            </p>
          </div>

          <SocialButton icon={<GoogleIcon />} label="Continuar com Google" />

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="mx-4 bg-black px-4 text-xs font-medium text-white/40 uppercase tracking-widest">
              Ou
            </span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          {erro && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">
              Conta criada com sucesso! Redirecionando...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Tipo de perfil
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTipoPerfil('lead')}
                  className={`h-11 rounded-xl text-sm font-medium transition ${
                    tipoPerfil === 'lead'
                      ? 'bg-brand-primary text-white ring-1 ring-brand-primary'
                      : 'bg-brand-gray text-white hover:bg-white/5'
                  }`}
                >
                  Lead
                </button>
                <button
                  type="button"
                  onClick={() => setTipoPerfil('corretor')}
                  className={`h-11 rounded-xl text-sm font-medium transition ${
                    tipoPerfil === 'corretor'
                      ? 'bg-brand-primary text-white ring-1 ring-brand-primary'
                      : 'bg-brand-gray text-white hover:bg-white/5'
                  }`}
                >
                  Corretor
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputGroup
                label="Nome"
                placeholder="João"
                value={primeiroNome}
                onChange={setPrimeiroNome}
                required
              />
              <InputGroup
                label="Sobrenome"
                placeholder="Silva"
                value={sobrenome}
                onChange={setSobrenome}
                required
              />
            </div>

            <InputGroup
              label="E-mail"
              placeholder="voce@email.com"
              type="email"
              value={email}
              onChange={setEmail}
              required
            />

            <InputGroup
              label="CPF"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={setCpf}
              required
            />

            {tipoPerfil === 'corretor' && (
              <InputGroup
                label="CRECI"
                placeholder="Ex: 12345-F"
                value={creci}
                onChange={setCreci}
                required
              />
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border-none bg-brand-gray px-4 pr-11 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-white/30">Requer no mínimo 8 caracteres.</p>
            </div>

            <button
              type="submit"
              disabled={carregando || sucesso}
              className="group mt-4 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-white pl-6 pr-2 font-semibold text-[#0a0400] transition hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(48,84,255,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-brand-primary" />
                  Criando conta...
                </>
              ) : (
                <>
                  <span>Criar conta</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary transition-colors group-hover:bg-brand-primary-hover">
                    <ArrowRight className="h-5 w-5 text-white" strokeWidth={2} />
                  </span>
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-white/40 text-center">
            Já faz parte da equipe?{' '}
            <Link
              href="/login"
              className="font-medium text-brand-accent transition hover:text-white hover:underline"
            >
              Entrar
            </Link>
          </p>
        </motion.div>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function StepItem({
  number,
  text,
  active = false,
}: {
  number: number;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition ${
        active
          ? 'bg-white text-black border border-white'
          : 'bg-brand-gray text-white border-none'
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          active ? 'bg-brand-primary text-white' : 'bg-white/10 text-white/40'
        }`}
      >
        {number}
      </span>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

function SocialButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-center gap-3 bg-black border border-white/10 rounded-xl h-11 hover:bg-white/5 transition"
    >
      {icon}
      <span className="text-sm font-medium text-white">{label}</span>
    </button>
  );
}

function InputGroup({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  required = false,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border-none bg-brand-gray px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
      />
    </div>
  );
}
