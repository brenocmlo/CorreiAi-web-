import type { NextRequest } from 'next/server';

export function requestOrigin(request: NextRequest): string {
  const url = new URL(request.nextUrl.origin);
  // NextURL normaliza loopback para localhost; Host preserva o endereço usado no navegador.
  const host = request.headers.get('host');
  if (url.hostname === 'localhost' && host) {
    try {
      const browserUrl = new URL(`${url.protocol}//${host}`);
      const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(browserUrl.hostname);
      if (loopback && browserUrl.port === url.port) url.host = browserUrl.host;
    } catch { /* Host inválido não altera a origem do destino. */ }
  }
  return url.origin;
}

// SameSite protege entre sites; Origin também impede alterações vindas de subdomínios.
export function isSameOriginRequest(request: NextRequest): boolean {
  const site = request.headers.get('sec-fetch-site');
  if (site === 'cross-site' || site === 'same-site') return false;
  const origin = request.headers.get('origin');
  // Clientes fora do navegador podem omitir ambos; a API ainda exige autorização.
  return !origin || origin === requestOrigin(request);
}
