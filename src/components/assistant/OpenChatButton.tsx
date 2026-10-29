'use client';
import type { ReactNode } from 'react';
import { useAssistant } from '@/contexts/AssistantContext';
export function OpenChatButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { openChat } = useAssistant();
  return (
    <button type="button" onClick={openChat} className={className}>
      {children}
    </button>
  );
}
