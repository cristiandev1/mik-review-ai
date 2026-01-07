# API as a Service - Implementation Plan

## Executive Summary

Transformar a infraestrutura existente em um produto API adicional, permitindo que empresas integrem code review AI em seus próprios produtos através de pay-as-you-go pricing.

## Modelo de Negócio

### Produtos Atuais vs Novo Produto

| Aspecto | SaaS (Atual) | API as a Service (Novo) |
|---------|--------------|-------------------------|
| **Target** | Usuários finais | Empresas/Desenvolvedores |
| **Interface** | Dashboard Web | API REST |
| **Pricing** | Mensal fixo ($5-$15/seat) | Pay-as-you-go |
| **Limites** | PRs por mês | Rate limit + metered |
| **Use Case** | Review direto no GitHub | Integração em produtos |

### Exemplos de Referência

- **OpenAI**: ChatGPT (SaaS) + API (pay-as-you-go)
- **Anthropic**: Claude.ai (SaaS) + API (pay-as-you-go por tokens)
- **Stripe**: Dashboard (SaaS) + API (% por transação)
- **Twilio**: API (pay-as-you-go por SMS/call)
- **SendGrid**: SaaS + API (pay-as-you-go por email)

---

## Pricing Strategy

### Opção 1: Por Review (Recomendado para MVP)

```
Free Tier:     $0/mês     - 100 reviews/mês
Startup:       $99/mês    + $0.10 por review adicional
Growth:        $499/mês   + $0.05 por review adicional (volume discount)
Enterprise:    Custom pricing com SLA dedicado
```

### Opção 2: Por Token (Modelo Anthropic/OpenAI)

```
$0.002 por 1K tokens consumidos
Desconto por volume:
  - 0-1M tokens: $0.002/1K
  - 1M-10M tokens: $0.0015/1K
  - 10M+ tokens: $0.001/1K
```

### Opção 3: Híbrido (Máxima Flexibilidade)

```
Base: $0.08 por review
+ $0.001 por 1K tokens consumidos
+ Rate limit baseado no tier
```

---

## Use Cases para Clientes API

1. **CI/CD Platforms**
   - Integrar code review no pipeline de deploy
   - Review automático em pull requests
   - Exemplo: GitLab CI, CircleCI, Jenkins

2. **IDEs & Extensions**
   - VS Code extension com AI review em tempo real
   - JetBrains plugin
   - Sublime Text plugin

3. **Code Management Tools**
   - Ferramentas internas de empresas
   - Code quality platforms
   - Security scanning tools

4. **DevOps Platforms**
   - Review automático antes de deploys
   - Quality gates em pipelines
   - Compliance checks

5. **Educational Platforms**
   - Review de código de estudantes
   - Feedback automático em exercícios
   - Plataformas de coding bootcamps

6. **Freelancer Platforms**
   - Review de código de freelancers
   - Quality assurance para clientes
   - Code escrow services

7. **White-label Solutions**
   - Empresas que querem oferecer AI code review
   - Revenda com marca própria
   - Integração em produtos SaaS existentes

---

## Technical Architecture

### 1. API Tiers & Limits

```typescript
export const API_TIERS = {
  free: {
    id: 'free',
    name: 'Free Developer',
    price: 0,
    limits: {
      reviewsPerMonth: 100,
      requestsPerMinute: 5,
      requestsPerHour: 100,
      concurrentRequests: 1,
    },
    pricing: {
      perReview: 0,
      perToken: 0,
    },
    features: {
      webhooks: false,
      priorityQueue: false,
      dedicatedSupport: false,
      sla: null,
    }
  },

  startup: {
    id: 'startup',
    name: 'Startup',
    price: 99, // base monthly fee
    limits: {
      reviewsPerMonth: 1000, // included
      requestsPerMinute: 50,
      requestsPerHour: 2000,
      concurrentRequests: 5,
    },
    pricing: {
      perReview: 0.10, // after included amount
      perToken: 0.002, // per 1K tokens
    },
    features: {
      webhooks: true,
      priorityQueue: false,
      dedicatedSupport: false,
      sla: '99.5% uptime',
    }
  },

  growth: {
    id: 'growth',
    name: 'Growth',
    price: 499,
    limits: {
      reviewsPerMonth: 10000, // included
      requestsPerMinute: 200,
      requestsPerHour: 10000,
      concurrentRequests: 20,
    },
    pricing: {
      perReview: 0.05, // volume discount
      perToken: 0.001,
    },
    features: {
      webhooks: true,
      priorityQueue: true,
      dedicatedSupport: true,
      sla: '99.9% uptime',
    }
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'custom',
    limits: {
      reviewsPerMonth: -1, // unlimited
      requestsPerMinute: 1000,
      requestsPerHour: -1,
      concurrentRequests: 100,
    },
    pricing: {
      perReview: 'custom',
      perToken: 'custom',
    },
    features: {
      webhooks: true,
      priorityQueue: true,
      dedicatedSupport: true,
      sla: '99.99% uptime',
      dedicatedInfra: true,
      customModels: true,
      onPremise: 'optional',
    }
  }
};
```

