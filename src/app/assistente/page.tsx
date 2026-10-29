'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssistant } from '@/contexts/AssistantContext';
import { useAuth } from '@/hooks/useAuth';
import { homeForRole } from '@/lib/auth-policy';

// Compatibilidade com links antigos: abre a janela e volta à página da conta, sem tela de chat separada.
export default function AssistentePage() {
  const { openChat } = useAssistant(),
    { profile, loading } = useAuth(),
    router = useRouter();
  useEffect(() => {
    if (!loading) {
      openChat();
      router.replace(profile ? homeForRole(profile.role) : '/');
    }
  }, [loading, profile, openChat, router]);
  return (
    <p role="status" className="p-6 text-sm text-slate-400">
      Abrindo atendimento...
    </p>
  );
}
