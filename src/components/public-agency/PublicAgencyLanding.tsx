'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  BedDouble,
  Car,
  House,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  ShieldCheck,
} from 'lucide-react';
import { OpenChatButton } from '@/components/assistant/OpenChatButton';
import { PublicLeadForm } from './PublicLeadForm';
import { requestJson } from '@/lib/client-request';
import { formatPhone, phoneLink } from '@/lib/phone';
import { publicAgencyPath } from '@/lib/public-agency-path';
import type { AssistantProperty } from '@/types/assistant';
export type PublicAgencyInfo = {
  nome: string;
  telefone: string | null;
  slug: string;
};
const money = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

export function PublicAgencyLanding({ agency }: { agency: PublicAgencyInfo }) {
  const [properties, setProperties] = useState<AssistantProperty[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const fetchCatalog = useCallback(
    () =>
      requestJson<{ imoveis: AssistantProperty[] }>(
        `/api/publico/imobiliarias/${agency.slug}`,
      ),
    [agency.slug],
  );
  const load = async () => {
    setLoading(true);
    setError('');
    setProperties([]);
    try {
      const data = await fetchCatalog();
      setProperties(data.imoveis);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível consultar os imóveis.',
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    fetchCatalog()
      .then((data) => {
        if (active) setProperties(data.imoveis);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível consultar os imóveis.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchCatalog]);
  const tel = agency.telefone ? phoneLink(agency.telefone) : null;
  return (
    <div className="min-h-screen bg-[#080d18] text-slate-100">
      <nav
        aria-label="Imobiliária"
        className="border-b border-white/10 bg-[#080d18]/95 px-4 py-4 sm:px-6"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link
            href={publicAgencyPath(agency.slug)}
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/25 bg-amber-300/5 text-amber-200">
              <House className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block max-w-[200px] truncate text-sm font-semibold sm:max-w-none sm:text-base">
                {agency.nome}
              </span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Atendimento com CorreAI
              </span>
            </span>
          </Link>
          <Link
            href="/login"
            className="shrink-0 rounded-lg border border-white/10 px-3 py-2.5 text-xs text-slate-300 hover:border-white/25"
          >
            Área da imobiliária
          </Link>
        </div>
      </nav>
      <main>
        <section className="relative overflow-hidden border-b border-white/5 px-4 py-10 sm:px-6 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.13),transparent_60%)]"
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/5 px-3 py-1.5 text-xs text-amber-100">
                <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                Página de {agency.nome}
              </span>
              <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Um lugar para a sua
                <br />
                <span className="text-indigo-300">próxima história.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400">
                Conheça os imóveis de {agency.nome}, compare preços e converse
                com a CorreAI para encontrar opções que combinam com você.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#imoveis"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-amber-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-100"
                >
                  Ver imóveis
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </a>
                <OpenChatButton className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-white hover:bg-white/5">
                  <MessageCircle
                    aria-hidden="true"
                    className="h-4 w-4 text-indigo-300"
                  />
                  Tirar uma dúvida
                </OpenChatButton>
              </div>
              {tel && (
                <a
                  href={tel}
                  className="mt-7 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
                >
                  <Phone
                    aria-hidden="true"
                    className="h-4 w-4 text-indigo-300"
                  />
                  {formatPhone(agency.telefone!)}
                </a>
              )}
              <p className="mt-5 text-xs text-slate-500">
                Você está consultando exclusivamente o catálogo desta
                imobiliária.
              </p>
            </div>
            <PublicLeadForm slug={agency.slug} companyName={agency.nome} />
          </div>
        </section>
        <section
          id="imoveis"
          aria-label="Catálogo da imobiliária"
          className="scroll-mt-6 px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-indigo-300">
                  Encontre sua próxima chave
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Imóveis disponíveis
                </h2>
              </div>
              {!loading && !error && (
                <p className="text-sm text-slate-500">
                  {properties.length}{' '}
                  {properties.length === 1
                    ? 'opção neste catálogo'
                    : 'opções neste catálogo'}
                </p>
              )}
            </div>
            {loading ? (
              <p
                role="status"
                className="rounded-2xl border border-white/10 p-8 text-sm text-slate-400"
              >
                Carregando os imóveis de {agency.nome}...
              </p>
            ) : error ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-sm text-red-200"
              >
                {error}
                <button onClick={() => void load()} className="ml-3 underline">
                  Tentar novamente
                </button>
              </div>
            ) : !properties.length ? (
              <div className="rounded-2xl border border-white/10 p-8 text-center">
                <House
                  aria-hidden="true"
                  className="mx-auto h-8 w-8 text-slate-500"
                />
                <h3 className="mt-4 font-medium">Novas opções em breve</h3>
                <p className="mt-2 text-sm text-slate-400">
                  A imobiliária ainda não publicou imóveis disponíveis. Você
                  pode conversar com a equipe pelo atendimento.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <article
                    key={property.id}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60"
                  >
                    <Link
                      href={`${publicAgencyPath(agency.slug)}/imoveis/${property.id}`}
                      className="block"
                    >
                      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-slate-800/50">
                        {property.imagem_url ? (
                          <Image
                            unoptimized
                            src={property.imagem_url}
                            alt={`${property.tipo} em ${property.bairro}`}
                            fill
                            sizes="(max-width:768px) 100vw, 33vw"
                            className="object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <House
                            aria-hidden="true"
                            className="h-12 w-12 text-slate-600"
                          />
                        )}
                        <span className="absolute left-4 top-4 rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-medium capitalize text-white">
                          {property.tipo}
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-2xl font-semibold tracking-tight text-white">
                          {money(property.valor)}
                        </h3>
                        <p className="mt-3 flex items-start gap-1.5 text-sm text-slate-300">
                          <MapPin
                            aria-hidden="true"
                            className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300"
                          />
                          {property.bairro}
                        </p>
                        <p className="mt-1 truncate pl-5.5 text-xs text-slate-500">
                          {property.endereco}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-4 border-t border-white/5 pt-4 text-xs text-slate-400">
                          {property.quartos != null && (
                            <span className="inline-flex items-center gap-1.5">
                              <BedDouble
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                              {property.quartos} quartos
                            </span>
                          )}
                          {property.vagas != null && (
                            <span className="inline-flex items-center gap-1.5">
                              <Car aria-hidden="true" className="h-4 w-4" />
                              {property.vagas} vagas
                            </span>
                          )}
                          {property.metragem != null && (
                            <span className="inline-flex items-center gap-1.5">
                              <Ruler aria-hidden="true" className="h-4 w-4" />
                              {property.metragem} m²
                            </span>
                          )}
                        </div>
                        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300">
                          Conhecer imóvel
                          <ArrowUpRight
                            aria-hidden="true"
                            className="h-4 w-4"
                          />
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <footer className="border-t border-white/5 px-4 py-8 text-center text-xs text-slate-500">
        {agency.nome} · Atendimento com CorreAI. Disponibilidade e visitas
        sujeitas à confirmação da equipe.
      </footer>
    </div>
  );
}
