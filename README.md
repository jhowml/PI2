# Soberania Digital — API

API REST da aplicação **Soberania Digital**, desenvolvida no Projeto Integrador II do eixo de Computação da UNIVESP (Grupo 12).

A aplicação faz a **gestão interna** de estabelecimentos alimentícios do Guarujá/SP — recepção e acompanhamento de pedidos, gestão de cardápio e de clientes e registro das formas de pagamento — como alternativa à dependência de aplicativos de intermediação.

**Fora do escopo:** gateway de pagamento online, roteirização de entregas e aplicativo para o cliente final.

**Stack:** Node.js · TypeScript · Express · Prisma · PostgreSQL · Zod · Pino · Vitest/Supertest

---

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Configuração do ambiente local](#configuração-do-ambiente-local)
- [Scripts](#scripts)
- [Arquitetura](#arquitetura)
- [Modelo de dados](#modelo-de-dados)
- [Endpoints](#endpoints)
- [Testes](#testes)
- [Problemas comuns](#problemas-comuns)

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) **20+**
- PostgreSQL **14+** acessível (local, Docker ou remoto)

Para subir um PostgreSQL local rapidamente com Docker:

```bash
docker run --name soberania-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=soberania_digital -p 5432:5432 -d postgres:16
```

---

## Configuração do ambiente local

### 1. Instalar dependências

```bash
git clone <url-do-repositório>
cd PI2
npm install
```

O `postinstall` executa `prisma generate` automaticamente.

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `PORT` | não | Porta HTTP (padrão `3000`) |
| `NODE_ENV` | não | `development`, `production` ou `test` |
| `ALLOWED_ORIGINS` | não | Origens permitidas no CORS, separadas por vírgula |
| `DATABASE_URL` | * | Connection string completa do PostgreSQL |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | * | Alternativa ao `DATABASE_URL` para ambiente local (`DB_PORT` padrão `5432`) |
| `JWT_SECRET` | sim | Segredo do JWT (**mínimo 10 caracteres**) |
| `JWT_EXPIRES_IN` | não | Validade do token (padrão `7d`) |
| `APP_USERNAME` | sim | Usuário de acesso à aplicação |
| `APP_PASSWORD` | sim | Senha de acesso à aplicação |

\* Informe `DATABASE_URL` **ou** o conjunto `DB_*`. Se `DATABASE_URL` estiver definida, as variáveis `DB_*` são ignoradas.

A aplicação **não inicia** se alguma variável obrigatória estiver ausente ou inválida.

### 3. Aplicar as migrations

```bash
npm run db:migrate
```

### 4. (Opcional) Popular dados de exemplo

```bash
npm run db:seed
```

Insere itens de cardápio e clientes com endereços **fictícios** do Guarujá. O seed só insere dados em tabelas vazias, então pode ser executado mais de uma vez.

### 5. Subir a API

```bash
npm run dev          # desenvolvimento, com hot reload
```

```bash
npm run build && npm start   # produção
```

### 6. Verificar se está no ar

```bash
curl -sS http://localhost:3000/health
# {"status":"ok","db":"ok"}
```

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Sobe o servidor com hot reload (`tsx watch`) |
| `npm run build` | Compila o TypeScript para `dist/` |
| `npm start` | Executa a versão compilada |
| `npm test` | Roda os testes unitários (Vitest) |
| `npm run test:coverage` | Gera relatório de cobertura |
| `npm run db:generate` | Regenera o Prisma Client após mudanças no schema |
| `npm run db:migrate` | Cria/aplica migrations em desenvolvimento |
| `npm run db:migrate:deploy` | Aplica migrations em produção/CI |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run db:seed` | Popula dados de exemplo |

Os scripts `db:*` montam o `DATABASE_URL` a partir das variáveis `DB_*` quando ele não está definido.

---

## Arquitetura

Arquitetura em camadas organizada por módulos de funcionalidade:

```
Requisição HTTP
  └─► Router
        └─► Controller   — valida a entrada (Zod) e devolve a resposta
              └─► Service     — regras de negócio
                    ├─► Repository  — consultas Prisma ao PostgreSQL
                    └─► Gateway     — chamadas a APIs externas (ViaCEP)
```

- **Controllers** não contêm regra de negócio.
- **Services** não conhecem Express (`req`/`res`).
- **Repositories** concentram todas as consultas Prisma.
- Quando um service depende de repositórios de outros módulos, eles são injetados como *ports* pela camada `src/composition/`.
- Erros de domínio são lançados como subclasses de `AppError` e formatados pelo middleware global.

Detalhes e convenções de código estão em [`CLAUDE.md`](./CLAUDE.md).

---

## Modelo de dados

| Entidade | Tabela | Campos principais |
|----------|--------|-------------------|
| **Cliente** | `clientes` | `nome`, `telefone`, `obs`, `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf` |
| **Cardapio** | `cardapio` | `nome`, `descricao`, `preco`, `categoria`, `disponivel`, `deletedAt` (exclusão lógica) |
| **Pedido** | `pedidos` | `dataPedido`, `status`, `valorTotal`, `obs`, `clienteId` |
| **ItemPedido** | `itens_pedido` | `quantidade`, `precoUnitario` (preço no momento do pedido), `pedidoId`, `cardapioId` |
| **Pagamento** | `pagamentos` | `forma`, `status`, `valor`, `dataPagamento`, `pedidoId` (1-para-1 com o pedido) |

**Status do pedido:**

```
PENDENTE → CONFIRMADO → PREPARANDO → ENTREGUE
    └──────────┴─────────────┴──────→ CANCELADO
```

**Formas de pagamento:** `DINHEIRO` · `PIX` · `CARTAO_CREDITO` · `CARTAO_DEBITO`

**Status do pagamento:** `PENDENTE` · `PAGO` · `ESTORNADO`

---

## Endpoints

Todas as rotas `/api/*`, exceto `/api/auth/login`, exigem o cabeçalho:

```
Authorization: Bearer <token>
```

### Formato de erro

```json
{ "error": { "code": "NOT_FOUND", "message": "Cliente não encontrado(a)." } }
```

| Status | `code` | Quando |
|--------|--------|--------|
| 401 | `UNAUTHORIZED` | Token ausente/inválido ou credenciais incorretas |
| 404 | `NOT_FOUND` | Recurso inexistente |
| 409 | `CONFLICT` | Regra de negócio violada |
| 422 | `VALIDATION_ERROR` | Dados inválidos (inclui `fields` com o detalhe por campo) |
| 502 | `BAD_GATEWAY` | Serviço externo respondeu de forma inesperada |
| 503 | `SERVICE_UNAVAILABLE` | Serviço externo fora do ar ou sem resposta |
| 500 | `INTERNAL_ERROR` | Erro inesperado |

### Listagens paginadas

As listagens aceitam `page` (padrão `1`) e `pageSize` (padrão `20`, máx. `100`) e respondem:

```json
{
  "data": [],
  "meta": { "total": 0, "page": 1, "pageSize": 20, "totalPages": 0, "hasNextPage": false, "hasPreviousPage": false }
}
```

### Health check

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Verifica a API e a conexão com o banco (`503` se o banco estiver inacessível) |

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/login` | Autentica o usuário único e retorna um JWT |

```json
// POST /api/auth/login
{ "username": "admin", "password": "sua-senha" }
// 200
{ "token": "eyJhbGciOi..." }
```

---

## Testes

```bash
npm test
npm run test:coverage
```

Os testes unitários ficam ao lado do arquivo testado (`<nome>.test.ts`) e cobrem as camadas de **controller** e **service**. Dependências são mockadas nas fronteiras dos módulos; chamadas ao ViaCEP usam `fetch` mockado, sem acesso à internet.

---

## Problemas comuns

- **`Cannot find module '@/...'` em runtime:** o build precisa rodar `tsc && tsc-alias` (já configurado em `npm run build`).
- **`Invalid environment variables` ao iniciar:** confira o `.env` com base no `.env.example`; `JWT_SECRET` precisa de ao menos 10 caracteres.
- **`Set DATABASE_URL or DB_HOST + DB_USER + DB_PASSWORD + DB_NAME`:** nenhuma forma de conexão com o banco foi informada.
- **Migration marcada como falha:** `npx tsx scripts/prisma-env.ts migrate resolve --rolled-back <nome-da-migration>` e depois `npm run db:migrate:deploy`.
