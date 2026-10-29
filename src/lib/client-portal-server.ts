import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "./api-auth";
import { createServerSupabaseClient } from "./supabase";
import { isUuid } from "./imoveis-input";
import { canUsePortal } from "./client-portal";
import { isSameOriginRequest } from "./request-origin";
export class PortalError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function portalError(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof PortalError
          ? error.message
          : "Não foi possível concluir. Tente novamente.",
    },
    {
      status: error instanceof PortalError ? error.status : 503,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
export async function portalAuth(request: NextRequest) {
  if (request.method !== "GET" && !isSameOriginRequest(request))
    throw new PortalError("Origem inválida.", 403);
  const actor = await getAuthFromRequest(request);
  if (!actor) throw new PortalError("Não autenticado.", 401);
  if (actor.role === "super_admin")
    throw new PortalError("Acesso negado.", 403);
  return actor;
}
export async function portalAccess(
  actor: Awaited<ReturnType<typeof portalAuth>>,
  id: string,
  configuring = false,
) {
  if (!isUuid(id)) throw new PortalError("Atendimento inválido.");
  const db = createServerSupabaseClient();
  const { data: lead, error } = await db
    .from("leads")
    .select("id,nome,email,etapa,corretor_id,cliente_perfil_id,portal_liberado")
    .eq("id", id)
    .maybeSingle();
  if (error)
    throw new PortalError("Portal indisponível. Tente novamente.", 503);
  if (!lead) throw new PortalError("Atendimento não encontrado.", 404);
  const { data: owner, error: ownerError } = await db
    .from("perfis")
    .select("id,ativo,imobiliaria_id,nome_completo")
    .eq("id", lead.corretor_id)
    .maybeSingle();
  const staff =
    ["corretor", "admin_corretora"].includes(actor.role) &&
    actor.uid === lead.corretor_id &&
    owner?.ativo &&
    actor.imobiliariaId === owner.imobiliaria_id;
  if (
    ownerError ||
    !owner ||
    !(configuring ? staff : canUsePortal(actor, lead, owner))
  )
    throw new PortalError("Portal não disponível para esta conta.", 404);
  return { db, lead, owner };
}
export async function portalJson(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > 6000)
    throw new PortalError("Solicitação muito grande.", 413);
  try {
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw new PortalError("Solicitação inválida.");
  }
}
