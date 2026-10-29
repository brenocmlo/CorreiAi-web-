import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserSupabaseClient } from '../src/lib/supabase.ts';
import { withRequestTimeout } from '../src/lib/client-request.ts';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture-storage.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fixture-public-key';

test('SDK real envia PNG pelo fetch controlado, sem rede externa', async () => {
  const calls = [];
  const client = createBrowserSupabaseClient(async (input, options) => {
    calls.push({ url: String(input), method: options.method, body: options.body });
    return Response.json({ Key: 'imoveis_imagens/fixture/imagem.png' });
  });
  const image = new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT2kAAAAASUVORK5CYII=', 'base64')], 'imagem.png', { type: 'image/png' });
  const result = await client.storage.from('imoveis_imagens').uploadToSignedUrl('fixture/imagem.png', 'fixture-token', image, { contentType: image.type });
  assert.equal(result.error, null);
  assert.equal(result.data.path, 'fixture/imagem.png');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'PUT');
  assert.match(calls[0].url, /object\/upload\/sign\/imoveis_imagens\/fixture\/imagem.png/);
  assert.ok(calls[0].body instanceof FormData);
});

test('upload travado cancela o fetch e encerra a espera com erro', async () => {
  let aborted = false;
  await assert.rejects(withRequestTimeout(async signal => {
    const client = createBrowserSupabaseClient(async () => new Promise((_, reject) => {
      signal.addEventListener('abort', () => { aborted = true; reject(new DOMException('Aborted', 'AbortError')); });
    }));
    await client.storage.from('imoveis_imagens').uploadToSignedUrl('fixture/imagem.png', 'fixture-token', new Blob(['fixture']));
  }, 20, 'O envio da imagem demorou.'), /imagem demorou/);
  assert.equal(aborted, true);
});
