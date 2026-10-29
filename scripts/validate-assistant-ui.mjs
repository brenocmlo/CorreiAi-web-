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
// Private portal fixtures: never uses Supabase or real files/accounts.
const portalLeadId='99999999-9999-4999-8999-999999999999';
db.state.leads.push({id:portalLeadId,nome:'Ana · cliente de teste',email:'ana@example.invalid',etapa:'em_atendimento',corretor_id:BROKER_A,cliente_perfil_id:CLIENT_A,portal_liberado:true});
db.state.cliente_documentos=[];db.state.cliente_mensagens=[];
const fixtureFiles=new Map();
db.storage={from(){return {async upload(key,data){fixtureFiles.set(key,new Blob([data]));return {error:null}},async remove(keys){keys.forEach(key=>fixtureFiles.delete(key));return{error:null}},async download(key){return{data:fixtureFiles.get(key)??null,error:null}}}}};
const baseFixtureRpc=db.rpc;
db.rpc=async(name,args)=>{
 if(name==='consume_public_attendance')return baseFixtureRpc(name,args);
 const lead=db.state.leads.find(l=>l.id===args.p_lead);
 if(name==='configurar_cliente_portal'){lead.portal_liberado=args.p_liberado;return{error:null};}
 if(name==='registrar_cliente_portal'){
  if(!lead?.portal_liberado)return{error:{code:'42501'}};
  if(args.p_acao==='documento')db.state.cliente_documentos.push({...args.p_dados,lead_id:lead.id,status:'recebido',observacao:'',criado_em:new Date().toISOString()});
  if(args.p_acao==='mensagem')db.state.cliente_mensagens.push({id:crypto.randomUUID(),lead_id:lead.id,autor_id:args.p_usuario,...args.p_dados,criado_em:new Date().toISOString()});
  if(args.p_acao==='revisao')Object.assign(db.state.cliente_documentos.find(d=>d.id===args.p_dados.id),args.p_dados);
  return{error:null};
 }
 return{data:portalLeadId,error:null};
};
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
  '/api/cliente': await import('../src/app/api/cliente/route.ts'),
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
const portalHandlers={thread:await import('../src/app/api/cliente/atendimento/[id]/route.ts'),document:await import('../src/app/api/cliente/documentos/[id]/route.ts'),config:await import('../src/app/api/leads/[id]/portal/route.ts')};
const root = process.cwd(),
  port = Number(process.env.ASSISTANT_UI_PORT || 3218),
  origin = `http://127.0.0.1:${port}`;
const output = await build({
  stdin: {
    contents: `import React,{useEffect,useState} from 'react';import{createRoot}from'react-dom/client';import{AuthProvider}from'./src/contexts/AuthContext';import{ClientPortal}from'./src/components/client/ClientPortal';import{AssistantProvider}from'./src/contexts/AssistantContext';import{OpenChatButton}from'./src/components/assistant/OpenChatButton';import Sidebar from'./src/components/Sidebar';import ImoveisPage from'./src/app/imoveis/page';import{CompanyContactSettings}from'./src/components/CompanyContactSettings';import{CompanyPublicPageSettings}from'./src/components/CompanyPublicPageSettings';import{PublicAgencyLanding}from'./src/components/public-agency/PublicAgencyLanding';import{PublicPropertyDetail}from'./src/components/public-agency/PublicPropertyDetail';import{LandingNavbar}from'./src/components/landing/LandingNavbar';import{HeroSection}from'./src/components/landing/HeroSection';import{LandingMidShowcase}from'./src/components/landing/LandingMidShowcase';import{CinematicFooter}from'./src/components/landing/CinematicFooter';function DemoLanding(){return <div className="landing-root"><LandingNavbar/><HeroSection/><LandingMidShowcase/><CinematicFooter/></div>};import{publicAgencySlug}from'./src/lib/public-agency-path';function PublicFixture(){const[agency,setAgency]=useState(null),[property,setProperty]=useState(null),[error,setError]=useState('');const slug=publicAgencySlug(location.pathname),id=location.pathname.split('/imoveis/')[1];useEffect(()=>{fetch('/api/publico/imobiliarias/'+slug+(id?'/imoveis/'+id:'')).then(async r=>{if(!r.ok)throw new Error('Página não encontrada');return r.json()}).then(data=>{setAgency(data.imobiliaria);setProperty(data.imovel??null)}).catch(err=>setError(err.message))},[slug]);return agency?(property?<PublicPropertyDetail agency={agency} property={property}/>:<PublicAgencyLanding key={slug} agency={agency}/>):<p className="p-10">{error||'Carregando página...'}</p>};createRoot(document.getElementById('root')).render(<AuthProvider><AssistantProvider><Sidebar/><div className="border-b border-amber-500/20 bg-amber-500/5 px-6 py-2 text-xs text-amber-200">TESTE LOCAL · Dados fictícios · Nenhum acesso ao banco real</div>{publicAgencySlug(location.pathname)?<PublicFixture/>:location.pathname==='/admin'?<main className="mx-auto max-w-4xl p-6"><CompanyContactSettings/><CompanyPublicPageSettings/></main>:location.pathname==='/cliente'?<main className="mx-auto max-w-3xl p-4"><ClientPortal/></main>:location.pathname==='/portal-corretor'?<main className="mx-auto max-w-3xl p-4"><ClientPortal staffLeadId="99999999-9999-4999-8999-999999999999"/></main>:location.pathname==='/'?<DemoLanding/>:<ImoveisPage/>}<div className="px-6 pb-12"><OpenChatButton className="rounded-xl bg-indigo-600 px-5 py-3 text-white">Abrir atendimento sem sair desta página</OpenChatButton></div></AssistantProvider></AuthProvider>);`,
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
      .readFileSync('src/app/globals.css', 'utf8').concat('\n',fs.readFileSync('src/app/landing.css','utf8'))
      .replace(/@import url\([^)]*\);/g, ''),
    { from: path.resolve('src/app/globals.css') },
  )
).css;
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, origin);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https://images.unsplash.com",
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
      Location: url.searchParams.get('portal')==='1'?(profile.role==='lead'?'/cliente':'/portal-corretor'):profile.role === 'admin_corretora' ? '/admin' : '/imoveis',
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
  const portalMatch=url.pathname.match(/^\/api\/cliente\/(atendimento|documentos)\/([^/]+)$/);
  const portalConfig=url.pathname.match(/^\/api\/leads\/([^/]+)\/portal$/);
  const controller = (portalMatch?portalHandlers[portalMatch[1]==='atendimento'?'thread':'document']:portalConfig?portalHandlers.config:null) ??
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
      const bodyChunks=[];
      for await (const chunk of req) bodyChunks.push(Buffer.from(chunk));
      const body=Buffer.concat(bodyChunks);
      const request = new NextRequest(url, {
        method: req.method,
        headers: req.headers,
        ...(!['GET', 'HEAD'].includes(req.method)
          ? { body: body.length?body:undefined }
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
          id: portalMatch?.[2]??portalConfig?.[1]??publicMatch?.[2],
        }),
      });
      const headers = Object.fromEntries(response.headers);
      if (response.headers.getSetCookie().length)
        headers['set-cookie'] = response.headers.getSetCookie();
      res.writeHead(response.status, headers);
      res.end(Buffer.from(await response.arrayBuffer()));
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
