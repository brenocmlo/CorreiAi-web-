// Local fixture: real components and handlers; database and provider stay in memory.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import { build } from 'esbuild';
import { NextRequest } from 'next/server.js';
import {
  assistantFixture,
  BROKER_A,
  CLIENT_A,
  ADMIN_A,
} from '../tests/helpers/assistant-fixture.mjs';
process.env.JWT_SECRET = 'ui-only-assistant-fixture-secret-123456';
process.env.OPENROUTER_API_KEY = 'fixture-provider-only';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.invalid';
const { signToken } = await import('../src/lib/jwt.ts');
const { setServerSupabaseClientOverride } = await import(
  '../src/lib/supabase.ts'
);
const db = assistantFixture();
Object.assign(db.state.imobiliarias[0], {
  public_slug: 'horizonte',
  atendimento_publico: true,
});
Object.assign(db.state.imobiliarias[1], {
  public_slug: 'outra-empresa',
  atendimento_publico: true,
});
setServerSupabaseClientOverride(db);
globalThis.fetch = async (url) => {
  if (!String(url).startsWith('https://openrouter.ai/'))
    throw new Error('External network disabled');
  return Response.json({
    choices: [
      {
        message: {
          content:
            'O banco analisa renda, documentação e o valor do imóvel. A aprovação depende dessa análise. Qual seu orçamento? Qual bairro? Quantos quartos?',
        },
      },
    ],
  });
};
const handlers = {
  '/api/auth/me': await import('../src/app/api/auth/me/route.ts'),
  '/api/assistente': await import('../src/app/api/assistente/route.ts'),
  '/api/imoveis': await import('../src/app/api/imoveis/route.ts'),
  '/api/imobiliaria': await import('../src/app/api/imobiliaria/route.ts'),
  '/api/auth/logout': await import('../src/app/api/auth/logout/route.ts'),
  '/api/leads/public': await import('../src/app/api/leads/public/route.ts'),
};
const publicHandlers = {
  catalog: await import('../src/app/api/publico/imobiliarias/[slug]/route.ts'),
  detail: await import(
    '../src/app/api/publico/imobiliarias/[slug]/imoveis/[id]/route.ts'
  ),
  image: await import(
    '../src/app/api/publico/imobiliarias/[slug]/imoveis/[id]/imagem/route.ts'
  ),
};
const root = process.cwd(),
  port = Number(process.env.ASSISTANT_UI_PORT || 3218),
  origin = `http://127.0.0.1:${port}`;