### 2. Database Schema Extensions

```sql
-- API Usage Tracking (detailed metering)
CREATE TABLE api_usage_tracking (
  id VARCHAR(36) PRIMARY KEY,
  api_key_id VARCHAR(36) REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,

  -- Metering
  reviews_count INTEGER DEFAULT 0,
  tokens_consumed INTEGER DEFAULT 0,
  requests_count INTEGER DEFAULT 0,

  -- Performance
  avg_response_time INTEGER, -- milliseconds
  error_count INTEGER DEFAULT 0,

  -- Billing period
  billing_month VARCHAR(7) NOT NULL, -- YYYY-MM
  billing_cycle_start TIMESTAMP,
  billing_cycle_end TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys extensions
ALTER TABLE api_keys ADD COLUMN tier VARCHAR(20) DEFAULT 'free'; -- free, startup, growth, enterprise
ALTER TABLE api_keys ADD COLUMN rate_limit_per_minute INTEGER DEFAULT 5;
ALTER TABLE api_keys ADD COLUMN rate_limit_per_hour INTEGER DEFAULT 100;
ALTER TABLE api_keys ADD COLUMN monthly_included_reviews INTEGER DEFAULT 100;
ALTER TABLE api_keys ADD COLUMN overage_rate DECIMAL(10,4) DEFAULT 0; -- price per additional review

-- API Billing (for invoicing)
CREATE TABLE api_billing (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  api_key_id VARCHAR(36) REFERENCES api_keys(id) ON DELETE SET NULL,

  -- Billing period
  billing_month VARCHAR(7) NOT NULL,
  billing_start TIMESTAMP NOT NULL,
  billing_end TIMESTAMP NOT NULL,

  -- Usage
  base_fee DECIMAL(10,2), -- monthly tier fee
  included_reviews INTEGER,
  total_reviews INTEGER,
  overage_reviews INTEGER, -- total_reviews - included_reviews

  -- Costs
  overage_cost DECIMAL(10,2), -- overage_reviews * overage_rate
  token_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),

  -- Stripe
  stripe_invoice_id VARCHAR(100),
  invoice_status VARCHAR(50), -- draft, open, paid, void
  invoice_url TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

-- API Request Logs (for debugging & analytics)
CREATE TABLE api_request_logs (
  id VARCHAR(36) PRIMARY KEY,
  api_key_id VARCHAR(36) REFERENCES api_keys(id) ON DELETE SET NULL,

  -- Request info
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  response_time INTEGER, -- milliseconds

  -- Usage
  review_id VARCHAR(36) REFERENCES reviews(id) ON DELETE SET NULL,
  tokens_used INTEGER,

  -- Client info
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Error tracking
  error_message TEXT,

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_api_key_created (api_key_id, created_at),
  INDEX idx_created_at (created_at)
);

-- Webhooks
CREATE TABLE api_webhooks (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  api_key_id VARCHAR(36) REFERENCES api_keys(id) ON DELETE CASCADE,

  -- Webhook config
  url TEXT NOT NULL,
  events JSON, -- ['review.completed', 'review.failed', 'usage.limit']
  secret VARCHAR(64), -- for signature validation
  is_active BOOLEAN DEFAULT TRUE,

  -- Stats
  last_triggered_at TIMESTAMP,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook Delivery Logs
CREATE TABLE webhook_delivery_logs (
  id VARCHAR(36) PRIMARY KEY,
  webhook_id VARCHAR(36) REFERENCES api_webhooks(id) ON DELETE CASCADE,

  event_type VARCHAR(50),
  payload JSON,

  -- Delivery
  status_code INTEGER,
  response_body TEXT,
  response_time INTEGER,
  success BOOLEAN,

  -- Retry
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. New API Endpoints

```
# API Key Management
POST   /api/v1/keys                    - Create new API key
GET    /api/v1/keys                    - List user's API keys
GET    /api/v1/keys/:id                - Get specific key details
PATCH  /api/v1/keys/:id                - Update key (name, rate limits)
DELETE /api/v1/keys/:id                - Delete/revoke key
POST   /api/v1/keys/:id/rotate         - Rotate key secret

