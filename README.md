# Sistema de Controle Logistica

MVP web para gestao operacional de frota de caminhoes, com React, TypeScript, Vite, Tailwind CSS, Node.js e Supabase.

## Estado atual

Fase 1 concluida:

- estrutura base em monorepo;
- frontend React com Vite e TypeScript strict;
- layout administrativo responsivo;
- login e logout via Supabase Auth;
- sessao persistente com Supabase;
- protecao de rotas autenticadas;
- backend Node/TypeScript com health check e middleware de autenticacao preparado para Supabase.

Fase 2 iniciada/concluida no escopo do MVP:

- migration SQL com tabelas `companies`, `company_users`, `vehicles`, `drivers` e `customers`;
- `company_id` nas tabelas operacionais;
- RLS por empresa usando Supabase Auth;
- cadastro inicial de empresa pelo usuario autenticado;
- CRUD de veiculos;
- CRUD de motoristas;
- CRUD de clientes/fornecedores;
- validacoes basicas de placa, CPF, CNPJ, e-mail e campos obrigatorios;
- constraints de duplicidade por empresa para placa, CPF, CNH e CNPJ.

Os modulos de viagens, despesas, dashboard real e rastreamento entram nas fases seguintes.

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

As migrations ficam em `supabase/migrations/`.

A Fase 2 adiciona a migration `20261008000100_phase_2_core_tables.sql`, que cria a base multiempresa, RLS e tabelas iniciais de operacao.

## Proximas fases

1. Fase 3: viagens, despesas e dashboard com dados reais.
2. Fase 4: tabelas de rastreamento, provider mock e mapa.
3. Fase 5: providers Positron/Sascar e integracoes.
4. Fase 6: documentacao completa, testes finais, seguranca e deploy.
