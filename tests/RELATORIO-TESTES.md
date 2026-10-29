# Relatório de Testes Automatizados - CorreIA

**Projeto:** CorreIA (CRM Imobiliário em Next.js 16 + React 19 + TypeScript + Supabase + JWT)  
**Runner:** Node.js Native Test Runner (`node:test` e `node:assert/strict`)  
**Comando de Execução:** `npm test` (`node --experimental-strip-types --test tests/*.test.mjs`)  
**Data da Execução:** 29 de Outubro de 2026  
**Status Geral:** ✅ **44 de 44 testes aprovados (100% de sucesso)**  
**Tempo Total de Execução:** ~2.4 segundos  

---

## 1. Sumário Executivo

A suíte de testes automatizados do CorreIA garante a integridade de regras de negócio essenciais, fluxos de segurança, autenticação e autorização por papéis (RBAC), controle de acesso multitenant a leads, processamento de uploads de imóveis e o algoritmo inteligente de recomendação.

```
Total de Testes: 44
Suítes / Arquivos: 10
Pass: 44
Fail: 0
Cancelled: 0
Skipped: 0
```

---

## 2. Visão Consolidada por Módulo

| Arquivo de Teste | Módulo / Arquivo Testado | Quantidade | Status |
| :--- | :--- | :---: | :---: |
| `tests/jwt.test.mjs` | `src/lib/jwt.ts` | 5 | ✅ 5/5 Pass |
| `tests/recomendacao.test.mjs` | `src/lib/recomendacao.ts` | 5 | ✅ 5/5 Pass |
| `tests/api-routes.test.mjs` | `src/app/api/auth/login`, `cadastro`, `leads` | 13 | ✅ 13/13 Pass |
| `tests/leads-ownership.test.mjs` | `src/lib/lead-input.ts` e `types/lead.ts` | 5 | ✅ 5/5 Pass |
| `tests/auth-input.test.mjs` | `src/lib/auth-input.ts` | 2 | ✅ 2/2 Pass |
| `tests/auth-policy.test.mjs` | `src/lib/auth-policy.ts` | 1 | ✅ 1/1 Pass |
| `tests/auth-session.test.mjs` | `src/lib/auth-session.ts` | 1 | ✅ 1/1 Pass |
| `tests/imoveis-input.test.mjs` | `src/lib/imoveis-input.ts` | 4 | ✅ 4/4 Pass |
| `tests/imoveis-upload.test.mjs` | `src/lib/imoveis-upload.ts` | 3 | ✅ 3/3 Pass |
| `tests/supabase-config.test.mjs` | `src/lib/supabase-config.ts` | 5 | ✅ 5/5 Pass |
| **Total** | **Projeto CorreIA** | **44** | ✅ **44/44 Pass** |

---

## 3. Detalhamento Completo dos Testes

### 3.1. Autenticação JWT (`tests/jwt.test.mjs`)
Testa as funções criptográficas `signToken` e `verifyToken` de [`src/lib/jwt.ts`](../src/lib/jwt.ts).

1. **Geração e validação de token válido preserva payload**
   - **Objetivo:** Garantir integridade dos dados codificados no token.
   - **Entrada:** `{ uid: 'corretor-uuid-123', email: 'corretor@exemplo.com', role: 'corretor', nome_completo: 'Carlos Silva' }`.
   - **Esperado:** Token gerado em string, decodificado com todos os campos idênticos.
   - **Resultado:** ✅ Pass. Decodificado preservando `uid`, `email`, `role`, `nome_completo`, `iat` e `exp`.
2. **Rejeita token adulterado ou assinado com outro segredo**
   - **Objetivo:** Impedir ataques de alteração de token ou forja de chaves.
   - **Entrada:** Token com assinatura corrompida e token assinado com chave secreta diferente.
   - **Esperado:** Disparo de `JsonWebTokenError`.
   - **Resultado:** ✅ Pass. Lançamento de erro de assinatura inválida.
3. **Rejeita token expirado**
   - **Objetivo:** Bloquear tokens que ultrapassaram a janela de expiração.
   - **Entrada:** Token gerado com `expiresIn: -1`.
   - **Esperado:** Disparo de `TokenExpiredError`.
   - **Resultado:** ✅ Pass. Rejeitado por tempo expirado.
4. **Rejeita token com role inválido**
   - **Objetivo:** Validar papéis contra a whitelist `AppRole`.
   - **Entrada:** Tokens com papéis `hacker`, `admin`, `visitante`, `""`, `null` e `123`.
   - **Esperado:** Disparo de `Error("Token inválido.")`.
   - **Resultado:** ✅ Pass. Todos os 6 papéis não autorizados foram rejeitados.
5. **Rejeita token sem uid ou com uid de tipo incorreto**
   - **Objetivo:** Validação estrita de tipo para identificador de usuário.
   - **Entrada:** Token sem chave `uid` e token com `uid: 99999` (número).
   - **Esperado:** Disparo de `Error("Token inválido.")`.
   - **Resultado:** ✅ Pass. Rejeitado com `Error("Token inválido.")`.

---

