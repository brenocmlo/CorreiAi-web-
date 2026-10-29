'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AssistantChat } from '@/components/assistant/AssistantChat';
import { assistantStorageKey } from '@/lib/assistant-cache';
import { publicAgencySlug } from '@/lib/public-agency-path';
import { getDemoAgency } from '@/lib/assistant-demo';

const ChatContext = createContext<{
  openChat: () => void;
  closeChat: () => void;
  refreshChat: () => void;
  startDemo: (slug: string) => void;
} | null>(null);
export function useAssistant() {
  const value = useContext(ChatContext);
  if (!value) throw new Error('AssistantProvider ausente.');
  return value;
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false),
    [mounted, setMounted] = useState(false),
    [visited, setVisited] = useState(false);
  const [revision, setRevision] = useState(0);
  const [selectedDemo, setSelectedDemo] = useState('horizonte');
  const dialog = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null);
  const { profile, loading } = useAuth();
  const pathname = usePathname();
  const publicSlug = publicAgencySlug(pathname);
  const demoSlug = pathname === '/' ? selectedDemo : null;
  const focusedPropertyId = publicSlug
    ? pathname.match(/\/imoveis\/([a-f0-9-]{36})$/)?.[1]
    : undefined;
  const openChat = useCallback(() => {
    opener.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setVisited(true);
    setOpen(true);
  }, []);
  const closeChat = useCallback(() => setOpen(false), []);
  const refreshChat = useCallback(() => {
    setRevision((value) => value + 1);
    openChat();
  }, [openChat]);
  const startDemo = useCallback(
    (slug: string) => {
      if (!getDemoAgency(slug)) return;
      setSelectedDemo(slug);
      openChat();
    },
    [openChat],
  );
  const key = demoSlug
    ? `correia-assistente:demo:${demoSlug}`
    : publicSlug
      ? `correia-assistente:publico:${publicSlug}`
      : assistantStorageKey(
          profile?.id ?? 'visitante',
          profile?.imobiliaria_id ?? null,
        );
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);
  useEffect(() => {
    const target = dialog.current;
    if (!target) return;
    if (open && !target.open) {
      target.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
        if (target.open) target.close();
      };
    }
    if (!open && target.open) target.close();
    if (!open && opener.current?.isConnected) opener.current.focus();
  }, [open]);
  const hidden =
    pathname === '/login' ||
    pathname === '/cadastro' ||
    (profile?.role === 'super_admin' && !publicSlug && !demoSlug);
  return (
    <ChatContext.Provider
      value={{ openChat, closeChat, refreshChat, startDemo }}
    >
      {children}
      {!hidden && !open && !loading && (
        <button
          type="button"
          aria-label="Abrir chat da CorreAI"
          onClick={openChat}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex min-h-12 items-center gap-2 rounded-full border border-indigo-300/25 bg-indigo-600 px-5 py-3 font-medium text-white shadow-xl shadow-indigo-950/40 transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-300 sm:bottom-6 sm:right-6"
        >
          <MessageCircle aria-hidden="true" className="h-5 w-5" />
          <span className="text-sm">Falar com a CorreAI</span>
        </button>
      )}
      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            aria-label="Chat da CorreAI"
            onCancel={(event) => {
              event.preventDefault();
              closeChat();
            }}
            onClose={closeChat}
            className="fixed inset-0 m-0 h-dvh max-h-dvh w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 text-slate-100 backdrop:bg-slate-950/50 sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(760px,calc(100dvh-40px))] sm:w-[450px] sm:rounded-3xl sm:border sm:border-slate-700/80 sm:shadow-2xl sm:shadow-black/60"
          >
            {visited && (
              <AssistantChat
                key={`${key}:${revision}:${focusedPropertyId ?? ''}`}
                storageKey={key}
                publicSlug={publicSlug}
                demoSlug={demoSlug}
                onDemoChange={startDemo}
                initialSelectedId={focusedPropertyId}
                onClose={closeChat}
              />
            )}
          </dialog>,
          document.body,
        )}
    </ChatContext.Provider>
  );
}
