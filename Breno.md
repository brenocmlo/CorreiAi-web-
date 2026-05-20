# Roadmap - Pessoa 1 (Breno): Base e Autenticação

**Foco:** Configuração inicial, setup do Supabase, autenticação JWT própria, cadastro de usuários e roteamento da aplicação.
**Justificativa:** Responsável por montar a fundação do projeto. Sem essa base, o restante do desenvolvimento não consegue progredir.

---

## Fase 1: Configuração Inicial e Fundação
- [x] **Revisão do Repositório:** Analisar a estrutura atual do projeto Next.js local.
- [x] **Estrutura de Pastas:** Configurar a arquitetura base (`src/lib`, `src/contexts`, `src/components`, `src/app/api`).
- [x] **Variáveis de Ambiente:** Criar o `.env.local` com separação clara entre variáveis server-only e públicas.
- [x] **Dependências:** Instalar `bcryptjs`, `jsonwebtoken` e `@supabase/supabase-js`. Firebase removido.

## Fase 2: Configuração dos Serviços

> **Decisão de Arquitetura:** Migração de Firebase Auth para **JWT próprio**. Toda a autenticação é gerenciada internamente — sem dependência de serviços de terceiros para sessão. O Supabase cuida exclusivamente do banco de dados.

- [x] **JWT Setup:**
  - Criar utilitário `src/lib/jwt.ts` com `signToken()` e `verifyToken()`.
  - Gerar `JWT_SECRET` via `openssl rand -base64 64`.
- [x] **Supabase Setup (Banco de Dados):**
  - Criar projeto no Supabase e obter `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
  - Inicializar dois clients em `src/lib/supabase.ts`: público (browser) e server-side (service_role).
  - Executar SQL para criar tabela `perfis` com coluna `senha_hash`.

## Fase 3: API Routes de Autenticação (RF01 e RF02)
- [x] **`POST /api/auth/register`:** Recebe dados do formulário, faz hash da senha com `bcrypt`, insere no Supabase e emite JWT em cookie `httpOnly`.
- [x] **`POST /api/auth/login`:** Busca usuário, compara senha com `bcrypt.compare`, emite JWT em cookie `httpOnly`.
- [x] **`POST /api/auth/logout`:** Apaga o cookie de autenticação.
- [x] **`GET /api/auth/me`:** Verifica o token JWT e retorna dados frescos do perfil no Supabase.

## Fase 4: Roteamento e Rotas Protegidas (RF03 / RF03.1)
- [x] **`src/proxy.ts` (Middleware Server-Side):**
  - Protege rotas antes de qualquer JS ser executado no browser.
  - Verifica JWT a cada requisição. Token inválido → redirect para `/login`.
  - Substitui a abordagem client-side anterior com `ProtectedRoute`.
- [x] **`AuthContext` Refatorado:**
  - Remove dependência do Firebase `onAuthStateChanged`.
  - Hidrata o estado de autenticação via `GET /api/auth/me` ao montar.
  - `logout()` chama `POST /api/auth/logout` e limpa o estado local.

---

## 📝 Explicação Detalhada do que foi Feito (Entregas da Pessoa 1)

Como **Pessoa 1**, montei toda a fundação do projeto — e realizei a migração completa do sistema de autenticação de Firebase para JWT próprio, resultando em uma arquitetura mais simples, segura e sem custos de terceiros.

### 1. Inicialização e Estrutura do Next.js
- **Next.js 16 (App Router) + TypeScript + Tailwind CSS:** Estrutura base limpa, sem lints ou erros de tipo.
- **Separação de variáveis de ambiente:** `JWT_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` são server-only (sem `NEXT_PUBLIC_`), garantindo que nunca vazem para o browser.

### 2. Sistema de Autenticação JWT Próprio
- **`src/lib/jwt.ts`:** Utilitário centralizado com `signToken(payload)` e `verifyToken(token)`. Token com expiração de 8h assinado com HS256.
- **Cookie `httpOnly`:** O token JWT é armazenado em cookie `httpOnly; Secure; SameSite=Strict` — completamente imune a ataques XSS. JavaScript no browser não consegue ler o cookie.
- **Senhas com bcrypt:** Nenhuma senha é armazenada em texto plano. O hash é gerado com `bcrypt` (custo 12) e verificado pelo servidor a cada login.

### 3. API Routes de Autenticação
- **`/api/auth/register`:** Único ponto de cadastro. Verifica email duplicado, faz hash da senha e insere no Supabase em uma única operação — sem a lógica dupla que existia antes (Firebase + Supabase).
- **`/api/auth/login`:** Valida credenciais server-side e emite o token via cookie.
- **`/api/auth/logout`:** Invalida o cookie zerando o `maxAge`.
- **`/api/auth/me`:** Endpoint usado pelo `AuthContext` para hidratar o estado do usuário ao carregar a página.

### 4. Supabase — Dois Clientes com Escopos Diferentes
- **Client público (`supabase`):** Usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`, disponível no browser para queries de dados (imóveis, leads etc.).
- **Client server (`createServerSupabaseClient()`):** Usa `SUPABASE_SERVICE_ROLE_KEY`, exclusivo das API Routes, com bypass de RLS para operações de autenticação.

### 5. Proteção de Rotas com Proxy Server-Side
- **`src/proxy.ts`:** No Next.js 16, o arquivo de middleware foi renomeado para `proxy.ts` e a função exportada de `middleware` para `proxy`. Verifica o JWT antes de qualquer renderização — proteção real, sem depender de JS no cliente.
- **`ProtectedRoute.tsx` simplificado:** Com a proteção feita no servidor, o componente agora serve apenas como spinner de loading enquanto o `AuthContext` hidrata via `/api/auth/me`.

### 6. Gerenciamento de Estado Global
- **`AuthContext.tsx` refatorado:** Remove toda dependência do Firebase SDK. Ao montar, chama `GET /api/auth/me` para hidratar o estado. Expõe `user`, `profile`, `loading`, `logout` e `refreshProfile` — mesma interface de antes, zero quebra de contrato com o restante do código.
- **`useAuth.ts`:** Hook de atalho sem mudanças na interface pública.

### 7. Interfaces de Usuário
- **Login (`/login`):** Design dark mode + glassmorphism. Erros vindos da API tratados com mensagens claras.
- **Cadastro (`/cadastro`):** Formulário completo que chama uma única API Route — sem lógica duplicada de Firebase + Supabase.
- **Navbar e Dashboard:** Referências ao Firebase removidas. Badge "Auth: Firebase" atualizado para "Auth: JWT".
