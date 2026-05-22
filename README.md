# CorreIA — CRM Imobiliário Inteligente

Este é o repositório do projeto **CorreIA**, um CRM Imobiliário Inteligente desenvolvido com **Next.js (App Router)**, **TypeScript** e **Tailwind CSS**. A arquitetura de autenticação utiliza **JWT próprio** com cookies `httpOnly` e **Supabase** como banco de dados PostgreSQL.

Este documento descreve a fundação do projeto, a estrutura de pastas e fornece instruções para os próximos membros do grupo continuarem o desenvolvimento (Pessoas 2, 3 e 4).

---

## 🛠️ Arquitetura de Autenticação (Pessoa 1 — Breno)

A autenticação é 100% própria, sem dependência de serviços de terceiros para sessão:

- **JWT (JSON Web Token):** Gerado pelo servidor após login/cadastro, armazenado em cookie `httpOnly; Secure; SameSite=Strict` — completamente imune a XSS.
- **Supabase Database (PostgreSQL):** Armazena todos os dados do usuário — credenciais (senha com hash `bcrypt`), perfil (CPF, CRECI, role), imóveis, leads e histórico.
- **Proxy (Middleware) Server-Side:** Protege rotas antes de qualquer código ser executado no browser, verificando o token JWT a cada requisição.

### Fluxo resumido

```
POST /api/auth/login  →  bcrypt.compare(senha, hash)  →  jwt.sign()  →  cookie httpOnly
GET  /api/auth/me     →  jwt.verify(cookie)            →  retorna perfil do Supabase
proxy.ts              →  jwt.verify(cookie)            →  redireciona para /login se inválido
```

---

## 🗂️ Estrutura de Pastas Implementada

```text
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts      # POST — valida credenciais e emite JWT
│   │       ├── register/route.ts   # POST — cria conta com hash bcrypt + emite JWT
│   │       ├── logout/route.ts     # POST — apaga cookie
│   │       └── me/route.ts         # GET  — valida token e retorna perfil
│   ├── cadastro/                   # Página de Cadastro de Corretores (RF02)
│   │   └── page.tsx
│   ├── login/                      # Página de Login com validação (RF01)
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx                  # Layout raiz (AuthProvider + Navbar)
│   └── page.tsx                    # Dashboard / Página Inicial protegida
├── components/
│   ├── Navbar.tsx                  # Menu de navegação global responsivo
│   └── ProtectedRoute.tsx          # Spinner de loading enquanto AuthContext hidrata
├── contexts/
│   └── AuthContext.tsx             # Estado global de autenticação (via /api/auth/me)
├── hooks/
│   └── useAuth.ts                  # Hook customizado para consumir o AuthContext
├── lib/
│   ├── jwt.ts                      # signToken() e verifyToken()
│   └── supabase.ts                 # Client público + createServerSupabaseClient()
└── proxy.ts                        # Proteção server-side de rotas (substituiu middleware)
```

---

## 🔌 Configuração das Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com os seguintes valores:

```env
# JWT — NUNCA adicionar NEXT_PUBLIC_ aqui (server-only)
JWT_SECRET=<gerar com: openssl rand -base64 64>

# Supabase — service_role para API Routes (server-only, sem NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=<pegar em: Supabase Dashboard → Project Settings → API Keys → service_role>

# Supabase — público para queries client-side
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY_DO_SUPABASE
```

> **⚠️ Atenção:** `JWT_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` **nunca** devem ter o prefixo `NEXT_PUBLIC_`. Isso os mantém exclusivamente no servidor.

---

## 💾 Script SQL do Banco de Dados (Supabase)

Execute no **SQL Editor** do painel do Supabase:

```sql
-- Criação da tabela de perfis
CREATE TABLE perfis (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  email       text UNIQUE NOT NULL,
  cpf         text,
  creci       text,
  senha_hash  text NOT NULL,  -- hash bcrypt gerenciado pelo backend
  role        text DEFAULT 'corretor', -- 'corretor' | 'admin_corretora' | 'super_admin'
  criado_em   timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- RLS desativado — acesso controlado via service_role nas API Routes
ALTER TABLE perfis DISABLE ROW LEVEL SECURITY;

-- Tabela de leads (RF06 / RF08 — Pessoa 3)
CREATE TABLE leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL,
  telefone        text NOT NULL,
  email           text NOT NULL,
  faixa_orcamento text NOT NULL,
  tipo_imovel     text NOT NULL,
  etapa           text NOT NULL DEFAULT 'novo',
  corretor_id     uuid REFERENCES perfis(id),
  criado_em       timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  atualizado_em   timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
```

