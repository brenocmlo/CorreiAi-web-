# Relatório de Povoamento do Banco de Dados em Produção — CorreIA

**Ambiente:** Produção (`https://correiai.vercel.app`)
**Banco de Dados:** Supabase Cloud (`sadnfebpklwgxerzgfqc.supabase.co`)
**Storage Bucket:** `imoveis_imagens` (Upload assinado e privado)
**Usuário Administrador Executor:** `brenocamelo@gmail.com` (Papel: `admin_corretora`)
**Imobiliária ID:** `8f3e840b-533e-4531-8e0b-fc1d3f9f49e8`
**Data da Operação:** 29 de Outubro de 2026
**Status da Operação:** ✅ **Sucesso absoluto (100% dos dados integrados)**

---

## 1. Sumário Executivo

O banco de dados do CorreIA em produção foi populado com um conjunto completo de dados fictícios realistas e de alta qualidade para simulação operacional de um CRM imobiliário moderno.

```
Total de Corretores Cadastrados: 3 (ativos na equipe)
Total de Imóveis no Catálogo: 9 (8 novos com fotos reais de alta resolução + 1 preexistente)
Total de Leads no Funil: 14 (13 novos distribuídos nas 5 etapas do Kanban + 1 preexistente)
Storage Supabase: 8 fotos reais de imóveis enviadas via upload assinado privado
```

---

## 2. Equipe de Corretores da Imobiliária

Cadastrados através da rota autenticada `POST /api/admin/corretores` com hash bcrypt, vinculados à imobiliária de Breno e habilitados para acesso imediato:

| Corretor(a) | E-mail | CPF | CRECI | Senha de Acesso | Leads Atribuídos | ID do Perfil |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Juliana Santos Silveira** | `juliana.santos@correiai.com.br` | `12345678901` | `24891-F/CE` | `[credencial removida]` | 3 leads | `037b0a65-6326-49c7-be18-c5bb1ba27b9f` |
| **Rodrigo Almeida Mendes** | `rodrigo.mendes@correiai.com.br` | `23456789012` | `19432-F/CE` | `[credencial removida]` | 3 leads | `441120a9-a29c-41e0-92de-ad915e1bc0be` |
| **Camila Guimarães Costa** | `camila.costa@correiai.com.br` | `34567890123` | `31205-F/CE` | `[credencial removida]` | 3 leads | `bd53896d-d834-40bb-96c7-8966c3d7578f` |

*Observação: Breno Camelo (`brenocamelo@gmail.com`) atua como Administrador da Imobiliária e possui 5 leads sob gestão direta.*

---

## 3. Catálogo de Imóveis com Imagens

Todos os imóveis foram registrados via `POST /api/imoveis` com fotos reais em alta resolução enviadas para o bucket `imoveis_imagens` via URL assinada (`/api/imoveis/upload-url`) e acessíveis por rota protegida (`/api/imoveis/imagem?path=...`):

| # | Tipo | Endereço | Bairro | Valor | Metragem | Quartos / Vagas | Responsável | Status |
| :-: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: |
| 1 | **Apartamento** | Av. Beira Mar, 2800 - Apto 1402 | Meireles | R$ 1.850.000 | 195 m² | 4 qts / 3 vag | Breno Camelo | `disponivel` |
| 2 | **Casa** | Alameda dos Ipês, 142 (Alphaville) | Eusébio | R$ 1.420.000 | 320 m² | 4 qts / 4 vag | Juliana Santos | `disponivel` |
| 3 | **Apartamento** | Rua Bento Albuquerque, 950 - Apto 803 | Cocó | R$ 480.000 | 68 m² | 2 qts / 1 vag | Rodrigo Mendes | `disponivel` |
| 4 | **Apartamento** | Rua Leonardo Mota, 1500 - Cob. 2101 | Aldeota | R$ 2.600.000 | 340 m² | 5 qts / 4 vag | Camila Costa | `disponivel` |
| 5 | **Comercial** | Av. Santos Dumont, 3131 - Sala 1204 | Aldeota | R$ 350.000 | 48 m² | — / 1 vag | Breno Camelo | `disponivel` |
| 6 | **Casa** | Rua das Acácias, 75 (Jardins) | Porto das Dunas | R$ 980.000 | 250 m² | 3 qts / 3 vag | Juliana Santos | `disponivel` |
| 7 | **Terreno** | Quadra G, Lote 18 (Cidade Alpha) | Cidade Alpha | R$ 390.000 | 450 m² | — / — | Rodrigo Mendes | `disponivel` |
| 8 | **Apartamento** | Rua Joãozito Arruda, 210 - Apto 102 Garden | Parque Iracema | R$ 620.000 | 110 m² | 3 qts / 2 vag | Camila Costa | `disponivel` |
| 9 | **Casa** *(legado)* | Rua abc | Maranguap | R$ 100 | 450 m² | 2 qts / 2 vag | Breno Camelo | `disponivel` |

