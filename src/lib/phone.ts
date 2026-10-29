export function phoneDigits(value: unknown): string | null {
  if (typeof value !== 'string' || !/^[\d\s()+.-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15 && !/^(\d)\1+$/.test(digits)
    ? digits
    : null;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const national =
    (digits.length === 12 || digits.length === 13) && digits.startsWith('55')
      ? digits.slice(2)
      : digits;
  if (national.length === 10 || national.length === 11)
    return `(${national.slice(0, 2)}) ${national.slice(2, -4)}-${national.slice(-4)}`;
  return `+${digits}`;
}

export function phoneLink(value: string): string | null {
  const digits = phoneDigits(value);
  return digits
    ? `tel:+${digits.length === 10 || digits.length === 11 ? '55' : ''}${digits}`
    : null;
}