> **💡 Dica de Admin:** O formulário público sempre cria contas com `role = 'corretor'`. Para elevar para `admin_corretora` ou `super_admin`, edite a coluna `role` diretamente no Table Editor do Supabase.

> **Pessoa 3:** Os leads são acessados via API Routes (`/api/leads`) com JWT. Execute o SQL da tabela `leads` acima no Supabase antes de testar.

---

## 🚀 Guia de Integração para os Próximos Desenvolvedores (Pessoas 2, 3 e 4)

### 1. Como resgatar os dados do usuário autenticado

Em qualquer componente `'use client'`, use o hook `useAuth`:

```tsx
import { useAuth } from '@/hooks/useAuth';

export default function MeuComponente() {
  const { user, profile, loading } = useAuth();

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <p>Nome: {profile?.nome_completo}</p>
      <p>Cargo: {profile?.role}</p> {/* corretor | admin_corretora | super_admin */}
    </div>
  );
}
```

### 2. Leads e Funil Kanban (Pessoa 3)

CRUD via API Routes autenticadas por cookie JWT:

| Método | Rota | Ação |
|--------|------|------|
| GET | `/api/leads` | Listar leads |
| POST | `/api/leads` | Criar lead |
| GET | `/api/leads/[id]` | Detalhe |
| PATCH | `/api/leads/[id]` | Editar / mover etapa no funil |
| DELETE | `/api/leads/[id]` | Excluir |

No client, use `src/lib/leads.ts` (`fetchLeads`, `createLead`, etc.).

### 3. Como usar o Banco de Dados do Supabase (client-side)

> `user` e `profile` apontam para o mesmo objeto `Profile`. Use `profile` para dados do usuário.

Para queries em tabelas que vocês criarem (ex: `imoveis`, `leads`):

```tsx
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('imoveis')
  .select('*');
```

### 4. Como proteger uma página privada:
Para garantir que uma nova página seja acessível apenas por usuários logados, envolva o JSX dela com o componente `<ProtectedRoute>`:
```tsx
import ProtectedRoute from '@/components/ProtectedRoute';
### 3. Como usar o Supabase em API Routes (server-side)

Para operações privilegiadas dentro de `route.ts`, use o client com service_role:

```ts
import { createServerSupabaseClient } from '@/lib/supabase';

const supabaseServer = createServerSupabaseClient();
const { data } = await supabaseServer.from('perfis').select('*');
```

### 5. Como restringir páginas baseado em Cargo (ex: Painel Admin):
Vocês podem combinar o `ProtectedRoute` com uma condicional baseada na role do usuário:
### 4. Como proteger uma página privada

A proteção real acontece no `proxy.ts` (server-side). O `ProtectedRoute` é apenas um spinner de loading. Para adicionar uma nova rota protegida, adicione o path no `matcher` de `src/proxy.ts`:

```ts
export const config = {
  matcher: ['/', '/dashboard/:path*', '/nova-rota/:path*'],
};
```

### 5. Como restringir por Cargo (ex: Painel Admin)

```tsx
import { useAuth } from '@/hooks/useAuth';

export default function AreaAdmin() {
  const { profile } = useAuth();

  if (profile?.role !== 'super_admin' && profile?.role !== 'admin_corretora') {
    return <p>Acesso negado. Apenas administradores podem ver esta tela.</p>;
  }

  return <div>Painel de Controle Administrativo</div>;
}
```

---

## ⚙️ Comandos do Projeto

- `npm run dev` — Inicia o servidor de desenvolvimento em `http://localhost:3000`
- `npm run build` — Compila para produção e valida TypeScript
- `npm start` — Inicia o servidor Next.js em modo produção após o build
