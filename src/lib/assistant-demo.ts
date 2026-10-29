import type { AssistantProperty } from '../types/assistant';

// Dados fictícios e versionados: a demonstração comercial nunca lê tenants reais.
const houseImage =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80';
const apartmentImage =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';
const coastalImage =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';
type DemoAgency = {
  slug: string;
  nome: string;
  cidade: string;
  descricao: string;
  imagem: string;
  imoveis: AssistantProperty[];
};
export const DEMO_AGENCIES: DemoAgency[] = [
  {
    slug: 'horizonte',
    nome: 'Horizonte · exemplo',
    cidade: 'Fortaleza',
    descricao:
      'Casas e apartamentos para testar buscas por bairro, preço e tamanho.',
    imagem: houseImage,
    imoveis: [
      {
        id: 'd1000000-0000-4000-8000-000000000001',
        tipo: 'Casa',
        endereco: 'Rua Modelo, 100 — endereço fictício',
        bairro: 'Centro',
        valor: 280000,
        quartos: 2,
        vagas: 1,
        metragem: 90,
        status: 'disponivel',
        descricao:
          'Imóvel fictício com varanda e quintal, usado apenas nesta demonstração.',
        imagem_url: houseImage,
      },
      {
        id: 'd1000000-0000-4000-8000-000000000002',
        tipo: 'Casa',
        endereco: 'Rua Exemplo, 200 — endereço fictício',
        bairro: 'Parquelândia',
        valor: 450000,
        quartos: 3,
        vagas: 2,
        metragem: 120,
        status: 'disponivel',
        descricao:
          'Casa fictícia com três quartos e área externa para simular o atendimento.',
        imagem_url: coastalImage,
      },
      {
        id: 'd1000000-0000-4000-8000-000000000003',
        tipo: 'Apartamento',
        endereco: 'Avenida Modelo, 300 — endereço fictício',
        bairro: 'Meireles',
        valor: 390000,
        quartos: 2,
        vagas: 1,
        metragem: 68,
        status: 'disponivel',
        descricao:
          'Apartamento fictício com varanda. Condomínio, IPTU e regras para pets não foram definidos.',
        imagem_url: apartmentImage,
      },
      {
        id: 'd1000000-0000-4000-8000-000000000004',
        tipo: 'Apartamento',
        endereco: 'Avenida Exemplo, 400 — endereço fictício',
        bairro: 'Aldeota',
        valor: 620000,
        quartos: 3,
        vagas: 2,
        metragem: 105,
        status: 'disponivel',
        descricao:
          'Apartamento fictício para demonstrar critérios de orçamento e número de quartos.',
        imagem_url: apartmentImage,
      },
    ],
  },
  {
    slug: 'litoral',
    nome: 'Litoral · exemplo',
    cidade: 'Aquiraz',
    descricao:
      'Um segundo catálogo para experimentar o atendimento separado por imobiliária.',
    imagem: coastalImage,
    imoveis: [
      {
        id: 'd2000000-0000-4000-8000-000000000001',
        tipo: 'Casa',
        endereco: 'Rua do Exemplo, 10 — endereço fictício',
        bairro: 'Porto das Dunas',
        valor: 480000,
        quartos: 3,
        vagas: 2,
        metragem: 140,
        status: 'disponivel',
        descricao:
          'Casa fictícia com área externa. Distância da praia e custos precisam ser confirmados em um cadastro real.',
        imagem_url: coastalImage,
      },
      {
        id: 'd2000000-0000-4000-8000-000000000002',
        tipo: 'Apartamento',
        endereco: 'Avenida do Exemplo, 20 — endereço fictício',
        bairro: 'Porto das Dunas',
        valor: 330000,
        quartos: 2,
        vagas: 1,
        metragem: 64,
        status: 'disponivel',
        descricao:
          'Apartamento fictício para comparar preço, localização e tamanho nesta demonstração.',
        imagem_url: apartmentImage,
      },
      {
        id: 'd2000000-0000-4000-8000-000000000003',
        tipo: 'Terreno',
        endereco: 'Rua Ilustrativa, 30 — endereço fictício',
        bairro: 'Centro',
        valor: 150000,
        metragem: 250,
        status: 'disponivel',
        descricao:
          'Terreno fictício. Documentação e condições de construção não foram definidas.',
        imagem_url: houseImage,
      },
    ],
  },
];
export const getDemoAgency = (slug: unknown) =>
  DEMO_AGENCIES.find((agency) => agency.slug === slug) ?? null;
export function demoAgencyMention(text: string) {
  const lower = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  return (
    DEMO_AGENCIES.find(
      (agency) =>
        lower === agency.slug ||
        (/(?:imobiliaria|trocar|mudar|testar|ver).{0,25}/.test(lower) &&
          new RegExp(`\\b${agency.slug}\\b`).test(lower)),
    )?.slug ?? null
  );
}