### 3.2. Motor de Recomendação de Imóveis (`tests/recomendacao.test.mjs`)
Testa o algoritmo ponderado de matching de [`src/lib/recomendacao.ts`](../src/lib/recomendacao.ts).

1. **Calcula pontuação por tipo (+3), faixa de orçamento (+3 ou +1) e bairro (+2)**
   - **Objetivo:** Validar pesos e pontuação cumulativa.
   - **Entrada:** Preferências: Apartamento, R$ 300 mil – R$ 500 mil, Aldeota.
   - **Esperado:** 4 imóveis recomendados com pontuações 8, 5, 4 e 2; imóvel com pontuação 0 descartado.
   - **Resultado:** ✅ Pass. Pontuações calculadas com exatidão conforme as regras.
2. **Ordena resultados por pontuação decrescente**
   - **Objetivo:** Validar ordenação decrescente de pontuação.
   - **Entrada:** Três imóveis pontuados com 8, 6 e 5 pontos.
   - **Esperado:** Ordem: alto (8), medio (6), baixo (5).
   - **Resultado:** ✅ Pass. Lista retornada rigorosamente na ordem decrescente.
3. **Limita o resultado a no máximo 5 recomendações**
   - **Objetivo:** Verificar limite de entrega para a interface e assistente.
   - **Entrada:** 8 imóveis elegíveis cadastrados.
   - **Esperado:** Retorno de exatamente 5 recomendações.
   - **Resultado:** ✅ Pass. Truncado em 5 itens (`slice(0, 5)`).
4. **Retorna lista vazia quando o Supabase retorna erro ou dados nulos**
   - **Objetivo:** Resiliência a falhas de conexão ou queries nulas.
   - **Entrada:** Mock retornando `error = Error("...")` e `data = null`.
   - **Esperado:** Array vazio `[]` sem estourar exceções não tratadas.
   - **Resultado:** ✅ Pass. Retorno `[]` seguro.
5. **Retorna lista vazia quando nenhum imóvel tem pontuação positiva**
   - **Objetivo:** Filtrar imóveis disponíveis sem aderência aos requisitos.
   - **Entrada:** Apenas imóveis com pontuação 0.
   - **Esperado:** Array vazio `[]`.
   - **Resultado:** ✅ Pass. Imóveis não aderentes foram filtrados.

---

### 3.3. Rotas de API (`tests/api-routes.test.mjs`)
Testa os endpoints HTTP de autenticação e gestão de leads em [`src/app/api/`](../src/app/api/).

1. **auth/login: rejeita requisição com campos obrigatórios ausentes ou e-mail inválido (400)**
   - **Validação:** Rejeita payloads vazios, sem senha ou com e-mail inválido com HTTP 400.
   - **Resultado:** ✅ Pass.
2. **auth/login: rejeita credenciais inválidas quando usuário não existe (401)**
   - **Validação:** Usuário inexistente no Supabase retorna HTTP 401 sem vazar detalhes da conta.
   - **Resultado:** ✅ Pass.
3. **auth/login: rejeita credenciais inválidas quando a senha está incorreta (401)**
   - **Validação:** Falha na comparação com hash do bcrypt retorna HTTP 401.
   - **Resultado:** ✅ Pass.
4. **auth/login: autentica com sucesso e define o cookie auth_token (200)**
   - **Validação:** Credenciais válidas retornam HTTP 200 `{ ok: true }` e cookie `auth_token` seguro (`httpOnly`, `sameSite: strict`).
   - **Resultado:** ✅ Pass.
5. **auth/cadastro: valida regras de registro e rejeita dados inválidos (400)**
   - **Validação:** Rejeita corretores sem CRECI, senhas com menos de 6 caracteres e papéis privilegiados (`super_admin`).
   - **Resultado:** ✅ Pass.
6. **auth/cadastro: rejeita e-mail já cadastrado (409)**
   - **Validação:** Conflito de e-mail existente retorna HTTP 409.
   - **Resultado:** ✅ Pass.
7. **auth/cadastro: cria perfil com sucesso e define o cookie auth_token (200)**
   - **Validação:** Gera hash seguro, insere registro no banco e loga o usuário automaticamente.
   - **Resultado:** ✅ Pass.
8. **leads: bloqueia requisições sem autenticação em GET e POST (401)**
   - **Validação:** Requisições sem cookie `auth_token` recebem HTTP 401 "Não autenticado."
   - **Resultado:** ✅ Pass.
9. **leads: bloqueia acesso de usuários com perfil de lead (403)**
   - **Validação:** Clientes cadastrados como `lead` não possuem acesso ao CRM (HTTP 403 "Acesso negado.").
   - **Resultado:** ✅ Pass.
10. **leads: filtra a listagem pelo corretor logado e retorna leads mapeados (200)**
    - **Validação:** Corretor autenticado visualiza estritamente os leads com `corretor_id = auth.uid`.
    - **Resultado:** ✅ Pass.
11. **leads: não restringe por corretor_id quando o usuário é administrador (200)**
    - **Validação:** Perfis `admin_corretora` têm visibilidade completa de todos os leads cadastrados.
    - **Resultado:** ✅ Pass.
