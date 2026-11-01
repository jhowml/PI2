# CLAUDE.md

This file documents the architecture, conventions, and structure of the project for Claude Code and any contributors.

## Language conventions

- **Project code and this file:** English (variable names, function names, folder names, comments, layer names, test descriptions).
- **Domain terms:** pt-BR, matching the database schema (e.g. `cardapio`, `cliente`, `pedido`, `pagamento`).
- **Documents intended for other people** (README, API docs, user-facing content, error messages): always **pt-BR**.

## Comments

Comments are only acceptable when the code cannot express intent on its own — e.g. non-obvious workarounds, regulatory constraints, or counter-intuitive decisions. Redundant comments that just restate what the code already says **must not** be written.

## Project Overview

**Soberania Digital** — REST API for the internal management of food establishments in Guarujá/SP (Projeto Integrador II, UNIVESP, Grupo 12): order intake and tracking (**pedidos**), menu (**cardápio**), customers (**clientes**), and recording of payment methods (**pagamentos**).

Out of scope: online payment gateway, delivery routing, and a customer-facing app.

**Stack:** Node.js · TypeScript · Express · Prisma · PostgreSQL · Zod · Pino · Vitest

---

## Architecture

The project follows a **layered architecture** organized by feature modules. Each module owns all its layers internally.

```
Request
  └─► Router
        └─► Controller   (HTTP layer)
              └─► Service     (business logic)
                    ├─► Repository  (data access) ──► Prisma / PostgreSQL
                    └─► Gateway     (external HTTP APIs, e.g. ViaCEP)
```

