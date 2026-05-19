# Roadmap - Pessoa 1 (Breno): Base e Autenticação

**Foco:** Configuração inicial, Firebase/Supabase setup, autenticação, cadastro de usuários e roteamento da aplicação.
**Justificativa:** Responsável por montar a fundação do projeto. Sem essa base, o restante do desenvolvimento não consegue progredir.

---

## Fase 1: Configuração Inicial e Fundação
- [x] **Revisão do Repositório:** Analisar a estrutura atual do projeto Next.js local.
- [x] **Estrutura de Pastas:** Configurar a arquitetura base (ex: `src/lib`, `src/context`, `src/components`).
- [x] **Variáveis de Ambiente:** Criar o arquivo `.env.local` e configurar as chaves de API necessárias com segurança.
- [x] **Dependências:** Instalar pacotes essenciais de autenticação e banco de dados (Firebase SDK e Supabase Client).

## Fase 2: Configuração dos Serviços (BaaS)
> **Decisão de Arquitetura:** Foi decidido utilizar uma abordagem híbrida, usando **Firebase para Autenticação** e **Supabase para Banco de Dados**.

- [x] **Firebase Setup (Autenticação):**
  - Criar/Acessar o projeto no Firebase Console.
  - Habilitar o provedor de Email/Senha no Firebase Auth.
  - Inicializar o app do Firebase no código (`src/lib/firebase.ts`).
- [x] **Supabase Setup (Banco de Dados):**
  - Criar/Acessar o projeto no Supabase.
  - Obter credenciais (Project URL e Anon Key).
  - Inicializar o cliente do Supabase no código (`src/lib/supabase.js`).
  - Configurar tabelas (ex: tabela de usuários) e políticas (RLS) no banco relacional PostgreSQL do Supabase.

## Fase 3: Autenticação e Banco de Dados (RF01 e RF02)
- [x] **RF02 / RF02.1 / RF02.2 — Cadastro de Usuários:**
  - Construir a interface (UI) de registro com base no HTML de exemplo.
  - Implementar a função de criação de conta usando o **Firebase Auth**.
  - Gravar os dados complementares do usuário (perfil) no **Supabase** assim que a conta for criada no Firebase (usando o UID do Firebase como chave no Supabase).
- [x] **RF01 / RF01.1 / RF01.2 — Login e Autenticação:**
  - Construir a interface (UI) de login.
  - Conectar o formulário com o **Firebase Auth** para validar credenciais.
  - Gerenciar o estado global do usuário.
  - Implementar a funcionalidade de "Sair" (Logout).

## Fase 4: Roteamento e Rotas Protegidas (RF03 / RF03.1)
- [x] **Mapeamento de Rotas:** 
  - Estruturar rotas públicas (ex: `/login`, `/cadastro`).
  - Estruturar rotas privadas da aplicação principal.
- [x] **Bloqueio de Acesso (Rotas Protegidas):**
  - Desenvolver uma lógica que verifica se o usuário possui sessão ativa via Firebase Auth.
  - Redirecionar usuários não autenticados de volta para a tela de login.

---

### 🚀 Próximos Passos (Ação Imediata)
1. **Inicialização do Projeto:** Rodar o comando para criar o projeto Next.js, já que o repositório atual possui apenas os arquivos HTML (`npx create-next-app`).
2. **Setup do TailwindCSS e Componentes:** Como os arquivos HTML de exemplo provavelmente usam um framework de CSS (ex: Tailwind), precisamos configurar isso no Next.js.
3. **Mão na Massa:** Iniciar a Fase 1 configurando as chaves de API e inicializando os clientes na aplicação.
