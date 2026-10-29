import test from "node:test";
import assert from "node:assert/strict";
import {
  canUsePortal,
  validateDocument,
  inviteHash,
} from "../src/lib/client-portal.ts";
const owner = { id: "broker", ativo: true, imobiliaria_id: "agency" };
const lead = {
  corretor_id: "broker",
  cliente_perfil_id: "client",
  portal_liberado: true,
};
test("portal pertence ao cliente vinculado e ao corretor responsável", () => {
  assert.equal(
    canUsePortal(
      { uid: "client", role: "lead", imobiliaria_id: "agency" },
      lead,
      owner,
    ),
    true,
  );
  assert.equal(
    canUsePortal(
      { uid: "broker", role: "corretor", imobiliaria_id: "agency" },
      lead,
      owner,
    ),
    true,
  );
  for (const a of [
    { uid: "other", role: "lead", imobiliaria_id: "agency" },
    { uid: "other", role: "corretor", imobiliaria_id: "agency" },
    { uid: "client", role: "lead", imobiliaria_id: "other" },
    { uid: "root", role: "super_admin", imobiliaria_id: "agency" },
  ])
    assert.equal(canUsePortal(a, lead, owner), false);
});
test("suspensão do corretor e revogação fecham documentos e mensagens", () => {
  const a = { uid: "client", role: "lead", imobiliaria_id: "agency" };
  assert.equal(
    canUsePortal(a, { ...lead, portal_liberado: false }, owner),
    false,
  );
  assert.equal(canUsePortal(a, lead, { ...owner, ativo: false }), false);
});
test("convite usa SHA256 e não contém código original", () => {
  assert.match(inviteHash("a".repeat(64)), /^[a-f0-9]{64}$/);
  assert.notEqual(inviteHash("a".repeat(64)), "a".repeat(64));
});
test("arquivo valida tamanho, extensão, MIME e assinatura real", () => {
  const pdf = Buffer.from("%PDF-1.4\nfixture");
  assert.equal(
    validateDocument("renda.pdf", "application/pdf", pdf).ext,
    "pdf",
  );
  assert.throws(() =>
    validateDocument("renda.pdf", "application/pdf", Buffer.from("<script>")),
  );
  assert.throws(() => validateDocument("x.html", "application/pdf", pdf));
  assert.throws(() => validateDocument("x.pdf", "text/html", pdf));
  assert.throws(() =>
    validateDocument(
      "x.pdf",
      "application/pdf",
      Buffer.alloc(3 * 1024 * 1024 + 1),
    ),
  );
  assert.throws(() => validateDocument("../x.pdf", "application/pdf", pdf));
});
