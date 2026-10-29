import { createClient } from '@supabase/supabase-js';

const ORIGIN = process.env.POPULATE_ORIGIN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ADMIN_CREDENTIALS = { email: process.env.POPULATE_ADMIN_EMAIL, senha: process.env.POPULATE_ADMIN_PASSWORD };
// Explicit opt-in: importing/running this file must not populate production by accident.
if (!process.argv.includes('--apply')) {
  console.log('Somente preparação: nenhum acesso ao banco. Defina POPULATE_ORIGIN, POPULATE_ADMIN_EMAIL e POPULATE_ADMIN_PASSWORD; revise os dados e use --apply para executar.');
  process.exit(0);
}
if (!ORIGIN || !ADMIN_CREDENTIALS.email || !ADMIN_CREDENTIALS.senha) throw new Error('Configure o destino e as credenciais fora do código.');
if (!/^https:\/\//.test(ORIGIN) && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(ORIGIN)) throw new Error('Destino inválido.');
if (!SUPABASE_URL || !ANON_KEY || !process.env.POPULATE_BROKER_PASSWORD) throw new Error('Configure Supabase e a senha das contas técnicas fora do código.');


const CORRETORES = [
  {
    nome_completo: 'Juliana Santos Silveira',
    email: 'juliana.santos@correiai.com.br',
    senha: process.env.POPULATE_BROKER_PASSWORD,
    cpf: '12345678901',
    creci: '24891-F/CE',
  },
  {
    nome_completo: 'Rodrigo Almeida Mendes',
    email: 'rodrigo.mendes@correiai.com.br',
    senha: process.env.POPULATE_BROKER_PASSWORD,
    cpf: '23456789012',
    creci: '19432-F/CE',
  },
  {
    nome_completo: 'Camila Guimarães Costa',
    email: 'camila.costa@correiai.com.br',
    senha: process.env.POPULATE_BROKER_PASSWORD,
    cpf: '34567890123',
    creci: '31205-F/CE',
  },
];

const IMOVEIS = [
  {
    tipo: 'apartamento',
    endereco: 'Av. Beira Mar, 2800 - Apto 1402',
    bairro: 'Meireles',
    valor: 1850000,
    metragem: 195,
    quartos: 4,
    vagas: 3,
    status: 'disponivel',
    descricao: 'Apartamento alto padrão frontal mar com varanda gourmet integrada, suíte master com hidromassagem e acabamento refinado em mármore.',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
  },
  {
    tipo: 'casa',
    endereco: 'Alameda dos Ipês, 142 - Condomínio Alphaville',
    bairro: 'Eusébio',
    valor: 1420000,
    metragem: 320,
    quartos: 4,
    vagas: 4,
    status: 'disponivel',
    descricao: 'Mansão duplex com piscina privativa, deck com churrasqueira gourmet, energia solar fotovoltaica instalada e 4 amplas suítes.',
    imageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&auto=format&fit=crop&q=80',
  },
  {
    tipo: 'apartamento',
    endereco: 'Rua Bento Albuquerque, 950 - Apto 803',
    bairro: 'Cocó',
    valor: 480000,
    metragem: 68,
    quartos: 2,
    vagas: 1,
    status: 'disponivel',
    descricao: 'Apartamento moderno todo planejado por arquiteto, a poucos metros do Parque do Cocó. 1 suíte + reversível, varanda gourmet e lazer completo.',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80',
  },
  {
    tipo: 'apartamento',
    endereco: 'Rua Leonardo Mota, 1500 - Cobertura 2101',
    bairro: 'Aldeota',
    valor: 2600000,
    metragem: 340,
    quartos: 5,
    vagas: 4,
    status: 'disponivel',
    descricao: 'Cobertura duplex panorâmica exclusiva na Aldeota. Terraço privativo com jacuzzi aquecida, espaço gourmet climatizado e 5 suítes plenas.',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
  },
  {
    tipo: 'comercial',
    endereco: 'Av. Santos Dumont, 3131 - Torre Sul, Sala 1204',
    bairro: 'Aldeota',
    valor: 350000,
    metragem: 48,
    quartos: null,
    vagas: 1,
    status: 'disponivel',
    descricao: 'Sala comercial pronta para consultório ou escritório executivo. Piso elevado em porcelanato, ar condicionado central e recepção finamente decorada.',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
  },
  {
    tipo: 'casa',
    endereco: 'Rua das Acácias, 75 - Condomínio Jardins',
    bairro: 'Porto das Dunas',
    valor: 980000,
    metragem: 250,
    quartos: 3,
    vagas: 3,
    status: 'disponivel',
    descricao: 'Casa térrea contemporânea com pé-direito duplo, integração de sala e cozinha americana com ilha, quintal amplo gramado e piscina.',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
  },
  {
    tipo: 'terreno',
    endereco: 'Quadra G, Lote 18 - Residencial Cidade Alpha',
    bairro: 'Cidade Alpha',
    valor: 390000,
    metragem: 450,
    quartos: null,
    vagas: null,
    status: 'disponivel',
    descricao: 'Lote residencial 100% plano, voltado para o nascente total. Condomínio com infraestrutura completa de lazer, lago e segurança 24 horas.',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80',
  },
  {
    tipo: 'apartamento',
    endereco: 'Rua Joãozito Arruda, 210 - Apto 102 Garden',
    bairro: 'Parque Iracema',
    valor: 620000,
    metragem: 110,
    quartos: 3,
    vagas: 2,
    status: 'disponivel',
    descricao: 'Apartamento estilo Garden com quintal privativo de 35m². Ideal para quem tem pets e crianças. Condomínio com mais de 30 itens de lazer.',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80',
  },
];

const LEADS = [
  {
    nome: 'Mariana Cavalcante Peixoto',
    telefone: '(85) 99124-8833',
    email: 'mariana.peixoto@email.com',
    faixaOrcamento: 'R$ 500 mil – R$ 800 mil',
    tipoImovel: 'Apartamento',
    etapa: 'novo',
  },
  {
    nome: 'Carlos Eduardo Vasconcelos',
    telefone: '(85) 98845-1290',
    email: 'cadu.vasconcelos@email.com',
    faixaOrcamento: 'R$ 800 mil – R$ 1,2 mi',
    tipoImovel: 'Casa',
    etapa: 'novo',
  },
  {
    nome: 'Fernanda Lima de Albuquerque',
    telefone: '(85) 99671-3344',
    email: 'fernanda.albuquerque@email.com',
    faixaOrcamento: 'Até R$ 300 mil',
    tipoImovel: 'Apartamento',
    etapa: 'novo',
  },
  {
    nome: 'Dr. Roberto Magalhães Filho',
    telefone: '(85) 98712-4455',
    email: 'roberto.magalhaes@clinica.med.br',
    faixaOrcamento: 'Acima de R$ 1,2 mi',
    tipoImovel: 'Cobertura',
    etapa: 'em_atendimento',
  },
  {
    nome: 'Patrícia Nogueira Sampaio',
    telefone: '(85) 99234-7711',
    email: 'patricia.sampaio@adv.com.br',
    faixaOrcamento: 'R$ 500 mil – R$ 800 mil',
    tipoImovel: 'Apartamento',
    etapa: 'em_atendimento',
  },
  {
    nome: 'Lucas Pinheiro Holanda',
    telefone: '(85) 98109-6677',
    email: 'lucas.holanda@techstart.io',
    faixaOrcamento: 'R$ 300 mil – R$ 500 mil',
    tipoImovel: 'Studio',
    etapa: 'em_atendimento',
  },
  {
    nome: 'Beatriz Mendonça Frota',
    telefone: '(85) 99450-8822',
    email: 'beatriz.frota@arquitetura.com.br',
    faixaOrcamento: 'Acima de R$ 1,2 mi',
    tipoImovel: 'Casa',
    etapa: 'visita_agendada',
  },
  {
    nome: 'Gustavo Bezerra de Menezes',
    telefone: '(85) 98667-3399',
    email: 'gustavo.menezes@empresa.com.br',
    faixaOrcamento: 'R$ 800 mil – R$ 1,2 mi',
    tipoImovel: 'Apartamento',
    etapa: 'visita_agendada',
  },
  {
    nome: 'Dra. Renata Lins Fontenele',
    telefone: '(85) 99788-2211',
    email: 'renata.lins@hospital.com.br',
    faixaOrcamento: 'R$ 300 mil – R$ 500 mil',
    tipoImovel: 'Comercial',
    etapa: 'visita_agendada',
  },
  {
    nome: 'Henrique Araripe Queiroz',
    telefone: '(85) 98901-4433',
    email: 'henrique.araripe@investimentos.com.br',
    faixaOrcamento: 'Acima de R$ 1,2 mi',
    tipoImovel: 'Casa',
    etapa: 'proposta',
  },
  {
    nome: 'Tatiana Chaves Barreto',
    telefone: '(85) 99188-6655',
    email: 'tatiana.barreto@gmail.com',
    faixaOrcamento: 'R$ 500 mil – R$ 800 mil',
    tipoImovel: 'Apartamento',
    etapa: 'proposta',
  },
  {
    nome: 'Marcelo Dantas Carneiro',
    telefone: '(85) 98833-2211',
    email: 'marcelo.carneiro@engenharia.com.br',
    faixaOrcamento: 'R$ 800 mil – R$ 1,2 mi',
    tipoImovel: 'Casa',
    etapa: 'fechado',
  },
  {
    nome: 'Priscila Rolim Maia',
    telefone: '(85) 99611-9988',
    email: 'priscila.maia@design.com.br',
    faixaOrcamento: 'R$ 300 mil – R$ 500 mil',
    tipoImovel: 'Apartamento',
    etapa: 'fechado',
  },
];

async function api(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${ORIGIN}${path}`, {
    redirect: 'error',
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data, setCookie: res.headers.get('set-cookie') };
}

async function login(email, senha) {
  const res = await api('/api/auth/login', {
    method: 'POST',
    body: { email, senha },
  });
  if (res.status !== 200 || !res.setCookie) {
    throw new Error(`Falha no login de ${email}: status ${res.status} ${JSON.stringify(res.data)}`);
  }
  const cookie = res.setCookie.split(';')[0];
  const me = await api('/api/auth/me', { cookie });
  return { cookie, perfil: me.data?.perfil };
}

async function uploadImage(cookie, imageUrl, authUid) {
  console.log(`  -> Baixando imagem de ${imageUrl.slice(0, 50)}...`);
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Falha ao baixar imagem: ${imgRes.status}`);
  const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

  console.log(`  -> Solicitando URL de upload assinada (${imgBuffer.length} bytes)...`);
  const uploadUrlRes = await api('/api/imoveis/upload-url', {
    method: 'POST',
    cookie,
    body: {
      name: 'foto.jpg',
      type: 'image/jpeg',
      size: imgBuffer.length,
    },
  });

  if (uploadUrlRes.status !== 200 || !uploadUrlRes.data?.path || !uploadUrlRes.data?.token) {
    throw new Error(`Erro ao autorizar upload: ${uploadUrlRes.status} ${JSON.stringify(uploadUrlRes.data)}`);
  }

  const { path, token } = uploadUrlRes.data;

  console.log(`  -> Enviando bytes para o Supabase Storage (path: ${path})...`);
  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: uploadError } = await supabase.storage
    .from('imoveis_imagens')
    .uploadToSignedUrl(path, token, imgBuffer, { contentType: 'image/jpeg' });

  if (uploadError) {
    throw new Error(`Erro no upload para storage: ${uploadError.message}`);
  }

  const relativeUrl = `/api/imoveis/imagem?path=${encodeURIComponent(path)}`;
  console.log(`  -> Imagem salva com sucesso: ${relativeUrl}`);
  return relativeUrl;
}

