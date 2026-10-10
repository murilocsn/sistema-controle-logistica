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

Fase 3 concluida no escopo do MVP:

- migration SQL com `trips`, `trip_expenses` e `trip_status_history`;
- CRUD de viagens com veiculo, motorista, cliente, rota, datas, frete e status;
- historico automatico de mudanca de status da viagem;
- CRUD de despesas por viagem;
- resumo financeiro por viagem;
- dashboard conectado a dados reais de veiculos, viagens, faturamento, despesas e resultado.

Fase 4 concluida no escopo do MVP:

- migration SQL com `tracking_providers`, `tracking_devices`, `tracking_positions`, `tracking_events` e `tracking_sync_logs`;
- RLS por empresa nas tabelas de rastreamento;
- provider mock para gerar posicoes de frota a partir dos veiculos cadastrados;
- pagina `/tracking` com mapa Leaflet/OpenStreetMap, filtros por status e historico de sincronizacao.

Fase 5 concluida no escopo do MVP:

- arquitetura de providers no backend para Mock, Positron e Sascar;
- endpoint autenticado `/api/tracking/providers/status` sem exposicao de segredos;
- pagina `/settings/integrations` para ativar providers e checar status operacional;
- variaveis de ambiente preparadas para credenciais Positron/Sascar somente no backend.

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
- `POSITRON_API_URL`
- `POSITRON_USERNAME`
- `POSITRON_PASSWORD`
- `SASCAR_API_URL`
- `SASCAR_USERNAME`
- `SASCAR_PASSWORD`

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

A Fase 2 adiciona as migrations:

- `20261009013538_20261008000100_phase_2_core_tables.sql`, que cria a base multiempresa, RLS e tabelas iniciais de operacao;
- `20261009013646_20261008000200_harden_phase_2_functions.sql`, que endurece funcoes auxiliares apontadas pelos advisors do Supabase.

A Fase 3 adiciona as migrations:

- `20261009115334_phase_3_trips_expenses_dashboard.sql`, que cria viagens, despesas de viagem, historico de status, RLS e relacoes multiempresa;
- `20261009120005_phase_3_cover_composite_foreign_key_indexes.sql`, que adiciona indices compostos para as chaves estrangeiras multiempresa.

A Fase 4 adiciona a migration:

- `20261010170134_phase_4_tracking_tables.sql`, que cria tabelas de rastreamento, provider/device/positions/events/logs, RLS e indices de consulta por empresa.

## Proximas fases

1. Fase 6: documentacao completa, testes finais, seguranca e deploy.
2. Integracao real Positron/Sascar quando os contratos/endpoints oficiais estiverem disponiveis.
