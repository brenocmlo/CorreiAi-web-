"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ClientPortal } from "@/components/client/ClientPortal";
export default function ClientPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
        <h1 className="mb-5 text-2xl font-bold text-white">Área do cliente</h1>
        <ClientPortal />
      </main>
    </ProtectedRoute>
  );
}
