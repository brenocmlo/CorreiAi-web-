import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
process.env.JWT_SECRET = "isolated-portal-fixture-secret-not-production-12345";
const { signToken } = await import("../src/lib/jwt.ts");
import { setServerSupabaseClientOverride } from "../src/lib/supabase.ts";
import * as clients from "../src/app/api/cliente/route.ts";
import * as thread from "../src/app/api/cliente/atendimento/[id]/route.ts";
import * as documents from "../src/app/api/cliente/documentos/[id]/route.ts";
import * as portal from "../src/app/api/leads/[id]/portal/route.ts";
const B = "11111111-1111-4111-8111-111111111111",
  C = "22222222-2222-4222-8222-222222222222",
  O = "33333333-3333-4333-8333-333333333333",
  L = "44444444-4444-4444-8444-444444444444",
  D = "55555555-5555-4555-8555-555555555555",
  A = "66666666-6666-4666-8666-666666666666";
const ctx = (id) => ({ params: Promise.resolve({ id }) });
function request(method = "GET", body, uid = C, role = "lead", headers = {}) {
  const token = uid
    ? signToken({
        uid,
        role,
        email: "client@example.invalid",
        nome_completo: "Fixture",
      })
    : "";
  const form = body instanceof FormData;
  return new NextRequest("http://localhost/api/cliente", {
    method,
    headers: {
      Cookie: "auth_token=" + token,
      Origin: "http://localhost",
      ...(form ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    ...(body !== undefined ? { body: form ? body : JSON.stringify(body) } : {}),
  });
}
function database() {
  const tables = {
    perfis: [
      {
        id: B,
        role: "corretor",
        ativo: true,
        imobiliaria_id: A,
        nome_completo: "Corretor Fixture",
      },
      {
        id: C,
        role: "lead",
        ativo: true,
        imobiliaria_id: A,
        email: "client@example.invalid",
      },
      { id: O, role: "lead", ativo: true, imobiliaria_id: A },
    ],
    imobiliarias: [{ id: A, ativo: true }],
    leads: [
      {
        id: L,
        nome: "Cliente Fixture",
        email: "client@example.invalid",
        corretor_id: B,
        cliente_perfil_id: C,
        portal_liberado: true,
        etapa: "em_atendimento",
      },
    ],
    cliente_documentos: [
      {
        id: D,
        lead_id: L,
        caminho: L + "/" + D + ".pdf",
        nome: "fixture.pdf",
        mime: "application/pdf",
        tamanho: 16,
        status: "recebido",
      },
    ],
    cliente_mensagens: [],
  };
  const calls = [],
    removed = [];
  let rpcError = false,
    uploadError = false,
    afterUpload = null;
  const db = {
    tables,
    calls,
    removed,
    setRpcError() {
      rpcError = true;
    },
    setUploadError() {
      uploadError = true;
    },
    onUpload(fn) {
      afterUpload = fn;
    },
    from(table) {
      const filters = [];
      let payload = null;
      return {
        select() {
          return this;
        },
        eq(k, v) {
          filters.push((r) => r[k] === v);
          return this;
        },
        order() {
          return this;
        },
        limit() {
          return this;
        },
        update(v) {
          payload = v;
          return this;
        },
        result(single = false) {
          let rows = (tables[table] ?? []).filter((r) =>
            filters.every((f) => f(r)),
          );
          if (payload) rows.forEach((r) => Object.assign(r, payload));
          return { data: single ? (rows[0] ?? null) : rows, error: null };
        },
        maybeSingle() {
          return Promise.resolve(this.result(true));
        },
        then(ok, bad) {
          return Promise.resolve(this.result()).then(ok, bad);
        },
      };
    },
    async rpc(name, args) {
      calls.push({ name, args });
      if (
        rpcError ||
        (tables.leads[0].portal_liberado === false &&
          name === "registrar_cliente_portal")
      )
        return { error: { code: "42501" } };
      if (name === "registrar_cliente_portal") {
        if (args.p_acao === "documento")
          tables.cliente_documentos.push({
            ...args.p_dados,
            lead_id: L,
            status: "recebido",
          });
        if (args.p_acao === "mensagem")
          tables.cliente_mensagens.push({
            id: D,
            autor_id: args.p_usuario,
            ...args.p_dados,
          });
      }
      return { data: L, error: null };
    },
    storage: {
      from(bucket) {
        assert.equal(bucket, "cliente_documentos");
        return {
          async upload(path, bytes, opts) {
            calls.push({ upload: path, bytes: bytes.length, opts });
            if (afterUpload) afterUpload();
            return { error: uploadError ? {} : null };
          },
          async remove(paths) {
            removed.push(...paths);
            return { error: null };
          },
          async download() {
            return {
              data: new Blob(["%PDF-1.4\nfixture"], {
                type: "application/pdf",
              }),
              error: null,
            };
          },
        };
      },
    },
  };
  setServerSupabaseClientOverride(db);
  return db;
}
afterEach(() => setServerSupabaseClientOverride(null));
function form(
  name = "renda.pdf",
  mime = "application/pdf",
  content = "%PDF-1.4\nfixture",
) {
  const f = new FormData();
  f.set("arquivo", new File([content], name, { type: mime }));
  return f;
}
test("APIs do portal exigem login e recusam origem externa", async () => {
  database();
  assert.equal(
    (await clients.GET(request("GET", undefined, null))).status,
    401,
  );
  assert.equal(
    (
      await clients.POST(
        request("POST", {}, C, "lead", { Origin: "https://evil.invalid" }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await thread.POST(
        request("POST", { mensagem: "oi" }, C, "lead", {
          "sec-fetch-site": "cross-site",
        }),
        ctx(L),
      )
    ).status,
    403,
  );
});
test("cliente vê apenas atendimentos vinculados e não pode liberar o próprio portal", async () => {
  database();
  assert.equal((await clients.GET(request())).status, 200);
  assert.deepEqual(
    (await (await clients.GET(request("GET", undefined, O))).json())
      .atendimentos,
    [],
  );
  assert.equal(
    (await portal.POST(request("POST", { liberado: true }), ctx(L))).status,
    404,
  );
});
test("outro cliente, outro corretor e administrador geral não leem documentos", async () => {
  const db = database();
  assert.equal(
    (await documents.GET(request("GET", undefined, O), ctx(D))).status,
    404,
  );
  db.tables.perfis[2].role = "corretor";
  assert.equal(
    (await documents.GET(request("GET", undefined, O, "corretor"), ctx(D)))
      .status,
    404,
  );
  db.tables.perfis[2].role = "super_admin";
  assert.equal(
    (await documents.GET(request("GET", undefined, O, "super_admin"), ctx(D)))
      .status,
    403,
  );
});
test("empresa diferente e corretor suspenso bloqueiam cliente vinculado", async () => {
  const db = database();
  db.tables.perfis[1].imobiliaria_id = null;
  assert.equal((await thread.GET(request(), ctx(L))).status, 404);
  db.tables.perfis[1].imobiliaria_id = A;
  db.tables.perfis[0].ativo = false;
  assert.equal((await thread.GET(request(), ctx(L))).status, 404);
});
test("portal pausado bloqueia leitura, envio e download; corretor vê controle", async () => {
  const db = database();
  db.tables.leads[0].portal_liberado = false;
  assert.equal((await thread.GET(request(), ctx(L))).status, 404);
  assert.equal(
    (await thread.POST(request("POST", { mensagem: "oi" }), ctx(L))).status,
    404,
  );
  assert.equal((await documents.GET(request(), ctx(D))).status, 404);
  assert.equal(
    (await thread.GET(request("GET", undefined, B, "corretor"), ctx(L))).status,
    200,
  );
});
test("convite nunca aceita identidade do corpo e transmite somente hash ao RPC", async () => {
  const db = database();
  const codigo = "ab".repeat(32);
  const res = await clients.POST(request("POST", { codigo, p_usuario: O }));
  assert.equal(res.status, 200);
  assert.equal(db.calls[0].args.p_usuario, C);
  assert.notEqual(db.calls[0].args.p_hash, codigo);
  db.setRpcError();
  assert.equal((await clients.POST(request("POST", { codigo }))).status, 409);
});
test("convite inválido e corretor tentando aceitar convite são bloqueados", async () => {
  database();
  assert.equal(
    (await clients.POST(request("POST", { codigo: "abc" }))).status,
    400,
  );
  assert.equal(
    (
      await clients.POST(
        request("POST", { codigo: "a".repeat(64) }, B, "corretor"),
      )
    ).status,
    403,
  );
});
test("responsável libera durante negociação sem mudar etapa e código não vai ao banco", async () => {
  const db = database();
  db.tables.leads[0].cliente_perfil_id = null;
  const res = await portal.POST(
    request("POST", { liberado: true, cliente_perfil_id: O }, B, "corretor"),
    ctx(L),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.match(body.codigo, /^[a-f0-9]{64}$/);
  assert.notEqual(db.calls[0].args.p_hash, body.codigo);
  assert.equal(db.calls[0].args.p_usuario, B);
  assert.equal(db.tables.leads[0].etapa, "em_atendimento");
});
test("upload confirma apenas após arquivo e metadados persistirem", async () => {
  const db = database();
  assert.equal(
    (await thread.POST(request("POST", form()), ctx(L))).status,
    201,
  );
  assert.equal(db.calls[0].opts.upsert, false);
  assert.match(db.calls[0].upload, new RegExp("^" + L + "/[a-f0-9-]+.pdf$"));
  assert.equal(db.calls[1].args.p_acao, "documento");
  assert.equal(db.calls[1].args.p_usuario, C);
});
test("arquivo disfarçado, tipo não aceito e corpo grande não chegam ao Storage", async () => {
  const db = database();
  for (const f of [
    form("x.pdf", "application/pdf", "<script>alert(1)</script>"),
    form("x.svg", "image/svg+xml", "<svg/>"),
    form("x.pdf", "text/html"),
  ])
    assert.equal((await thread.POST(request("POST", f), ctx(L))).status, 400);
  assert.equal(
    (
      await thread.POST(
        request("POST", form(), C, "lead", { "Content-Length": "9000000" }),
        ctx(L),
      )
    ).status,
    413,
  );
  assert.equal(db.calls.length, 0);
});
test("falha no Storage não cria registro e falha de registro remove objeto novo", async () => {
  let db = database();
  db.setUploadError();
  assert.equal(
    (await thread.POST(request("POST", form()), ctx(L))).status,
    503,
  );
  assert.equal(db.calls.length, 1);
  db = database();
  db.setRpcError();
  assert.equal(
    (await thread.POST(request("POST", form()), ctx(L))).status,
    409,
  );
  assert.equal(db.removed.length, 1);
});
test("revogação durante upload cancela confirmação e remove objeto", async () => {
  const db = database();
  db.onUpload(() => (db.tables.leads[0].portal_liberado = false));
  assert.equal(
    (await thread.POST(request("POST", form()), ctx(L))).status,
    409,
  );
  assert.equal(db.removed.length, 1);
});
test("download exige autorização e entrega anexo privado sem URL pública", async () => {
  database();
  const res = await documents.GET(request(), ctx(D));
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-disposition"), /^attachment/);
  assert.equal(res.headers.get("cache-control"), "private, no-store");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.match(await res.text(), /%PDF/);
});
test("cliente não aprova documento e revisão de reenvio exige orientação", async () => {
  const db = database();
  assert.equal(
    (
      await documents.PATCH(
        request("PATCH", { status: "aprovado", observacao: "" }),
        ctx(D),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await documents.PATCH(
        request("PATCH", { status: "reenviar", observacao: "" }, B, "corretor"),
        ctx(D),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await documents.PATCH(
        request(
          "PATCH",
          { status: "reenviar", observacao: "Envie uma imagem legível." },
          B,
          "corretor",
        ),
        ctx(D),
      )
    ).status,
    200,
  );
  assert.equal(db.calls[0].args.p_acao, "revisao");
});
test("SQL e HTML em mensagem são dados parametrizados, sem ação da IA", async () => {
  const db = database();
  const mensagem = "<script>alert(1)</script> '; DROP TABLE leads; --";
  assert.equal(
    (await thread.POST(request("POST", { mensagem, autor_id: O }), ctx(L)))
      .status,
    201,
  );
  assert.equal(db.calls[0].args.p_dados.mensagem, mensagem);
  assert.equal(db.calls[0].args.p_usuario, C);
  assert.equal(
    (await thread.POST(request("POST", { mensagem: "a".repeat(2001) }), ctx(L)))
      .status,
    400,
  );
});
