type Environment = Record<string, string | undefined>;

export const IMOVEIS_STORAGE_BUCKET = 'imoveis_imagens';

function readRequiredEnvironment(
  environment: Environment,
  names: readonly string[]
): Record<string, string> {
  const missing = names.filter((name) => !environment[name]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Configure as variáveis ${missing.join(', ')} no arquivo .env.local.`
    );
  }

  return Object.fromEntries(
    names.map((name) => [name, environment[name]!.trim()])
  );
}

export function getServerSupabaseConfig(environment: Environment) {
  const values = readRequiredEnvironment(environment, [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]);

  return {
    url: values.NEXT_PUBLIC_SUPABASE_URL,
    key: values.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function getBrowserSupabaseConfig(environment: Environment) {
  const values = readRequiredEnvironment(environment, [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]);

  return {
    url: values.NEXT_PUBLIC_SUPABASE_URL,
    key: values.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}
