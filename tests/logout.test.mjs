import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/auth/logout/route.ts';

test('logout por formulário encerra os dois cookies e abre o login', async () => {
  const res=await POST(new NextRequest('https://correiai.vercel.app/api/auth/logout',{method:'POST'}));
  assert.equal(res.status,303);
  assert.equal(res.headers.get('location'),'https://correiai.vercel.app/login');
  for(const name of ['auth_token','correia_atendimento']) {
    const cookie=res.cookies.get(name);assert.equal(cookie.value,'');assert.equal(cookie.maxAge,0);assert.equal(cookie.path,'/');
  }
  assert.match(res.headers.get('cache-control'),/no-store/);
});
test('logout rejeita formulário de origem externa', async () => {
  const res=await POST(new NextRequest('https://correiai.vercel.app/api/auth/logout',{method:'POST',headers:{Origin:'https://external.invalid'}}));
  assert.equal(res.status,403);
});
test('logout local preserva 127.0.0.1 sem confundir a origem com localhost', async () => {
  const res=await POST(new NextRequest('http://127.0.0.1:3217/api/auth/logout',{method:'POST',headers:{Host:'127.0.0.1:3217',Origin:'http://127.0.0.1:3217'}}));
  assert.equal(res.status,303);
  assert.equal(res.headers.get('location'),'http://127.0.0.1:3217/login');
});
