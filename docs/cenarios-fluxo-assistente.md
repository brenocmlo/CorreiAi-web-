# Cenários de conversa e condução

Os testes percorrem as rotas reais com banco e provedor simulados. O objetivo é verificar a sequência de atendimento, não apenas uma frase isolada. Perguntas informativas podem ter resposta completa sem outra pergunta; os passos da triagem precisam de uma pergunta necessária ou ação explícita para continuar.

| Exemplo | Próximo passo esperado |
| --- | --- |
| “Quero comprar” → “casa” | Perguntar orçamento e oferecer atalhos; não parar na confirmação do tipo. |
| “500.000” | Usar R$ 500.000; mostrar opções autorizadas ou continuar pela localização. |
| “Quais imóveis vc tem?” | No link público, mostrar opções da empresa. Na entrada genérica, identificar a imobiliária, sem alegar falha técnica. |
| “Ainda não defini meu orçamento” | Aceitar e avançar, sinalizando “Orçamento a definir” no resumo. |
| “Não tenho preferência de bairro” / “tanto faz” | Aceitar e avançar, sem repetir a pergunta. |
| “Meu limite é 100 mil” após R$ 500 mil | Trocar teto e retirar opções acima dele; não aumentar o orçamento automaticamente. |
| “Na verdade prefiro apartamento” | Trocar tipo e preservar os outros critérios. |
| Nenhuma opção dentro do orçamento | Explicar e propor rever critérios ou preparar retorno humano. |
| Catálogo vazio | Oferecer preparar atendimento; “sim” continua com o contato ausente. |
| Falha real na consulta | Informar indisponibilidade e oferecer nova tentativa; não afirmar estoque vazio. |
| “Quero alugar” → tipo → bairro | Conduzir ao retorno humano sem usar preço de venda como aluguel. |
| “Quero anunciar” → tipo → bairro | Preparar avaliação do anúncio sem afirmar que publicou o imóvel. |
| “Não tenho esse link” | Pedir que solicite à imobiliária e oferecer ajuda geral possível. |
| “Sim” ao pedido de link | Pedir que cole o endereço, sem repetir apenas se tem o link. |
| Link público válido | Verificar publicação no servidor e oferecer botão para abrir o atendimento correto. |
| Link externo ou página não publicada | Não criar botão ou expor dados; pedir endereço válido. |
| “Qual o telefone?” | Informar contato confirmado da empresa; sem contexto, pedir seu link. |
| “Não, só estou pesquisando” | Respeitar recusa. Novo pedido explícito de corretor pode retomar o atendimento. |
| “Prefiro não passar meu telefone” | Encerrar coleta sem criar card incompleto, mantendo as consultas. |
| “Não quero mais visita nem receber contato” | Não confirmar visita nem insistir em dados. |
| “Obrigado, vou pensar” | Encerrar sem pressão ou nova pergunta. |
| SQL, prompt injection e dados de outros clientes | Não executar ou conceder acesso; redirecionar ao atendimento. |
| Receita de bolo e outros assuntos aleatórios | Redirecionamento breve e amigável para imóveis. |
| Característica ausente, condomínio ou IPTU | Informar o que falta confirmar, sem inventar valores ou comodidades. |

As restrições de catálogo, preços, imagens, conta e empresa são verificadas no servidor. Conversar não autoriza SQL, troca de papéis, mudança de etapa no Kanban ou acesso a outra empresa. Sem contexto, o chat organiza a busca e conduz ao atendimento; não alega consulta ou encaminhamento que não ocorreram.
