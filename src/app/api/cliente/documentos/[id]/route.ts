import { NextRequest } from "next/server";
import {
  portalAuth,
  portalAccess,
  portalError,
  portalJson,
  PortalError,
} from "@/lib/client-portal-server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { DOCUMENT_BUCKET } from "@/lib/client-portal";
import { isUuid } from "@/lib/imoveis-input";
async function documentAccess(request: NextRequest, id: string) {
  const actor = await portalAuth(request);
  if (!isUuid(id)) throw new PortalError("Documento inválido.");
  const db = createServerSupabaseClient();
  const { data: doc, error } = await db
    .from("cliente_documentos")
    .select("id,lead_id,caminho,mime,nome")
    .eq("id", id)
    .maybeSingle();
  if (error || !doc) throw new PortalError("Documento não encontrado.", 404);
  await portalAccess(actor, doc.lead_id);
  return { actor, db, doc };
}
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { actor, db, doc } = await documentAccess(
      request,
      (await context.params).id,
    );
    const { data, error } = await db.storage
      .from(DOCUMENT_BUCKET)
      .download(doc.caminho);
    if (error || !data)
      throw new PortalError("Arquivo indisponível. Tente novamente.", 503);
    await portalAccess(actor, doc.lead_id);
    const safe = doc.nome.replace(/[^a-zA-Z0-9._-]/g, "_");
    return new Response(data, {
      headers: {
        "Content-Type": doc.mime,
        "Content-Disposition": `attachment; filename="${safe}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox; default-src 'none'",
      },
    });
  } catch (error) {
    return portalError(error);
  }
}
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { actor, db, doc } = await documentAccess(
      request,
      (await context.params).id,
    );
    if (actor.role === "lead")
      throw new PortalError("Somente o corretor pode revisar documentos.", 403);
    const body = await portalJson(request);
    if (
      !["em_analise", "aprovado", "reenviar"].includes(String(body.status)) ||
      typeof body.observacao !== "string" ||
      body.observacao.length > 500
    )
      throw new PortalError("Revisão inválida.");
    if (body.status === "reenviar" && !body.observacao.trim())
      throw new PortalError("Explique ao cliente o que precisa ser reenviado.");
    const { error } = await db.rpc("registrar_cliente_portal", {
      p_usuario: actor.uid,
      p_lead: doc.lead_id,
      p_acao: "revisao",
      p_dados: {
        id: doc.id,
        status: body.status,
        observacao: body.observacao.trim(),
      },
    });
    if (error)
      throw new PortalError(
        "Não foi possível salvar a revisão. Atualize e tente novamente.",
        409,
      );
    return Response.json({ ok: true });
  } catch (error) {
    return portalError(error);
  }
}
