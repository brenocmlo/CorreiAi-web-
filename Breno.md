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

---

## 📝 Explicação Detalhada do que foi Feito (Entregas da Pessoa 1)

Como **Pessoa 1**, montei toda a fundação do projeto, que serve como o pilar de sustentação para os demais membros do grupo começarem a trabalhar. Abaixo está o detalhamento técnico e prático de tudo o que foi entregue:

### 1. Inicialização e Estrutura do Next.js
*   **Next.js (App Router) + TypeScript + Tailwind CSS:** Criei toda a estrutura base do projeto na raiz do repositório de forma limpa, garantindo a configuração de compilação sem lints ou erros de tipo.
*   **Padrão de Variáveis de Ambiente:** Configurei o `.env.local` na raiz para garantir o tráfego seguro de credenciais das APIs externas.

### 2. Integração Híbrida de Serviços (BaaS)
*   **Firebase Authentication (`src/lib/firebase.ts`):** Inicializei e integrei o Firebase Auth no código para controlar exclusivamente a validação de credenciais de login, cadastro rápido e gerenciamento de estado de usuário logado de forma super segura.
*   **Supabase Database (`src/lib/supabase.ts`):** Inicializei a comunicação com o banco PostgreSQL. Desenvolvi o script SQL para estruturar a tabela `perfis`, garantindo os campos obrigatórios profissionais como **CPF** e **CRECI**, além do cargo (**role**), desabilitando as regras de RLS para possibilitar o registro híbrido direto pelo front-end de forma fluida.

### 3. Gerenciamento de Estado Global e Hooks
*   **AuthContext (`src/contexts/AuthContext.tsx`):** Desenvolvi o Context Provider global. Ele gerencia o estado da sessão do Firebase em tempo real e, de forma reativa, busca a linha correspondente de informações profissionais na tabela `perfis` do Supabase usando o UID como chave estrangeira.
*   **Hook Customizado (`src/hooks/useAuth.ts`):** Criei um atalho universal para extrair os dados do usuário atual e o seu nível de acesso de forma simples em qualquer parte da aplicação.

### 4. Segurança e Roteamento
*   **Componente de Rotas Protegidas (`src/components/ProtectedRoute.tsx`):** Criei um componente de proteção. Se qualquer usuário deslogado tentar acessar o dashboard (`/`) ou qualquer página interna, ele é redirecionado imediatamente para a tela de `/login`.
*   **Navbar Global Responsiva (`src/components/Navbar.tsx`):** Criei uma barra de navegação responsiva e estilizada que se oculta automaticamente nas telas de login/cadastro. Ela possui os links simulados de todas as páginas privadas do projeto, além de exibir o nome do corretor e fornecer o botão de logout integrado.

### 5. Interfaces de Usuário Modernas (Tailwind CSS)
*   **Tela de Login (`src/app/login/page.tsx`):** Design moderno em estilo *dark mode* e *glassmorphism* contendo tratamento robusto de erros para e-mails inválidos ou senhas incorretas.
*   **Tela de Cadastro (`src/app/cadastro/page.tsx`):** Formulário completo que cria a conta no Firebase Auth, armazena no mesmo instante os dados complementares no Supabase e previne a criação de contas com e-mails duplicados ou senhas fracas.

