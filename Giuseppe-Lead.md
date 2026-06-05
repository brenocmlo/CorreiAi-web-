# Giuseppe — Branch `Giuseppe-Lead`

Documentação do trabalho realizado por **Giuseppe** na branch `Giuseppe-Lead`, descrevendo **apenas o estado atual** do projeto (sem histórico de commits).

| Item | Valor |
|------|--------|
| **Versão do app** | `0.1.0` (`package.json`) |
| **Branch** | `Giuseppe-Lead` |
| **Stack principal** | Next.js 16.2.6 · React 19.2.4 · Tailwind CSS 4 · Supabase · JWT (`jsonwebtoken`) |

---

## Índice de rotas

### Páginas (App Router)

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Landing page cinematográfica |
| `/login` | Público | Login de corretor ou lead |
| `/cadastro` | Público | Cadastro de **corretor** |
| `/dashboard` | Autenticado | Dashboard diferenciado por `role` |
| `/leads` | Autenticado (corretor) | Listagem de leads |
| `/leads/[id]` | Autenticado (corretor) | Detalhe / edição / exclusão de lead |
| `/funil` | Autenticado (corretor) | Funil de vendas em Kanban |

Rotas referenciadas na navbar do corretor, mas **ainda sem página implementada nesta branch**: `/imoveis`, `/chat`, `/admin`.

### API (Route Handlers)

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| `POST` | `/api/auth/login` | Não | Login; define cookie `auth_token` |
| `POST` | `/api/auth/logout` | Não | Logout; remove cookie |
| `GET` | `/api/auth/me` | Cookie JWT | Retorna perfil logado |
| `POST` | `/api/auth/register` | Não | Cadastro (`role`: `corretor` ou `lead`) |
| `GET` | `/api/leads` | JWT | Lista todos os leads |
| `POST` | `/api/leads` | JWT | Cria lead vinculado ao corretor |
| `GET` | `/api/leads/[id]` | JWT | Busca um lead |
| `PATCH` | `/api/leads/[id]` | JWT | Atualiza lead (dados e/ou etapa do funil) |
| `DELETE` | `/api/leads/[id]` | JWT | Remove lead |
| `POST` | `/api/leads/public` | Não | Captura de lead na landing (sem login) |

### Proteção server-side (`src/proxy.ts`)

Rotas protegidas pelo proxy (JWT no cookie `auth_token`):

- `/dashboard`, `/dashboard/*`
- `/leads`, `/leads/*`
- `/funil`

Sem token ou com token inválido → redirecionamento para `/login`.

---

## 1. Landing page pública

**Rota:** `/`

**O que foi feito**

- Landing em tema escuro com vídeo HLS no hero (Mux + `hls.js`).
- Navbar fixa com logo e CTA “Começar Agora” → `/cadastro`.
- Seção intermediária com carrossel GSAP/ScrollTrigger e **cards de imóveis mockados** (apenas visual).
- Footer cinematográfico (GSAP, marquee, botões magnéticos) com links para `/cadastro`, `/login` e `mailto:suporte@correai.com`.
- Formulário público de captura de lead no hero (`LeadCaptureForm` → `POST /api/leads/public`).
- Usuário já logado é redirecionado para `/dashboard`.

**Arquivos principais**

| Arquivo | Função |
|---------|--------|
| `src/app/page.tsx` | Página da landing |
| `src/components/landing/LandingNavbar.tsx` | Navbar da landing |
| `src/components/landing/HeroSection.tsx` | Hero com vídeo + formulário |
| `src/components/landing/LeadCaptureForm.tsx` | Formulário de lead (público) |
| `src/components/landing/LandingMidShowcase.tsx` | Showcase com `MOCK_CARDS` |
| `src/components/landing/CinematicFooter.tsx` | Footer animado |
| `src/components/landing/SunburstIcon.tsx` | Ícone da marca |
| `src/app/globals.css` | Tokens de marca (`#3054ff`, Instrument Sans/Serif) |

---

## 2. Login e cadastro

### Login

**Rota:** `/login`

**O que foi feito**

- Tela split: vídeo de fundo + formulário com animações (`motion`).
- Integração com `POST /api/auth/login` e redirecionamento para `/dashboard`.
- Botão **“Voltar ao início”** → `/` (`BackToHomeButton`).
- Link para cadastro de corretor.

**Arquivos:** `src/app/login/page.tsx`, `src/app/login/layout.tsx`, `src/components/auth/BackToHomeButton.tsx`

### Cadastro

**Rota:** `/cadastro`

**O que foi feito**

- Formulário reutilizável `CadastroForm` com suporte a dois perfis no código (`corretor` | `lead`).
- Página atual expõe apenas **cadastro de corretor** (`tipoPerfil="corretor"`).
- Campos: nome, sobrenome, e-mail, CPF, CRECI (obrigatório para corretor), senha.
- Registro via `POST /api/auth/register` com `role: 'corretor'` ou `'lead'` (API pronta para lead; rota de página de lead ainda não criada).

**Arquivos:** `src/app/cadastro/page.tsx`, `src/app/cadastro/layout.tsx`, `src/components/cadastro/CadastroForm.tsx`

---

## 3. Separação Lead × Corretor

**O que foi feito**

- Perfil no Supabase (`perfis`) com `role`: `corretor` | `lead` | `admin_corretora` | `super_admin`.
- **Dashboard** renderiza layout diferente conforme o `role`:
  - **Corretor:** atalhos para `/leads` e `/funil`, card de perfil (CRECI, etc.).
  - **Lead (cliente):** área simplificada com dados básicos (e-mail, CPF).
