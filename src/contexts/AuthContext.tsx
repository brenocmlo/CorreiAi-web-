'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface Profile {
  id: string;
  nome_completo: string;
  email: string;
  cpf?: string;
  creci?: string;
  role: 'corretor' | 'lead' | 'admin_corretora' | 'super_admin';
  criado_em: string;
}

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null;
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
    fetchMe().finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setProfile(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // user e profile apontam para o mesmo objeto — mantendo compatibilidade com código existente
    <AuthContext.Provider value={{ user: profile, profile, loading, logout, refreshProfile }}>
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