const output = await build({
  stdin: {
    contents: `import React,{useEffect,useState} from 'react';import{createRoot}from'react-dom/client';import{AuthProvider}from'./src/contexts/AuthContext';import{AssistantProvider}from'./src/contexts/AssistantContext';import{OpenChatButton}from'./src/components/assistant/OpenChatButton';import Navbar from'./src/components/Navbar';import ImoveisPage from'./src/app/imoveis/page';import{CompanyContactSettings}from'./src/components/CompanyContactSettings';import{CompanyPublicPageSettings}from'./src/components/CompanyPublicPageSettings';import{PublicAgencyLanding}from'./src/components/public-agency/PublicAgencyLanding';import{PublicPropertyDetail}from'./src/components/public-agency/PublicPropertyDetail';import{publicAgencySlug}from'./src/lib/public-agency-path';function PublicFixture(){const[agency,setAgency]=useState(null),[property,setProperty]=useState(null),[error,setError]=useState('');const slug=publicAgencySlug(location.pathname),id=location.pathname.split('/imoveis/')[1];useEffect(()=>{fetch('/api/publico/imobiliarias/'+slug+(id?'/imoveis/'+id:'')).then(async r=>{if(!r.ok)throw new Error('Página não encontrada');return r.json()}).then(data=>{setAgency(data.imobiliaria);setProperty(data.imovel??null)}).catch(err=>setError(err.message))},[slug]);return agency?(property?<PublicPropertyDetail agency={agency} property={property}/>:<PublicAgencyLanding key={slug} agency={agency}/>):<p className="p-10">{error||'Carregando página...'}</p>};createRoot(document.getElementById('root')).render(<AuthProvider><AssistantProvider><Navbar/><div className="border-b border-amber-500/20 bg-amber-500/5 px-6 py-2 text-xs text-amber-200">TESTE LOCAL · Dados fictícios · Nenhum acesso ao banco real</div>{publicAgencySlug(location.pathname)?<PublicFixture/>:location.pathname==='/admin'?<main className="mx-auto max-w-4xl p-6"><CompanyContactSettings/><CompanyPublicPageSettings/></main>:<ImoveisPage/>}<div className="px-6 pb-12"><OpenChatButton className="rounded-xl bg-indigo-600 px-5 py-3 text-white">Abrir atendimento sem sair desta página</OpenChatButton></div></AssistantProvider></AuthProvider>);`,
    resolveDir: root,
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  platform: 'browser',
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env.NEXT_PUBLIC_SUPABASE_URL': '"https://fixture.invalid"',
    'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': '"fixture-public"',
  },
  plugins: [
    {
      name: 'next-ui-fixture',
      setup(builder) {
        builder.onResolve(
          { filter: /^next\/(link|navigation|image)$/ },
          (args) => ({ path: args.path, namespace: 'fixture' }),
        );
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
          loader: 'jsx',
          resolveDir: root,
          contents:
            args.path === 'next/navigation'
              ? `export function usePathname(){return location.pathname}export function useSearchParams(){return new URL(location.href).searchParams}const router={push:p=>location.assign(p),replace:p=>location.replace(p),back:()=>history.back()};export function useRouter(){return router}`
              : args.path === 'next/image'
                ? `import React from'react';export default function Image({unoptimized,...props}){return <img {...props}/>} `
                : `import React from'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,
        }));
      },
    },
  ],
});
const css = (
  await postcss([tailwindcss()]).process(
    fs
      .readFileSync('src/app/globals.css', 'utf8')
      .replace(/@import url\([^)]*\);/g, ''),
    { from: path.resolve('src/app/globals.css') },
  )
).css;
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, origin);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:",
  );
  if (url.pathname === '/__start') {
    if (url.searchParams.get('role') === 'guest') {
      res.writeHead(303, {
        Location: '/',
        'Set-Cookie':
          'auth_token=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/',
      });
      res.end();
      return;
    }
    const id = ['lead', 'unlinked'].includes(url.searchParams.get('role'))
      ? CLIENT_A
      : url.searchParams.get('role') === 'admin'
        ? ADMIN_A
        : BROKER_A;
    const profile = db.state.perfis.find((p) => p.id === id);
    if (url.searchParams.get('role') === 'unlinked')
      profile.imobiliaria_id = null;
    const token = signToken({
      uid: id,
      role: profile.role,
      email: profile.email,
      nome_completo: profile.nome_completo,
    });
    res.writeHead(303, {
      Location: profile.role === 'admin_corretora' ? '/admin' : '/imoveis',
      'Set-Cookie': `auth_token=${token}; HttpOnly; SameSite=Strict; Path=/`,
    });
    res.end();
    return;
  }
  if (url.pathname === '/bundle.js') {
    res.setHeader('Content-Type', 'application/javascript');
    res.end(output.outputFiles[0].text);
    return;
  }
  const publicMatch = url.pathname.match(
    /^\/api\/publico\/imobiliarias\/([^/]+)(?:\/imoveis\/([^/]+)(\/imagem)?)?$/,
  );
  const controller =
    handlers[url.pathname] ??
    (publicMatch
      ? publicMatch[3]
        ? publicHandlers.image
        : publicMatch[2]
          ? publicHandlers.detail
          : publicHandlers.catalog
      : null);
  if (controller) {
    try {
      let body = '';
      for await (const chunk of req) body += chunk;
      const request = new NextRequest(url, {
        method: req.method,
        headers: req.headers,
        ...(!['GET', 'HEAD'].includes(req.method)
          ? { body: body || undefined }
          : {}),
      });
      const handler = controller[req.method];
      if (!handler) {
        res.writeHead(405);
        res.end();
        return;
      }
      const response = await handler(request, {
        params: Promise.resolve({
          slug: publicMatch?.[1],
          id: publicMatch?.[2],
        }),
      });
      const headers = Object.fromEntries(response.headers);
      if (response.headers.getSetCookie().length)
        headers['set-cookie'] = response.headers.getSetCookie();
      res.writeHead(response.status, headers);
      res.end(await response.text());
    } catch (error) {
      console.error(error.message);
      res.writeHead(500);
      res.end('{}');
    }
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(
    `<title>CorreAI · Atendimento · Teste isolado</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body><div id="root"></div><script src="/bundle.js"></script></body>`,
  );
});
server.listen(port, '127.0.0.1', () =>
  console.log(`UI isolada: ${origin}/__start · ?role=lead · ?role=admin`),
);
