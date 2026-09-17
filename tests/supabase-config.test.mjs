import assert from 'node:assert/strict';
import test from 'node:test';

import {
  IMOVEIS_STORAGE_BUCKET,
  getBrowserSupabaseConfig,
  getServerSupabaseConfig,
} from '../src/lib/supabase-config.ts';

test('expõe o nome único do bucket de imagens', () => {
  assert.equal(IMOVEIS_STORAGE_BUCKET, 'imoveis_imagens');
});

test('lê a configuração pública do Supabase', () => {
  const config = getBrowserSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  });

  assert.deepEqual(config, {
    url: 'https://example.supabase.co',
    key: 'anon-key',
  });
});

test('lê a configuração privada do Supabase', () => {
  const config = getServerSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  });

  assert.deepEqual(config, {
    url: 'https://example.supabase.co',
    key: 'service-role-key',
  });
});

test('informa todas as variáveis ausentes em uma única mensagem', () => {
  assert.throws(
    () => getBrowserSupabaseConfig({}),
    /NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY/
  );
});

test('trata valor vazio como variável ausente', () => {
  assert.throws(
    () =>
      getServerSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: '   ',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      }),
    /NEXT_PUBLIC_SUPABASE_URL/
  );
});
