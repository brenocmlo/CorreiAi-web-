'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

// A proteção real é feita pelo middleware server-side (src/middleware.ts).
// Este componente apenas renderiza um loading enquanto o AuthContext hidrata.
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
