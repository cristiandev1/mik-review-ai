# Mik Review AI - Plano de Implementação Completo

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Stack Tecnológica](#stack-tecnológica)
4. [Estado Atual da Implementação](#estado-atual-da-implementação)
5. [Backend API - Detalhamento](#backend-api---detalhamento)
6. [Frontend Dashboard - Detalhamento](#frontend-dashboard---detalhamento)
7. [Plano de Implementação por Fases](#plano-de-implementação-por-fases)
8. [Endpoints da API](#endpoints-da-api)
9. [Banco de Dados - Schema](#banco-de-dados---schema)
10. [Configuração e Variáveis de Ambiente](#configuração-e-variáveis-de-ambiente)
11. [Próximos Passos Críticos](#próximos-passos-críticos)

---

## 🎯 Visão Geral do Projeto

**Mik Review AI** é uma plataforma de code review automatizado que se integra ao seu fluxo de trabalho no GitHub. O objetivo é fornecer feedbacks inteligentes e contextuais sobre Pull Requests utilizando a IA DeepSeek-V3.2, mas gerenciado centralmente através do nosso dashboard.

### Fluxo Principal do Usuário (Journey)
1.  **Onboarding**: O usuário faz login no Dashboard e conecta sua conta do GitHub (OAuth/App).
2.  **Permissões**: O usuário concede permissão para o Mik Review AI ler seus repositórios.
3.  **Seleção de Repositórios**: No Dashboard, o usuário vê uma lista de seus repositórios e seleciona quais deseja ativar para code review.
4.  **Integração**:
    *   O usuário gera uma `MIK_REVIEW_API_KEY` no Dashboard.
    *   No GitHub, adiciona essa chave como Secret (`MIK_REVIEW_API_KEY`) no repositório.
    *   Adiciona um arquivo de workflow (`.github/workflows/mik-review.yml`) que utiliza nossa Action oficial.
5.  **Review Automático**:
    *   A cada novo Pull Request, a Action é disparada.
    *   A Action envia os dados para a **API do Mik Review** usando a chave.
    *   Nossa API busca as **Custom Rules** configuradas no Dashboard para aquele repositório (ou globais), processa o review e posta os comentários de volta no PR.

### Modelo de Negócio
- **Free Plan**: 50 reviews/mês
- **Pro Plan**: 500 reviews/mês ($9.99/mês)
- **Business Plan**: 2000 reviews/mês ($29.99/mês)

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Pull Request Created/Updated                       │    │
│  └─────────────────┬──────────────────────────────────┘    │
│                    │                                         │
│                    ▼                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  GitHub Action (uses mik-review-action)             │    │
│  │  - Env: MIK_REVIEW_API_KEY                         │    │
│  │  - Step: Call Mik Review API (POST /v1/reviews)    │    │
│  └─────────────────┬──────────────────────────────────┘    │
└────────────────────┼─────────────────────────────────────────┘
                     │ Auth: Bearer <MIK_REVIEW_API_KEY>
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Fastify)                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  API Gateway & Security                             │    │
│  │  - Validate API Key                                 │    │
│  │  - Check Repository Authorization (is selected?)    │    │
│  │  - Check Plan Limits / Balance                      │    │
│  └─────────────────┬──────────────────────────────────┘    │
│                    │                                         │
│                    ▼                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Core Logic                                         │    │
│  │  - Create Review Record (pending)                   │    │
│  │  - Enqueue Job (BullMQ)                             │    │
│  └─────────────────┬──────────────────────────────────┘    │
└────────────────────┼─────────────────────────────────────────┘
                     │ Async Processing
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Background Worker Process                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Review Worker                                      │    │
│  │  1. Fetch Full PR Context (Diff, Files) via Octokit │    │
│  │  2. Load Custom Rules from Dashboard                │    │
│  │  3. AI Inference (DeepSeek Provider)                │    │
│  │  4. Parse & Format Comments                         │    │
│  │  5. Post Comments to GitHub PR                      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │    Redis     │  │  DeepSeek    │     │
│  │  - Users     │  │  - Sessions  │  │  AI API      │     │
│  │  - Reviews   │  │  - Queues    │  │              │     │
│  │  - API Keys  │  │  - Rate Limit│  │              │     │
│  │  - Analytics │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Dashboard Web App (Next.js 14)                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Pages                                              │    │
│  │  - Login / Signup                                  │    │
│  │  - Dashboard (overview + recent reviews)          │    │
│  │  - Analytics (charts + usage stats)               │    │
│  │  - API Keys Management                            │    │
│  │  - [TODO] Teams Management                        │    │
│  │  - [TODO] Settings & Custom Rules                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica

### Backend (packages/api)
| Componente | Tecnologia | Versão | Propósito |
|------------|-----------|--------|-----------|
| Runtime | Node.js | 20+ | Ambiente de execução |
| Framework | Fastify | 4.29.1 | Web framework (alto desempenho) |
| Linguagem | TypeScript | 5.3.3 | Type safety |
| Database ORM | Drizzle | 0.29.3 | ORM para PostgreSQL |
| Database | PostgreSQL | 15+ | Banco de dados relacional |
| Cache/Queue | Redis | 7+ | Cache e job queue |
| Queue System | BullMQ | 5.1.6 | Background job processing |
| Authentication | JWT | @fastify/jwt 7.2.4 | Token-based auth |
| Password Hash | bcryptjs | 2.4.3 | Password encryption |
| Validation | Zod | 3.22.4 | Schema validation |
| Logger | Pino | 8.17.2 | Structured logging |
| GitHub API | Octokit | 20.0.2 | GitHub integration |
| AI SDK | OpenAI SDK | 4.24.1 | DeepSeek provider (uses OpenAI-compatible SDK) |
| Testing | Vitest | 1.1.0 | Unit testing |

### Frontend (packages/dashboard)
| Componente | Tecnologia | Versão | Propósito |
|------------|-----------|--------|-----------|
| Framework | Next.js | 14.2.0 | React framework (App Router) |
| React | React | 18.3.0 | UI library |
| Linguagem | TypeScript | 5.4.3 | Type safety |
| Styling | TailwindCSS | 3.4.1 | Utility-first CSS |
| UI Components | shadcn/ui | - | Component library |
| Forms | React Hook Form | 7.51.0 | Form management |
| Validation | Zod | 3.22.4 | Schema validation |
| HTTP Client | Axios | 1.6.8 | API requests |
| State Management | TanStack Query | 5.28.0 | Server state management |
| Charts | Recharts | 2.12.0 | Data visualization |
| Icons | Lucide React | 0.363.0 | Icon library |
| Date Utils | date-fns | 3.6.0 | Date manipulation |
| Authentication | NextAuth.js | 4.24.7 | Auth for Next.js |

### Infrastructure
| Componente | Tecnologia | Propósito |
|------------|-----------|-----------|
| Package Manager | pnpm | Monorepo management |
| Workspace | pnpm workspace | Monorepo structure |
| CI/CD | GitHub Actions | Automation |
| Bundler | @vercel/ncc | Action bundling |

---

## 🔌 Documentação de Integração (Workflow Recomendado)

Para integrar o Mik Review AI em um repositório, o usuário deve seguir este processo padronizado:

### 1. Configuração no Dashboard
1.  Acesse o Dashboard e vá em **"Repositórios"**.
2.  Clique em **"Adicionar Repositório"** e ative o repositório desejado.
3.  Vá em **"Custom Rules"** e configure as regras de revisão (globais ou específicas para este repositório).
4.  Vá em **"API Keys"**, gere uma nova chave e copie-a.

### 2. Configuração no GitHub
... (mesmo processo de secrets)

### 3. Setup do Workflow
Crie um arquivo `.github/workflows/code-review.yml` na raiz do projeto com o seguinte conteúdo:

```yaml
name: Mik Review AI

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      
      - name: Run Mik Review AI
        uses: mik-review/action@v1
        with:
          mik_api_key: ${{ secrets.MIK_REVIEW_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

---

## ✅ Estado Atual da Implementação

### 🟢 Completo e Funcional

#### Backend API
- [x] **Autenticação de Usuários**
  - Signup com email/password
  - Login com JWT (15min expiry)
  - Hashing de senha com bcryptjs
  - Geração automática de API key no signup
  - Middleware de autenticação JWT

- [x] **Gerenciamento de API Keys**
  - Criar novas API keys (formato: `mik_[32chars]`)
  - Listar API keys do usuário
  - Revogar API keys
  - Validação de API key com metadata
  - Track last used timestamp
  - Middleware de validação de API key

- [x] **Sistema de Reviews**
  - Criar review via POST /v1/reviews
  - Validação de rate limit (Redis-based)
  - Sistema de filas com BullMQ
  - Worker para processar reviews em background
  - Buscar review por ID com status
  - Listar reviews do usuário (paginado)
  - Status tracking: pending → processing → completed/failed

- [x] **Analytics e Métricas**
  - Track de uso diário (reviews count, tokens, processing time)
  - Dashboard stats (total reviews, success rate, avg time)
  - Usage stats por período (7/30/90 dias)
  - Top repositories tracking
  - Rate limit info por plano

- [x] **Serviço de IA**
  - Interface abstrata para AI providers
  - Implementação DeepSeek provider
  - Gerar reviews com summary + inline comments
  - Parse de resposta da IA

- [x] **GitHub Integration**
  - Fetch PR data (files, diff, metadata) via Octokit
  - Get file contents por commit SHA
  - Fetch múltiplos arquivos

- [x] **Rate Limiting**
  - Limites mensais por plano (50/500/2000)
  - Contador Redis-based
  - Auto-expiry no fim do mês
  - Validação antes de criar review

- [x] **Database Schema**
  - Tabelas: users, apiKeys, reviews, usageAnalytics
  - Tabelas: teams, teamMembers, customRules, subscriptions
  - Migrations com Drizzle Kit
  - Seed script para dados de teste

- [x] **Configuração**
  - Environment variables (.env)
  - Database config (Postgres via Drizzle)
  - Redis config (ioredis)
  - Logger (Pino)
  - CORS, Helmet, Rate Limit global

#### Frontend Dashboard
- [x] **Autenticação UI**
  - Página de Login (email/password)
  - Página de Signup (name, email, password)
  - OAuth buttons UI (GitHub, GitLab) - sem integração
  - Auto-redirect root → login
  - Auth state em localStorage

- [x] **Dashboard Overview**
  - Cards de estatísticas (total reviews, monthly, success rate, avg time)
  - Lista de reviews recentes (últimos 10)
  - Barra de progresso de uso mensal
  - Rate limit indicator

- [x] **Analytics Page**
  - Stats cards (total reviews, tokens, avg time)
  - Seletor de período (7/30/90 dias)
  - Tabela de uso diário
  - Recharts instalado (pronto para gráficos)

- [x] **API Keys Management**
  - Criar nova API key
  - Listar keys existentes (name, key, status, last used)
  - Revogar key com confirmação
  - Display de key recém-criada (copyable)
  - Truncate/reveal de API keys

- [x] **UI Components**
  - shadcn/ui components (Button, Card, Input, Label, Table)
  - Sidebar navigation
  - Icons (Lucide React)
  - Responsive layout

- [x] **Data Fetching**
  - Axios client configurado
  - React Query setup
  - Error handling básico

#### GitHub Action
- [x] **Workflow File**
  - Trigger em pull_request (opened, synchronize)
  - Fetch PR diff
  - POST para API /v1/reviews
  - Post de summary comment no PR

---

### 🟡 Parcialmente Implementado

- [x] **Review Comments no GitHub** ✅ IMPLEMENTADO
  - ✅ Review armazenado no DB
  - ✅ AI gera comentários inline
  - ✅ Worker posta comentários no PR via GitHub API
  - ✅ Error handling robusto (não falha job se posting falhar)
  - **Status**: Completamente funcional

- [x] **AI Provider** ✅ COMPLETO
  - ✅ Interface abstrata AIProvider
  - ✅ DeepSeek provider completo (único provider suportado)
  - ✅ Focado em custo-benefício e performance
  - **Status**: DeepSeek é o único provider - sem suporte a outros modelos

- [x] **Custom Rules** ✅ IMPLEMENTADO (Backend)
  - ✅ Tabela customRules no schema
  - ✅ Relação com users e teams
  - ✅ Endpoints CRUD completos (GET, POST, PUT, DELETE /custom-rules)
  - ✅ Integração no worker (busca custom rules por repositório)
  - ✅ Suporte a rules globais e por repositório
  - ✅ Fallback para rules default se não houver custom
  - ❌ UI para editar rules (frontend pendente)
  - **Status**: Backend completo, falta frontend

- [ ] **GitHub OAuth**
  - ✅ Botões na UI de login/signup
  - ✅ NextAuth.js instalado
  - ❌ GitHub App não configurado
  - ❌ Callback routes não implementados
  - **Impacto**: Login só funciona via email/password

- [ ] **Teams**
  - ✅ Schema completo (teams, teamMembers)
  - ❌ Endpoints de API (criar team, adicionar membros, etc.)
  - ❌ UI para gerenciar teams
  - **Impacto**: Feature de teams não utilizável

- [ ] **Subscription/Billing**
  - ✅ Campo stripeCustomerId e stripeSubscriptionId em users
  - ✅ Tabela subscriptions
  - ❌ Integração com Stripe API
  - ❌ Checkout flow
  - ❌ Webhook handlers
  - ❌ UI de planos e upgrade
  - **Impacto**: Todos usuários ficam no free plan

---

### 🔴 Não Implementado

#### Backend
- [x] **Email System**
  - ✅ Email verification após signup
  - ✅ Endpoint: POST /auth/verify-email
  - ✅ Endpoint: POST /auth/resend-verification
  - ✅ Password reset flow (POST /auth/forgot-password, /auth/reset-password)
  - ✅ Email templates (HTML/CSS styled)
  - ✅ SMTP/SendGrid/Resend integration

- [ ] **Notification System**
  - Notificações in-app
  - Email notifications (review complete, errors)
  - WebSocket para real-time updates

- [ ] **Advanced Features**
  - Webhooks para integrações externas
  - Audit logs
  - Admin dashboard/endpoints
  - Multi-language support (i18n)

- [ ] **Testing**
  - Unit tests (Vitest configurado, 0 testes)
  - Integration tests
  - E2E tests
  - Coverage reports

- [ ] **Documentation**
  - API documentation (Swagger/OpenAPI)
  - Architecture docs
  - Deployment guides

- [ ] **DevOps**
  - Docker Compose para local dev
  - Production Dockerfile
  - CI/CD pipeline
  - Monitoring/Observability (Sentry, DataDog)

#### Frontend
- [ ] **Advanced UI**
  - Review detail page (visualizar diff + comments)
  - Settings page (profile, notifications, preferences)
  - Team management UI
  - Custom rules editor (Monaco/CodeMirror)
  - Billing/subscription management page

- [ ] **Data Visualization**
  - Gráficos de analytics (line charts, bar charts)
  - Exportar reports (CSV, PDF)
  - Advanced filtering e search

- [ ] **UX Improvements**
  - Loading states
  - Error boundaries
  - Toast notifications
  - Dark mode toggle
  - Keyboard shortcuts

- [ ] **Testing**
  - Component tests (Jest/Testing Library)
  - E2E tests (Playwright/Cypress)

---

## 📦 Backend API - Detalhamento

### Estrutura de Diretórios

```
packages/api/src/
├── config/
│   ├── database.ts         # Drizzle client setup
│   ├── redis.ts           # Redis client (ioredis)
│   └── env.ts             # Environment variables validation
│
├── database/
│   ├── schema.ts          # Drizzle schema (todas as tabelas)
│   ├── migrate.ts         # Migration runner
│   └── seed.ts            # Seed data script
│
├── middleware/
│   ├── auth.middleware.ts      # JWT validation
│   ├── api-key.middleware.ts   # API key validation
│   └── rate-limit.middleware.ts # Global rate limiting
│
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts     # Business logic (signup, login)
│   │   ├── auth.controller.ts  # Route handlers
│   │   ├── auth.routes.ts      # Route definitions
│   │   └── auth.schemas.ts     # Zod schemas
│   │
│   ├── api-keys/
│   │   ├── api-key.service.ts
│   │   ├── api-key.controller.ts
│   │   ├── api-key.routes.ts
│   │   └── api-key.schemas.ts
│   │
│   ├── reviews/
│   │   ├── review.service.ts
│   │   ├── review.controller.ts
│   │   ├── review.routes.ts
│   │   ├── review.schemas.ts
│   │   ├── review.queue.ts     # BullMQ queue setup
│   │   └── review.worker.ts    # Background worker
│   │
│   ├── analytics/
│   │   ├── analytics.service.ts
│   │   ├── analytics.controller.ts
│   │   └── analytics.routes.ts
│   │
│   ├── github/
│   │   └── github.service.ts   # Octokit wrapper
│   │
│   ├── ai/
│   │   ├── ai.service.ts       # AI service orchestrator
│   │   ├── ai.interface.ts     # AIProvider interface
│   │   └── providers/
│   │       └── deepseek.provider.ts   # ✅ Implementado (único provider)
│   │
│   └── rate-limit/
│       └── rate-limit.service.ts      # Rate limit logic
│
├── shared/
│   ├── constants/
│   │   └── plans.ts           # Plan limits (free, pro, business)
│   ├── utils/
│   │   └── logger.ts          # Pino logger
│   ├── types/
│   └── errors/
│
├── app.ts                     # Fastify app setup
└── index.ts                   # Entry point
```

### Módulos Detalhados

#### 1. Auth Module

**Arquivo: `auth.service.ts`**
```typescript
class AuthService {
  async signup(data: SignupInput): Promise<{ user, token, apiKey }>
  async login(data: LoginInput): Promise<{ user, token }>
  async verifyToken(token: string): Promise<User>
}
```

**Fluxo de Signup:**
1. Validar input (Zod schema)
2. Checar se email já existe
3. Hash da senha com bcryptjs (10 rounds)
4. Criar usuário no DB (plan: 'free')
5. Gerar API key automática (nanoid)
6. Gerar JWT token
7. Retornar user + token + apiKey

**Fluxo de Login:**
1. Validar input
2. Buscar usuário por email
3. Comparar senha (bcrypt.compare)
4. Gerar JWT token
5. Retornar user + token

**Endpoints:**
- `POST /auth/signup`
  - Body: `{ name, email, password }`
  - Response: `{ user, token, apiKey }`

- `POST /auth/login`
  - Body: `{ email, password }`
  - Response: `{ user, token }`

---

#### 2. API Keys Module

**Arquivo: `api-key.service.ts`**
```typescript
class ApiKeyService {
  async createApiKey(userId, name): Promise<ApiKey>
  async listApiKeys(userId): Promise<ApiKey[]>
  async revokeApiKey(userId, keyId): Promise<void>
  async validateApiKey(key: string): Promise<{ valid: boolean, user?: User }>
}
```

**Formato da Key:** `mik_` + nanoid(32)

**Fluxo de Criação:**
1. Validar input
2. Gerar key com nanoid
3. Salvar no DB (userId, name, key, status: active)
4. Retornar key completa (só exibida uma vez)

**Fluxo de Validação (Middleware):**
1. Extrair key do header `X-API-Key`
2. Buscar no DB + JOIN com user
3. Verificar status (active)
4. Atualizar lastUsedAt
5. Anexar user no request

**Endpoints:**
- `GET /api-keys` (protegido JWT)
  - Response: `[{ id, name, key: 'mik_***...', status, lastUsedAt }]`

- `POST /api-keys` (protegido JWT)
  - Body: `{ name }`
  - Response: `{ id, name, key, status }`

- `DELETE /api-keys/:id` (protegido JWT)
  - Response: `{ success: true }`

---

#### 3. Reviews Module

**Arquivo: `review.service.ts`**
```typescript
class ReviewService {
  async createReview(userId, data): Promise<Review>
  async getReview(userId, reviewId): Promise<Review>
  async listReviews(userId, options): Promise<{ reviews, total }>
}
```

**Arquivo: `review.worker.ts`**
```typescript
async function processReview(job: Job) {
  // 1. Fetch GitHub PR data
  const prData = await githubService.fetchPR(repo, prNumber)

  // 2. Get file contents
  const files = await githubService.fetchFiles(repo, prData.files, sha)

  // 3. Load review rules from DB (Global or Repository specific)
  const rules = await customRulesService.getRulesForRepo(repo)

  // 4. Call AI service
  const aiResult = await aiService.generateReview(prData.diff, files, rules)

  // 5. Update review in DB
  await updateReview(reviewId, {
    status: 'completed',
    summary: aiResult.summary,
    comments: aiResult.comments,
    tokensUsed: aiResult.tokensUsed
  })

  // 6. Record analytics
  await analyticsService.recordUsage(userId, tokensUsed, processingTime)

  // 7. TODO: Post comments to GitHub PR
  // await githubService.postReviewComments(repo, prNumber, aiResult.comments)
}
```

**Fluxo de Criação:**
1. Validar API key (middleware)
2. Check rate limit (Redis counter)
3. Validar input (repo, prNumber, installationId)
4. Criar review no DB (status: pending)
5. Enqueue job no BullMQ
6. Retornar reviewId imediatamente

**Fluxo de Worker:**
1. Dequeue job
2. Atualizar status: processing
3. Fetch GitHub data
4. Call AI
5. Salvar resultado
6. Record analytics
7. [TODO] Post comments no PR

**Endpoints:**
- `POST /v1/reviews` (protegido API Key + rate limit)
  - Body: `{ repository, prNumber, installationId }`
  - Response: `{ reviewId, status: 'pending' }`

- `GET /v1/reviews/:id` (protegido API Key)
  - Response: `{ id, status, summary, comments, createdAt, ... }`

- `GET /v1/reviews` (protegido JWT)
  - Query: `?page=1&limit=10`
  - Response: `{ reviews: [...], total, page, limit }`

---

#### 4. Analytics Module

**Arquivo: `analytics.service.ts`**
```typescript
class AnalyticsService {
  async recordUsage(userId, reviewId, tokensUsed, processingTime): Promise<void>
  async getDashboardStats(userId): Promise<DashboardStats>
  async getUsageStats(userId, days): Promise<UsageStats[]>
  async getTopRepositories(userId, limit): Promise<Repo[]>
}
```

**Tabela `usageAnalytics`:**
```sql
CREATE TABLE usageAnalytics (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL,
  date DATE NOT NULL,
  reviewsCount INT DEFAULT 0,
  tokensUsed INT DEFAULT 0,
  processingTimeMs INT DEFAULT 0,
  UNIQUE(userId, date)
);
```

**Lógica de Record:**
- Upsert daily record (INSERT ... ON CONFLICT)
- Incrementar reviewsCount
- Acumular tokensUsed e processingTimeMs

**Dashboard Stats:**
```typescript
{
  totalReviews: 150,
  monthlyReviews: 23,
  successRate: 98.5, // (completed / total) * 100
  avgProcessingTime: 12.5, // seconds
  recentReviews: [...], // últimos 10
  rateLimit: {
    used: 23,
    limit: 50,
    percentage: 46
  }
}
```

**Endpoints:**
- `GET /analytics/dashboard` (protegido JWT)
  - Response: `DashboardStats`

- `GET /analytics/usage?days=30` (protegido JWT)
  - Response: `[{ date, reviewsCount, tokensUsed, processingTimeMs }]`

---

#### 5. AI Module

**Interface: `ai.interface.ts`**
```typescript
interface AIProvider {
  generateReview(input: AIReviewInput): Promise<AIReviewOutput>
}

interface AIReviewInput {
  diff: string
  files: FileContent[]
  rules: string
  repository: string
  prNumber: number
}

interface AIReviewOutput {
  summary: string
  comments: InlineComment[]
  tokensUsed: number
}
```

**DeepSeek Provider:**
- Usa OpenAI SDK (compatível)
- Endpoint: `https://api.deepseek.com`
- Model: `deepseek-chat`
- Prompt engineering para retornar JSON estruturado
- Parse de resposta com fallback
- **Único provider suportado** - focado em custo-benefício e performance

---

#### 6. Rate Limit Module

**Arquivo: `rate-limit.service.ts`**
```typescript
class RateLimitService {
  async checkRateLimit(userId: string): Promise<{ allowed: boolean, used: number, limit: number }>
  async incrementUsage(userId: string): Promise<void>
}
```

**Limites por Plano:**
```typescript
const PLAN_LIMITS = {
  free: 50,
  pro: 500,
  business: 2000
}
```

**Implementação Redis:**
- Key: `rate-limit:${userId}:${YYYY-MM}`
- Increment on review creation
- Expire no fim do mês (auto-reset)
- Check antes de criar review

---

## 🎨 Frontend Dashboard - Detalhamento

### Estrutura de Diretórios

```
packages/dashboard/
├── app/
│   ├── (auth)/                     # Auth layout group
│   │   ├── layout.tsx             # Centered layout
│   │   ├── login/
│   │   │   └── page.tsx           # Login page
│   │   └── signup/
│   │       └── page.tsx           # Signup page
│   │
│   ├── dashboard/                  # Protected routes
│   │   ├── layout.tsx             # Dashboard layout (sidebar)
│   │   ├── page.tsx               # Dashboard home
│   │   ├── analytics/
│   │   │   └── page.tsx           # Analytics page
│   │   └── api-keys/
│   │       └── page.tsx           # API keys management
│   │
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Root redirect
│
├── components/
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── table.tsx
│   ├── icons.tsx                  # Lucide icons
│   └── sidebar.tsx                # Navigation sidebar
│
├── lib/
│   ├── api.ts                     # Axios client
│   └── utils.ts                   # Helper functions
│
├── styles/
│   └── globals.css                # Tailwind imports + custom
│
├── public/
│   └── ...                        # Static assets
│
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### Páginas Implementadas

#### 1. Login Page (`app/(auth)/login/page.tsx`)

**Features:**
- Email + password form
- React Hook Form + Zod validation
- OAuth buttons (GitHub, GitLab) - visual apenas
- Loading state durante login
- Redirect to dashboard on success
- Link para signup

**State Management:**
```typescript
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const onSubmit = async (data) => {
  const response = await axios.post('/auth/login', data)
  localStorage.setItem('token', response.data.token)
  localStorage.setItem('user', JSON.stringify(response.data.user))
  router.push('/dashboard')
}
```

**Validação:**
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})
```

---

#### 2. Signup Page (`app/(auth)/signup/page.tsx`)

**Features:**
- Name, email, password form
- Password strength indicator (TODO)
- OAuth buttons
- Auto-display API key após signup
- Redirect to dashboard

**Diferencial do Login:**
- Campo extra: name
- Exibe API key gerada automaticamente
- Copy button para API key
- Warning para salvar key

---

#### 3. Dashboard Home (`app/dashboard/page.tsx`)

**Features:**
- 4 stat cards:
  - Total Reviews
  - This Month
  - Success Rate
  - Avg Processing Time

- Recent Reviews Table:
  - Repository
  - PR Number
  - Status (badge colorido)
  - Created At
  - Link para detail (TODO)

- Monthly Usage Progress Bar:
  - Visual de uso (23/50)
  - Percentual
  - Plan indicator

**Data Fetching:**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: () => api.get('/analytics/dashboard')
})
```

**Cards Layout:**
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <Card>
    <CardHeader>
      <CardTitle>Total Reviews</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{data.totalReviews}</div>
    </CardContent>
  </Card>
  {/* ... outros cards */}
</div>
```

---

#### 4. Analytics Page (`app/dashboard/analytics/page.tsx`)

**Features:**
- Period selector (7/30/90 days)
- 3 summary cards (total reviews, tokens, avg time)
- Daily usage table
- TODO: Line/bar charts (Recharts instalado)

**Data Fetching:**
```typescript
const [days, setDays] = useState(30)

const { data } = useQuery({
  queryKey: ['usage-stats', days],
  queryFn: () => api.get(`/analytics/usage?days=${days}`)
})
```

**Table Columns:**
- Date
- Reviews Count
- Tokens Used
- Avg Processing Time (ms)

**TODO: Charts**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="reviewsCount" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>
```

---

#### 5. API Keys Page (`app/dashboard/api-keys/page.tsx`)

**Features:**
- Create new key form (name input)
- List existing keys:
  - Name
  - Key (truncated: `mik_abc...xyz`)
  - Status badge
  - Last Used (date-fns format)
  - Revoke button

- New key modal/alert:
  - Display full key
  - Copy button
  - Warning: "Save this key, it won't be shown again"

**Create Flow:**
```typescript
const createKey = async (name: string) => {
  const response = await api.post('/api-keys', { name })
  setNewKey(response.data.key) // Display full key
  refetch() // Reload list
}
```

**Revoke Flow:**
```typescript
const revokeKey = async (id: string) => {
  if (confirm('Are you sure?')) {
    await api.delete(`/api-keys/${id}`)
    refetch()
  }
}
```

**Key Display:**
```tsx
const displayKey = (key: string) => {
  if (key.length > 20) {
    return `${key.slice(0, 10)}...${key.slice(-6)}`
  }
  return key
}
```

---

### Componentes Principais

#### Sidebar (`components/sidebar.tsx`)

**Features:**
- Logo
- Navigation links:
  - Dashboard
  - Analytics
  - API Keys
  - Settings (TODO)
  - Teams (TODO)
- Active state
- Logout button
- User info display

**Navegação:**
```typescript
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartIcon },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: KeyIcon },
]
```

---

#### UI Components (shadcn/ui)

**Instalados:**
- Button (variants: default, outline, ghost)
- Card (CardHeader, CardTitle, CardContent)
- Input (text, email, password)
- Label (para forms)
- Table (Table, TableHeader, TableRow, TableCell)

**Padrão de Uso:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

---

### Estado e Data Fetching

**API Client (`lib/api.ts`):**
```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
```

**React Query Setup:**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 min
      retry: 1
    }
  }
})
```

**Auth State:**
- Armazenado em localStorage (token + user object)
- TODO: Migrar para NextAuth.js
- TODO: Server-side auth check

---

## 🚀 Plano de Implementação por Fases

### Fase 1: Core Functionality (Crítico) - 2-3 semanas

**Objetivo:** Tornar o produto minimamente funcional de ponta a ponta

#### Backend
- [x] **Repository Management** ✅ IMPLEMENTADO
  - ✅ Tabela `repositories` criada no schema
  - ✅ Migration executada (0004_tense_tarantula.sql)
  - ✅ Módulo completo (service, controller, routes, schemas)
  - ✅ Endpoint `GET /github/repositories` - listar repos do GitHub via Octokit
  - ✅ Endpoint `POST /repositories/sync` - sincronizar repositório no DB
  - ✅ Endpoint `GET /repositories` - listar repos sincronizados (paginado)
  - ✅ Endpoint `GET /repositories/:id` - obter repositório específico
  - ✅ Endpoint `PATCH /repositories/:id` - ativar/desativar repositório
  - ✅ Endpoint `DELETE /repositories/:id` - deletar repositório
  - ✅ Validação no `review.service.ts` - só permite reviews em repos ativos
  - ✅ Integração com GitHubService para listar repositórios do usuário
  - ❌ UI do frontend (pendente)
  - **Status**: Backend completo e funcional

- [ ] **1.1 GitHub Comment Posting** (Alta prioridade)
  - Implementar postagem de comentários inline no PR
  - Usar Octokit para criar review comments
  - Mapear linha do diff para posição no arquivo
  - Testar com PRs reais
  - **Arquivos:** `review.worker.ts`, `github.service.ts`

- [ ] **1.2 Custom Rules Integration** (Alta prioridade)
  - Endpoints: GET, POST, PUT, DELETE /custom-rules
  - Controller e service
  - Modificar worker para usar custom rules se existirem
  - **Arquivos:** Novo módulo `modules/custom-rules/`

- [x] **1.3 Error Handling** (Alta prioridade)
  - ✅ Centralizar error handling (Fastify error handler)
  - ✅ Padronizar responses de erro (AppError)
  - ✅ Logging de erros (Pino + Global Handler)
  - ❌ Retry logic para falhas temporárias (GitHub API) (Parcialmente via Redis/BullMQ)
  - **Arquivos:** `shared/errors/`, middleware

- [ ] **1.4 Email Verification** (Média prioridade)
  - Enviar email de confirmação no signup
  - Endpoint: POST /auth/verify-email/:token
  - Bloquear uso até verificar (opcional)
  - Usar Resend ou SendGrid
  - **Arquivos:** Novo módulo `modules/email/`

#### Frontend
- [x] **1.5 Review Detail Page** (Alta prioridade)
  - ✅ Rota: /dashboard/reviews/:id
  - ✅ Mostrar resumo e comentários
  - ✅ Integração com API via React Query
  - **Arquivos:** `app/dashboard/reviews/[id]/page.tsx`

- [ ] **1.6 Error Handling UI** (Alta prioridade)
  - Error boundaries
  - Toast notifications (sonner ou react-hot-toast)
  - Loading states consistentes
  - Retry buttons em falhas
  - **Arquivos:** `components/error-boundary.tsx`, `lib/toast.ts`

- [ ] **1.7 Custom Rules UI** (Média prioridade)
  - Página: /dashboard/settings/rules
  - Editor Monaco ou CodeMirror
  - Save/load rules
  - Preview antes de salvar
  - **Arquivos:** `app/dashboard/settings/rules/page.tsx`

#### Testes
- [x] **1.8 Testing Infrastructure** ✅ IMPLEMENTADO
  - ✅ Vitest configurado (vitest.config.ts)
  - ✅ Estrutura de diretórios criada (unit/, integration/, helpers/)
  - ✅ Setup global e mocks (logger, Redis)
  - ✅ Test helpers e utilities (test-utils.ts, mock-db.ts)
  - ✅ **Unit Tests implementados:**
    - auth.service.test.ts (10 testes - 9 passando)
    - repository.service.test.ts (11 testes - 7 passando)
    - ai.service.test.ts (5 testes - 5 passando ✅)
  - ✅ **Integration Tests implementados:**
    - auth.routes.test.ts (6 testes)
    - repository.routes.test.ts (6 testes)
  - ✅ **Status Atual**: 21/26 testes passando (81%)
  - ✅ Framework: Vitest 1.6.1
  - **Arquivos:** `tests/`, `vitest.config.ts`

---

### Fase 2: User Features (Importante) - 3-4 semanas

**Objetivo:** Melhorar experiência do usuário e adicionar features esperadas

#### Backend
- [x] **2.1 Repository Management** ✅ COMPLETO (movido para Fase 1)
  - ✅ Tabela `repositories` criada e migration executada
  - ✅ Endpoints CRUD completos (GET, POST, PATCH, DELETE)
  - ✅ Integração com GitHub API via Octokit
  - ✅ Validação em reviews (só repositórios ativos)
  - **Arquivos:** `modules/repositories/`

- [x] **2.2 GitHub OAuth** (Alta prioridade)
  - ✅ Criar GitHub App (Configuração externa necessária)
  - ✅ Callback endpoints: /auth/github/callback
  - ✅ Link existing users ou criar novos
  - ✅ Armazenar GitHub access token (criptografado/armazenado)
  - **Arquivos:** `modules/auth/github-oauth.service.ts`

- [ ] **2.2 Teams Management** (Em Progresso) 🚧
  - Endpoints:
    - POST /teams (criar team)
    - GET /teams (listar teams do user)
    - POST /teams/:id/members (adicionar membro)
    - DELETE /teams/:id/members/:userId
    - PUT /teams/:id/members/:userId/role
  - Permissões: owner, admin, member
  - Shared API keys por team
  - **Arquivos:** Novo módulo `modules/teams/`

- [x] **2.3 Password Reset** (Média prioridade)
  - ✅ POST /auth/forgot-password (enviar email)
  - ✅ POST /auth/reset-password/:token
  - ✅ Tokens com expiry (15min)
  - **Arquivos:** `modules/auth/password-reset.ts`

- [ ] **2.4 Notifications** (Baixa prioridade)
  - Notificações in-app (review completed, errors)
  - Email notifications (opcional via settings)
  - Endpoints: GET /notifications, PATCH /notifications/:id/read
  - **Arquivos:** Novo módulo `modules/notifications/`

- [ ] **2.5 WebSocket Real-time** (Baixa prioridade)
  - Socket.io integration
  - Eventos: review-started, review-progress, review-completed
  - Auth via JWT
  - **Arquivos:** `websocket/`, `review.worker.ts`

#### Frontend
- [ ] **2.6 Repository Selection UI** (Alta Prioridade) - PRÓXIMA TAREFA
  - ❌ Página: `/dashboard/repositories`
  - ❌ Integração com backend (`GET /github/repositories`, `POST /repositories/sync`)
  - ❌ Lista de repositórios vindos do GitHub (com search/filter)
  - ❌ Botão "Sync" para sincronizar repositório
  - ❌ Toggle switch para ativar/desativar repositório (PATCH endpoint)
  - ❌ Feedback visual de "Syncing" e status enabled/disabled
  - ❌ React Query para data fetching
  - **Arquivos:** `app/dashboard/repositories/page.tsx`
  - **Backend:** ✅ Pronto e aguardando integração

- [x] **2.7 GitHub OAuth Flow** (Alta prioridade)
  - ✅ Integrar com backend endpoints
  - ✅ Callback page: /auth/callback
  - ✅ Handle success/error states
  - **Arquivos:** `app/auth/callback/page.tsx`

- [ ] **2.7 Teams Management UI** (Média prioridade)
  - Páginas:
    - /dashboard/teams (listar teams)
    - /dashboard/teams/:id (team detail)
    - /dashboard/teams/new (criar team)
  - Manage members (add, remove, change role)
  - Team settings
  - **Arquivos:** `app/dashboard/teams/`

- [ ] **2.8 Settings Page** (Média prioridade)
  - Profile settings (name, email, avatar)
  - Notification preferences
  - Password change
  - Delete account
  - **Arquivos:** `app/dashboard/settings/page.tsx`

- [ ] **2.9 Charts & Visualizations** (Baixa prioridade)
  - Integrar Recharts nas páginas de analytics
  - Line chart: reviews over time
  - Bar chart: reviews por repository
  - Pie chart: success vs failed
  - **Arquivos:** `app/dashboard/analytics/page.tsx`, `components/charts/`

- [ ] **2.10 Search & Filters** (Baixa prioridade)
  - Filter reviews por status, repository, date range
  - Search por PR number ou title
  - Sort por date, processing time
  - **Arquivos:** `app/dashboard/page.tsx`

#### UX Improvements
- [ ] **2.11 Loading States** (Alta prioridade)
  - Skeleton loaders (shadcn/ui skeleton)
  - Suspense boundaries
  - Progress indicators
  - **Arquivos:** `components/ui/skeleton.tsx`

- [ ] **2.12 Toast Notifications** (Alta prioridade)
  - Success/error toasts
  - Action confirmations
  - Copy to clipboard feedback
  - **Framework:** sonner

- [ ] **2.13 Dark Mode** (Baixa prioridade)
  - Theme toggle
  - Persist preference
  - Tailwind dark: classes
  - **Arquivos:** `components/theme-provider.tsx`

---

### Fase 3: Monetization (Enhancement) - 2-3 semanas

**Objetivo:** Implementar billing e monetizar o produto

#### Backend
- [ ] **3.1 Stripe Integration** (Alta prioridade)
  - Criar Stripe customers no signup
  - Webhook: /webhooks/stripe
  - Handle events:
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.payment_succeeded
    - invoice.payment_failed
  - Update subscriptions table
  - Update user plan
  - **Arquivos:** Novo módulo `modules/billing/`

- [ ] **3.2 Subscription Endpoints** (Alta prioridade)
  - GET /billing/plans (listar planos)
  - POST /billing/checkout (criar checkout session)
  - GET /billing/portal (customer portal link)
  - GET /billing/subscription (current subscription)
  - POST /billing/upgrade (upgrade plan)
  - POST /billing/cancel (cancel subscription)
  - **Arquivos:** `modules/billing/`

- [ ] **3.3 Usage Billing** (Média prioridade)
  - Calcular overages (reviews acima do plano)
  - Endpoint: GET /billing/usage
  - Cobrar por review extra ($0.10 cada no free)
  - Invoice no fim do mês
  - **Arquivos:** `modules/billing/usage-billing.ts`

#### Frontend
- [ ] **3.4 Pricing Page** (Alta prioridade)
  - Página pública: /pricing
  - Cards dos planos (Free, Pro, Business)
  - Feature comparison table
  - CTA buttons → checkout ou signup
  - **Arquivos:** `app/pricing/page.tsx`

- [ ] **3.5 Checkout Flow** (Alta prioridade)
  - Select plan → Stripe Checkout
  - Redirect back com success/cancel
  - Update UI após upgrade
  - **Arquivos:** `app/checkout/`, `app/checkout/success/page.tsx`

- [ ] **3.6 Billing Management** (Alta prioridade)
  - Página: /dashboard/billing
  - Current plan display
  - Usage stats (reviews usado vs limite)
  - Payment method
  - Invoices history
  - Upgrade/downgrade buttons
  - Cancel subscription
  - **Arquivos:** `app/dashboard/billing/page.tsx`

- [ ] **3.7 Upgrade Prompts** (Média prioridade)
  - Modal quando atingir rate limit
  - Banner quando perto do limite (80%)
  - Upgrade CTA em páginas
  - **Arquivos:** `components/upgrade-modal.tsx`

---

### Fase 4: Polish & Scale (Quality) - 3-4 semanas

**Objetivo:** Preparar para escala e produção

#### Testing
- [ ] **4.1 Backend Tests** (Alta prioridade)
  - Unit tests para todos os services (coverage >80%)
  - Integration tests para endpoints críticos
  - E2E tests para fluxos principais
  - **Framework:** Vitest + Supertest

- [ ] **4.2 Frontend Tests** (Alta prioridade)
  - Component tests (Testing Library)
  - E2E tests (Playwright)
  - Visual regression tests (Chromatic)
  - **Framework:** Vitest + Playwright

#### Documentation
- [ ] **4.3 API Documentation** (Alta prioridade)
  - Swagger/OpenAPI spec
  - Interactive docs (@fastify/swagger)
  - Code examples
  - **Arquivos:** `docs/api-spec.yaml`

- [ ] **4.4 Architecture Docs** (Média prioridade)
  - System architecture diagrams
  - Database schema docs
  - Deployment guides
  - Contributing guide
  - **Arquivos:** `docs/architecture.md`

#### DevOps
- [ ] **4.5 Docker Setup** (Alta prioridade)
  - Dockerfile para API
  - Dockerfile para Dashboard
  - docker-compose.yml (API + DB + Redis + Worker)
  - Multi-stage builds (dev + prod)
  - **Arquivos:** `Dockerfile.api`, `Dockerfile.dashboard`, `docker-compose.yml`

- [ ] **4.6 CI/CD Pipeline** (Alta prioridade)
  - GitHub Actions workflow
  - Build + Test + Lint
  - Deploy to staging on PR
  - Deploy to production on merge to main
  - **Arquivos:** `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`

- [ ] **4.7 Monitoring** (Alta prioridade)
  - Sentry para error tracking
  - DataDog ou New Relic para APM
  - Health checks detalhados
  - Metrics dashboard (Grafana)
  - **Arquivos:** `modules/monitoring/`

#### Performance
- [ ] **4.8 Database Optimization** (Média prioridade)
  - Adicionar índices necessários
  - Query optimization
  - Connection pooling tuning
  - Read replicas (se necessário)
  - **Arquivos:** `database/migrations/`

- [ ] **4.9 Caching Strategy** (Média prioridade)
  - Cache de analytics (Redis)
  - Cache de user data (short-lived)
  - CDN para assets estáticos
  - **Arquivos:** `shared/cache/`

- [x] **Rate Limiting Improvements**
  - ✅ Refinar lógica de rate limiting (Atomic consumption, User-aware)
  - ✅ Configuração de Redis distribuído para rate limit global
  - ✅ Endpoints para ver quota usage (GET /rate-limit/usage)
  - ✅ Headers de rate limit detalhados (Limit, Remaining, Used, Plan, Reset)

#### Security
- [ ] **4.11 Security Audit** (Alta prioridade)
  - OWASP checklist
  - Dependency audit (npm audit)
  - SQL injection prevention (Drizzle prepared statements)
  - XSS prevention (React auto-escape)
  - CSRF protection
  - **Arquivos:** Security checklist doc

- [ ] **4.12 Secrets Management** (Alta prioridade)
  - Usar secrets manager (AWS Secrets Manager, Vault)
  - Rotate API keys periodicamente
  - Encrypt sensitive DB fields
  - **Arquivos:** `config/secrets.ts`

#### Advanced Features
- [ ] **4.13 Webhooks** (Baixa prioridade)
  - Permitir usuários configurar webhooks
  - Eventos: review.completed, review.failed
  - Retry logic
  - Signature verification
  - **Arquivos:** Novo módulo `modules/webhooks/`

- [ ] **4.14 Audit Logs** (Baixa prioridade)
  - Log de ações importantes (login, API key created, review created)
  - Endpoint: GET /audit-logs
  - Retention policy (90 dias)
  - **Arquivos:** Novo módulo `modules/audit/`

- [ ] **4.15 Admin Dashboard** (Baixa prioridade)
  - Painel admin: /admin
  - Visualizar todos usuários
  - Metrics gerais (total reviews, revenue)
  - Moderar conteúdo
  - **Arquivos:** `app/admin/`

- [ ] **4.16 Multi-language Support** (Baixa prioridade)
  - i18n setup (next-intl)
  - Traduzir UI (EN, PT-BR)
  - Traduzir emails
  - **Arquivos:** `messages/`, `middleware/i18n.ts`

---

## 📡 Endpoints da API

### Autenticação

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/auth/signup` | - | Criar nova conta |
| POST | `/auth/login` | - | Login e obter JWT |
| POST | `/auth/logout` | JWT | Logout (invalidar token) [TODO] |
| POST | `/auth/forgot-password` | - | Solicitar reset de senha [TODO] |
| POST | `/auth/reset-password/:token` | - | Resetar senha [TODO] |
| POST | `/auth/verify-email/:token` | - | Verificar email [TODO] |
| GET | `/auth/me` | JWT | Obter usuário atual [TODO] |

### API Keys

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/api-keys` | JWT | Listar API keys do usuário |
| POST | `/api-keys` | JWT | Criar nova API key |
| DELETE | `/api-keys/:id` | JWT | Revogar API key |

### Reviews

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/v1/reviews` | API Key | Criar review (+ rate limit check) |
| GET | `/v1/reviews/:id` | API Key | Obter review por ID |
| GET | `/v1/reviews` | JWT | Listar reviews do usuário (paginado) |

### Analytics

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/analytics/dashboard` | JWT | Dashboard stats (total, monthly, success rate) |
| GET | `/analytics/usage` | JWT | Usage stats por período (?days=30) |

### Repositories ✅ IMPLEMENTADO

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/github/repositories` | JWT | Listar repositórios do GitHub do usuário (via Octokit) |
| POST | `/repositories/sync` | JWT | Sincronizar repositório do GitHub para o DB |
| GET | `/repositories` | JWT | Listar repositórios sincronizados (query: page, limit, isEnabled) |
| GET | `/repositories/:id` | JWT | Obter repositório específico |
| PATCH | `/repositories/:id` | JWT | Atualizar repositório (ativar/desativar) |
| DELETE | `/repositories/:id` | JWT | Deletar repositório |

**Validação Integrada:**
- `POST /v1/reviews` agora valida se o repositório está sincronizado e ativo antes de criar review
- Retorna erro 403 se repositório não estiver habilitado

### Teams [TODO]

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/teams` | JWT | Listar teams do usuário |
| POST | `/teams` | JWT | Criar novo team |
| GET | `/teams/:id` | JWT | Obter team por ID |
| PUT | `/teams/:id` | JWT | Atualizar team |
| DELETE | `/teams/:id` | JWT | Deletar team |
| GET | `/teams/:id/members` | JWT | Listar membros do team |
| POST | `/teams/:id/members` | JWT | Adicionar membro |
| DELETE | `/teams/:id/members/:userId` | JWT | Remover membro |
| PUT | `/teams/:id/members/:userId/role` | JWT | Atualizar role do membro |

### Custom Rules ✅ IMPLEMENTADO

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/custom-rules` | JWT | Listar rules do usuário/team (query: repository, isActive, limit, offset) |
| POST | `/custom-rules` | JWT | Criar custom rule (body: name, content, repository?, teamId?) |
| GET | `/custom-rules/:id` | JWT | Obter rule por ID |
| PUT | `/custom-rules/:id` | JWT | Atualizar rule (body: name?, content?, repository?, isActive?) |
| DELETE | `/custom-rules/:id` | JWT | Deletar rule |

**Funcionalidades:**
- Rules podem ser globais (repository=null) ou específicas por repositório
- Worker busca automaticamente a rule mais específica (repo > global > default)
- Suporte a team rules (se teamId fornecido)
- Validação com Zod schemas

### Billing [TODO]

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/billing/plans` | - | Listar planos disponíveis |
| POST | `/billing/checkout` | JWT | Criar Stripe checkout session |
| GET | `/billing/portal` | JWT | Link para customer portal (Stripe) |
| GET | `/billing/subscription` | JWT | Obter subscription atual |
| POST | `/billing/upgrade` | JWT | Upgrade de plano |
| POST | `/billing/cancel` | JWT | Cancelar subscription |
| GET | `/billing/usage` | JWT | Usage e overages |

### Webhooks [TODO]

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/webhooks/stripe` | Stripe Signature | Webhook do Stripe |
| POST | `/webhooks/github` | GitHub Secret | Webhook do GitHub |

### Admin [TODO]

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/admin/users` | Admin | Listar todos usuários |
| GET | `/admin/stats` | Admin | Stats gerais da plataforma |
| PUT | `/admin/users/:id/plan` | Admin | Alterar plano manualmente |
| DELETE | `/admin/users/:id` | Admin | Deletar usuário |

### Health & Info

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/health` | - | Health check (DB + Redis) |
| GET | `/` | - | API info e versão |

---

## 🗄️ Banco de Dados - Schema

### Tabela: `users`

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255), -- bcrypt hash (null se OAuth)
  plan VARCHAR(50) DEFAULT 'free', -- free, pro, business
  githubId VARCHAR(255), -- GitHub OAuth ID
  githubAccessToken TEXT, -- Encrypted token
  stripeCustomerId VARCHAR(255),
  stripeSubscriptionId VARCHAR(255),
  emailVerified BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Índices:**
- `email` (unique)
- `githubId`
- `stripeCustomerId`

---

### Tabela: `apiKeys`

```sql
CREATE TABLE apiKeys (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teamId INT REFERENCES teams(id) ON DELETE CASCADE, -- null se user key
  name VARCHAR(255) NOT NULL,
  key VARCHAR(255) UNIQUE NOT NULL, -- mik_[32chars]
  status VARCHAR(50) DEFAULT 'active', -- active, revoked
  lastUsedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

**Índices:**
- `key` (unique)
- `userId`
- `teamId`

---

### Tabela: `reviews`

```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repository VARCHAR(255) NOT NULL,
  prNumber INT NOT NULL,
  installationId BIGINT, -- GitHub App installation
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  summary TEXT,
  comments JSONB, -- [ { file, line, body } ]
  tokensUsed INT DEFAULT 0,
  processingTimeMs INT DEFAULT 0,
  error TEXT, -- Error message se failed
  createdAt TIMESTAMP DEFAULT NOW(),
  completedAt TIMESTAMP
);
```

**Índices:**
- `userId`
- `repository`
- `status`
- `createdAt`

**Exemplo `comments` JSONB:**
```json
[
  {
    "file": "src/app.ts",
    "line": 42,
    "body": "Critical: This function has a potential SQL injection vulnerability"
  }
]
```

---

### Tabela: `usageAnalytics`

```sql
CREATE TABLE usageAnalytics (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reviewsCount INT DEFAULT 0,
  tokensUsed INT DEFAULT 0,
  processingTimeMs INT DEFAULT 0,
  UNIQUE(userId, date)
);
```

**Índices:**
- `userId`
- `date`
- `(userId, date)` (unique composite)

---

### Tabela: `repositories` ✅ IMPLEMENTADO

```sql
CREATE TABLE repositories (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  github_repo_id INTEGER NOT NULL,
  full_name VARCHAR(255) NOT NULL, -- owner/repo-name
  name VARCHAR(255) NOT NULL,
  owner VARCHAR(255) NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false NOT NULL,
  is_enabled BOOLEAN DEFAULT true NOT NULL,
  default_branch VARCHAR(100) DEFAULT 'main',
  language VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**Índices:**
- `user_id`
- `full_name`
- `is_enabled`
- `(user_id, github_repo_id)` (unique composite - previne duplicatas)

**Relações:**
- Um usuário pode ter múltiplos repositórios sincronizados
- Cada repositório pertence a um único usuário
- Reviews só são criados para repositórios com `is_enabled: true`

---

### Tabela: `teams`

```sql
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  ownerId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) DEFAULT 'free',
  stripeCustomerId VARCHAR(255),
  stripeSubscriptionId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT NOW()
);
```

**Índices:**
- `ownerId`
- `stripeCustomerId`

---

### Tabela: `teamMembers`

```sql
CREATE TABLE teamMembers (
  id SERIAL PRIMARY KEY,
  teamId INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  userId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
  joinedAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(teamId, userId)
);
```

**Índices:**
- `teamId`
- `userId`
- `(teamId, userId)` (unique composite)

---

### Tabela: `customRules`

```sql
CREATE TABLE customRules (
  id SERIAL PRIMARY KEY,
  userId INT REFERENCES users(id) ON DELETE CASCADE, -- null se team rule
  teamId INT REFERENCES teams(id) ON DELETE CASCADE, -- null se user rule
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL, -- Markdown rules
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Índices:**
- `userId`
- `teamId`

---

### Tabela: `subscriptions`

```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  userId INT REFERENCES users(id) ON DELETE CASCADE,
  teamId INT REFERENCES teams(id) ON DELETE CASCADE,
  stripeSubscriptionId VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL, -- active, canceled, past_due
  currentPeriodStart TIMESTAMP,
  currentPeriodEnd TIMESTAMP,
  cancelAtPeriodEnd BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Índices:**
- `userId`
- `teamId`
- `stripeSubscriptionId` (unique)

---

## ⚙️ Configuração e Variáveis de Ambiente

### Backend (packages/api/.env)

```bash
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mik_review_ai

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Provider
DEEPSEEK_API_KEY=sk-...

# GitHub
GITHUB_APP_ID=123456 # Opcional para OAuth
GITHUB_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----... # Opcional
GITHUB_WEBHOOK_SECRET=your-webhook-secret # Opcional

# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend ou SendGrid)
EMAIL_PROVIDER=resend # resend | sendgrid
RESEND_API_KEY=re_...
SENDGRID_API_KEY=SG...
FROM_EMAIL=noreply@mikreview.ai

# Logging
LOG_LEVEL=info # debug | info | warn | error

# CORS
ALLOWED_ORIGINS=http://localhost:3001,https://mikreview.ai

# Rate Limiting (global)
GLOBAL_RATE_LIMIT=100 # requests per minute per IP
```

---

### Frontend (packages/dashboard/.env.local)

```bash
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# NextAuth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret-key

# GitHub OAuth
GITHUB_ID=Iv1.abcd1234
GITHUB_SECRET=your-github-client-secret

# Stripe (Public Key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Analytics (opcional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

### GitHub Action (packages/action/.env - não usar, só secrets)

```yaml
# Em GitHub Secrets
MIK_REVIEW_API_KEY: ${{ secrets.MIK_REVIEW_API_KEY }}
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # Auto-provido
```

---

## 🎯 Próximos Passos Críticos

### Prioridade Máxima (Semana 1-2)

1. **GitHub Comment Posting**
   - Implementar postagem de comentários no PR
   - Testar com PRs reais
   - **Impacto:** Feature principal funcional de ponta a ponta

2. **Error Handling**
   - Centralizar error handling
   - Logging adequado
   - Retry logic
   - **Impacto:** Estabilidade e debugabilidade

3. **Review Detail Page**
   - Frontend para visualizar reviews
   - Exibir diff e comentários
   - **Impacto:** Usuários podem ver resultados

4. **Custom Rules CRUD**
   - Endpoints backend
   - Integração no worker
   - **Impacto:** Customização por projeto

### Prioridade Alta (Semana 3-4)

5. **GitHub OAuth**
   - Backend + Frontend
   - Simplificar signup
   - **Impacto:** Melhor UX de onboarding

7. **Email Verification**
   - Prevenir spam
   - Validar emails
   - **Impacto:** Qualidade de usuários

8. **Tests (Críticos)**
   - Unit tests para services
   - Coverage >60%
   - **Impacto:** Confiança para deploy

### Prioridade Média (Mês 2)

9. **Stripe Integration**
   - Checkout + webhooks
   - Billing management
   - **Impacto:** Monetização

10. **Teams Management**
    - Backend + Frontend
    - Shared keys e rules
    - **Impacto:** Enterprise feature

11. **Charts & Analytics**
    - Visualizações com Recharts
    - Exportar reports
    - **Impacto:** Insights para usuários

12. **Docker + CI/CD**
    - Setup de deploy
    - Automation
    - **Impacto:** Produção-ready

---

## 📝 Notas Finais

### Decisões Arquiteturais

1. **Monorepo com pnpm workspaces**: Facilita compartilhamento de types e utils
2. **BullMQ para jobs**: Processamento assíncrono escalável
3. **Drizzle ORM**: Type-safe, performance, migrations SQL
4. **Fastify**: Mais rápido que Express, suporte nativo a async/await
5. **Next.js App Router**: SSR, RSC, melhor SEO
6. **shadcn/ui**: Components unstyled, totalmente customizáveis

### Trade-offs

- **JWT sem refresh token**: Simplicidade vs segurança (adicionar refresh em Fase 2)
- **localStorage auth**: Client-side vs server-side (migrar para NextAuth em Fase 2)
- **Redis rate limiting**: Performance vs distribuição (OK para MVP)
- **DeepSeek only**: Foco em custo-benefício e performance (MVP)

### Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| GitHub API rate limits | Alto | Implementar caching, usar GitHub Apps |
| DeepSeek API downtime | Médio | Retry logic, graceful degradation |
| Spam/abuse de reviews | Médio | Email verification, rate limiting |
| Custos de AI scaling | Alto | Monitoring de usage, alertas |
| Database performance | Médio | Índices, connection pooling, read replicas |

### Métricas de Sucesso

- [ ] 100% de reviews completam sem erro
- [ ] <15s avg processing time
- [ ] >95% uptime
- [ ] <500ms API response time (p95)
- [ ] >80% test coverage
- [ ] 0 security vulnerabilities (critical/high)

---

**Última atualização:** 2026-01-01
**Versão:** 1.0
**Autor:** Cristian Castro
