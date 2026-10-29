'use client';

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppRole, canAccessPage, homeForRole, isAdminRole, isPrivatePage } from '@/lib/auth-policy';
import { withRequestTimeout } from '@/lib/client-request';

interface Profile {
  id: string;
  nome_completo: string;
  email: string;
  cpf?: string;
  creci?: string;
  role: AppRole;
  criado_em: string;
}

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null;
  role: AppRole | null;
  isLead: boolean;
  isCorretor: boolean;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const requestVersion = useRef(0);

  const fetchMe = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      const body = await withRequestTimeout(async signal => {
        const response = await fetch('/api/auth/me', { signal, credentials: 'same-origin', cache: 'no-store' });
        return response.ok ? await response.json() : null;
      });
      if (version === requestVersion.current) setProfile(body?.perfil ?? null);
    } catch {
      if (version === requestVersion.current) setProfile(null);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  const refreshProfile = fetchMe;

  useEffect(() => {
    // Validar novamente ao navegar também cobre conteúdo pré-carregado antes do logout.
    async function loadSession() { await fetchMe(); }
    void loadSession();
  }, [fetchMe, pathname]);

  useEffect(() => {
    const expire = () => {
      requestVersion.current++;
      setProfile(null);
      setLoading(false);
      try { sessionStorage.removeItem('correia-assistente'); } catch { /* Armazenamento opcional. */ }
    };
    const checkOnFocus = () => { void fetchMe(); };
    const checkOnRestore = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setLoading(true);
        void fetchMe();
      }
    };
    window.addEventListener('correia:session-expired', expire);
    window.addEventListener('focus', checkOnFocus);
    window.addEventListener('pageshow', checkOnRestore);
    return () => {
      window.removeEventListener('correia:session-expired', expire);
      window.removeEventListener('focus', checkOnFocus);
      window.removeEventListener('pageshow', checkOnRestore);
    };
  }, [fetchMe]);

  const privatePage = isPrivatePage(pathname);
  const allowed = profile && canAccessPage(profile.role, pathname);
  useEffect(() => {
    if (privatePage && !loading) {
      if (!profile) window.location.replace('/login');
      else if (!canAccessPage(profile.role, pathname)) window.location.replace(homeForRole(profile.role));
    }
  }, [privatePage, loading, profile, pathname]);

  // Não deixar conteúdo de uma sessão antiga visível enquanto redireciona.
  if (privatePage && (loading || !profile || !allowed)) {
    return <div role="status" className="min-h-screen flex items-center justify-center bg-slate-950">Verificando sessão...</div>;
  }

  const role = profile?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user: profile,
        profile,
        role,
        isLead: role === 'lead',
        isCorretor: role !== null && role !== 'lead',
        isAdmin: isAdminRole(role),
        loading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
