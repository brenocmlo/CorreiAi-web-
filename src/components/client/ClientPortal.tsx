"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { requestJson, withRequestTimeout } from "@/lib/client-request";
import { useAuth } from "@/hooks/useAuth";
type Document = {
  id: string;
  nome: string;
  tamanho: number;
  status: string;
  observacao: string;
};
type Message = {
  id: string;
  autor_id: string;
  mensagem: string;
  criado_em: string;
};
type Attendance = {
  id: string;
  nome: string;
  etapa: string;
  portal_liberado: boolean;
  cliente_perfil_id?: string | null;
};
type Detail = {
  lead: Attendance;
  corretor: string;
  documentos: Document[];
  mensagens: Message[];
};
const statuses: Record<string, string> = {
  recebido: "Recebido",
  em_analise: "Em análise",
  aprovado: "Conferido pelo corretor",
  reenviar: "Reenvio solicitado",
};
const stages: Record<string, string> = {
  novo: "Novo atendimento",
  em_atendimento: "Em atendimento",
  visita_agendada: "Visita agendada",
  proposta: "Proposta",
  fechado: "Fechado",
};
const button =
  "min-h-11 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50";
const field =
  "w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white focus:outline-2 focus:outline-indigo-400";
export function ClientPortal({ staffLeadId }: { staffLeadId?: string }) {
  const { profile, refreshProfile } = useAuth();
  const [list, setList] = useState<Attendance[]>([]),
    [id, setId] = useState(staffLeadId ?? "");
  const [detail, setDetail] = useState<Detail | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [code, setCode] = useState(""),
    [invitation, setInvitation] = useState("");
  const [message, setMessage] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [revision, setRevision] = useState<Record<string, string>>({});
  const requestVersion = useRef({ value: 0 });
  const load = useCallback(async () => {
    const version = ++requestVersion.current.value;
    setError("");
    setLoading(true);
    try {
      if (!staffLeadId) {
        const data = await requestJson<{ atendimentos: Attendance[] }>(
          "/api/cliente",
        );
        if (version === requestVersion.current.value)
          setList(data.atendimentos);
      }
      if (id) {
        const data = await requestJson<Detail>(
          `/api/cliente/atendimento/${id}`,
        );
        if (version === requestVersion.current.value) setDetail(data);
      } else if (version === requestVersion.current.value) setDetail(null);
    } catch (e) {
      if (version === requestVersion.current.value) {
        setError((e as Error).message);
        setDetail(null);
      }
    } finally {
      if (version === requestVersion.current.value) setLoading(false);
    }
  }, [id, staffLeadId]);
  useEffect(() => {
    async function fetchAttendance() {
      await load();
    }
    void fetchAttendance();
    const counter = requestVersion.current;
    return () => {
      counter.value++;
    };
  }, [load]);
  async function act(operation: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function release(liberado: boolean) {
    await act(async () => {
      const data = await requestJson<{ codigo: string | null; email: string }>(
        `/api/leads/${id}/portal`,
        { method: "POST", body: JSON.stringify({ liberado }) },
      );
      setInvitation(data.codigo ?? "");
      setNotice(
        liberado
          ? "Portal liberado. O cliente já vinculado pode acessar."
          : "Acesso do cliente pausado.",
      );
    });
  }
  async function upload() {
    if (!file) return;
    await act(async () => {
      const data = new FormData();
      data.set("arquivo", file);
      await withRequestTimeout(
        async (signal) => {
          const res = await fetch(`/api/cliente/atendimento/${id}`, {
            method: "POST",
            body: data,
            signal,
            credentials: "same-origin",
            cache: "no-store",
          });
          const body = await res.json().catch(() => null);
          if (res.status === 401)
            window.dispatchEvent(new Event("correia:session-expired"));
          if (!res.ok)
            throw new Error(body?.error ?? "Não foi possível enviar.");
        },
        45000,
        "O envio demorou. Atualize a lista antes de repetir para evitar duplicidade.",
      );
      setFile(null);
      setNotice(
        "Documento enviado com sucesso. Aguarde a conferência do corretor.",
      );
    });
  }
  return (
    <section
      aria-label={staffLeadId ? "Portal do cliente" : "Meu atendimento"}
      className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-slate-100 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">
            {staffLeadId ? "Portal do cliente" : "Meu atendimento"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Documentos e mensagens privados com o corretor responsável.
          </p>
        </div>
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => void load()}
          className="min-h-11 rounded-xl border border-slate-700 px-3 text-sm"
        >
          Atualizar
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-400/30 bg-emerald-950/40 p-3 text-sm text-emerald-200"
        >
          {notice}
        </p>
      )}
      {!staffLeadId && (
        <>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                const data = await requestJson<{ id: string }>("/api/cliente", {
                  method: "POST",
                  body: JSON.stringify({ codigo: code.trim() }),
                });
                setCode("");
                setId(data.id);
                await refreshProfile();
                setNotice("Convite aceito. Seu atendimento está disponível.");
              });
            }}
          >
            <label htmlFor="portal-code" className="text-sm font-medium">
              Recebeu um convite do corretor?
            </label>
            <p className="text-xs text-slate-400">
              Use a conta com o mesmo e-mail informado no atendimento. O convite
              vale por 7 dias.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="portal-code"
                className={field}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={64}
                autoComplete="off"
                placeholder="Cole o código de acesso"
                required
              />
              <button className={button} disabled={busy || !code.trim()}>
                Vincular atendimento
              </button>
            </div>
          </form>
          {list.length > 0 ? (
            <label className="block text-sm">
              Escolha seu atendimento
              <select
                className={`${field} mt-2`}
                value={id}
                onChange={(e) => setId(e.target.value)}
              >
                <option value="">Selecionar atendimento</option>
                {list.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} · {stages[a.etapa] ?? a.etapa}
                    {a.portal_liberado ? "" : " · acesso pausado"}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            !loading &&
            !error && (
              <p className="rounded-xl bg-slate-800/60 p-4 text-sm">
                Seu corretor poderá liberar este espaço em qualquer etapa da
                negociação. Quando receber o código, cole acima para começar.
              </p>
            )
          )}
        </>
      )}
      {loading && (
        <p role="status" className="text-sm text-slate-400">
          Carregando atendimento…
        </p>
      )}
      {detail && !loading && (
        <>
          <div className="rounded-xl bg-slate-800/50 p-3 text-sm">
            <p className="font-semibold">
              {detail.lead.nome} ·{" "}
              {stages[detail.lead.etapa] ?? detail.lead.etapa}
            </p>
            <p className="mt-1 text-slate-400">Corretor: {detail.corretor}</p>
          </div>
          {staffLeadId && (
            <div className="space-y-3">
              <p className="text-sm text-slate-300">
                Libere o portal durante a negociação, quando for necessário
                receber documentos ou conversar com o cliente.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={busy}
                  className={button}
                  onClick={() => void release(true)}
                >
                  {detail.lead.portal_liberado
                    ? detail.lead.cliente_perfil_id
                      ? "Manter acesso liberado"
                      : "Gerar novo convite"
                    : "Liberar portal"}
                </button>
                {detail.lead.portal_liberado && (
                  <button
                    disabled={busy}
                    className="min-h-11 rounded-xl border border-amber-400/40 px-4 text-sm text-amber-200"
                    onClick={() => void release(false)}
                  >
                    Pausar acesso
                  </button>
                )}
              </div>
              {invitation && (
                <div className="space-y-2 rounded-xl border border-indigo-400/40 bg-indigo-950/40 p-3">
                  <p className="text-sm">
                    Envie este código diretamente ao cliente. Ele deve criar uma
                    conta de cliente e entrar em{" "}
                    <strong>Meu atendimento</strong> com o mesmo e-mail do lead.
                    Novo convite invalida o anterior.
                  </p>
                  <label className="block text-xs">
                    Código válido por 7 dias
                    <input
                      readOnly
                      value={invitation}
                      className={`${field} mt-1 font-mono text-xs`}
                      onFocus={(e) => e.currentTarget.select()}
                    />
                  </label>
                  <p className="text-xs text-slate-400">
                    O código é mostrado somente agora. Nada foi enviado
                    automaticamente.
                  </p>
                </div>
              )}
            </div>
          )}
          {!detail.lead.portal_liberado ? (
            <p className="text-sm text-amber-200">
              O acesso aos arquivos e mensagens está pausado.
            </p>
          ) : (
            <>
              <div className="space-y-3 border-t border-slate-800 pt-5">
                <h3 className="font-semibold">Documentos</h3>
                <p className="text-xs text-slate-400">
                  PDF, JPG ou PNG · até 3 MB por arquivo. Envie apenas o que seu
                  corretor solicitar. A conferência aqui não representa
                  aprovação de crédito.
                </p>
                <label className="block text-sm">
                  Selecionar documento
                  <input
                    key={file ? "selected" : "empty"}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={busy}
                    className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:p-3 file:text-white"
                    onChange={(e) => {
                      const next = e.target.files?.[0] ?? null;
                      if (next && next.size > 3 * 1024 * 1024) {
                        setError("Envie um arquivo de até 3 MB.");
                        setFile(null);
                      } else {
                        setError("");
                        setFile(next);
                      }
                    }}
                  />
                </label>
                <button
                  className={button}
                  disabled={busy || !file}
                  onClick={() => void upload()}
                >
                  {busy ? "Aguarde…" : "Enviar documento"}
                </button>
                {!detail.documentos.length && (
                  <p className="text-sm text-slate-400">
                    Nenhum documento enviado ainda.
                  </p>
                )}
                <ul className="space-y-3">
                  {detail.documentos.map((doc) => (
                    <li
                      key={doc.id}
                      className="space-y-2 rounded-xl border border-slate-700 p-3"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <a
                          href={`/api/cliente/documentos/${doc.id}`}
                          className="break-all text-sm font-medium text-indigo-300 underline"
                        >
                          {doc.nome} ↗
                        </a>
                        <span className="text-xs text-slate-400">
                          {Math.ceil(doc.tamanho / 1024)} KB
                        </span>
                      </div>
                      <p className="text-sm text-emerald-200">
                        {statuses[doc.status] ?? doc.status}
                      </p>
                      {doc.observacao && (
                        <p className="whitespace-pre-wrap break-words text-sm text-slate-300">
                          {doc.observacao}
                        </p>
                      )}
                      {staffLeadId && (
                        <div className="space-y-2">
                          <label className="block text-xs">
                            Orientação para o cliente
                            <input
                              className={`${field} mt-1 text-sm`}
                              maxLength={500}
                              value={revision[doc.id] ?? ""}
                              onChange={(e) =>
                                setRevision({
                                  ...revision,
                                  [doc.id]: e.target.value,
                                })
                              }
                            />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {(
                              ["em_analise", "aprovado", "reenviar"] as const
                            ).map((status) => (
                              <button
                                key={status}
                                disabled={busy}
                                className="min-h-10 rounded-lg border border-slate-600 px-3 text-xs"
                                onClick={() =>
                                  void act(async () => {
                                    await requestJson(
                                      `/api/cliente/documentos/${doc.id}`,
                                      {
                                        method: "PATCH",
                                        body: JSON.stringify({
                                          status,
                                          observacao: revision[doc.id] ?? "",
                                        }),
                                      },
                                    );
                                    setNotice("Conferência atualizada.");
                                  })
                                }
                              >
                                {status === "aprovado"
                                  ? "Conferir documento"
                                  : status === "reenviar"
                                    ? "Solicitar reenvio"
                                    : "Analisar"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3 border-t border-slate-800 pt-5">
                <h3 className="font-semibold">
                  Conversa com {staffLeadId ? "o cliente" : "o corretor"}
                </h3>
                <p className="text-xs text-slate-400">
                  Mensagens do atendimento, separadas do assistente virtual.
                  Atualize para ver novas respostas.
                </p>
                <ol
                  aria-label="Mensagens do atendimento"
                  className="max-h-80 space-y-3 overflow-y-auto"
                >
                  {detail.mensagens.map((m) => (
                    <li
                      key={m.id}
                      className={`max-w-[95%] rounded-2xl p-3 text-sm ${m.autor_id === profile?.id ? "ml-auto bg-indigo-600/30" : "bg-slate-800"}`}
                    >
                      <p className="mb-1 text-xs font-semibold text-indigo-200">
                        {m.autor_id === profile?.id
                          ? "Você"
                          : m.autor_id === detail.lead.cliente_perfil_id
                            ? "Cliente"
                            : detail.corretor}
                      </p>
                      <p className="whitespace-pre-wrap break-words">
                        {m.mensagem}
                      </p>
                      <time className="mt-1 block text-[11px] text-slate-400">
                        {new Date(m.criado_em).toLocaleString("pt-BR")}
                      </time>
                    </li>
                  ))}
                </ol>
                {!detail.mensagens.length && (
                  <p className="text-sm text-slate-400">
                    Nenhuma mensagem ainda.
                  </p>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act(async () => {
                      await requestJson(`/api/cliente/atendimento/${id}`, {
                        method: "POST",
                        body: JSON.stringify({ mensagem: message }),
                      });
                      setMessage("");
                      setNotice("Mensagem enviada.");
                    });
                  }}
                  className="space-y-2"
                >
                  <label className="block text-sm">
                    Sua mensagem
                    <textarea
                      className={`${field} mt-2`}
                      rows={3}
                      maxLength={2000}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </label>
                  <button className={button} disabled={busy || !message.trim()}>
                    Enviar mensagem
                  </button>
                </form>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
