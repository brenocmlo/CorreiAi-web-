# Área do cliente e documentos

O cadastro público continua criando somente uma conta `lead`, com login e dashboard próprios. O cliente entra em `/cliente`, também acessível pelo menu **Meu atendimento**.

O corretor responsável abre **Leads → atendimento → Portal do cliente** e libera o acesso em qualquer etapa do Kanban. Para um cliente ainda sem vínculo, gera um código de uso único, válido por sete dias, destinado ao e-mail salvo no lead. O código aparece somente naquela resposta e deve ser entregue diretamente ao cliente por um canal já conhecido. Nada é enviado automaticamente. Gerar outro convite invalida o anterior.

O cliente cria sua conta, entra com o mesmo e-mail do atendimento e cola o código. Saber somente o e-mail de outra pessoa não permite acesso: a posse do código é obrigatória. O vínculo é atômico, não aceita outra conta/empresa nem um código usado, expirado ou de um portal pausado. Clientes já vinculados preservam seu acesso ao reativar o portal.

O cliente e seu corretor podem enviar PDF/JPG/PNG de até 3 MB, consultar o recebimento e trocar mensagens privadas. O corretor pode marcar documentos em análise, conferir ou solicitar reenvio com orientação. Conferência de arquivo não representa decisão sobre crédito, financiamento ou aprovação de uma compra.

Documentos ficam no bucket privado `cliente_documentos`. Todo upload verifica extensão, MIME, tamanho e assinatura do conteúdo no servidor. O caminho é gerado pelo servidor; arquivos existentes nunca são substituídos. O recebimento só é confirmado depois de persistir arquivo e metadados. Se o registro falhar, a API tenta remover apenas o objeto novo. Limites: 50 documentos e 500 mensagens por atendimento; as 50 mensagens mais recentes aparecem em ordem cronológica.

Downloads passam pela API autenticada, com nova verificação do vínculo e acesso atual, resposta sem cache e disposição de anexo. Não existem links públicos ou links de download persistentes. RLS e revogação de privilégios impedem leitura direta das novas tabelas por `anon`/`authenticated`. As funções são `SECURITY INVOKER` e executáveis somente pelo servidor (`service_role`).

Pausar o portal bloqueia leitura, envio e downloads do cliente; o corretor mantém apenas o controle de liberação enquanto pausado. Mesmo usuários da mesma empresa e o administrador geral não ganham acesso a um atendimento de outro responsável. O portal não muda a etapa do Kanban nem atribui outro corretor. Documentos/mensagens não são enviados ao modelo de IA.

Os registros têm chaves estrangeiras que impedem excluir um lead com documentos/mensagens, evitando arquivos sem atendimento. Ainda não há política automática de retenção/exclusão ou antivírus: validar a assinatura de um PDF não é escanear malware. Os arquivos são baixados como anexos para conferência humana; não devem ser executados. Uma política de retenção deve ser definida antes de operar com volume de documentação real.

Migration: `20261029210204_client_document_portal.sql`. Rollback operacional seguro: voltar o código para a versão anterior, mantendo tabelas/bucket privados e portal desabilitado; não apagar documentos para reverter um deploy.
