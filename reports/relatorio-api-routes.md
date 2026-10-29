# Relatório Geral da Suíte: Rotas de API (auth/login, auth/cadastro e leads)

- **Componente / Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data de Execução:** 29/10/2026, 18:08:45
- **Total de Testes:** 13
- **Aprovados:** 13
- **Reprovados:** 0

---

## Resumo dos Testes

| # | Teste | Status | Relatório Individual |
| :-: | :--- | :-: | :--- |
| 1 | auth/login rejeita requisição com campos obrigatórios ausentes ou e-mail inválido (400) | ✅ Pass | [Ver Detalhes](./api-routes/01-auth-login-rejeita-requisicao-com-campos-obrigatorios-ausentes-ou-e-mail-invalido-400.md) |
| 2 | auth/login rejeita credenciais inválidas quando usuário não existe (401) | ✅ Pass | [Ver Detalhes](./api-routes/02-auth-login-rejeita-credenciais-invalidas-quando-usuario-nao-existe-401.md) |
| 3 | auth/login rejeita credenciais inválidas quando a senha está incorreta (401) | ✅ Pass | [Ver Detalhes](./api-routes/03-auth-login-rejeita-credenciais-invalidas-quando-a-senha-esta-incorreta-401.md) |
| 4 | auth/login autentica com sucesso e define o cookie auth_token (200) | ✅ Pass | [Ver Detalhes](./api-routes/04-auth-login-autentica-com-sucesso-e-define-o-cookie-auth-token-200.md) |
| 5 | auth/cadastro valida regras de registro e rejeita dados inválidos (400) | ✅ Pass | [Ver Detalhes](./api-routes/05-auth-cadastro-valida-regras-de-registro-e-rejeita-dados-invalidos-400.md) |
| 6 | auth/cadastro rejeita e-mail já cadastrado (409) | ✅ Pass | [Ver Detalhes](./api-routes/06-auth-cadastro-rejeita-e-mail-ja-cadastrado-409.md) |
| 7 | auth/cadastro cria perfil com sucesso e define o cookie auth_token (200) | ✅ Pass | [Ver Detalhes](./api-routes/07-auth-cadastro-cria-perfil-com-sucesso-e-define-o-cookie-auth-token-200.md) |
| 8 | leads bloqueia requisições sem autenticação em GET e POST (401) | ✅ Pass | [Ver Detalhes](./api-routes/08-leads-bloqueia-requisicoes-sem-autenticacao-em-get-e-post-401.md) |
| 9 | leads bloqueia acesso de usuários com perfil de lead (403) | ✅ Pass | [Ver Detalhes](./api-routes/09-leads-bloqueia-acesso-de-usuarios-com-perfil-de-lead-403.md) |
| 10 | leads filtra a listagem pelo corretor logado e retorna leads mapeados (200) | ✅ Pass | [Ver Detalhes](./api-routes/10-leads-filtra-a-listagem-pelo-corretor-logado-e-retorna-leads-mapeados-200.md) |
| 11 | leads não restringe por corretor_id quando o usuário é administrador (200) | ✅ Pass | [Ver Detalhes](./api-routes/11-leads-nao-restringe-por-corretor-id-quando-o-usuario-e-administrador-200.md) |
| 12 | leads valida payload na criação de novo lead e rejeita dados inválidos (400) | ✅ Pass | [Ver Detalhes](./api-routes/12-leads-valida-payload-na-criacao-de-novo-lead-e-rejeita-dados-invalidos-400.md) |
| 13 | leads cria lead associado ao corretor autenticado (201) | ✅ Pass | [Ver Detalhes](./api-routes/13-leads-cria-lead-associado-ao-corretor-autenticado-201.md) |

---

## Detalhamento Completo

### 1. auth/login rejeita requisição com campos obrigatórios ausentes ou e-mail inválido (400)
- **Status:** ✅ Aprovado
- **Objetivo:** Verifica validação de payload no login (e-mail malformado ou senha ausente).
- **Esperado:** Status HTTP 400 com mensagem "E-mail e senha são obrigatórios."
- **Obtido:** Todos os 5 formatos inválidos retornaram HTTP 400 com mensagem de validação.

### 2. auth/login rejeita credenciais inválidas quando usuário não existe (401)
- **Status:** ✅ Aprovado
- **Objetivo:** Garante que tentativa de login com e-mail inexistente retorne 401 sem vazar detalhes.
- **Esperado:** Status HTTP 401 com erro "E-mail ou senha incorretos."
- **Obtido:** HTTP 401 retornado corretamente com mensagem genérica de segurança.