- **Navbar** adapta os links:
  - Corretor: Dashboard, Imóveis, Leads, Funil, Chat IA, Admin.
  - Lead: apenas “Início” (`/dashboard`).
- Páginas `/leads`, `/leads/[id]` e `/funil` redirecionam lead para `/dashboard`.

**Arquivos:** `src/app/dashboard/page.tsx`, `src/components/Navbar.tsx`, `src/contexts/AuthContext.tsx`

---

## 4. Gestão de leads (CRM — corretor)

### Listagem

**Rota:** `/leads`

- Grid de cards com nome, contato, orçamento, tipo de imóvel e etapa do funil.
- Ações: **Ver / Editar** e **Excluir** (com diálogo de confirmação).
- Hook `useLeads` carrega dados de `GET /api/leads`.
- Referência de requisito: RF06.1.

**Arquivos:** `src/app/leads/page.tsx`, `src/components/leads/LeadCard.tsx`, `src/components/leads/ConfirmDialog.tsx`, `src/hooks/useLeads.ts`

### Detalhe e edição

**Rota:** `/leads/[id]`

- Carrega lead por id (`GET /api/leads/[id]`).
- Formulário reutilizável (`LeadForm`) para editar campos.
- Salvar (`PATCH`), excluir (`DELETE`) e voltar para listagem.

**Arquivos:** `src/app/leads/[id]/page.tsx`, `src/components/leads/LeadForm.tsx`

### Tipos e domínio

**Arquivo:** `src/types/lead.ts`

- Etapas do funil: `novo` → `em_atendimento` → `visita_agendada` → `proposta` → `fechado`.
- Tipos de imóvel e faixas de orçamento padronizados.
- Interfaces `Lead`, `LeadInput`, `EtapaFunil`.

### Persistência

- Tabela Supabase `leads` (mapeamento em `src/lib/leads-mapper.ts`).
- Cliente HTTP em `src/lib/leads.ts` (fetch com `credentials: 'include'`).
- Leads da landing entram com `corretor_id: null`; leads criados pelo corretor autenticado recebem `corretor_id` do JWT.

---

## 5. Funil de vendas (Kanban)

**Rota:** `/funil`

**O que foi feito**

- Board Kanban com 5 colunas (uma por etapa do funil).
- Drag-and-drop entre colunas; ao soltar, `PATCH /api/leads/[id]` com nova `etapa`.
- Cards compactos e arrastáveis no funil; link para edição completa em `/leads/[id]`.
- Referência de requisito: RF08.

**Arquivos:** `src/app/funil/page.tsx`, `src/components/leads/KanbanBoard.tsx`, `src/components/leads/KanbanColuna.tsx`

---

## 6. Captura pública de lead (sem login)

**Rota de API:** `POST /api/leads/public`  
**UI:** formulário no hero da `/` (`LeadCaptureForm`)

**Campos:** nome, telefone, e-mail, faixa de orçamento, tipo de imóvel, etapa (opcional; padrão `novo`).

**Comportamento:** validação no servidor, insert no Supabase, resposta `201` com o lead criado.

---

## 7. Infraestrutura e bibliotecas

| Arquivo | Função |
|---------|--------|
| `src/lib/supabase.ts` | Cliente Supabase server-side |
| `src/lib/jwt.ts` | Assinatura e verificação do token |
| `src/lib/api-auth.ts` | Extração do usuário autenticado nas APIs |
| `src/lib/leads-mapper.ts` | Conversão linha Supabase ↔ modelo `Lead` |
| `src/lib/utils.ts` | Utilitário `cn` (classes CSS) |
| `src/proxy.ts` | Proteção de rotas autenticadas (Next.js 16) |
| `src/components/ProtectedRoute.tsx` | Spinner enquanto o `AuthContext` hidrata |

**Dependências adicionadas nesta branch (destaque):** `gsap`, `hls.js`, `motion`, `lucide-react`, `bcryptjs`, `jsonwebtoken`.

**Removido:** integração Firebase (`src/lib/firebase.ts` removido em favor de Supabase + JWT).

---

## 8. UX e ajustes gerais

- Paleta de marca (`#3054ff`, accent `#b4c0ff`) e fontes Instrument Sans/Serif.
- Navbar oculta em `/`, `/login` e `/cadastro`.
- Links sem destino real na landing (Privacidade / Termos) apontam para `#` — removidos ou neutralizados conforme ajustes da branch.
- Metadata do app: título “CorreAi — Corretagem Inteligente” e descrição de CRM imobiliário.

---

## 9. Resumo por perfil de usuário

| Perfil | Rotas que usa hoje | O que vê |
|--------|-------------------|----------|
| **Visitante** | `/`, `/login`, `/cadastro` | Landing, captura de lead, login, cadastro corretor |
| **Lead (cliente)** | `/dashboard` | Dashboard simplificado do cliente |
| **Corretor** | `/dashboard`, `/leads`, `/leads/[id]`, `/funil` | CRM completo de leads + Kanban |

---

## 10. O que é mock vs. integrado

| Recurso | Status |
|---------|--------|
| Formulário de lead na landing | Integrado (Supabase via `/api/leads/public`) |
| CRUD de leads (área logada) | Integrado (Supabase + JWT) |
| Funil Kanban | Integrado |
| Cards de imóveis na landing | **Mock** (`MOCK_CARDS` em `LandingMidShowcase`) |
| Imóveis, Chat IA, Admin | Apenas links na navbar (sem páginas) |
| Cadastro de lead como página | API pronta; UI só expõe `/cadastro` para corretor |

---

*Documento gerado com base no código atual da branch `Giuseppe-Lead` (versão `0.1.0`).*
