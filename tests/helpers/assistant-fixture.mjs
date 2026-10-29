import { randomUUID } from 'node:crypto';
export const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  ORG_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const BROKER_A = '11111111-1111-4111-8111-111111111111',
  BROKER_B = '22222222-2222-4222-8222-222222222222',
  ADMIN_A = '33333333-3333-4333-8333-333333333333',
  CLIENT_A = '44444444-4444-4444-8444-444444444444';
export function assistantFixture() {
  const state = {
    imobiliarias: [
      {
        id: ORG_A,
        nome: 'Horizonte Imóveis · teste',
        telefone: '85999990000',
        ativo: true,
      },
      {
        id: ORG_B,
        nome: 'Outra empresa · teste',
        telefone: '11988887777',
        ativo: true,
      },
    ],
    perfis: [
      {
        id: BROKER_A,
        role: 'corretor',
        ativo: true,
        imobiliaria_id: ORG_A,
        nome_completo: 'Corretor de teste',
        email: 'corretor@example.invalid',
      },
      { id: BROKER_B, role: 'corretor', ativo: true, imobiliaria_id: ORG_B },
      {
        id: ADMIN_A,
        role: 'admin_corretora',
        ativo: true,
        imobiliaria_id: ORG_A,
        nome_completo: 'Admin de teste',
        email: 'admin@example.invalid',
      },
      {
        id: CLIENT_A,
        role: 'lead',
        ativo: true,
        imobiliaria_id: ORG_A,
        nome_completo: 'Ana de teste',
        email: 'ana@example.invalid',
      },
    ],
    imoveis: [
      {
        id: 'a1111111-1111-4111-8111-111111111111',
        proprietario_id: BROKER_A,
        imobiliaria_id: ORG_A,
        tipo: 'casa',
        bairro: 'Centro',
        endereco: 'Rua das Flores, 123',
        valor: 280000,
        quartos: 2,
        vagas: 1,
        metragem: 90,
        status: 'disponivel',
        descricao: 'Casa com varanda e área externa.',
        imagem_url: null,
      },
      {
        id: 'a2222222-2222-4222-8222-222222222222',
        proprietario_id: ADMIN_A,
        imobiliaria_id: ORG_A,
        tipo: 'casa',
        bairro: 'Centro',
        endereco: 'Rua do Sol, 45',
        valor: 295000,
        quartos: 3,
        vagas: 1,
        metragem: 105,
        status: 'disponivel',
        descricao: 'Casa com três quartos.',
        imagem_url: null,
      },
      {
        id: 'b1111111-1111-4111-8111-111111111111',
        proprietario_id: BROKER_B,
        imobiliaria_id: ORG_B,
        tipo: 'casa',
        bairro: 'Centro',
        endereco: 'ENDEREÇO PRIVADO DE OUTRA EMPRESA',
        valor: 220000,
        quartos: 3,
        status: 'disponivel',
        imagem_url: null,
      },
    ],
    leads: [],
  };
  const calls = [];
  const db = {
    state,
    calls,
    from(table) {
      let operation = 'read',
        payload,
        fields = '*',
        cap = Infinity;
      const filters = [];
      const q = {
        select(value = '*') {
          fields = value;
          return this;
        },
        eq(key, value) {
          filters.push((row) => row[key] === value);
          return this;
        },
        in(key, values) {
          filters.push((row) => values.includes(row[key]));
          return this;
        },
        or(expression) {
          const values = expression.split(',').map((s) => {
            const [k, , v] = s.split('.');
            return [k, v];
          });
          filters.push((row) => values.some(([k, v]) => row[k] === v));
          return this;
        },
        order() {
          return this;
        },
        limit(n) {
          cap = n;
          return this;
        },
        insert(value) {
          operation = 'insert';
          payload = Array.isArray(value) ? value : [value];
          return this;
        },
        update(value) {
          operation = 'update';
          payload = value;
          return this;
        },
        result(single = false) {
          let rows = (state[table] ?? [])
            .filter((row) => filters.every((f) => f(row)))
            .slice(0, cap);
          if (operation === 'insert') {
            rows = payload.map((row) => ({
              id: randomUUID(),
              criado_em: new Date().toISOString(),
              ...row,
            }));
            state[table].push(...rows);
            calls.push({ table, operation, rows });
          }
          if (operation === 'update') {
            rows.forEach((row) => Object.assign(row, payload));
            calls.push({ table, operation, ids: rows.map((r) => r.id) });
          }
          if (fields !== '*') {
            const keys = fields.split(',').map((s) => s.trim());
            rows = rows.map((row) =>
              Object.fromEntries(
                keys.filter((k) => k in row).map((k) => [k, row[k]]),
              ),
            );
          }
          return { data: single ? (rows[0] ?? null) : rows, error: null };
        },
        maybeSingle() {
          return Promise.resolve(this.result(true));
        },
        single() {
          return this.maybeSingle();
        },
        then(resolve, reject) {
          return Promise.resolve(this.result()).then(resolve, reject);
        },
      };
      return q;
    },
  };
  return db;
}