### 3. auth/login rejeita credenciais inválidas quando a senha está incorreta (401)
- **Status:** ✅ Aprovado
- **Objetivo:** Valida checagem criptográfica de senha via bcrypt.compare.
- **Esperado:** Status HTTP 401 com erro "E-mail ou senha incorretos."
- **Obtido:** HTTP 401 retornado e login bloqueado.

### 4. auth/login autentica com sucesso e define o cookie auth_token (200)
- **Status:** ✅ Aprovado
- **Objetivo:** Valida login com sucesso, retorno HTTP 200 { ok: true } e geração do cookie seguro httpOnly.
- **Esperado:** Status HTTP 200 com { ok: true } e cookie auth_token configurado como httpOnly.
- **Obtido:** Login concluído com sucesso e cookie auth_token definido com opções seguras.

### 5. auth/cadastro valida regras de registro e rejeita dados inválidos (400)
- **Status:** ✅ Aprovado
- **Objetivo:** Garante que cadastros sem CRECI para corretor, senha fraca ou perfis administrativos proibidos sejam rejeitados.
- **Esperado:** Status HTTP 400 em todas as tentativas inválidas.
- **Obtido:** Validação impediu o cadastro em todos os cenários com HTTP 400.

### 6. auth/cadastro rejeita e-mail já cadastrado (409)
- **Status:** ✅ Aprovado
- **Objetivo:** Valida verificação de e-mail duplicado retornando conflito HTTP 409.
- **Esperado:** Status HTTP 409 com erro "Este e-mail já está sendo utilizado por outra conta."
- **Obtido:** HTTP 409 retornado e criação bloqueada.

### 7. auth/cadastro cria perfil com sucesso e define o cookie auth_token (200)
- **Status:** ✅ Aprovado
- **Objetivo:** Valida fluxo completo de cadastro: hash com bcrypt, inserção no banco e login automático com cookie.
- **Esperado:** Status HTTP 200 com { ok: true } e perfil inserido no Supabase.
- **Obtido:** Perfil criado e autenticado com cookie de sessão válido.

### 8. leads bloqueia requisições sem autenticação em GET e POST (401)
- **Status:** ✅ Aprovado
- **Objetivo:** Garante que requisições sem cookie auth_token recebam 401 Não autenticado.
- **Esperado:** HTTP 401 com erro "Não autenticado." para ambos os métodos.
- **Obtido:** Tanto GET quanto POST bloquearam requisições não autenticadas.

### 9. leads bloqueia acesso de usuários com perfil de lead (403)
- **Status:** ✅ Aprovado
- **Objetivo:** Valida controle de acesso baseado em papel (RBAC): usuários com role lead não acessam gestão de leads.
- **Esperado:** Status HTTP 403 com erro "Acesso negado." em GET e POST.
- **Obtido:** HTTP 403 retornado corretamente impedindo acesso de clientes lead.

### 10. leads filtra a listagem pelo corretor logado e retorna leads mapeados (200)
- **Status:** ✅ Aprovado
- **Objetivo:** Valida isolamento multitenant: corretores visualizam apenas leads onde corretor_id bate com seu uid.
- **Esperado:** Filtro corretor_id = "corretor-42" aplicado na query do Supabase e leads retornados.
- **Obtido:** Filtro aplicado com sucesso: [{"col":"corretor_id","val":"corretor-42"}]

### 11. leads não restringe por corretor_id quando o usuário é administrador (200)
- **Status:** ✅ Aprovado
- **Objetivo:** Valida que administradores de corretora possuem visão global sem filtro de corretor específico.
- **Esperado:** Nenhum filtro corretor_id aplicado na query.
- **Obtido:** Consulta realizada sem filtro restritivo de corretor.

### 12. leads valida payload na criação de novo lead e rejeita dados inválidos (400)
- **Status:** ✅ Aprovado
- **Objetivo:** Garante que tentativa de cadastro de lead sem nome obrigatório seja rejeitada com 400.
- **Esperado:** Status HTTP 400 com erro indicando campo nome.
- **Obtido:** HTTP 400 retornado e mensagem de erro informada ao cliente.

### 13. leads cria lead associado ao corretor autenticado (201)
- **Status:** ✅ Aprovado
- **Objetivo:** Valida criação de lead: dados normalizados, etapa inicial "novo" e corretor_id preenchido a partir do JWT do corretor logado.
- **Esperado:** Status HTTP 201 com lead criado e corretor_id = "corretor-vip".
- **Obtido:** Lead criado com sucesso com ID lead-gerado-10 vinculado a corretor-vip.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._