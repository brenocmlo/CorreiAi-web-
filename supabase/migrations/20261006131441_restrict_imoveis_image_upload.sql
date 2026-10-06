-- E14: o navegador envia diretamente ao Storage com token de upload de uso limitado,
-- emitido pela API após verificar o JWT da aplicação. Não permitir INSERT anônimo.
drop policy if exists "imoveis_imagens_public_insert" on storage.objects;
