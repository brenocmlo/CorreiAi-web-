'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, MessageCircle, Phone, RotateCcw, X } from 'lucide-react';
import { AssistantProperties } from './AssistantProperties';
import { AssistantSummary } from './AssistantSummary';
import { formatPhone, phoneLink } from '@/lib/phone';
import { requestJson } from '@/lib/client-request';
import type {
  AssistantContext,
  AssistantProperty,
  AssistantResponse,
  CaptureStatus,
  ConversationMessage,
  Qualification,
} from '@/types/assistant';

type DisplayMessage = ConversationMessage & {
  properties?: AssistantProperty[];
};
const greeting: DisplayMessage = {
  role: 'assistant',
  text: 'Olá! Sou a assistente da CorreAI. Você quer comprar, alugar ou anunciar um imóvel?',
};
const defaultContext: AssistantContext = {
  catalogState: 'restricted',
  company: null,
};
export function AssistantChat({
  storageKey = 'correia-assistente:visitante:sem-vinculo',
  onClose,
}: {
  storageKey?: string;
  onClose?: () => void;
  embedded?: boolean;
}) {
  const [messages, setMessages] = useState<DisplayMessage[]>([greeting]),
    [input, setInput] = useState('');
  const [loading, setLoading] = useState(false),
    [initialized, setInitialized] = useState(false),
    [error, setError] = useState(''),
    [warning, setWarning] = useState('');
  const [qualification, setQualification] = useState<Qualification | null>(
      null,
    ),
    [capture, setCapture] = useState<CaptureStatus>('incompleto');
  const [context, setContext] = useState<AssistantContext>(defaultContext),
    [suggestions, setSuggestions] = useState([
      'Quero comprar',
      'Quero alugar',
      'Quero anunciar',
    ]);
  const [selectedId, setSelectedId] = useState<string>();
  const field = useRef<HTMLTextAreaElement>(null),
    scrollArea = useRef<HTMLDivElement>(null),
    busy = useRef(false),
    request = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 10000);
    async function restore() {
      try {
        const res = await fetch('/api/assistente', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('restore');
        const data = await res.json();
        if (!active) return;
        setContext(data.contexto ?? defaultContext);
        const history = data.atendimento?.historico;
        if (Array.isArray(history) && history.length) {
          const restored: DisplayMessage[] = history.slice(-30);
          const last = restored.at(-1);
          if (last?.role === 'assistant') last.properties = data.imoveis ?? [];
          setMessages(restored);
          setQualification(data.atendimento);
          setCapture(
            data.atendimento.permiteContato ? 'atualizado' : 'nao_autorizado',
          );
          setSelectedId(data.atendimento.imovelInteresseId ?? undefined);
          setSuggestions([]);
        } else {
          const cached = JSON.parse(
            sessionStorage.getItem(storageKey) || 'null',
          );
          if (
            Array.isArray(cached?.messages) &&
            cached.messages.length &&
            cached.messages.length <= 30 &&
            cached.messages.every(
              (m: ConversationMessage) =>
                m &&
                (m.role === 'user' || m.role === 'assistant') &&
                typeof m.text === 'string' &&
                m.text.length <= 2000,
            )
          )
            setMessages(cached.messages);
        }
      } catch {
        /* A recuperação não impede uma nova conversa. */
      } finally {
        clearTimeout(timer);
        if (active) setInitialized(true);
      }
    }
    void restore();
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
      request.current?.abort();
    };
  }, [storageKey]);
  useEffect(() => {
    if (!initialized) return;
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          messages: messages
            .map(({ role, text }) => ({ role, text }))
            .slice(-30),
        }),
      );
    } catch {
      /* Armazenamento opcional. */
    }
    const scroll = scrollArea.current;
    if (scroll)
      scroll.scrollTo({
        top: scroll.scrollHeight,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      });
  }, [messages, initialized, loading, storageKey]);

  async function submit(history: ConversationMessage[], propertyId?: string) {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError('');
    setWarning('');
    setSuggestions([]);
    const controller = new AbortController();
    request.current = controller;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 65000);
    try {
      const response = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.slice(-29),
          ...(propertyId ? { imovelId: propertyId } : {}),
        }),
        signal: controller.signal,
      });
      const data = (await response.json()) as AssistantResponse;
      if (!response.ok || !data.reply)
        throw new Error(
          data.error || 'Não consegui responder agora. Tente novamente.',
        );
      if (controller.signal.aborted) return;
      setMessages((previous) => {
        const lastCards = previous.findLast(
          (message) => message.properties?.length,
        )?.properties;
        const changed =
          JSON.stringify(lastCards) !== JSON.stringify(data.imoveis);
        const showAgain =
          /mostr|ve[rj]|opç|opçõ|opcao|opcoes|ajust|buscar|procuro|quero comprar/i.test(
            history.at(-1)?.text ?? '',
          );
        return [
          ...previous,
          {
            role: 'assistant',
            text: data.reply,
            properties: changed || showAgain ? data.imoveis : [],
          },
        ].slice(-30) as DisplayMessage[];
      });
      setQualification(data.qualificacao);
      setCapture(data.captura);
      setContext(data.contexto ?? defaultContext);
      setSuggestions(data.sugestoes ?? []);
      setSelectedId(data.qualificacao.imovelInteresseId ?? undefined);
      setWarning(data.aviso ?? '');
    } catch (err) {
      if (!controller.signal.aborted || timedOut)
        setError(
          err instanceof Error &&
            !['TimeoutError', 'AbortError'].includes(err.name)
            ? err.message
            : 'A resposta demorou. Sua mensagem foi mantida; tente novamente.',
        );
    } finally {
      clearTimeout(timer);
      busy.current = false;
      setLoading(false);
    }
  }
  function send(text = input, propertyId = selectedId) {
    if (!text.trim() || busy.current || !initialized) return;
    const next = [
      ...messages.map(({ role, text }) => ({ role, text })),
      { role: 'user' as const, text: text.trim() },
    ];
    setInput('');
    setMessages((previous) => [
      ...previous,
      { role: 'user', text: text.trim() },
    ]);
    if (propertyId) setSelectedId(propertyId);
    void submit(next, propertyId);
  }
  async function restart() {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError('');
    try {
      await requestJson('/api/assistente', { method: 'DELETE' });
      sessionStorage.removeItem(storageKey);
      setMessages([greeting]);
      setQualification(null);
      setCapture('incompleto');
      setSelectedId(undefined);
      setInput('');
      setWarning('');
      setSuggestions(['Quero comprar', 'Quero alugar', 'Quero anunciar']);
    } catch {
      setError('Não consegui iniciar uma nova conversa. Tente novamente.');
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  const contactLink = context.company?.telefone
    ? phoneLink(context.company.telefone)
    : null;
  return (
    <section
      aria-label="Conversa com a assistente imobiliária"
      className="flex h-full min-h-0 flex-col overflow-hidden bg-[#0b1120] text-slate-100"
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-slate-900 px-4 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-500/15 text-indigo-200">
          <MessageCircle aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold tracking-tight">CorreAI</h1>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {context.company?.nome ?? 'Seu atendimento imobiliário'}
          </p>
        </div>
        <button
          type="button"
          title="Nova conversa"
          aria-label="Iniciar nova conversa"
          onClick={() => void restart()}
          disabled={loading || !initialized}
          className="rounded-xl p-2.5 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-40"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
        </button>
        {onClose && (
          <button
            type="button"
            aria-label="Fechar chat"
            onClick={onClose}
            autoFocus
            className="rounded-xl p-2.5 text-slate-300 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-indigo-300"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        )}
      </header>
      {contactLink && context.company?.telefone && (
        <a
          href={contactLink}
          className="flex shrink-0 items-center justify-between gap-3 border-b border-white/5 px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5"
        >
          <span className="flex items-center gap-2">
            <Phone aria-hidden="true" className="h-3.5 w-3.5 text-indigo-300" />
            Contato oficial
          </span>
          <span className="font-medium text-indigo-200">
            {formatPhone(context.company.telefone)}
          </span>
        </a>
      )}
      <div
        ref={scrollArea}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5"
      >
        {initialized && context.catalogState === 'restricted' && (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-400">
            O catálogo é privado. Para ver imóveis, use uma conta vinculada à
            imobiliária.{' '}
            <Link
              href="/login"
              onClick={onClose}
              className="text-indigo-200 underline underline-offset-2"
            >
              Entrar
            </Link>
          </p>
        )}
        <div
          role="log"
          aria-label="Mensagens do atendimento"
          aria-live="polite"
          aria-relevant="additions"
          aria-busy={loading}
          className="space-y-5"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex min-w-0 flex-col gap-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <p
                className={`max-w-[92%] whitespace-pre-wrap break-words px-4 py-3 text-[14px] leading-relaxed ${message.role === 'user' ? 'rounded-2xl rounded-br-md bg-indigo-600 text-white' : 'rounded-2xl rounded-bl-md border border-white/[0.06] bg-slate-900 text-slate-200'}`}
              >
                <span className="sr-only">
                  {message.role === 'user' ? 'Você' : 'CorreAI'}:{' '}
                </span>
                {message.text}
              </p>
              {message.role === 'assistant' && !!message.properties?.length && (
                <AssistantProperties
                  properties={message.properties}
                  disabled={loading}
                  onDetails={onClose}
                  onSelect={(property) =>
                    send(
                      'Quero solicitar uma visita a este imóvel.',
                      property.id,
                    )
                  }
                />
              )}
            </div>
          ))}
          {loading && (
            <p
              role="status"
              className="flex items-center gap-2 px-1 text-xs text-slate-400"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-300" />
              Preparando sua resposta...
            </p>
          )}
        </div>
        {qualification && (
          <AssistantSummary value={qualification} status={capture} />
        )}
        {capture === 'criado' && (
          <p
            role="status"
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-relaxed text-emerald-200"
          >
            Seu atendimento foi registrado no funil do corretor.
            {qualification?.visitaSolicitada
              ? ' A visita ainda aguarda confirmação.'
              : ''}
          </p>
        )}
        {warning && (
          <p
            role="status"
            className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-200"
          >
            {warning}
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/25 bg-red-500/5 p-3 text-sm text-red-200"
          >
            <p>{error}</p>
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                void submit(
                  messages.map(({ role, text }) => ({ role, text })),
                  selectedId,
                )
              }
              className="mt-2 underline underline-offset-4"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
      <div className="shrink-0 border-t border-white/10 bg-slate-900/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {!!suggestions.length && !loading && (
          <div
            aria-label="Sugestões de resposta"
            className="mb-3 flex flex-wrap gap-2"
          >
            {suggestions.map((text) => (
              <button
                key={text}
                type="button"
                disabled={!initialized}
                onClick={() => send(text)}
                className="rounded-full border border-indigo-300/20 bg-indigo-400/5 px-3 py-2 text-xs text-indigo-200 transition hover:border-indigo-300/60 hover:bg-indigo-400/10 disabled:opacity-40"
              >
                {text}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="flex items-end gap-2 rounded-2xl border border-slate-700 bg-slate-950 p-2 focus-within:border-indigo-400/70"
        >
          <label htmlFor="mensagem-assistente" className="sr-only">
            Sua mensagem para a CorreAI
          </label>
          <textarea
            ref={field}
            id="mensagem-assistente"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                send();
              }
            }}
            rows={2}
            maxLength={2000}
            disabled={loading || !initialized}
            placeholder="Escreva sua mensagem..."
            className="max-h-32 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-relaxed text-white outline-none placeholder:text-slate-500 sm:text-sm"
          />
          <button
            type="submit"
            aria-label="Enviar mensagem"
            disabled={loading || !initialized || !input.trim()}
            className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 disabled:bg-slate-800 disabled:text-slate-500"
          >
            <ArrowUp aria-hidden="true" className="h-5 w-5" />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-500">
          Assistente virtual · Visitas dependem da confirmação do corretor.
        </p>
      </div>
    </section>
  );
}