async function main() {
  console.log('====================================================');
  console.log('🚀 INICIANDO POVOAMENTO DO BANCO DE DADOS EM PRODUÇÃO');
  console.log('====================================================\n');

  // 1. Login como Administrador da Imobiliária
  console.log(`1. Autenticando Administrador (${ADMIN_CREDENTIALS.email})...`);
  const admin = await login(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.senha);
  console.log(`✅ Admin autenticado com sucesso!`);
  console.log(`   Nome: ${admin.perfil.nome_completo}`);
  console.log(`   Perfil ID: ${admin.perfil.id}`);
  console.log(`   Role: ${admin.perfil.role}`);
  console.log(`   Imobiliária ID: ${admin.perfil.imobiliaria_id}\n`);

  // 2. Cadastrar Corretores da Imobiliária
  console.log('2. Verificando e cadastrando corretores da equipe...');
  const equipeAtual = await api('/api/admin', { cookie: admin.cookie });
  const corretoresExistentes = Array.isArray(equipeAtual.data) ? equipeAtual.data : [];
  console.log(`   Corretores existentes na equipe: ${corretoresExistentes.length}`);

  const corretoresSessoes = [];

  for (const c of CORRETORES) {
    const jaExiste = corretoresExistentes.find((e) => e.email.toLowerCase() === c.email.toLowerCase());
    if (jaExiste) {
      console.log(`   ℹ️ Corretor ${c.nome_completo} (${c.email}) já cadastrado. ID: ${jaExiste.id}`);
    } else {
      console.log(`   ➕ Cadastrando corretor: ${c.nome_completo} (${c.email})...`);
      const cadRes = await api('/api/admin/corretores', {
        method: 'POST',
        cookie: admin.cookie,
        body: c,
      });
      if (cadRes.status === 201) {
        console.log(`   ✅ Corretor ${c.nome_completo} criado com sucesso! ID: ${cadRes.data.id}`);
      } else {
        console.error(`   ❌ Falha ao cadastrar corretor ${c.nome_completo}: status ${cadRes.status} ${JSON.stringify(cadRes.data)}`);
      }
    }

    // Fazer login com o corretor para obter cookie de sessão
    try {
      const sessaoCorretor = await login(c.email, c.senha);
      corretoresSessoes.push({ ...c, sessao: sessaoCorretor });
      console.log(`   🔑 Sessão ativa para corretor: ${c.nome_completo}`);
    } catch (err) {
      console.warn(`   ⚠️ Não foi possível logar com corretor ${c.email}: ${err.message}`);
    }
  }

  // Lista de todas as contas ativas da imobiliária para atribuir imóveis e leads
  const contasEquipe = [
    { nome: admin.perfil.nome_completo, sessao: admin },
    ...corretoresSessoes.map((c) => ({ nome: c.nome_completo, sessao: c.sessao })),
  ];

  console.log(`\nTotal de usuários ativos da equipe para distribuição: ${contasEquipe.length}\n`);

  // 3. Cadastrar Imóveis com Imagens
  console.log('3. Cadastrando catálogo de imóveis fictícios com fotos reais...');
  const imoveisAtuaisRes = await api('/api/imoveis', { cookie: admin.cookie });
  const imoveisAtuais = imoveisAtuaisRes.data?.imoveis ?? [];
  console.log(`   Imóveis atualmente no catálogo: ${imoveisAtuais.length}`);

  let imoveisCadastrados = 0;
  for (let i = 0; i < IMOVEIS.length; i++) {
    const imovelDef = IMOVEIS[i];
    const responsavel = contasEquipe[i % contasEquipe.length];

    // Verifica se imóvel com mesmo endereço já existe
    const jaExiste = imoveisAtuais.some(
      (im) => im.endereco.toLowerCase() === imovelDef.endereco.toLowerCase()
    );

    if (jaExiste) {
      console.log(`   ℹ️ Imóvel em "${imovelDef.endereco}" já existe no catálogo. Pulando.`);
      continue;
    }

    console.log(`\n   🏠 Cadastrando Imóvel #${i + 1}: ${imovelDef.tipo.toUpperCase()} - ${imovelDef.endereco}`);
    console.log(`      Bairro: ${imovelDef.bairro} | Valor: R$ ${imovelDef.valor.toLocaleString('pt-BR')} | Responsável: ${responsavel.nome}`);

    try {
      // Upload da foto para o bucket via sessão do corretor/admin responsável
      const imagemUrl = await uploadImage(responsavel.sessao.cookie, imovelDef.imageUrl, responsavel.sessao.perfil.id);

      const imovelPayload = {
        tipo: imovelDef.tipo,
        endereco: imovelDef.endereco,
        bairro: imovelDef.bairro,
        valor: imovelDef.valor,
        metragem: imovelDef.metragem,
        quartos: imovelDef.quartos,
        vagas: imovelDef.vagas,
        status: imovelDef.status,
        descricao: imovelDef.descricao,
        imagem_url: imagemUrl,
      };

      const cadImovelRes = await api('/api/imoveis', {
        method: 'POST',
        cookie: responsavel.sessao.cookie,
        body: imovelPayload,
      });

      if (cadImovelRes.status === 201) {
        console.log(`      ✅ Imóvel cadastrado com sucesso! ID: ${cadImovelRes.data?.imovel?.id}`);
        imoveisCadastrados++;
      } else {
        console.error(`      ❌ Falha ao cadastrar imóvel: status ${cadImovelRes.status} ${JSON.stringify(cadImovelRes.data)}`);
      }
    } catch (err) {
      console.error(`      ❌ Erro durante upload/criação do imóvel: ${err.message}`);
    }
  }

  // 4. Cadastrar e Distribuir Leads no Funil Kanban
  console.log('\n4. Cadastrando e organizando leads no Funil de Vendas...');
  let leadsCadastrados = 0;

  for (let i = 0; i < LEADS.length; i++) {
    const leadDef = LEADS[i];
    // Distribuir entre os corretores e admin
    const responsavel = contasEquipe[i % contasEquipe.length];

    console.log(`   👤 Lead #${i + 1}: ${leadDef.nome} -> Corretor: ${responsavel.nome} | Etapa desejada: ${leadDef.etapa}`);

    try {
      const cadLeadRes = await api('/api/leads', {
        method: 'POST',
        cookie: responsavel.sessao.cookie,
        body: {
          nome: leadDef.nome,
          telefone: leadDef.telefone,
          email: leadDef.email,
          faixaOrcamento: leadDef.faixaOrcamento,
          tipoImovel: leadDef.tipoImovel,
        },
      });

      if (cadLeadRes.status === 201 && cadLeadRes.data?.lead?.id) {
        const leadId = cadLeadRes.data.lead.id;

        // Se a etapa for diferente de 'novo', atualiza via PATCH
        if (leadDef.etapa !== 'novo') {
          const patchRes = await api(`/api/leads/${leadId}/etapa`, {
            method: 'PATCH',
            cookie: responsavel.sessao.cookie,
            body: { etapa: leadDef.etapa },
          });

          if (patchRes.status === 200) {
            console.log(`      ✅ Lead criado e movido para etapa "${leadDef.etapa}" (ID: ${leadId})`);
          } else {
            console.warn(`      ⚠️ Lead criado, mas não moveu etapa: ${patchRes.status} ${JSON.stringify(patchRes.data)}`);
          }
        } else {
          console.log(`      ✅ Lead criado com sucesso na etapa "novo" (ID: ${leadId})`);
        }
        leadsCadastrados++;
      } else {
        console.error(`      ❌ Falha ao criar lead: ${cadLeadRes.status} ${JSON.stringify(cadLeadRes.data)}`);
      }
    } catch (err) {
      console.error(`      ❌ Erro ao criar lead: ${err.message}`);
    }
  }

  // 5. Relatório e Conferência Final
  console.log('\n====================================================');
  console.log('📊 CONFERÊNCIA DOS DADOS SALVOS EM PRODUÇÃO');
  console.log('====================================================');

  const imoveisFinaisRes = await api('/api/imoveis', { cookie: admin.cookie });
  const totalImoveis = imoveisFinaisRes.data?.imoveis?.length ?? 0;
  console.log(`• Total de Imóveis no Catálogo da Imobiliária: ${totalImoveis}`);

  const equipeFinalRes = await api('/api/admin', { cookie: admin.cookie });
  const equipeFinal = equipeFinalRes.data ?? [];
  console.log(`• Corretores na Equipe da Imobiliária: ${equipeFinal.length}`);
  equipeFinal.forEach((c) => {
    console.log(`  - ${c.nome_completo} (${c.email}) | CRECI: ${c.creci} | Total Leads: ${c.total_leads}`);
  });

  const leadsAdminRes = await api('/api/leads', { cookie: admin.cookie });
  const leadsAdmin = leadsAdminRes.data?.leads?.length ?? 0;
  console.log(`• Leads sob gestão direta de Breno: ${leadsAdmin}`);

  console.log('\n🎉 Povoamento concluído com sucesso!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
