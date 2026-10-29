// Local-only UI fixture: real Navbar/React and logout handler, no database or real credentials.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import { build } from 'esbuild';
import { NextRequest } from 'next/server.js';
import { POST as logout } from '../src/app/api/auth/logout/route.ts';

const port = 3217;
const origin = `http://127.0.0.1:${port}`;
const bundle = await build({
  stdin: {
    contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Navbar from './src/components/Navbar'; import NovoImovel from './src/app/imoveis/novo/page'; import Imoveis from './src/app/imoveis/page'; createRoot(document.getElementById('root')).render(<><Navbar/>{location.pathname==='/imoveis/novo'?<NovoImovel/>:location.pathname==='/imoveis'?<Imoveis/>:null}</>);`,
    resolveDir: process.cwd(), loader: 'tsx',
  },
  bundle: true, write: false, platform: 'browser', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [{ name: 'fixture-context', setup(builder) {
    // O chat real é validado separadamente em validate-assistant-ui.mjs.
    builder.onLoad({ filter: /[\\/]OpenChatButton\.tsx$/ }, () => ({ loader: 'jsx', contents: `import React from 'react';export function OpenChatButton({children,...props}){return <button type="button" {...props}>{children}</button>}` }));
    // Test image is generated in memory; this does not access local files or bypass the browser chooser.
    builder.onLoad({ filter: /[\\/]ImovelForm\.tsx$/ }, args => {
      const source = fs.readFileSync(args.path, 'utf8').replace(/<input\s+type="file"([\s\S]*?)\/>/, '<FixtureImagePicker$1/>');
      const picker = `function FixtureImagePicker({onChange, disabled, className, id}) { return <button id={id} type="button" disabled={disabled} className={className} onClick={()=>onChange({target:{files:[new File([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT2kAAAAASUVORK5CYII='),c=>c.charCodeAt(0))],'fixture.png',{type:'image/png'})]}})}>Selecionar PNG simulado</button> }`;
      return { contents: source + '\n' + picker, loader: 'tsx', resolveDir: path.dirname(args.path) };
    });
    builder.onResolve({ filter: /^(@\/hooks\/useAuth|@\/lib\/supabase|next\/navigation|next\/link)$/ }, args => ({ path: args.path, namespace: 'fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ loader: 'jsx', resolveDir: process.cwd(), contents:
      args.path === 'next/link' ? `import React from 'react'; export default function Link(props){return <a {...props}/>}` :
      args.path === 'next/navigation' ? `export function usePathname(){return location.pathname} export function useSearchParams(){return new URL(location.href).searchParams} const router={push:p=>location.assign(p),replace:p=>location.replace(p),back:()=>history.back()}; export function useRouter(){return router}` :
      args.path === '@/lib/supabase' ? `export function createBrowserSupabaseClient(fetcher){return {storage:{from(){return {async uploadToSignedUrl(path,token,file){try{const r=await (fetcher||fetch)('/__upload',{method:'PUT',body:file});if(!r.ok)throw new Error('Falha simulada no envio da imagem.');return {error:null}}catch(error){return {error}}}}}}}}` :
      `export function useAuth(){const profile={id:'fixture',role:'corretor',nome_completo:'Corretor de teste'};return {user:profile,profile,isLead:false,isAdmin:false,isCorretor:true,loading:false}}`,
    }));
  } }],
});
const css = (await postcss([tailwindcss()]).process(fs.readFileSync('src/app/globals.css', 'utf8').replace(/@import url\([^)]*\);/g, ''), { from: path.resolve('src/app/globals.css') })).css;
let posts = 0;
let scenario = 'success';
const properties = [];
const server = http.createServer(async (req, res) => {
  // CSP confines the fixture browser to this local origin, including nested frames.
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; form-action 'self'; frame-src 'self'; connect-src 'self'");
  res.setHeader('Cache-Control', 'no-store');
  const url = new URL(req.url, origin);
  if (url.pathname === '/__start') {
    scenario = url.searchParams.get('scenario') || 'success';
    res.writeHead(303, { Location: url.searchParams.get('page') === 'property' ? '/imoveis/novo' : '/dashboard', 'Set-Cookie': ['auth_token=fixture; HttpOnly; SameSite=Strict; Path=/', 'correia_atendimento=fixture; HttpOnly; SameSite=Strict; Path=/'] }); res.end(); return;
  }
  if (url.pathname === '/__mobile') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<title>Teste isolado mobile — CorreiAi</title><style>body{background:#111827;color:white;font:16px system-ui}iframe{width:390px;height:730px;border:1px solid #475569}h1{font-size:20px}</style><h1>CorreiAi · menu mobile · 390px · dados simulados</h1><iframe title="Aplicação mobile isolada" src="/__start?${url.searchParams}"></iframe>`); return;
  }
  if (url.pathname === '/bundle.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(bundle.outputFiles[0].text); return; }
  if (url.pathname === '/api/imoveis/imagem') { res.setHeader('Content-Type','image/png');res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT2kAAAAASUVORK5CYII=','base64'));return; }
  if (url.pathname === '/api/imoveis' || url.pathname === '/api/imoveis/upload-url' || url.pathname === '/__upload') {
    res.setHeader('Content-Type', 'application/json');
    if (scenario === 'list-hang' && req.method === 'GET') return;
    if ((scenario === 'save-error' && req.method === 'POST' && url.pathname === '/api/imoveis') || (scenario === 'upload-error' && url.pathname === '/__upload')) { res.writeHead(500); res.end(JSON.stringify({error:'Falha simulada. Tente novamente.'})); return; }
    if (url.pathname === '/api/imoveis/upload-url') { res.end(JSON.stringify({path:'fixture/image.png',token:'fixture-only'})); return; }
    if (url.pathname === '/__upload') { req.resume(); res.end('{}'); return; }
    if (req.method === 'POST') {
      let text=''; for await(const chunk of req) text+=chunk;
      const row={...JSON.parse(text),id:crypto.randomUUID(),criado_em:new Date().toISOString()};properties.push(row);
      console.log(`Fixture: imóvel salvo (${properties.length}); sem banco`);
      res.writeHead(201);res.end(JSON.stringify({imovel:row}));return;
    }
    res.end(JSON.stringify({imoveis:properties}));return;
  }
  if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
    posts++;
    const response = await logout(new NextRequest(url, { method: 'POST', headers: req.headers }));
    res.writeHead(response.status, { Location: response.headers.get('location'), 'Set-Cookie': response.headers.getSetCookie(), 'Cache-Control': 'no-store' }); res.end(); return;
  }
  if (url.pathname === '/login') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<title>Logout confirmado</title><style>${css}</style><main><h1>Logout confirmado</h1><p>Formulários recebidos: ${posts}</p><p>Cookie de sessão: ${/auth_token=fixture/.test(req.headers.cookie ?? '') ? 'PRESENTE — FALHA' : 'ausente'}</p><p>Cookie de atendimento: ${/correia_atendimento=fixture/.test(req.headers.cookie ?? '') ? 'PRESENTE — FALHA' : 'ausente'}</p><a href="/dashboard">Testar acesso à área privada</a></main>`); return;
  }
  if (['/dashboard','/assistente','/imoveis','/imoveis/novo'].includes(url.pathname)) {
    if (!/auth_token=fixture/.test(req.headers.cookie ?? '')) { res.writeHead(303, { Location: '/login' }); res.end(); return; }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<title>CorreiAi — fixture local</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><main style="padding:24px"><h1>Área do corretor</h1><p>Dados simulados. Nenhum acesso ao Supabase.</p><a href="/assistente">Abrir assistente</a></main><script src="/bundle.js"></script>`); return;
  }
  res.writeHead(404); res.end('Não encontrado');
});
server.listen(port, '127.0.0.1', () => console.log(`Fixture isolada: ${origin}/__mobile`));
