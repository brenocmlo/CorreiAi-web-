'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppRole, isAdminRole } from '@/lib/auth-policy';

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
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const { perfil } = await res.json();
        setProfile(perfil as Profile);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    await fetchMe();
  };

  useEffect(() => {
    async function loadSession() {
      await fetchMe();
      setLoading(false);
    }
    void loadSession();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Não foi possível encerrar a sessão.');
      setProfile(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

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
        logout,
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
