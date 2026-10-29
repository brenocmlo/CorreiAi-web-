import { NextRequest, NextResponse } from "next/server";
import {
  portalAuth,
  portalError,
  portalJson,
  PortalError,
} from "@/lib/client-portal-server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { inviteHash } from "@/lib/client-portal";
export async function GET(request: NextRequest) {
  try {
    const actor = await portalAuth(request);
    if (actor.role !== "lead")
      throw new PortalError("Área exclusiva do cliente.", 403);
    const { data, error } = await createServerSupabaseClient()
      .from("leads")
      .select("id,nome,etapa,portal_liberado")
      .eq("cliente_perfil_id", actor.uid)
      .order("criado_em", { ascending: false })
      .limit(50);
    if (error)
      throw new PortalError("Portal indisponível. Tente novamente.", 503);
    return NextResponse.json(
      { atendimentos: data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return portalError(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const actor = await portalAuth(request);
    if (actor.role !== "lead")
      throw new PortalError("Entre com sua conta de cliente.", 403);
    const { codigo } = await portalJson(request);
    if (typeof codigo !== "string" || !/^[a-f0-9]{64}$/.test(codigo.trim()))
      throw new PortalError("Código inválido. Copie o convite completo.");
    const { data, error } = await createServerSupabaseClient().rpc(
      "vincular_cliente_portal",
      { p_usuario: actor.uid, p_hash: inviteHash(codigo.trim()) },
    );
    if (error)
      throw new PortalError(
        "Convite indisponível. Confira o e-mail da sua conta e solicite um novo código ao corretor.",
        409,
      );
    return NextResponse.json({ id: data });
  } catch (error) {
    return portalError(error);
  }
}
