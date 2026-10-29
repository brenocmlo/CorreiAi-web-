export class RequestBodyError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

// Read the stream rather than trusting the caller's Content-Length header.
export async function boundedJson(request: Request, maxBytes: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError(400, 'JSON inválido.');
  const decoder = new TextDecoder();
  let bytes = 0, text = '';
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new RequestBodyError(413, 'A mensagem é muito grande. Reduza o texto e tente novamente.');
      }
      text += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError(400, 'JSON inválido.');
  } finally {
    reader.releaseLock();
  }
}
