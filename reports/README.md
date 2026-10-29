# Relatórios de Execução de Testes Automatizados - CorreIA

Este diretório contém os relatórios em formato Markdown gerados automaticamente pela suíte de testes do CorreIA (`npm test`).

## 📊 Visão Geral

- **Ambiente de Testes:** Node.js native test runner (`node:test` + `node:assert/strict`)
- **Flags:** `--experimental-strip-types`
- **Total de Testes Criados e Documentados:** 23 testes
- **Status Geral:** ✅ 100% Aprovados (44 testes no total do projeto)

---

## 📑 Suítes de Teste e Relatórios

### 1. Autenticação JWT (`src/lib/jwt.ts`)
- **Relatório Consolidado da Suíte:** [relatorio-jwt.md](./relatorio-jwt.md)
- **Relatórios Individuais por Teste:**
  1. [01. Geração e validação de token válido preserva payload](./jwt/01-geracao-e-validacao-de-token-valido-preserva-payload.md)
  2. [02. Rejeita token adulterado ou assinado com outro segredo](./jwt/02-rejeita-token-adulterado-ou-assinado-com-outro-segredo.md)
  3. [03. Rejeita token expirado](./jwt/03-rejeita-token-expirado.md)
  4. [04. Rejeita token com role inválido](./jwt/04-rejeita-token-com-role-invalido.md)
  5. [05. Rejeita token sem uid ou com uid de tipo incorreto](./jwt/05-rejeita-token-sem-uid-ou-com-uid-de-tipo-incorreto.md)

---

### 2. Motor de Recomendação de Imóveis (`src/lib/recomendacao.ts`)
- **Relatório Consolidado da Suíte:** [relatorio-recomendacao.md](./relatorio-recomendacao.md)
- **Relatórios Individuais por Teste:**
  1. [01. Calcula pontuação por tipo, faixa de orçamento e bairro](./recomendacao/01-calcula-pontuacao-por-tipo-3-faixa-de-orcamento-3-ou-1-e-bairro-2.md)
  2. [02. Ordena resultados por pontuação decrescente](./recomendacao/02-ordena-resultados-por-pontuacao-decrescente.md)
  3. [03. Limita o resultado a no máximo 5 recomendações](./recomendacao/03-limita-o-resultado-a-no-maximo-5-recomendacoes.md)
  4. [04. Retorna lista vazia quando o Supabase retorna erro ou dados nulos](./recomendacao/04-retorna-lista-vazia-quando-o-supabase-retorna-erro-ou-dados-nulos.md)
  5. [05. Retorna lista vazia quando nenhum imóvel tem pontuação positiva](./recomendacao/05-retorna-lista-vazia-quando-nenhum-imovel-tem-pontuacao-positiva.md)

---

### 3. Rotas de API (`src/app/api/auth/login`, `src/app/api/auth/cadastro` e `src/app/api/leads`)
- **Relatório Consolidado da Suíte:** [relatorio-api-routes.md](./relatorio-api-routes.md)
- **Relatórios Individuais por Teste:**
  1. [01. auth/login: rejeita campos obrigatórios ausentes ou e-mail inválido (400)](./api-routes/01-auth-login-rejeita-requisicao-com-campos-obrigatorios-ausentes-ou-e-mail-invalido-400.md)
  2. [02. auth/login: rejeita credenciais inválidas quando usuário não existe (401)](./api-routes/02-auth-login-rejeita-credenciais-invalidas-quando-usuario-nao-existe-401.md)
  3. [03. auth/login: rejeita credenciais inválidas quando a senha está incorreta (401)](./api-routes/03-auth-login-rejeita-credenciais-invalidas-quando-a-senha-esta-incorreta-401.md)
  4. [04. auth/login: autentica com sucesso e define o cookie auth_token (200)](./api-routes/04-auth-login-autentica-com-sucesso-e-define-o-cookie-auth-token-200.md)
  5. [05. auth/cadastro: valida regras de registro e rejeita dados inválidos (400)](./api-routes/05-auth-cadastro-valida-regras-de-registro-e-rejeita-dados-invalidos-400.md)
  6. [06. auth/cadastro: rejeita e-mail já cadastrado (409)](./api-routes/06-auth-cadastro-rejeita-e-mail-ja-cadastrado-409.md)
  7. [07. auth/cadastro: cria perfil com sucesso e define o cookie auth_token (200)](./api-routes/07-auth-cadastro-cria-perfil-com-sucesso-e-define-o-cookie-auth-token-200.md)
  8. [08. leads: bloqueia requisições sem autenticação em GET e POST (401)](./api-routes/08-leads-bloqueia-requisicoes-sem-autenticacao-em-get-e-post-401.md)
  9. [09. leads: bloqueia acesso de usuários com perfil de lead (403)](./api-routes/09-leads-bloqueia-acesso-de-usuarios-com-perfil-de-lead-403.md)
  10. [10. leads: filtra a listagem pelo corretor logado e retorna leads mapeados (200)](./api-routes/10-leads-filtra-a-listagem-pelo-corretor-logado-e-retorna-leads-mapeados-200.md)
  11. [11. leads: não restringe por corretor_id quando o usuário é administrador (200)](./api-routes/11-leads-nao-restringe-por-corretor-id-quando-o-usuario-e-administrador-200.md)
  12. [12. leads: valida payload na criação de novo lead e rejeita dados inválidos (400)](./api-routes/12-leads-valida-payload-na-criacao-de-novo-lead-e-rejeita-dados-invalidos-400.md)
  13. [13. leads: cria lead associado ao corretor autenticado (201)](./api-routes/13-leads-cria-lead-associado-ao-corretor-autenticado-201.md)

---
_Todos os relatórios são gerados e atualizados dinamicamente a cada execução do comando `npm test`._