When a service needs repositories from **other** modules, it receives them as **ports** instead of importing them directly — see [Composition](#composition).

---

## Folder Structure

```
src/
├── composition/          # Wires cross-module repositories into services (ports)
├── config/               # App-wide configuration (env, database, logger)
├── modules/              # Feature modules — one folder per domain entity
│   └── <module>/
│       ├── controllers/  # HTTP handlers — parse input, call service, return response
│       ├── services/     # Business rules — orchestrates repositories, applies logic
│       ├── repositories/ # Data access — all Prisma queries live here
│       ├── gateways/     # Calls to external HTTP APIs (only when the module needs one)
│       └── dtos/         # Zod schemas + TypeScript types for request/response shapes
├── shared/
│   ├── errors/           # AppError base class and typed error subclasses
│   ├── middleware/       # Express middleware (error handler, auth)
│   └── types/            # Shared TypeScript types (pagination)
├── integration-tests/    # supertest(app) against a real test PostgreSQL — npm run test:integration
├── app.ts                # Express app setup — registers middleware and routes
└── server.ts             # Entry point — starts HTTP server, handles graceful shutdown

prisma/
├── schema.prisma         # Data model
├── seed.ts               # Seeds development data (small, deterministic — the contract of `npm run db:seed`)
├── seed-outubro.ts        # Optional: fills october with randomized pedidos/pagamentos for demos (run manually with tsx)
└── migrations/           # Versioned migration SQL files

scripts/
└── prisma-env.ts         # Runs the Prisma CLI resolving DATABASE_URL from DB_* variables
```

### Module naming

Modules are named after the domain entity they own, in **pt-BR**:

| Module folder | Domain entity | Route |
|---|---|---|
| `auth` | Login (single user from env) | `/api/auth` |
| `cardapio` | Cardapio (item do cardápio) | `/api/cardapio` |
| `clientes` | Cliente | `/api/clientes` |
| `cep` | Consulta de CEP (ViaCEP) | `/api/cep` |
| `pedidos` | Pedido + ItemPedido | `/api/pedidos` |
| `pagamentos` | Pagamento | `/api/pagamentos` |
| `dashboard` | Indicadores agregados de pedidos (sem entidade própria; lê `Pedido`, `ItemPedido` e `Cardapio`) | `/api/dashboard` |

---

## Layer Responsibilities

### Controller

- Lives in `modules/<module>/controllers/<action>/`
- Parses and validates HTTP input (params, query, body) using the DTO schema
- Calls a single service method
- Returns the HTTP response with the appropriate status code
- **Does not contain business logic**

### Service

- Lives in `modules/<module>/services/<action>/`
- Contains all business rules for the use case (e.g. computing `valorTotal` of a pedido)
- Calls one or more repository/gateway methods
- Throws `AppError` subclasses on domain violations
- **Does not import from Express or interact with HTTP primitives**

### Repository

- Lives in `modules/<module>/repositories/`
- One file per domain entity (e.g., `cardapio.repository.ts`)
- All Prisma queries are concentrated here
- Returns plain data objects — no business logic, no HTTP concerns

### Gateway

- Lives in `modules/<module>/gateways/`
- Wraps a call to an external HTTP API using native `fetch` with a timeout
- Translates transport failures into typed errors (`ServiceUnavailableError`, `BadGatewayError`) and returns plain data
- Tests mock `fetch` — never call the real API

### DTO

- Lives in `modules/<module>/dtos/<action>/`
- Two files per action:
  - `<action>.dto.ts` — Zod schema for validation
  - `<action>.types.ts` — TypeScript types inferred from the schema
- String length limits **must match** the column sizes in `schema.prisma`

### Composition

- Lives in `src/composition/`
- `<use-case>.ports.ts` declares the functions a service needs from other modules (typed with `typeof` of the real repository functions)
- `<use-case>.ts` builds the ports object from the real repositories and exposes the use case to the controller
- The service receives the ports as a parameter, so its tests pass `vi.fn()` implementations instead of mocking modules

### Shared

| Path | Purpose |
|---|---|
| `shared/errors/AppError.ts` | Base error class; subclasses: `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `InvalidDescontoError`, `BadGatewayError`, `ServiceUnavailableError` |
| `shared/middleware/errorHandler.middleware.ts` | Global Express error handler; formats `AppError` and Zod errors |
| `shared/middleware/auth.middleware.ts` | `authenticate` — validates the `Bearer` JWT; applied to every `/api/*` route except `/api/auth` |
| `shared/types/pagination.ts` | `paginate()` helper and `buildPaginatedResult()` — used across all list endpoints |

---

## Domain Entities

All entity names in **pt-BR** (matching the database schema):

- **Cliente** — comprador; possui `nome`, `telefone`, `obs` e endereço estruturado para o ViaCEP (`cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf`), todos opcionais
- **Cardapio** — item do cardápio; possui `nome`, `descricao`, `preco`, `categoria`, `disponivel` e `deletedAt` (soft delete)
- **Pedido** — pertence a um cliente; possui `dataPedido`, `status`, `tipoEntrega` (`ENTREGA` | `RETIRADA`), `taxaEntrega`, `desconto`, `valorTotal`, `obs`; status: `CONFIRMADO → PREPARANDO → ENTREGUE | CANCELADO`. There is **no** `PENDENTE` status: pedidos are always entered directly by staff (there is no customer-facing request screen), so a pedido is `CONFIRMADO` — the DB default — the moment it's registered.
- **ItemPedido** — item de um pedido; possui `quantidade` e `precoUnitario` (preço do cardápio no momento do pedido); removido em cascata com o pedido
- **Pagamento** — associado 1-para-1 a um pedido; `forma`: `DINHEIRO`, `PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO`; `status`: `PENDENTE`, `PAGO`, `ESTORNADO`

### `Pedido.valorTotal`

`valorTotal` is an **intentional denormalization**: the financial closing of the pedido, stored so reports and payments never depend on recomputing history.

```
valorTotal = Σ (quantidade × precoUnitario of the pedido's ItemPedido) + taxaEntrega − desconto
```

- It is **never** accepted from the request body; it is always computed in the service by `calculatePedidoTotal()` (`modules/pedidos/services/calculate-pedido-total/`).
- `precoUnitario` is the cardápio price at the moment of the sale, copied into `ItemPedido` so later price changes do not rewrite history.
- `RETIRADA` ⇒ `taxaEntrega = 0` (enforced in the DTO). `taxaEntrega` and `desconto` are never negative.
- A `desconto` that would make the total negative throws `InvalidDescontoError` (422).
- **Any future change** to a pedido's itens, `taxaEntrega` or `desconto` (e.g. editing pedidos) must recompute `valorTotal` with `calculatePedidoTotal()` over **all** `ItemPedido` of that pedido, and persist the pedido and its itens in the same transaction.
- `PATCH /api/pedidos/:id` implements this: it only allows editing while `status` is `CONFIRMADO` (once `PREPARANDO` starts, the kitchen has committed to the order), replaces **all** `ItemPedido` rows (delete + recreate) and recomputes `valorTotal` in one `prisma.$transaction` (`update-pedido.service.ts` / `pedido.repository.ts#updatePedido`). Item lookup/validation (exists, available, snapshot `precoUnitario`) is shared with `create-pedido.service.ts` via `resolve-itens-pedido.ts`, so both use cases enforce the same rules from one place.
- Editing is also blocked (`ConflictError`) when the pedido's pagamento is `PAGO` — the money has already been received, so the closing amount can't move. When the pagamento is `PENDENTE`, the edit instead syncs `pagamento.valor` to the new `valorTotal` in the **same transaction** (`updatePedido`'s `syncPagamentoValor` flag). This cross-module check goes through a port (`findPagamentoByPedidoId`) on `UpdatePedidoPorts`, same pattern as the rest of `pedido-update.*`.
- `PATCH /api/pedidos/:id/status` changes only `status`, one step at a time: `CONFIRMADO → PREPARANDO → ENTREGUE`, with `CANCELADO` reachable from `CONFIRMADO` or `PREPARANDO`. `CONFIRMADO` itself is never a valid target (it's the initial state, not a transition). `ENTREGUE` and `CANCELADO` are terminal. Invalid transitions throw `ConflictError` (`update-pedido-status.service.ts`). Canceling is additionally blocked when the pagamento is `PAGO` (estorne first) — this is why `update-pedido-status` now goes through composition (`pedido-status-update.ports.ts`/`.ts`) instead of calling the repository directly: it needs the cross-module `findPagamentoByPedidoId` port.

### `Pagamento`

- Created via `POST /api/pagamentos` with only `pedidoId` and `forma`; `valor` is **never** accepted from the request — it is always copied from the pedido's `valorTotal` at the moment of registration, for the same reason `valorTotal` itself is never trusted from the client.
- A pedido with `status = CANCELADO` cannot receive a pagamento, and a pedido can have at most one (`pedidoId` is `@unique`) — both are enforced in `create-pagamento.service.ts`.
- `status` transitions via `PATCH /api/pagamentos/:pedidoId`: `PENDENTE → PAGO → ESTORNADO`, and `ESTORNADO → PAGO` to undo an estorno when needed; any other transition (e.g. `PENDENTE → ESTORNADO`) throws `ConflictError`. `dataPagamento` is refreshed to now every time the status moves **to** `PAGO` (including the revert from `ESTORNADO`) and preserved (not overwritten) on `ESTORNADO`.
- `ESTORNADO → PAGO` is additionally blocked when the pedido itself is `CANCELADO` — you can't re-charge a cancelled order. `update-pagamento-status.service.ts` goes through composition (`pagamento-status-update.ports.ts`/`.ts`) for the cross-module `findPedidoById` port this check needs; this is the only transition that checks the pedido (e.g. `PENDENTE → PAGO` does not).
- `forma` can be edited independently of `status` via `PATCH /api/pagamentos/:pedidoId/forma`, at any status.

### `dashboard`

`GET /api/dashboard` (optional `from`/`to` query dates) returns aggregated indicadores for the painel: `faturamentoTotal`, `ticketMedio`, `faturamentoPorPeriodo` (grouped by day), `vendasPorDiaSemana` (grouped by weekday — `pedidos`, `faturamento` and `ticketMedio` — always all 7 in `SEGUNDA..DOMINGO` order and zero-filled), `pedidosPorStatus` (all five statuses, zero-filled), `itensMaisVendidos` (top 5 by `quantidade`) and `pagamentosPorForma` (`quantidade` and `valor` per `FormaPagamento`, zero-filled, counting only `PAGO` pagamentos). This is the one module whose repository is not scoped to a single domain entity — it reads `Pedido`, `ItemPedido`, `Cardapio` and `Pagamento` directly for reporting, since it has no table or business rules of its own. All aggregation (`CANCELADO` pedidos excluded from faturamento/ticketMedio, grouping by day/weekday, zero-filling statuses/formas) happens in `get-dashboard.service.ts`, not in the repository.

There is **no** `User` model: authentication uses a single user defined by `APP_USERNAME`/`APP_PASSWORD`.

Database tables and columns are `snake_case` (via `@@map`/`@map`); Prisma fields are `camelCase`.

---

## Key Conventions

### File naming

- All files use **kebab-case** (except the pre-existing `AppError.ts` and `buildDatabaseUrl.ts`)
- Action-specific files are nested in a folder with the same name as the action:
  ```
  controllers/list-cardapio/list-cardapio.controller.ts
  controllers/list-cardapio/list-cardapio.controller.test.ts
  ```

### Error handling

Throw typed errors from `shared/errors/`; the global middleware handles formatting:

```ts
throw new NotFoundError('Cliente')
```

Never send raw `res.status(500).json(...)` from inside services or repositories.

### Validation

All request input is validated with Zod at the **controller** level before reaching the service. Use `schema.parse()` — not `.safeParse()` — so that validation errors bubble up to the global handler automatically.

### Money

Monetary columns are `Decimal(10, 2)`. Arithmetic on money uses `Prisma.Decimal` — never plain JavaScript numbers.

### Soft delete

`Cardapio` uses `deletedAt`. Every query that reads cardápio items must filter `deletedAt: null`.

### Pagination

All list endpoints use `paginate()` + `buildPaginatedResult()` from `shared/types/pagination.ts`.

Default: `page=1`, `pageSize=20`. Max pageSize: `100`.

Response shape:
```json
{
  "data": [...],
  "meta": { "total": 0, "page": 1, "pageSize": 20, "totalPages": 0, "hasNextPage": false, "hasPreviousPage": false }
}
```

### Path aliases

Use the `@/` alias for imports instead of relative paths:

```ts
import { AppError } from '@/shared/errors/AppError'
```

---

## Configuration

### Environment variables

Defined and validated in `src/config/env.ts` using Zod. The app **will not start** if required variables are missing.

The database connection uses `DATABASE_URL` when set (production / Vercel). Otherwise it is assembled from `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` by `src/config/buildDatabaseUrl.ts`.

### Logging

Pino via `src/config/logger.ts`:
- `development` → debug level, pretty output
- `production` → info level, JSON output

HTTP requests are logged automatically by `pino-http`, with sensitive fields (`password`, `senha`, `token`, `authorization`) masked.

---

## Scripts

```
npm run dev               # Start dev server with hot reload (tsx watch)
npm run build             # Compile TypeScript to dist/
npm start                 # Run compiled output (production)
npm test                  # Run unit tests with Vitest
npm run test:coverage     # Generate coverage report
npm run test:integration  # Run integration tests (supertest + a real TEST_DATABASE_URL)

npm run db:validate       # Validate schema.prisma
npm run db:generate       # Regenerate Prisma client after schema changes
npm run db:migrate        # Apply migrations (development)
npm run db:migrate:deploy # Apply migrations (production / CI)
npm run db:studio         # Open Prisma Studio
npm run db:seed           # Seed database with sample data
```

---

## Testing

Framework: **Vitest** + **Supertest**

- Unit tests live alongside the file they test: `<name>.test.ts`
- Test both the **service** and **controller** layers
- Mock dependencies at module boundaries (mock the repository when testing the service; mock the service when testing the controller; pass fake ports to services that use composition; mock `fetch` when testing gateways)
- Run `npm test` before pushing

### Integration tests

- Live in `src/integration-tests/*.integration.test.ts`, run with `npm run test:integration` (separate Vitest config: `vitest.config.integration.ts`) — **excluded** from the default `npm test`/`vitest.config.ts`.
- Drive the real `app` (from `src/app.ts`) through `supertest` — no mocked repositories; `TEST_DATABASE_URL` must point at a real, disposable PostgreSQL (never the dev or prod database — the suite `TRUNCATE`s every table after each test).
- `global-setup.ts` applies `prisma migrate deploy` once per run; `setup.ts` loads `.env` (the app normally gets this from `server.ts`, which integration tests bypass), guards that `DATABASE_URL` really is `TEST_DATABASE_URL` before allowing any test to run, and truncates all tables in `afterEach`.
- CI (`.github/workflows/ci.yml`) runs this in a separate job against a `postgres:16` service container.