# Usage & Billing
GET    /api/v1/usage                   - Get current month usage
GET    /api/v1/usage/history           - Get historical usage
GET    /api/v1/billing                 - Get billing info & invoices
GET    /api/v1/billing/current         - Current billing cycle
GET    /api/v1/billing/invoices/:id    - Specific invoice

# Webhooks
POST   /api/v1/webhooks                - Create webhook
GET    /api/v1/webhooks                - List webhooks
PATCH  /api/v1/webhooks/:id            - Update webhook
DELETE /api/v1/webhooks/:id            - Delete webhook
POST   /api/v1/webhooks/:id/test       - Test webhook delivery
GET    /api/v1/webhooks/:id/logs       - Webhook delivery logs

# API Review Endpoints (existing, might need enhancement)
POST   /api/v1/reviews                 - Create review (already exists)
GET    /api/v1/reviews/:id             - Get review status
GET    /api/v1/reviews                 - List reviews
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

#### ✅ Already Implemented
- [x] API Key system
- [x] Review API endpoint
- [x] Basic authentication

#### 🔨 To Implement

1. **Database Schema**
   - Add `api_usage_tracking` table
   - Add `api_billing` table
   - Add `api_request_logs` table
   - Extend `api_keys` table with tier fields

2. **API Tier System**
   - Create `API_TIERS` constant
   - Implement tier validation
   - Link API keys to tiers

3. **Usage Tracking Service**
   ```typescript
   class ApiUsageService {
     async trackRequest(apiKeyId, reviewId, tokensUsed)
     async getUsage(apiKeyId, month)
     async checkLimit(apiKeyId)
   }
   ```

4. **Rate Limiting (Enhanced)**
   - Per-minute rate limiting
   - Per-hour rate limiting
   - Concurrent request limiting
   - Different limits per tier

---

### Phase 2: Metering & Billing (Week 3-4)

1. **Stripe Metered Billing Integration**
   - Create Stripe products for API tiers
   - Report usage to Stripe
   - Handle subscription + usage-based charges
   - Automatic invoicing

2. **Billing Service**
   ```typescript
   class ApiBillingService {
     async calculateMonthlyBill(userId, month)
     async createInvoice(userId, month)
     async reportUsageToStripe(userId, usage)
   }
   ```

3. **Usage Alerts**
   - Alert at 80% of limit
   - Alert at 100% of limit
   - Email notifications
   - Webhook notifications

---

### Phase 3: Dashboard & UX (Week 5-6)

1. **API Dashboard Page**
   - `/dashboard/api` - Overview
   - API Key management
   - Usage graphs & metrics
   - Current billing cycle
   - Invoice history

2. **API Key Management UI**
   - Create/delete keys
   - View key details
   - Copy key securely
   - Rotate keys
   - Set permissions

3. **Usage Monitoring UI**
   - Real-time usage graphs
   - Request logs viewer
   - Error tracking
   - Performance metrics

4. **Billing UI**
   - Current cycle usage
   - Estimated cost
   - Invoice history
   - Payment method

---

### Phase 4: Documentation & Developer Experience (Week 7-8)

1. **API Documentation**
   - OpenAPI/Swagger spec
   - Interactive API explorer
   - Code examples (curl, Node.js, Python, Go)
   - Authentication guide
   - Rate limiting guide
   - Error handling guide

2. **Developer Portal**
   - Getting started guide
   - Quickstart tutorials
   - Use case examples
   - Best practices
   - Migration guides

3. **SDKs (Optional)**
   ```
   npm install @mik-review/sdk
   pip install mik-review
   ```

4. **Webhooks Documentation**
   - Event types
   - Payload schemas
   - Signature verification
   - Retry logic
   - Testing webhooks

---

### Phase 5: Webhooks & Advanced Features (Week 9-10)

1. **Webhook System**
   - Event emitter architecture
   - Webhook delivery queue
   - Retry logic (exponential backoff)
   - Signature validation
   - Delivery logs

2. **Webhook Events**
   ```typescript
   'review.created'
   'review.processing'
   'review.completed'
   'review.failed'
   'usage.limit_reached'
   'usage.limit_warning'
   'billing.invoice_created'
   'billing.payment_succeeded'
   'billing.payment_failed'
   ```

3. **Priority Queue**
   - Separate queue for paid tiers
   - Faster processing for premium users
   - SLA enforcement

---

### Phase 6: Enterprise Features (Week 11-12)

1. **Custom Models**
   - Allow enterprise to use specific AI models
   - Fine-tuned models for their codebase
   - Custom rules per API key

2. **Dedicated Infrastructure**
   - Isolated processing
   - Dedicated rate limits
   - Custom SLA

3. **White-label Options**
   - Custom branding in responses
   - Custom domain support
   - Reseller program

