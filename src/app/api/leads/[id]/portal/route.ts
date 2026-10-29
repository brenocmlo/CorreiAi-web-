import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import {
  portalAuth,
  portalAccess,
  portalError,
  portalJson,
  PortalError,
} from "@/lib/client-portal-server";
import { inviteHash } from "@/lib/client-portal";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await portalAuth(request);
    const { id } = await context.params;
    const { db, lead } = await portalAccess(actor, id, true);
    const body = await portalJson(request);
    if (typeof body.liberado !== "boolean")
      throw new PortalError("Informe a liberação do portal.");
    if (
      body.liberado &&
      !lead.cliente_perfil_id &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email ?? "")
    )
      throw new PortalError(
        "Salve um e-mail válido no lead antes de gerar o convite.",
      );
    const codigo =
      body.liberado && !lead.cliente_perfil_id
        ? randomBytes(32).toString("hex")
        : null;
    const { error } = await db.rpc("configurar_cliente_portal", {
      p_usuario: actor.uid,
      p_lead: id,
      p_liberado: body.liberado,
      p_hash: codigo ? inviteHash(codigo) : null,
    });
    if (error)
      throw new PortalError(
        "Não foi possível alterar o acesso. Atualize e tente novamente.",
        409,
      );
    return NextResponse.json(
      { liberado: body.liberado, codigo, email: lead.email },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return portalError(error);
  }
}