12. **leads: valida payload na criação de novo lead e rejeita dados inválidos (400)**
    - **Validação:** Falta de campos obrigatórios (nome, telefone) retorna HTTP 400.
    - **Resultado:** ✅ Pass.
13. **leads: cria lead associado ao corretor autenticado (201)**
    - **Validação:** Inserção vincula compulsoriamente o `corretor_id` do JWT e etapa inicial "novo" (HTTP 201).
    - **Resultado:** ✅ Pass.

---

### 3.4. Isolamento e Propriedade de Leads (`tests/leads-ownership.test.mjs`)
Testa sanitização, normalização e segurança de ownership de [`src/lib/lead-input.ts`](../src/lib/lead-input.ts).

1. **Cadastro normaliza campos e não aceita corretor informado pelo cliente**
   - **Validação:** Impede que o cliente forje `corretor_id` ou `id` no payload.
   - **Resultado:** ✅ Pass.
2. **Campos obrigatórios devem ser strings não vazias**
   - **Validação:** Rejeita espaços em branco e tipos numéricos em campos de texto.
   - **Resultado:** ✅ Pass.
3. **Edição parcial aceita apenas campos de contato e rejeita payload vazio**
   - **Validação:** Permite atualização de telefone e e-mail, rejeitando payloads sem campos úteis.
   - **Resultado:** ✅ Pass.
4. **Todas as consultas de leads são filtradas pelo corretor do JWT**
   - **Validação:** `ownerFilter` gera cláusula `['corretor_id', uid]`.
   - **Resultado:** ✅ Pass.
5. **Mudança de etapa aceita somente uma etapa conhecida e nenhum outro campo**
   - **Validação:** Transição de etapas do funil rejeita campos extras ou etapas inválidas.
   - **Resultado:** ✅ Pass.

---

### 3.5. Entradas de Autenticação (`tests/auth-input.test.mjs`)
Testa funções de normalização em [`src/lib/auth-input.ts`](../src/lib/auth-input.ts).

1. **Registration accepts public roles and normalizes email**
   - **Validação:** Normaliza e-mail para caixa baixa sem espaços e aceita papéis públicos.
   - **Resultado:** ✅ Pass.
2. **Registration rejects privileged roles and incomplete data**
   - **Validação:** Rejeita cadastro direto de `super_admin` e payloads com dados incompletos.
   - **Resultado:** ✅ Pass.

---

### 3.6. Políticas de Rota (`tests/auth-policy.test.mjs`)
Testa controle de acesso a rotas em [`src/lib/auth-policy.ts`](../src/lib/auth-policy.ts).

1. **Private routes enforce role boundaries**
   - **Validação:** Leads bloqueados de `/leads`, `/imoveis/novo`; Corretores bloqueados de `/admin`; Administradores autorizados.
   - **Resultado:** ✅ Pass.

---

### 3.7. Sessão de Usuário (`tests/auth-session.test.mjs`)
Testa proteção de dados em [`src/lib/auth-session.ts`](../src/lib/auth-session.ts).

1. **Session profile never includes the password hash**
   - **Validação:** `publicProfile` remove o campo `senha_hash` antes de retornar ao cliente.
   - **Resultado:** ✅ Pass.

---

### 3.8. Validação de Imóveis (`tests/imoveis-input.test.mjs`)
Testa validação de cadastro e edição de imóveis em [`src/lib/imoveis-input.ts`](../src/lib/imoveis-input.ts).

1. **Aceita imóvel válido, normaliza texto e ignora campos controlados pelo servidor** (Pass)
2. **Rejeita campos obrigatórios vazios e valores fora do esquema** (Pass)
3. **Edição aceita campos parciais válidos, mas não atualização vazia** (Pass)
4. **Identificadores de imóvel inválidos são rejeitados antes da consulta** (Pass)

---

### 3.9. Upload de Mídia de Imóveis (`tests/imoveis-upload.test.mjs`)
Testa restrições de armazenamento em [`src/lib/imoveis-upload.ts`](../src/lib/imoveis-upload.ts).

1. **Aceita apenas JPEG, PNG e WebP até 5 MB** (Pass)
2. **Nome do objeto é único e não incorpora caminho enviado pelo navegador** (Pass)
3. **O cadastro só aceita URLs públicas do bucket configurado** (Pass)

---

### 3.10. Configuração do Supabase (`tests/supabase-config.test.mjs`)
Testa variáveis de ambiente e instâncias de cliente em [`src/lib/supabase-config.ts`](../src/lib/supabase-config.ts).

1. **Expõe o nome único do bucket de imagens** (Pass)
2. **Lê a configuração pública do Supabase** (Pass)
3. **Lê a configuração privada do Supabase** (Pass)
4. **Informa todas as variáveis ausentes em uma única mensagem** (Pass)
5. **Trata valor vazio como variável ausente** (Pass)

---

## 4. Como Executar os Testes

Para reproduzir os testes a qualquer momento, execute no terminal do projeto:

```bash
npm test
```

Este comando invoca diretamente:
```bash
node --experimental-strip-types --test tests/*.test.mjs
```

---

_Relatório compilado e validado automaticamente na pasta `tests/` do repositório CorreIA._