---

## 4. Leads do Funil de Vendas (Kanban)

Os leads foram cadastrados e distribuídos entre as colunas do funil de vendas (`POST /api/leads` e `PATCH /api/leads/[id]/etapa`), permitindo visualização rica e realista no quadro Kanban:

| # | Nome do Lead | Telefone | E-mail | Orçamento | Interesse | Etapa Kanban | Corretor Responsável |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | **Mariana Cavalcante Peixoto** | (85) 99124-8833 | `mariana.peixoto@email.com` | R$ 500k – R$ 800k | Apartamento | **Novo** | Breno Camelo |
| 2 | **Carlos Eduardo Vasconcelos** | (85) 98845-1290 | `cadu.vasconcelos@email.com` | R$ 800k – R$ 1,2 mi | Casa | **Novo** | Juliana Santos |
| 3 | **Fernanda Lima de Albuquerque** | (85) 99671-3344 | `fernanda.albuquerque@email.com` | Até R$ 300 mil | Apartamento | **Novo** | Rodrigo Mendes |
| 4 | **Dr. Roberto Magalhães Filho** | (85) 98712-4455 | `roberto.magalhaes@clinica.med.br` | Acima de R$ 1,2 mi | Cobertura | **Em atendimento** | Camila Costa |
| 5 | **Patrícia Nogueira Sampaio** | (85) 99234-7711 | `patricia.sampaio@adv.com.br` | R$ 500k – R$ 800k | Apartamento | **Em atendimento** | Breno Camelo |
| 6 | **Lucas Pinheiro Holanda** | (85) 98109-6677 | `lucas.holanda@techstart.io` | R$ 300k – R$ 500k | Studio | **Em atendimento** | Juliana Santos |
| 7 | **Beatriz Mendonça Frota** | (85) 99450-8822 | `beatriz.frota@arquitetura.com.br` | Acima de R$ 1,2 mi | Casa | **Visita agendada** | Rodrigo Mendes |
| 8 | **Gustavo Bezerra de Menezes** | (85) 98667-3399 | `gustavo.menezes@empresa.com.br` | R$ 800k – R$ 1,2 mi | Apartamento | **Visita agendada** | Camila Costa |
| 9 | **Dra. Renata Lins Fontenele** | (85) 99788-2211 | `renata.lins@hospital.com.br` | R$ 300k – R$ 500k | Comercial | **Visita agendada** | Breno Camelo |
| 10 | **Henrique Araripe Queiroz** | (85) 98901-4433 | `henrique.araripe@investimentos.com.br` | Acima de R$ 1,2 mi | Casa | **Proposta** | Juliana Santos |
| 11 | **Tatiana Chaves Barreto** | (85) 99188-6655 | `tatiana.barreto@gmail.com` | R$ 500k – R$ 800k | Apartamento | **Proposta** | Rodrigo Mendes |
| 12 | **Marcelo Dantas Carneiro** | (85) 98833-2211 | `marcelo.carneiro@engenharia.com.br` | R$ 800k – R$ 1,2 mi | Casa | **Fechado** | Camila Costa |
| 13 | **Priscila Rolim Maia** | (85) 99611-9988 | `priscila.maia@design.com.br` | R$ 300k – R$ 500k | Apartamento | **Fechado** | Breno Camelo |
| 14 | **Pedro** *(legado)* | 88988335991 | `pedrinho@gmail.com` | R$ 300k – R$ 500k | Casa | **Fechado** | Breno Camelo |

---

## 5. Script de Execução e Reprodução

O script de automação para inserção desses dados está disponível e documentado em [`tests/povoar-banco.mjs`](povoar-banco.mjs).

Para executar novamente ou validar os dados de produção a qualquer momento:
```bash
node tests/verificar-banco.mjs
```

---

## 6. Como Acessar e Validar em Produção

1. Acesse o sistema publicado na Vercel: **[https://correiai.vercel.app/login](https://correiai.vercel.app/login)**
2. Faça login com o administrador:
   - **E-mail:** `brenocamelo@gmail.com`
   - **Senha:** `[credencial removida]`
3. Navegue pelos módulos:
   - **`/admin`:** Visualize a equipe de corretores com métricas de leads em tempo real.
   - **`/imoveis`:** Explore o catálogo completo de imóveis com fotos em alta definição.
   - **`/leads`:** Interaja com o quadro Kanban contendo os leads organizados por etapas do funil.
