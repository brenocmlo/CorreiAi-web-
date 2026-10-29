# Atendimento público por imobiliária

## Acesso do cliente

O administrador da imobiliária entra em `/admin`, configura o telefone comercial, define um endereço e ativa **Página de atendimento para clientes**. Compartilha então `https://correiai.vercel.app/imobiliaria/SEU-ENDERECO`.

O visitante desse link pode consultar os imóveis disponíveis, preços e contato comercial e conversar com a IA sem login de corretor. O cadastro rápido pede nome, e-mail, telefone e autorização para contato. Ele cria um lead no funil da equipe e identifica a pessoa no chat; não cria conta de funcionário nem senha. O cadastro público `/cadastro` continua criando somente perfil de cliente.

As empresas existentes começam com publicação desativada. Somente seu administrador decide ativá-la. Sem um link de empresa publicado, a landing genérica não expõe um catálogo global. Desativar a página ou suspender a empresa impede novas consultas públicas; URLs de imagem já assinadas podem continuar válidas por até 60 segundos.

## Comportamento do assistente

- Reconhece `500.000` como orçamento e apresenta os imóveis compatíveis com preços reais e uma próxima ação.
- Explica ausência de resultados, tipo de imóvel indisponível ou catálogo vazio; não aumenta o orçamento nem inventa ofertas.
- Responde preço, endereço, quartos, vagas e metragem a partir do imóvel selecionado. Dados ausentes precisam de confirmação da equipe.
- Mantém o telefone comercial confirmado no chat; não deduz WhatsApp, aluguel, taxa, parcela, desconto ou visita confirmada.
- Reaproveita o contato recebido pelo formulário e evita duplicar o card da mesma sessão. Não altera responsável ou etapa já definida pelo corretor.
- Redireciona pedidos aleatórios e tentativas reconhecidas de comandos/extração de segredos. O modelo recebe dados de catálogo limitados, sem ferramenta SQL, credenciais ou dados de outros clientes. Filtros de texto são uma camada adicional, não uma garantia de detectar toda formulação maliciosa.

## Proteções e operação

Os endpoints públicos validam publicação ativa, empresa exata, status disponível e ID do imóvel. As tabelas internas continuam sem acesso direto para anon/authenticated. Imagens são liberadas somente após a mesma validação. Nome, telefone e mensagens não entram em expressões SQL concatenadas; React escapa texto renderizado.

O chat aceita até 256 KiB por requisição, 30 mensagens e 2.000 caracteres por mensagem. O cadastro rápido aceita 8 KiB. No atendimento público, o banco aplica contadores atômicos compartilhados entre instâncias: 20 mensagens/minuto e 5 cadastros/minuto por origem e empresa, além de 3.000 mensagens/dia e 500 cadastros/dia por empresa. São limites de proteção iniciais; ajustar conforme uso real. IP não é armazenado: somente HMAC com segredo do servidor. A origem pode ser compartilhada por clientes da mesma rede. A cota diária limita também tentativas que alternem o endereço informado. Indisponibilidade do limitador bloqueia novas operações públicas com erro recuperável.

Aplicar as migrations `public_agency_attendance`, `public_attendance_limits` e `fix_public_attendance_clock` antes da nova versão. A primeira é aditiva e mantém publicação desativada por padrão; as demais adicionam contadores temporários e uma função executável por service_role. O ajuste de relógio evita colisão com a expressão SQL reservada CURRENT_TIME, identificada na validação real da função antes do deploy. Nenhuma migration ativa empresas, cria usuários ou altera imóveis/leads existentes.

## Validação

Suíte isolada: cadastro/login de cliente, papéis administrativos, catálogo e sessão separados por imobiliária, cadastro rápido no Kanban, concorrência com resposta em andamento, imóveis selecionados, busca com e sem resultados, `500.000`, telefone, comandos SQL, prompt injection, assuntos aleatórios, falha do limitador e corpos grandes sem Content-Length. Banco, Storage e provedor da IA são simulados nessa suíte; esse resultado não equivale a testar o modelo real ou o SQL em produção.
