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
- [Infraestrutura (produção)](#infraestrutura-produção)
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

Insere itens de cardápio, clientes com endereços **fictícios** (CEP `00000-000`, logradouros "Exemplo"/"Modelo" — não correspondem a endereços reais) e dois pedidos de exemplo (um de entrega com taxa e um de retirada com desconto). O seed só insere dados em tabelas vazias, então pode ser executado mais de uma vez.

Para apagar tudo e recomeçar do zero (inclui os pedidos de outubro gerados por `seed-outubro.ts`):

```bash
npm run db:reset-demo-data
```

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
| `npm run db:validate` | Valida o `schema.prisma` |
| `npm run db:generate` | Regenera o Prisma Client após mudanças no schema |
| `npm run db:migrate` | Cria/aplica migrations em desenvolvimento |
| `npm run db:migrate:deploy` | Aplica migrations em produção/CI |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run db:seed` | Popula dados de exemplo |

Os scripts `db:*` montam o `DATABASE_URL` a partir das variáveis `DB_*` quando ele não está definido. Comandos `npx prisma ...` executados diretamente exigem `DATABASE_URL` no ambiente.

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
| **Pedido** | `pedidos` | `dataPedido`, `status`, `tipoEntrega`, `taxaEntrega`, `desconto`, `valorTotal`, `obs`, `clienteId` |
| **ItemPedido** | `itens_pedido` | `quantidade`, `precoUnitario` (preço no momento do pedido), `pedidoId`, `cardapioId` |
| **Pagamento** | `pagamentos` | `forma`, `status`, `valor`, `dataPagamento`, `pedidoId` (1-para-1 com o pedido) |

**Status do pedido:** não existe status `PENDENTE` — o pedido é sempre lançado diretamente pela equipe do estabelecimento (não há tela de solicitação do cliente), então já nasce `CONFIRMADO`.

```
CONFIRMADO → PREPARANDO → ENTREGUE
    └─────────────┴──────→ CANCELADO
```

**Tipo de entrega:** `ENTREGA` · `RETIRADA`

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
| 422 | `INVALID_DESCONTO` | Desconto maior que o valor dos itens somado à taxa de entrega |
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

### Cardápio

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/cardapio` | Lista os itens do cardápio (paginado; ignora itens excluídos) |
| `POST` | `/api/cardapio` | Cadastra um item no cardápio |
| `PATCH` | `/api/cardapio/:id` | Edita um item do cardápio (`404` se não existir ou estiver excluído) |

**Query — `GET /api/cardapio`:** `page`, `pageSize`, `search` (busca por nome, sem diferenciar maiúsculas/minúsculas).

**Body — `POST /api/cardapio` e `PATCH /api/cardapio/:id`** (mesmo formato nos dois):

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `nome` | string | sim | 1–100 caracteres |
| `descricao` | string | não | até 255 caracteres |
| `preco` | number | sim | positivo, no máximo 2 casas decimais |
| `categoria` | string | sim | 1–50 caracteres (ex.: `Pratos`, `Bebidas`) |
| `disponivel` | boolean | não | padrão `true` |

No `PATCH`, o corpo substitui o item por completo (não é um merge parcial) — envie todos os campos.

Valores monetários são devolvidos como **string** decimal (ex.: `"18.5"`), para não perder precisão.

### Clientes

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/clientes` | Lista clientes (paginado) |
| `GET` | `/api/clientes/:id` | Detalha um cliente (`404` se não existir) |
| `POST` | `/api/clientes` | Cadastra um cliente |
| `PATCH` | `/api/clientes/:id` | Edita um cliente (`404` se não existir) |

**Query — `GET /api/clientes`:** `page`, `pageSize`, `search`.

A busca aceita **telefone, endereço ou nome** (ex.: `13 99123`, `dom pedro 350`, `enseada`). O texto é dividido em termos, e **cada termo** precisa aparecer em algum campo: nome, logradouro, número, complemento, bairro ou cidade (sem diferenciar maiúsculas/minúsculas), ou, pelos dígitos, telefone e CEP.

**Body — `POST /api/clientes` e `PATCH /api/clientes/:id`** (mesmo formato nos dois; no `PATCH` o corpo substitui o cliente por completo):

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `nome` | string | sim | 1–100 caracteres |
| `telefone` | string | sim | DDD + número, 10 ou 11 dígitos; máscara é removida (`(13) 99123-4567` → `13991234567`) |
| `obs` | string | não | até 255 caracteres |
| `cep` | string | não | 8 dígitos, com ou sem hífen; salvo sem hífen |
| `logradouro` | string | não | até 150 caracteres |
| `numero` | string | não | até 10 caracteres |
| `complemento` | string | não | até 60 caracteres |
| `bairro` | string | não | até 80 caracteres |
| `cidade` | string | não | até 80 caracteres |
| `uf` | string | não | 2 letras; convertida para maiúsculas |

Campos opcionais enviados como string vazia são ignorados. O endereço é opcional para permitir clientes de retirada no balcão.

### CEP

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/cep/:cep` | Consulta o endereço na API pública [ViaCEP](https://viacep.com.br) para autopreenchimento do cadastro de clientes |

Aceita o CEP com ou sem hífen (`11410-000` ou `11410000`).

```json
// GET /api/cep/11410-000 → 200
{ "cep": "11410000", "logradouro": "...", "bairro": "Pitangueiras", "cidade": "Guarujá", "uf": "SP" }
```

| Status | Quando |
|--------|--------|
| `422` | CEP em formato inválido |
| `404` | CEP inexistente (ViaCEP responde `{"erro": true}`) |
| `502` | ViaCEP respondeu com erro HTTP ou em formato inesperado |
| `503` | ViaCEP fora do ar, falha de rede ou tempo limite (5 s) excedido |

### Pedidos

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/pedidos` | Lista pedidos, do mais recente para o mais antigo (paginado), com cliente e itens |
| `GET` | `/api/pedidos/:id` | Detalha um pedido com cliente e itens (`404` se não existir) |
| `POST` | `/api/pedidos` | Registra um pedido com um ou mais itens do cardápio |
| `PATCH` | `/api/pedidos/:id` | Edita os itens, `tipoEntrega`, `taxaEntrega`, `desconto` e `obs` de um pedido |
| `PATCH` | `/api/pedidos/:id/status` | Avança (ou cancela) o status do pedido |

As respostas incluem `tipoEntrega`, `taxaEntrega`, `desconto` e `valorTotal` de cada pedido.

**Query — `GET /api/pedidos`:** `page`, `pageSize`, `status` (`CONFIRMADO`, `PREPARANDO`, `ENTREGUE` ou `CANCELADO`).

**Body — `POST /api/pedidos`:**

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `clienteId` | number | sim | cliente existente |
| `tipoEntrega` | string | sim | `ENTREGA` ou `RETIRADA` |
| `taxaEntrega` | number | não | padrão `0`; não negativa, até 2 casas decimais; **deve ser `0` em `RETIRADA`** |
| `desconto` | number | não | padrão `0`; não negativo, até 2 casas decimais |
| `itens` | array | sim | 1 a 100 itens, sem repetir o mesmo `cardapioId` |
| `itens[].cardapioId` | number | sim | item existente, não excluído e disponível |
| `itens[].quantidade` | number | sim | inteiro de 1 a 999 |
| `obs` | string | não | até 255 caracteres |

```json
// POST /api/pedidos
{
  "clienteId": 1,
  "tipoEntrega": "ENTREGA",
  "taxaEntrega": 5.00,
  "desconto": 2.00,
  "itens": [
    { "cardapioId": 2, "quantidade": 2 },
    { "cardapioId": 4, "quantidade": 1 }
  ],
  "obs": "Sem cebola"
}
```

Com os itens custando R$ 15,00 e R$ 6,00, o pedido é gravado com `valorTotal` = 2 × 15,00 + 1 × 6,00 + 5,00 − 2,00 = **39,00**.

Regras aplicadas pela API:

- O pedido é criado com status `CONFIRMADO` (não existe status `PENDENTE` — o pedido já nasce confirmado, pois é sempre lançado diretamente pela equipe).
- O `precoUnitario` de cada item é o **preço atual** do cardápio, gravado no pedido; mudanças futuras de preço não alteram pedidos já registrados.
- O `valorTotal` é sempre calculado pela API: **Σ (quantidade × precoUnitario) + taxaEntrega − desconto**. Se for enviado no corpo da requisição, é ignorado.
- `RETIRADA` com `taxaEntrega` diferente de `0`, ou `taxaEntrega`/`desconto` negativos → `422 VALIDATION_ERROR`.
- Desconto que deixaria o total negativo → `422 INVALID_DESCONTO`.
- Os cálculos usam aritmética decimal exata (sem arredondamentos de ponto flutuante).
- Cliente inexistente ou item do cardápio inexistente/excluído → `404`; item marcado como indisponível → `409`.

**Body — `PATCH /api/pedidos/:id`:** mesmo formato de `POST /api/pedidos`, exceto que **não** tem `clienteId` (o cliente do pedido não muda). Os `itens` enviados substituem **todos** os itens atuais do pedido — não é possível adicionar/remover individualmente, envie a lista completa. `valorTotal` é recalculado da mesma forma que no cadastro. Só é permitido enquanto o pedido está `CONFIRMADO`; depois disso → `409 CONFLICT`.

**Body — `PATCH /api/pedidos/:id/status`:**

```json
// PATCH /api/pedidos/1/status
{ "status": "CONFIRMADO" }
```

O status só avança um passo por vez: `CONFIRMADO → PREPARANDO → ENTREGUE`, com `CANCELADO` disponível a partir de `CONFIRMADO` ou `PREPARANDO`. `CONFIRMADO` nunca é um destino válido (é o estado inicial, não uma transição). `ENTREGUE` e `CANCELADO` são finais. Qualquer outra transição (pular etapas, voltar atrás, mexer em um pedido finalizado) → `409 CONFLICT`.

### Pagamentos

Registro interno da forma de pagamento de um pedido — **não** há integração com gateway de pagamento online; é apenas o controle de quanto e como o estabelecimento recebeu.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/pagamentos` | Registra o pagamento de um pedido |
| `GET` | `/api/pagamentos/:pedidoId` | Consulta o pagamento de um pedido (`404` se não houver) |
| `PATCH` | `/api/pagamentos/:pedidoId` | Atualiza o status do pagamento (`PAGO` ou `ESTORNADO`) |
| `PATCH` | `/api/pagamentos/:pedidoId/forma` | Altera a forma de pagamento, em qualquer status |

**Body — `POST /api/pagamentos`:**

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `pedidoId` | number | sim | pedido existente, não `CANCELADO`, sem pagamento registrado |
| `forma` | string | sim | `DINHEIRO`, `PIX`, `CARTAO_CREDITO` ou `CARTAO_DEBITO` |

```json
// POST /api/pagamentos
{ "pedidoId": 1, "forma": "PIX" }
```

```json
// PATCH /api/pagamentos/1
{ "status": "PAGO" }
```

```json
// PATCH /api/pagamentos/1/forma
{ "forma": "CARTAO_CREDITO" }
```

Regras aplicadas pela API:

- O `valor` do pagamento **nunca** é aceito do corpo da requisição: é sempre copiado do `valorTotal` do pedido no momento do registro.
- Um pedido só pode ter um pagamento (`pedidoId` é único) → registrar de novo resulta em `409`.
- Pedido `CANCELADO` não pode receber pagamento → `409`.
- O status transita em `PENDENTE → PAGO → ESTORNADO`, e `ESTORNADO → PAGO` para desfazer um estorno feito por engano; qualquer outra transição (ex.: `PENDENTE → ESTORNADO`) → `409`.
- `dataPagamento` é atualizada para o momento atual sempre que o status muda **para** `PAGO` (inclusive ao desfazer um estorno), e preservada ao estornar.
- `forma` pode ser alterada a qualquer momento, independente do status.

### Dashboard

Painel de indicadores do estabelecimento, calculado a partir do histórico de pedidos.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/dashboard` | Indicadores agregados de pedidos, pagamentos e cardápio |

**Query — `GET /api/dashboard`:** `from`, `to` (datas ISO, ambas opcionais; filtram por `dataPedido`). Sem elas, considera todo o histórico.

```json
// GET /api/dashboard?from=2026-10-01&to=2026-10-31
{
  "faturamentoTotal": "1540.00",
  "ticketMedio": "38.50",
  "faturamentoPorPeriodo": [
    { "data": "2026-10-01", "pedidos": 3, "faturamento": "120.00" }
  ],
  "vendasPorDiaSemana": [
    { "diaSemana": "SEGUNDA", "pedidos": 5, "faturamento": "210.00", "ticketMedio": "42.00" },
    { "diaSemana": "TERCA", "pedidos": 2, "faturamento": "80.00", "ticketMedio": "40.00" }
  ],
  "pedidosPorStatus": { "CONFIRMADO": 2, "PREPARANDO": 0, "ENTREGUE": 36, "CANCELADO": 1 },
  "itensMaisVendidos": [
    { "cardapioId": 2, "nome": "Marmita Executiva", "quantidade": 58 }
  ],
  "pagamentosPorForma": [
    { "forma": "DINHEIRO", "quantidade": 10, "valor": "420.00" },
    { "forma": "PIX", "quantidade": 20, "valor": "900.00" },
    { "forma": "CARTAO_CREDITO", "quantidade": 8, "valor": "180.00" },
    { "forma": "CARTAO_DEBITO", "quantidade": 2, "valor": "40.00" }
  ]
}
```

Regras aplicadas pela API:

- Pedidos `CANCELADO` **não** entram no `faturamentoTotal`, `ticketMedio` nem em `faturamentoPorPeriodo`/`vendasPorDiaSemana`/`itensMaisVendidos` — mas aparecem normalmente em `pedidosPorStatus`, que sempre traz os 5 status (zerados quando não houver pedidos).
- `faturamentoPorPeriodo` agrupa por dia (`dataPedido`), em ordem crescente.
- `vendasPorDiaSemana` agrupa por dia da semana (`dataPedido`), sempre com os 7 dias na ordem `SEGUNDA..DOMINGO` (zerados quando não houver pedidos naquele dia da semana); `ticketMedio` é `faturamento / pedidos` daquele dia (zero quando não houver pedidos).
- `itensMaisVendidos` traz os 5 itens do cardápio com maior soma de `quantidade` vendida no período.
- `pagamentosPorForma` conta apenas pagamentos com `status = PAGO` (pendentes e estornados não entram), sempre com as 4 formas (zeradas quando não houver pagamentos naquela forma).

---

## Testes

```bash
npm test
npm run test:coverage
```

Os testes unitários ficam ao lado do arquivo testado (`<nome>.test.ts`) e cobrem as camadas de **controller** e **service**. Dependências são mockadas nas fronteiras dos módulos; chamadas ao ViaCEP usam `fetch` mockado, sem acesso à internet.

### Testes de integração

Ficam em `src/integration-tests/*.integration.test.ts` e sobem a aplicação de verdade (via `supertest(app)`, sem abrir porta) contra um **PostgreSQL de teste real** — não usam mocks de banco. Exercitam login/autenticação, o fluxo completo de um pedido (cardápio → cliente → pedido → edição → status → pagamento → dashboard) e as regras de negócio (itens indisponíveis/inexistentes, desconto inválido, transições de status, consistência pedido↔pagamento).

Suba um Postgres **separado** do de desenvolvimento (porta diferente, banco descartável — os testes fazem `TRUNCATE` nele a cada teste):

```bash
docker run -d \
  --name soberania-digital-test-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=soberania_digital_test \
  -p 5434:5432 \
  postgres:16
```

Defina `TEST_DATABASE_URL` (no `.env` ou na linha de comando) e rode:

```bash
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5434/soberania_digital_test" npm run test:integration
```

O comando aplica as migrations automaticamente no banco de teste antes de rodar. **Nunca** aponte `TEST_DATABASE_URL` para o banco de desenvolvimento ou produção — as tabelas são truncadas entre cada teste.

---

## Infraestrutura (produção)

| Camada | Serviço | URL |
|---|---|---|
| Banco de dados | [Neon](https://neon.tech) (PostgreSQL serverless) | — |
| API | [Render](https://render.com) (Web Service) | https://pi2-82np.onrender.com |
| Front-end | [Vercel](https://vercel.com) | https://pi-2-front.vercel.app |

Todos no plano gratuito — sem custo para o estabelecimento, conforme o escopo do projeto.

### Variáveis de ambiente — API (Render)

| Variável | Valor |
|---|---|
| `DATABASE_URL` | connection string do Neon (tem prioridade sobre as `DB_*`) |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | string aleatória forte, mínimo 10 caracteres |
| `APP_USERNAME` / `APP_PASSWORD` | credenciais do usuário único da aplicação |
| `ALLOWED_ORIGINS` | **precisa incluir** `https://pi-2-front.vercel.app` (a URL do front-end em produção) |

O **Start Command** no Render aplica as migrations antes de subir o servidor:

```bash
npm run db:migrate:deploy && npm start
```

### Variáveis de ambiente — Front-end (Vercel)

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://pi2-82np.onrender.com` (sem barra no final) |

Por ser uma variável `NEXT_PUBLIC_*`, o Next.js grava o valor no build — qualquer alteração exige um novo deploy (Vercel → Deployments → "⋯" → Redeploy, sem usar o cache de build) para ter efeito.

### Pegadinhas já encontradas (documentadas para não repetir)

- Valor de `ALLOWED_ORIGINS`/`DATABASE_URL` colado com espaço ou quebra de linha a mais faz a comparação de CORS falhar silenciosamente (sem erro visível) — o código já aplica `.trim()` no `ALLOWED_ORIGINS` por causa disso.
- Uma barra `/` sobrando no final de `NEXT_PUBLIC_API_URL` vira `//api/...` nas chamadas (404 em vez do JSON de erro esperado) — o front-end já remove barras finais automaticamente, mas evite deixá-la lá mesmo assim.
- `DATABASE_URL` colado com um caractere extra no início (ex.: `<postgresql://...`) quebra a validação do Prisma com uma mensagem genérica sobre "protocolo inválido" — confira o valor exato salvo, não só o que foi copiado.

---

## Problemas comuns

- **`Cannot find module '@/...'` em runtime:** o build precisa rodar `tsc && tsc-alias` (já configurado em `npm run build`).
- **`Invalid environment variables` ao iniciar:** confira o `.env` com base no `.env.example`; `JWT_SECRET` precisa de ao menos 10 caracteres.
- **`Set DATABASE_URL or DB_HOST + DB_USER + DB_PASSWORD + DB_NAME`:** nenhuma forma de conexão com o banco foi informada.
- **Migration marcada como falha:** `npx tsx scripts/prisma-env.ts migrate resolve --rolled-back <nome-da-migration>` e depois `npm run db:migrate:deploy`.
