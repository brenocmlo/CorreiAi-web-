import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';

// Proteção local da demonstração sem consultar dados de imobiliárias reais.
// Os limites de empresas reais continuam distribuídos no Postgres.
export class DemoRequestLimiter {
  private origins = new Map<string, { minute: number; count: number }>();
  private hour = -1;
  private count = 0;
  constructor(
    private perMinute = 40,
    private perHour = 600,
  ) {}
  allow(subject: string, now = Date.now()) {
    const minute = Math.floor(now / 60000),
      hour = Math.floor(now / 3600000);
    if (hour !== this.hour) {
      this.hour = hour;
      this.count = 0;
    }
    for (const [key, bucket] of this.origins)
      if (bucket.minute !== minute) this.origins.delete(key);
    const bucket = this.origins.get(subject) ?? { minute, count: 0 };
    if (this.count >= this.perHour || bucket.count >= this.perMinute)
      return false;
    bucket.count++;
    this.count++;
    this.origins.set(subject, bucket);
    return true;
  }
}
const demoLimiter = new DemoRequestLimiter();
const salt = randomBytes(32);
export function demoAttendanceLimit(request: Request) {
  const address = (request.headers.get('x-forwarded-for') ?? 'unknown')
    .split(',')[0]
    .trim()
    .slice(0, 128);
  const subject = createHash('sha256')
    .update(salt)
    .update(address)
    .digest('hex');
  return demoLimiter.allow(subject)
    ? null
    : NextResponse.json(
        {
          error:
            'A demonstração recebeu muitas mensagens. Aguarde um minuto e tente novamente.',
        },
        {
          status: 429,
          headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
        },
      );
}
