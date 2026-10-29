import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  portalAuth,
  portalAccess,
  portalError,
  portalJson,
  PortalError,
} from "@/lib/client-portal-server";
import {
  DOCUMENT_BUCKET,
  DOCUMENT_MAX,
  validateDocument,
} from "@/lib/client-portal";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await portalAuth(request);
    const { id } = await context.params;
    // The responsible broker can see release state even before enabling the portal.
    const { db, lead, owner } = await portalAccess(
      actor,
      id,
      actor.role !== "lead",
    );
    if (!lead.portal_liberado)
      return NextResponse.json({
        lead,
        corretor: owner.nome_completo,
        documentos: [],
        mensagens: [],
      });
    const [docs, msgs] = await Promise.all([
      db
        .from("cliente_documentos")
        .select("id,nome,mime,tamanho,status,observacao,criado_em")
        .eq("lead_id", id)
        .order("criado_em", { ascending: false })
        .limit(50),
      db
        .from("cliente_mensagens")
        .select("id,autor_id,mensagem,criado_em")
        .eq("lead_id", id)
        .order("criado_em", { ascending: false })
        .limit(50),
    ]);
    if (docs.error || msgs.error)
      throw new PortalError("Não foi possível carregar o atendimento.", 503);
    return NextResponse.json(
      {
        lead: {
          id: lead.id,
          nome: lead.nome,
          etapa: lead.etapa,
          portal_liberado: lead.portal_liberado,
          cliente_perfil_id: lead.cliente_perfil_id,
        },
        corretor: owner.nome_completo,
        documentos: docs.data,
        mensagens: msgs.data?.reverse(),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return portalError(error);
  }
}
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let cleanup: { remove: (paths: string[]) => Promise<unknown> } | null = null;
  let path = "";
  try {
    const actor = await portalAuth(request);
    const { id } = await context.params;
    const { db } = await portalAccess(actor, id);
    let action: string, payload: Record<string, unknown>;
    if (
      request.headers.get("content-type")?.startsWith("multipart/form-data")
    ) {
      const length = Number(request.headers.get("content-length"));
      if (length > DOCUMENT_MAX + 64 * 1024)
        throw new PortalError("Envie um arquivo de até 3 MB.", 413);
      // Bound the body before parsing multipart, including chunked requests.
      const reader = request.body?.getReader();
      if (!reader) throw new PortalError("Arquivo ausente.");
      const parts: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > DOCUMENT_MAX + 64 * 1024) {
          await reader.cancel();
          throw new PortalError("Envie um arquivo de até 3 MB.", 413);
        }
        parts.push(value);
      }
      const form = await new Response(Buffer.concat(parts), {
        headers: { "Content-Type": request.headers.get("content-type")! },
      }).formData();
      const file = form.get("arquivo");
      if (!(file instanceof File))
        throw new PortalError("Selecione um arquivo.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      let valid;
      try {
        valid = validateDocument(file.name, file.type, bytes);
      } catch (e) {
        throw new PortalError((e as Error).message);
      }
      const docId = randomUUID();
      path = `${id}/${docId}.${valid.ext}`;
      const storage = db.storage.from(DOCUMENT_BUCKET);
      const { error } = await storage.upload(path, bytes, {
        contentType: valid.mime,
        upsert: false,
      });
      if (error)
        throw new PortalError(
          "Falha no envio do arquivo. Tente novamente.",
          503,
        );
      cleanup = storage;
      action = "documento";
      payload = {
        id: docId,
        nome: valid.name,
        caminho: path,
        mime: valid.mime,
        tamanho: bytes.length,
      };
    } else {
      const body = await portalJson(request);
      if (
        typeof body.mensagem !== "string" ||
        !body.mensagem.trim() ||
        body.mensagem.trim().length > 2000
      )
        throw new PortalError("Escreva uma mensagem de até 2.000 caracteres.");
      action = "mensagem";
      payload = { mensagem: body.mensagem.trim() };
    }
    // Re-check inside a transaction: revocation during upload must fail closed.
    const { error } = await db.rpc("registrar_cliente_portal", {
      p_usuario: actor.uid,
      p_lead: id,
      p_acao: action,
      p_dados: payload,
    });
    if (error)
      throw new PortalError(
        "Não foi possível registrar. O portal pode ter sido pausado ou o limite de envios atingido. Atualize a lista antes de tentar novamente.",
        409,
      );
    cleanup = null;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (cleanup && path) await cleanup.remove([path]).catch(() => null);
    return portalError(error);
  }
}
