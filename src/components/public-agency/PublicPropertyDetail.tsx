import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  House,
  MapPin,
  BedDouble,
  Car,
  Ruler,
  Phone,
} from 'lucide-react';
import { publicAgencyPath } from '@/lib/public-agency-path';
import { phoneLink, formatPhone } from '@/lib/phone';
import { OpenChatButton } from '@/components/assistant/OpenChatButton';
import type { AssistantProperty } from '@/types/assistant';
import type { PublicAgencyInfo } from './PublicAgencyLanding';
export function PublicPropertyDetail({
  agency,
  property,
}: {
  agency: PublicAgencyInfo;
  property: AssistantProperty;
}) {
  const slug = agency.slug,
    tel = agency.telefone ? phoneLink(agency.telefone) : null;
  return (
    <main className="min-h-screen bg-[#080d18] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href={publicAgencyPath(slug)}
          className="inline-flex min-h-10 items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Voltar aos imóveis de {agency.nome}
        </Link>
        <div className="mt-6 grid gap-7 lg:grid-cols-[1.2fr_1fr]">
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-slate-800/50">
            {property.imagem_url ? (
              <Image
                unoptimized
                src={property.imagem_url}
                alt={`${property.tipo} em ${property.bairro}`}
                fill
                priority
                sizes="(max-width:1024px) 100vw, 60vw"
                className="object-cover"
              />
            ) : (
              <House aria-hidden="true" className="h-16 w-16 text-slate-600" />
            )}
          </div>
          <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-300">
              {agency.nome}
            </p>
            <h1 className="mt-4 text-3xl font-semibold capitalize">
              {property.tipo} em {property.bairro}
            </h1>
            <p className="mt-5 text-3xl font-semibold text-white">
              {property.valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="mt-4 flex gap-2 text-sm leading-relaxed text-slate-400">
              <MapPin aria-hidden="true" className="h-5 w-5 shrink-0" />
              {property.endereco}
            </p>
            <div className="mt-7 flex flex-wrap gap-4 border-y border-white/10 py-5 text-sm text-slate-300">
              {property.quartos != null && (
                <span className="inline-flex items-center gap-2">
                  <BedDouble className="h-4 w-4" aria-hidden="true" />
                  {property.quartos} quartos
                </span>
              )}
              {property.vagas != null && (
                <span className="inline-flex items-center gap-2">
                  <Car className="h-4 w-4" aria-hidden="true" />
                  {property.vagas} vagas
                </span>
              )}
              {property.metragem != null && (
                <span className="inline-flex items-center gap-2">
                  <Ruler className="h-4 w-4" aria-hidden="true" />
                  {property.metragem} m²
                </span>
              )}
            </div>
            {property.descricao && (
              <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                {property.descricao}
              </p>
            )}
            <OpenChatButton className="mt-8 flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white hover:bg-indigo-400">
              Conversar sobre este imóvel
            </OpenChatButton>
            {tel && (
              <a
                href={tel}
                className="mt-4 flex min-h-10 items-center justify-center gap-2 text-sm text-indigo-300"
              >
                <Phone aria-hidden="true" className="h-4 w-4" />
                {formatPhone(agency.telefone!)}
              </a>
            )}
            <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
              Valores e disponibilidade podem mudar. Visitas dependem da
              confirmação da equipe.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
