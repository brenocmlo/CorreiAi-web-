import { createHash } from "node:crypto";
export const DOCUMENT_BUCKET = "cliente_documentos";
export const DOCUMENT_MAX = 3 * 1024 * 1024;
type Actor = {
  uid: string;
  role: string;
  imobiliariaId?: string | null;
  imobiliaria_id?: string | null;
};
type PortalLead = {
  corretor_id: string;
  cliente_perfil_id?: string | null;
  portal_liberado?: boolean;
};
type Owner = { id: string; ativo: boolean; imobiliaria_id: string | null };
export function canUsePortal(
  actor: Actor,
  lead: PortalLead,
  owner: Owner,
): boolean {
  const company = actor.imobiliariaId ?? actor.imobiliaria_id;
  if (
    !lead.portal_liberado ||
    !owner.ativo ||
    !company ||
    company !== owner.imobiliaria_id
  )
    return false;
  return actor.role === "lead"
    ? lead.cliente_perfil_id === actor.uid
    : ["corretor", "admin_corretora"].includes(actor.role) &&
        lead.corretor_id === actor.uid;
}
export function inviteHash(code: string) {
  return createHash("sha256").update(code).digest("hex");
}
export function validateDocument(
  name: string,
  mime: string,
  bytes: Uint8Array,
) {
  if (!name || name.length > 160 || /[\\/\x00-\x1f]/.test(name))
    throw new Error("Nome de arquivo inválido.");
  if (!bytes.length || bytes.length > DOCUMENT_MAX)
    throw new Error("Envie um arquivo de até 3 MB.");
  const ext = name.split(".").pop()?.toLowerCase();
  const head = Buffer.from(bytes.subarray(0, 12));
  const valid =
    (ext === "pdf" &&
      mime === "application/pdf" &&
      head.subarray(0, 5).toString() === "%PDF-") ||
    (["jpg", "jpeg"].includes(ext ?? "") &&
      mime === "image/jpeg" &&
      head[0] === 255 &&
      head[1] === 216 &&
      head[2] === 255) ||
    (ext === "png" &&
      mime === "image/png" &&
      head
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
  if (!valid)
    throw new Error(
      "Arquivo inválido. Use PDF, JPG ou PNG com o formato correto.",
    );
  return { ext: ext!, mime, name };
}
