export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export class OpenRouterError extends Error {
  constructor(public readonly status: number) {
    super(`OpenRouter respondeu HTTP ${status}.`);
  }
}

export async function openRouterChat(messages: ChatMessage[], maxTokens = 512): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY não configurada.');
  const model = process.env.OPENROUTER_MODEL || 'mistralai/mistral-nemo';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      ...(model === 'mistralai/mistral-nemo' ? {
        provider: { sort: 'price', max_price: { prompt: 0.03, completion: 0.03 } },
      } : {}),
      messages,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) throw new OpenRouterError(response.status);
  const payload: unknown = await response.json();
  const result = payload as { choices?: { message?: { content?: unknown } }[] };
  const content = result.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenRouter retornou uma resposta vazia.');
  }
  return content.trim();
}
