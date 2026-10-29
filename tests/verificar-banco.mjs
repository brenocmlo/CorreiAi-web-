const ORIGIN = 'https://correiai.vercel.app';

const ADMIN_CREDENTIALS = {
  email: 'brenocamelo@gmail.com',
  senha: 'Tabosa1206',
};

async function api(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${ORIGIN}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data, headers: res.headers };
}

async function verificar() {
  console.log('====================================================');
  console.log('🔍 VERIFICAÇÃO DO BANCO DE DADOS EM PRODUÇÃO');
  console.log('====================================================\n');

  console.log('1. Autenticando administrador...');
  const loginRes = await api('/api/auth/login', {
    method: 'POST',
    body: ADMIN_CREDENTIALS,
  });

  if (loginRes.status !== 200 || !loginRes.headers.get('set-cookie')) {
    throw new Error('Falha na autenticação do administrador');
  }

  const cookie = loginRes.headers.get('set-cookie').split(';')[0];
  const me = await api('/api/auth/me', { cookie });
  console.log(`✅ Conectado como: ${me.data?.perfil?.nome_completo} (${me.data?.perfil?.email})`);
  console.log(`   Role: ${me.data?.perfil?.role} | Imobiliária ID: ${me.data?.perfil?.imobiliaria_id}\n`);

  console.log('2. Consultando equipe de corretores...');
  const adminRes = await api('/api/admin', { cookie });
  const corretores = adminRes.data ?? [];
  console.log(`   Total de corretores encontrados: ${corretores.length}`);
  for (const c of corretores) {
    console.log(`   - ${c.nome_completo} | ${c.email} | CRECI: ${c.creci} | Ativo: ${c.ativo} | Leads: ${c.total_leads}`);
  }

  console.log('\n3. Consultando catálogo de imóveis...');
  const imoveisRes = await api('/api/imoveis', { cookie });
  const imoveis = imoveisRes.data?.imoveis ?? [];
  console.log(`   Total de imóveis no catálogo: ${imoveis.length}`);
  for (const im of imoveis) {
    console.log(`   - [${im.tipo.toUpperCase()}] ${im.endereco} (${im.bairro}) - R$ ${Number(im.valor).toLocaleString('pt-BR')} | Foto: ${im.imagem_url ? 'Sim' : 'Não'}`);
  }

  console.log('\n4. Consultando leads...');
  const leadsRes = await api('/api/leads', { cookie });
  const leads = leadsRes.data?.leads ?? [];
  console.log(`   Leads sob gestão direta de Breno: ${leads.length}`);
  for (const l of leads) {
    console.log(`   - ${l.nome} | ${l.telefone} | Etapa: ${l.etapa} | Orçamento: ${l.faixaOrcamento}`);
  }

  console.log('\n====================================================');
  console.log('✅ Verificação concluída com sucesso!');
  console.log('====================================================');
}

verificar().catch(console.error);
