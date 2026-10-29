export async function withRequestTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = 20000,
  message = 'A resposta demorou mais que o esperado. Verifique sua conexão e tente novamente.',
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(message));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([operation(controller.signal), timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function requestJson<T>(url: string, options: RequestInit = {}, timeoutMs = 20000): Promise<T> {
  const writing = options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase());
  const uncertain = 'Não foi possível confirmar o resultado. Confira a lista antes de tentar novamente para evitar duplicidade.';
  return withRequestTimeout(async signal => {
    const response = await fetch(url, {
      ...options, signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('correia:session-expired'));
    }
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error ?? 'Não foi possível concluir a solicitação. Tente novamente.');
    if (!body || typeof body !== 'object') throw new Error(writing ? uncertain : 'Resposta inválida do servidor. Tente novamente.');
    return body as T;
  }, timeoutMs, writing ? `A resposta demorou. ${uncertain}` : undefined).catch(error => {
    if (error instanceof TypeError) {
      throw new Error(writing ? `Não foi possível conectar ao servidor. ${uncertain}` : 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    }
    throw error;
  });
}
