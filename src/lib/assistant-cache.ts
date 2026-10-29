const PREFIX = 'correia-assistente:';
export const assistantStorageKey = (
  accountId: string,
  companyId: string | null,
) => `${PREFIX}${accountId}:${companyId ?? 'sem-vinculo'}`;
export function clearAssistantCache() {
  try {
    for (const key of Object.keys(sessionStorage))
      if (key === 'correia-assistente' || key.startsWith(PREFIX))
        sessionStorage.removeItem(key);
  } catch {
    /* Armazenamento opcional. */
  }
}
