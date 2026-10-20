'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, RotateCcw } from 'lucide-react';
import { AssistantProperties } from './AssistantProperties';
import { AssistantSummary } from './AssistantSummary';
import type { AssistantProperty, AssistantResponse, CaptureStatus, ConversationMessage, Qualification } from '@/types/assistant';

const STORAGE = 'correia-assistente';
const greeting: ConversationMessage = { role: 'assistant', text: 'Olá! Sou o assistente da CorreIA. Posso consultar os imóveis disponíveis, entender sua busca e encaminhar seu atendimento a um corretor. Você quer comprar, alugar ou investir? Que tipo de imóvel procura?' };

export function AssistantChat({ embedded = false }: { embedded?: boolean }) {
  const [messages, setMessages] = useState<ConversationMessage[]>([greeting]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [qualification, setQualification] = useState<Qualification | null>(null);
  const [capture, setCapture] = useState<CaptureStatus>('incompleto');
  const [properties, setProperties] = useState<AssistantProperty[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const bottom = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        const res = await fetch('/api/assistente', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
        const data = await res.json();
        if (cancelled) return;
        if (data.atendimento?.historico?.length) {
          setMessages(data.atendimento.historico);
          setQualification(data.atendimento);
          setCapture(data.atendimento.permiteContato ? 'atualizado' : 'nao_autorizado');
          setSelectedId(data.atendimento.imovelInteresseId ?? undefined);
        } else {
          const cached = JSON.parse(sessionStorage.getItem(STORAGE) || 'null');
          if (Array.isArray(cached?.messages) && cached.messages.length > 0 && cached.messages.length <= 30 && cached.messages.every((m: ConversationMessage) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.length <= 2000)) setMessages(cached.messages);
        }
      } catch { /* Falha na recuperação não impede iniciar um atendimento. */ }
      finally { if (!cancelled) setInitialized(true); }
    }
    void restore();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!initialized) return;
    try { sessionStorage.setItem(STORAGE, JSON.stringify({ messages: messages.slice(-30) })); } catch { /* Navegação privada pode bloquear armazenamento local. */ }
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, initialized]);

  async function submit(history: ConversationMessage[], propertyId?: string) {
    if (busy.current) return;
    busy.current = true;
    setLoading(true); setError(''); setWarning('');
    setMessages(history);
    try {
      const response = await fetch('/api/assistente', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-29), ...(propertyId ? { imovelId: propertyId } : {}) }),
        signal: AbortSignal.timeout(65000),
      });
      const data = await response.json() as AssistantResponse;
      if (!response.ok || !data.reply) throw new Error(data.error || 'Não consegui responder agora. Tente novamente.');
      setMessages([...history, { role: 'assistant' as const, text: data.reply }].slice(-30));
      setQualification(data.qualificacao); setCapture(data.captura); setProperties(data.imoveis);
      setSelectedId(data.qualificacao.imovelInteresseId ?? undefined);
      setWarning(data.aviso || '');
    } catch (err) {
      setError(err instanceof Error && err.name !== 'TimeoutError' ? err.message : 'A resposta demorou. Sua mensagem foi mantida; tente novamente.');
    } finally { busy.current = false; setLoading(false); field.current?.focus(); }
  }

  function send(text = input, propertyId = selectedId) {
    if (!text.trim() || loading || !initialized) return;
    setInput('');
    if (propertyId) setSelectedId(propertyId);
    void submit([...messages, { role: 'user', text: text.trim() }], propertyId);
  }

  async function restart() {
    if (busy.current) return;
    try {
      const response = await fetch('/api/assistente', { method: 'DELETE' });
      if (!response.ok) throw new Error('Não consegui iniciar uma nova conversa.');
      sessionStorage.removeItem(STORAGE);
      setMessages([greeting]); setQualification(null); setProperties([]); setCapture('incompleto');
      setSelectedId(undefined); setInput(''); setError(''); setWarning('');
    } catch { setError('Não consegui iniciar uma nova conversa. Tente novamente.'); }
  }

  const select = (property: AssistantProperty) => send(`Quero solicitar uma visita ao imóvel ${property.tipo} em ${property.endereco}, ${property.bairro}.`, property.id);

  return (
    <section aria-label="Conversa com o assistente imobiliário" className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 ${embedded ? 'h-[650px] max-h-[85dvh]' : 'min-h-[70dvh]'}`}>
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-6">
        <div><h1 className="font-semibold text-white">Assistente CorreIA</h1><p className="mt-1 text-xs text-slate-400">Imóveis reais e atendimento com um corretor</p></div>
        <button type="button" onClick={() => void restart()} disabled={loading} className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"><RotateCcw aria-hidden="true" className="h-3 w-3" />Nova conversa</button>
      </header>
      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        <div role="log" aria-live="polite" aria-relevant="additions" aria-busy={loading} className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[92%] rounded-xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%] ${message.role === 'user' ? 'bg-indigo-600 text-white' : 'border border-slate-700 bg-slate-900 text-slate-200'}`}>
                <span className="sr-only">{message.role === 'user' ? 'Você' : 'Assistente'}: </span><p className="whitespace-pre-wrap break-words">{message.text}</p>
              </div>
            </div>
          ))}
          {loading && <p role="status" className="text-sm text-slate-400">Consultando sua busca e os imóveis disponíveis…</p>}
        </div>
        {qualification && <AssistantSummary value={qualification} status={capture} />}
        <AssistantProperties properties={properties} disabled={loading} onSelect={select} />
        {warning && <p role="status" className="rounded-lg border border-amber-500/30 p-3 text-sm text-amber-200">{warning}</p>}
        {error && <div role="alert" className="rounded-lg border border-red-500/30 p-3 text-sm text-red-200"><p>{error}</p><button onClick={() => void submit(messages, selectedId)} disabled={loading} className="mt-2 underline underline-offset-4">Tentar novamente</button></div>}
        <div ref={bottom} />
      </div>
      <form onSubmit={(event) => { event.preventDefault(); send(); }} className="border-t border-slate-800 p-4 sm:px-6">
        <label htmlFor="mensagem-assistente" className="sr-only">Sua mensagem para o assistente</label>
        <div className="flex items-end gap-2">
          <textarea ref={field} id="mensagem-assistente" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} maxLength={2000} rows={2} disabled={loading || !initialized} placeholder="Conte o tipo de imóvel, bairro e orçamento…" className="min-w-0 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-indigo-400 disabled:opacity-60" />
          <button type="submit" aria-label="Enviar mensagem" disabled={loading || !initialized || !input.trim()} className="rounded-xl bg-indigo-600 p-3 text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-indigo-300 disabled:bg-slate-800 disabled:text-slate-500"><Send aria-hidden="true" className="h-5 w-5" /></button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">Informe apenas dados de contato para o atendimento. Visitas e condições comerciais dependem da confirmação do corretor.</p>
      </form>
    </section>
  );
}
