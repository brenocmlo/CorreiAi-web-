import assert from 'node:assert/strict';
import test from 'node:test';

import { parseImageMetadata, imagePath, isPublicImovelImageUrl } from '../src/lib/imoveis-upload.ts';

test('aceita apenas JPEG, PNG e WebP até 5 MB', () => {
  assert.deepEqual(parseImageMetadata({ name: 'foto.jpg', type: 'image/jpeg', size: 1024 }), {
    extension: 'jpg',
  });
  assert.match(parseImageMetadata({ name: 'foto.svg', type: 'image/svg+xml', size: 1024 }).error, /formato/i);
  assert.match(parseImageMetadata({ name: 'foto.png', type: 'image/png', size: 5 * 1024 * 1024 + 1 }).error, /5 MB/i);
  assert.match(parseImageMetadata({ name: 'foto.jpg', type: 'image/png', size: 1024 }).error, /formato/i);
});

test('nome do objeto é único e não incorpora caminho enviado pelo navegador', () => {
  assert.equal(
    imagePath('9c839930-4d66-4a36-a8b9-96e72253536d', 'webp', 'a1b2c3'),
    '9c839930-4d66-4a36-a8b9-96e72253536d/a1b2c3.webp'
  );
});

test('o cadastro só aceita URLs públicas do bucket configurado', () => {
  const projectUrl = 'https://correiai.supabase.co';
  assert.equal(isPublicImovelImageUrl(
    'https://correiai.supabase.co/storage/v1/object/public/imoveis_imagens/owner/foto.webp', projectUrl
  ), true);
  assert.equal(isPublicImovelImageUrl('https://evil.example/foto.webp', projectUrl), false);
  assert.equal(isPublicImovelImageUrl(
    'https://correiai.supabase.co.evil.example/storage/v1/object/public/imoveis_imagens/foto.webp', projectUrl
  ), false);
});
