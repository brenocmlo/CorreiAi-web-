export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function openRouterChat(messages: ChatMessage[], maxTokens = 512): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY não configurada.');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'openrouter/free',
      messages,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) throw new Error(`OpenRouter respondeu HTTP ${response.status}.`);
  const payload: unknown = await response.json();
  const result = payload as { choices?: { message?: { content?: unknown } }[] };
  const content = result.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenRouter retornou uma resposta vazia.');
  }
  return content.trim();
}
