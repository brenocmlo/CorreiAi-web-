# Demonstração comercial do CorreAI

A landing `/` vende o sistema CorreAI. Ela permite experimentar o atendimento ali mesmo, sem cadastro, telefone, login de corretor ou link de outra imobiliária.

O catálogo de exemplo vem de `src/lib/assistant-demo.ts`: Horizonte (Fortaleza, quatro imóveis fictícios) e Litoral (Aquiraz, três). Fotos são ilustrativas, e empresas, endereços e valores são fictícios. A vitrine e o chat compartilham os mesmos registros, evitando mostrar uma oferta na landing e outra na conversa. Não foram criadas empresas, contas ou imóveis de demonstração no banco real.

O visitante escolhe a imobiliária no início ou no seletor do chat. Pode pedir casas até R$ 500 mil, consultar detalhes, ajustar critérios, perguntar sobre outra empresa de exemplo ou simular uma visita. A ausência de resultados conduz a alternativas. Pedidos de contato/visita explicam o funcionamento do funil, sem coletar dados pessoais ou confirmar ações reais.

`GET/POST /api/assistente?demo=horizonte` e `?demo=litoral` usam somente esses exemplos. O modo de demonstração é reconhecido antes de consultar perfil ou banco, não tem responsável nem hash de lead e nunca chama a gravação de atendimento. Slug desconhecido e imóvel não pertencente ao catálogo são recusados. Reiniciar a demonstração não limpa o cookie de um atendimento real em outra aba. A chave do provedor continua apenas no servidor.

Há limite local de 40 mensagens/minuto por origem e 600/hora por instância, com identificadores efêmeros e sem IP persistido. É uma proteção por processo: não constitui cota global entre múltiplas instâncias. Os atendimentos de imobiliárias reais usam o limitador compartilhado no Postgres.

As páginas `/imobiliaria/{slug}` atendem clientes de empresas reais, conforme publicação autorizada pelo seu administrador, com cadastro rápido e Kanban reais. Catálogo interno, equipe e dados de outros clientes continuam protegidos. A demonstração da landing não concede acesso a esses recursos.
