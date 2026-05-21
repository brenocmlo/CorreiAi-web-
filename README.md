# CorreIA — CRM Imobiliário Inteligente

Este é o repositório do projeto **CorreIA**, um CRM Imobiliário Inteligente desenvolvido com **Next.js (App Router)**, **TypeScript** e **Tailwind CSS**. A arquitetura do backend utiliza um modelo híbrido com **Firebase** (para autenticação) e **Supabase** (como banco de dados PostgreSQL).

Este documento descreve a fundação do projeto, a estrutura de pastas e fornece instruções para os próximos membros do grupo continuarem o desenvolvimento (Pessoas 2, 3 e 4).

---

## 🛠️ Arquitetura e Fluxo Híbrido (Pessoa 1 — Breno)

Para garantir segurança, facilidade no fluxo de autenticação e poder de um banco relacional PostgreSQL, adotamos a seguinte divisão:
*   **Firebase Authentication:** Responsável exclusivo pelas credenciais de login, cadastro inicial de e-mail/senha, gerenciamento de sessões ativas e recuperação de senhas.
*   **Supabase Database (PostgreSQL):** Responsável por armazenar os dados de perfil (inclusive CPF, CRECI e Cargo/Role), imóveis, leads e histórico de interações.
*   **Vínculo:** Quando um usuário se cadastra, ele é criado no Firebase Auth, que gera um **UID** único. Este mesmo **UID** é usado como a chave primária (`id`) na tabela `perfis` do Supabase.

---

## 🗂️ Estrutura de Pastas Implementada

Seguindo o escopo do projeto, a estrutura do Next.js foi organizada da seguinte forma:

```text
src/
├── app/
│   ├── cadastro/          # Página de Cadastro de Corretores (RF02)
│   │   └── page.tsx
│   ├── login/             # Página de Login com validação (RF01)
│   │   └── page.tsx
│   ├── globals.css        # Configurações do Tailwind CSS
│   ├── layout.tsx         # Layout raiz (Provider de Autenticação e Navbar)
│   └── page.tsx           # Dashboard / Página Inicial protegida (RF10/Home)
├── components/
│   ├── Navbar.tsx         # Menu de navegação global responsivo (RF03)
│   └── ProtectedRoute.tsx # HOC para bloqueio de rotas não autenticadas (RF03.1)
├── contexts/
│   └── AuthContext.tsx    # Contexto global de Estado de Autenticação
├── hooks/
│   └── useAuth.ts         # Hook customizado de atalho para consumir o AuthContext
└── lib/
    ├── firebase.ts        # Inicialização do Firebase SDK
    └── supabase.ts        # Inicialização do Supabase Client
```

---

## 🔌 Configuração das Variáveis de Ambiente

Para rodar o projeto localmente, crie um arquivo `.env.local` na raiz da pasta `/CorreiAi-web-` seguindo este modelo:

```env
# Firebase Auth Config
NEXT_PUBLIC_FIREBASE_API_KEY=SUA_API_KEY_DO_FIREBASE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=SEU_AUTH_DOMAIN.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=SEU_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=SEU_STORAGE_BUCKET.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=SEU_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=SEU_APP_ID
# Firebase Realtime Database (RF06 / RF08 — Leads e Funil)
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://SEU_PROJECT_ID-default-rtdb.firebaseio.com

# Supabase DB Config
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY_DO_SUPABASE
```

---

## 💾 Script SQL do Banco de Dados (Supabase)

Para preparar o seu banco de dados Supabase para o fluxo híbrido, execute o script SQL abaixo no **SQL Editor** do painel do Supabase:

```sql
-- 1. Criação da tabela de perfis de usuários
create table perfis (
  id text primary key, -- Vínculo com o UID do Firebase
  nome_completo text not null,
  email text unique not null,
  cpf text,
  creci text,
  role text default 'corretor', -- Níveis: 'corretor' | 'admin_corretora' | 'super_admin'
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Desativação do RLS para a tabela de perfis 
-- (necessário para a autenticação híbrida direto no frontend)
alter table perfis disable row level security;
```

> **💡 Dica de Admin/Super Admin:** Por motivos de segurança, o formulário público de cadastro de usuários sempre cria contas com a `role` de `corretor`. Para elevar uma conta para administrador da corretora (`admin_corretora`) ou administrador global (`super_admin`), edite a coluna `role` da linha correspondente diretamente na planilha de dados (Table Editor) do Supabase.

---

## 🚀 Guia de Integração para os Próximos Desenvolvedores (Pessoas 2, 3 e 4)

Aqui estão as instruções sobre como usufruir da fundação já criada:

### 1. Como resgatar os dados do usuário autenticado:
Em qualquer componente ou página `'use client'`, importe o hook `useAuth`:
```tsx
import { useAuth } from '@/hooks/useAuth';

export default function MeuComponente() {
  const { user, profile, loading } = useAuth();

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <p>Nome: {profile?.nome_completo}</p>
      <p>Cargo: {profile?.role}</p> {/* corretor, admin_corretora ou super_admin */}
    </div>
  );
}
```

### 2. Como usar o Firebase Realtime Database (Leads — Pessoa 3):
Os leads e o funil Kanban são persistidos no **Firebase Realtime Database** (`src/lib/leads.ts`). No Firebase Console, ative o Realtime Database e configure as regras de leitura/escrita para usuários autenticados. Exemplo mínimo de regras:

```json
{
  "rules": {
    "leads": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### 3. Como usar o Banco de Dados do Supabase:
Para realizar queries e inserções em tabelas que vocês criarem (ex: `imoveis` ou `leads`), importem a instância global do Supabase:
```tsx
import { supabase } from '@/lib/supabase';

// Exemplo de busca de imóveis
const { data, error } = await supabase
  .from('imoveis')
  .select('*');
```

### 4. Como proteger uma página privada:
Para garantir que uma nova página seja acessível apenas por usuários logados, envolva o JSX dela com o componente `<ProtectedRoute>`:
```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MinhaPaginaPrivada() {
  return (
    <ProtectedRoute>
      <div>Conteúdo super secreto do CRM</div>
    </ProtectedRoute>
  );
}
```

### 5. Como restringir páginas baseado em Cargo (ex: Painel Admin):
Vocês podem combinar o `ProtectedRoute` com uma condicional baseada na role do usuário:
```tsx
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

export default function AreaAdmin() {
  const { profile } = useAuth();

  if (profile?.role !== 'super_admin' && profile?.role !== 'admin_corretora') {
    return <p>Acesso negado. Apenas administradores podem ver esta tela.</p>;
  }

  return (
    <ProtectedRoute>
      <div>Painel de Controle Administrativo</div>
    </ProtectedRoute>
  );
}
```

---

## ⚙️ Comandos do Projeto

Na raiz do projeto, você pode executar os seguintes scripts do NPM:

*   `npm run dev`: Inicia o servidor de desenvolvimento local em `http://localhost:3000`
*   `npm run build`: Compila o aplicativo para produção e valida erros de TypeScript/Lints
*   `npm start`: Inicia o servidor Next.js em modo produção após o build