4. **Advanced Security**
   - IP whitelisting
   - OAuth2 for API keys
   - Audit logs
   - SOC2 compliance

---

## Revenue Projections

### Scenario: Conservative Growth

| Month | Free Users | Startup ($99) | Growth ($499) | Enterprise | MRR |
|-------|-----------|---------------|---------------|-----------|-----|
| 1 | 50 | 5 | 0 | 0 | $495 |
| 3 | 200 | 20 | 2 | 0 | $2,980 |
| 6 | 500 | 50 | 10 | 1 | $11,940 |
| 12 | 1000 | 100 | 25 | 3 | $27,425 |

**Year 1 ARR**: ~$330K (apenas API)

### Assumptions
- 10% conversion from free to paid
- 20% of paid upgrade to growth
- Average overage: $50/month per customer
- 1 enterprise deal every 3 months

---

## Go-to-Market Strategy

### 1. Developer Marketing

- **Technical Blog Posts**
  - "Building AI Code Review into your CI/CD"
  - "How to integrate AI code review in 5 minutes"
  - Use case tutorials

- **Open Source**
  - CLI tool open source
  - SDK libraries open source
  - Example integrations open source

- **Developer Community**
  - Discord/Slack community
  - Twitter/X presence
  - Dev.to articles
  - HackerNews launches

### 2. Partnerships

- **CI/CD Platforms**
  - GitHub Actions marketplace
  - GitLab integrations
  - CircleCI orbs
  - Jenkins plugins

- **IDE Extensions**
  - VS Code marketplace
  - JetBrains marketplace

- **DevOps Tools**
  - Integration with Sentry
  - Integration with Datadog
  - Integration with PagerDuty

### 3. Content Marketing

- **Documentation First**
  - Excellent docs = less support cost
  - Interactive examples
  - Video tutorials

- **Use Case Studies**
  - Success stories from beta users
  - Performance metrics
  - ROI calculations

### 4. Pricing Page

- **Clear Value Prop**
  - "AI Code Review API - Pay only for what you use"
  - Cost calculator
  - Live demo

- **Free Tier**
  - 100 reviews/month free forever
  - No credit card required
  - Instant signup

---

## Success Metrics

### Technical Metrics
- API uptime %
- Average response time
- Error rate
- P99 latency

### Business Metrics
- Free to paid conversion rate
- Average revenue per user (ARPU)
- Customer acquisition cost (CAC)
- Lifetime value (LTV)
- Monthly recurring revenue (MRR)
- Churn rate

### User Metrics
- API keys created
- Active API keys
- Requests per month
- Reviews per month
- Webhook deliveries

---

## Risk Assessment

### Technical Risks

1. **Rate Limiting Bypass**
   - Mitigation: IP-based + API key-based rate limiting
   - DDoS protection
   - Suspicious activity detection

2. **Cost Overruns**
   - Mitigation: Hard limits on free tier
   - Automatic pausing at limits
   - Real-time cost monitoring

3. **Performance Issues**
   - Mitigation: Auto-scaling infrastructure
   - Queue system for reviews
   - Caching layer

### Business Risks

1. **Low Conversion Rate**
   - Mitigation: Excellent docs + support
   - Free tier generous enough to test
   - Clear value proposition

2. **High Support Costs**
   - Mitigation: Self-service dashboard
   - Comprehensive documentation
   - Community forum

3. **Competitor Entry**
   - Mitigation: First-mover advantage
   - Strong documentation
   - Unique features (webhooks, custom models)

---

## Next Steps

1. **Validate Demand**
   - Survey existing users about API interest
   - Beta program with 5-10 companies
   - Collect feedback on pricing

2. **Build MVP (Phase 1-2)**
   - Focus on core metering & billing
   - Simple dashboard
   - Basic documentation

3. **Beta Launch**
   - Invite 10-20 beta users
   - Gather feedback
   - Iterate quickly

4. **Public Launch**
   - ProductHunt launch
   - HackerNews Show HN
   - Technical blog post
   - Social media campaign

5. **Scale**
   - Add enterprise features
   - Build partnerships
   - Expand documentation
   - Grow community

---

## Conclusion

O modelo API as a Service é altamente viável e complementa perfeitamente o produto SaaS atual. Com a infraestrutura já existente, o MVP pode ser construído em 4-6 semanas.

**Principais Vantagens:**
- Abre novo mercado B2B2C
- Receita adicional significativa
- Baixo custo marginal (mesma infraestrutura)
- Efeito viral através de integrações

**Recomendação:**
Começar com Phase 1-2 (metering + billing básico) e fazer beta com 5-10 empresas para validar antes de investir em todas as features.
