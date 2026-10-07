# Sistema de Controle Logistica

MVP web para gestao operacional de frota de caminhoes, com React, TypeScript, Vite, Tailwind CSS, Node.js e Supabase.

## Estado atual

Fase 1 implementada:

- estrutura base em monorepo;
- frontend React com Vite e TypeScript strict;
- layout administrativo responsivo;
- login e logout via Supabase Auth;
- sessao persistente com Supabase;
- protecao de rotas autenticadas;
- backend Node/TypeScript com health check e middleware de autenticacao preparado para Supabase.

Os modulos de veiculos, motoristas, clientes, viagens, despesas, dashboard real e rastreamento entram nas fases seguintes.

## Estrutura

```text
apps/
  api/   API REST Node.js
  web/   Aplicacao React
supabase/
  migrations/
```

## Configuracao

Crie os arquivos de ambiente a partir dos exemplos:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

Preencha as variaveis do Supabase:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Nunca use `SUPABASE_SERVICE_ROLE_KEY` no frontend.

## Execucao local

Instale as dependencias:

```bash
npm install
```

Rode o frontend:

```bash
npm run dev:web
```

Rode a API:

```bash
npm run dev:api
```

## Banco

As migrations do Supabase com tabelas, `company_id` e RLS serao criadas na Fase 2.

## Proximas fases

1. Fase 2: banco, RLS, veiculos, motoristas e clientes.
2. Fase 3: viagens, despesas e dashboard com dados reais.
3. Fase 4: tabelas de rastreamento, provider mock e mapa.
4. Fase 5: providers Positron/Sascar e integracoes.
5. Fase 6: documentacao completa, testes finais, seguranca e deploy.
