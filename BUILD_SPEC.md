# ScoreFlow — Complete Build Specification

> **Instructions for Cursor:** This is a complete specification for a multi-tenant SaaS called ScoreFlow. Build it phase by phase in the exact order listed. Do not skip phases. Do not build multiple phases at once. After each phase, stop and verify before moving on. Use TypeScript strict mode throughout. Never compromise on multi-tenancy security.

---

## 1. Product Overview

ScoreFlow is a white-label review collection SaaS sold to **digital marketing agencies**, who resell it to their **business clients** (restaurants, salons, clinics, etc.).

### User hierarchy (3 tiers)
1. **Platform Owner (me)** — sees all agencies, platform analytics, system status
2. **Agency** — white-labeled account, manages multiple business clients, their own branding
3. **Business** — a single client of an agency (e.g., "NOBU Restaurant Group") with one or more locations

### Core flow
1. Customer scans NFC tag at a business location
2. Opens branded review page (branded as the agency's product, referencing the business)
3. Customer optionally enters order number → AI fetches/generates order context
4. Customer rates 0–10 (NPS-style)
5. AI generates 3 personalized review suggestions based on order + rating
6. Customer submits — feedback stored internally
7. **All customers** are shown links to Google/TripAdvisor (this is the critical legal fix — see Section 9)
8. Unhappy customers get an additional service-recovery path

### Revenue model
- Agencies pay ScoreFlow monthly subscription (tiered by number of client businesses)
- NFC tags sold as one-time purchase add-on (~$8/tag, costs us ~$0.50)
- Optional: API access tier for larger agencies

---

## 2. Tech Stack (Final Decisions — Do Not Change)

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js 15 (App Router) | SSR + API routes + middleware for subdomain routing |
| Language | TypeScript (strict mode) | Type safety for multi-tenant isolation |
| Styling | Tailwind CSS v4 + shadcn/ui | Matches existing prototype aesthetic |
| Database | Supabase (Postgres) | Built-in auth + RLS for multi-tenancy |
| Auth | Supabase Auth | Magic links + password, handles sessions |
| ORM | Drizzle ORM | Type-safe, Postgres-native, works with Supabase |
| Payments | Stripe (Checkout + Customer Portal + Webhooks) | Industry standard |
| Email | Resend | Clean API, React Email templates |
| AI | Google Gemini API (gemini-2.5-flash) | Best for nuanced review generation |
| Charts | Recharts | Matches existing prototype |
| Hosting | Vercel (Next.js) + Supabase Cloud | Zero-config deploy |
| File Storage | Supabase Storage | For agency logos, business photos |
| Analytics | PostHog (free tier) | Product analytics + feature flags |
| Error tracking | Sentry (free tier) | Catch production bugs |

### Do NOT use
- ❌ Prisma (Drizzle is faster and simpler with Supabase)
- ❌ NextAuth (Supabase Auth is already included)
- ❌ Custom email SMTP (use Resend)
- ❌ Client-side Firebase/Firestore (incompatible with Postgres RLS model)
- ❌ SQLite (no multi-tenancy)

---

## 3. Complete File Structure

```
scoreflow/
├── .env.local
├── .env.example
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── middleware.ts                          # Subdomain routing + auth
├── src/
│   ├── app/
│   │   ├── (marketing)/                   # Public marketing site (scoreflow.com)
│   │   │   ├── page.tsx                   # Landing page
│   │   │   ├── pricing/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (auth)/                        # Auth pages
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (platform)/                    # Platform owner portal (admin.scoreflow.com)
│   │   │   ├── overview/page.tsx
│   │   │   ├── agencies/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── system/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (agency)/                      # Agency portal (dashboard.{agency-subdomain}.scoreflow.com)
│   │   │   ├── overview/page.tsx
│   │   │   ├── businesses/page.tsx
│   │   │   ├── businesses/[id]/page.tsx
│   │   │   ├── businesses/new/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   ├── branding/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (business)/                    # Business owner portal
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── locations/page.tsx
│   │   │   ├── nfc/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── r/                             # Public review capture flow
│   │   │   └── [locationSlug]/page.tsx    # e.g., /r/nobu-london
│   │   │
│   │   └── api/
│   │       ├── ai/
│   │       │   └── suggestions/route.ts   # Gemini API for review suggestions
│   │       ├── reviews/
│   │       │   ├── submit/route.ts
│   │       │   └── [id]/route.ts
│   │       ├── stripe/
│   │       │   ├── checkout/route.ts
│   │       │   ├── portal/route.ts
│   │       │   └── webhook/route.ts
│   │       ├── pos/
│   │       │   └── square/
│   │       │       ├── connect/route.ts
│   │       │       ├── callback/route.ts
│   │       │       └── lookup-order/route.ts
│   │       └── nfc/
│   │           └── generate/route.ts
│   │
│   ├── components/
│   │   ├── ui/                            # shadcn/ui components
│   │   ├── platform/                      # Platform admin components
│   │   ├── agency/                        # Agency portal components
│   │   ├── business/                      # Business owner components
│   │   ├── review-flow/                   # Customer-facing review components
│   │   └── shared/
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts                   # Drizzle client
│   │   │   ├── schema.ts                  # All tables
│   │   │   └── migrations/
│   │   ├── supabase/
│   │   │   ├── client.ts                  # Browser client
│   │   │   ├── server.ts                  # Server client
│   │   │   └── middleware.ts
│   │   ├── stripe/
│   │   │   ├── client.ts
│   │   │   └── plans.ts
│   │   ├── ai/
│   │   │   ├── gemini.ts
│   │   │   └── prompts.ts
│   │   ├── email/
│   │   │   ├── resend.ts
│   │   │   └── templates/
│   │   ├── auth/
│   │   │   ├── permissions.ts             # RBAC helpers
│   │   │   └── context.ts
│   │   ├── tenant/
│   │   │   └── resolver.ts                # Resolve subdomain → agency
│   │   └── utils.ts
│   │
│   ├── types/
│   │   ├── database.ts
│   │   └── index.ts
│   │
│   └── emails/                            # React Email templates
│       ├── welcome-agency.tsx
│       ├── new-review-alert.tsx
│       └── follow-up-review.tsx
│
└── public/
    └── assets/
```

---

## 4. Database Schema (Drizzle + Postgres)

This is the single most important section. Multi-tenancy correctness lives here. **Every query must filter by tenant.**

```typescript
// src/lib/db/schema.ts

import {
  pgTable, uuid, text, timestamp, integer, boolean, jsonb,
  pgEnum, decimal, unique, index
} from 'drizzle-orm/pg-core';

// ============ ENUMS ============
export const userRoleEnum = pgEnum('user_role', [
  'platform_admin',      // Me — sees everything
  'agency_owner',        // Agency owner — manages their agency
  'agency_staff',        // Agency employee
  'business_owner',      // Owns one or more businesses under an agency
  'business_manager'     // Manages one location under a business
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trial', 'active', 'past_due', 'canceled', 'paused'
]);

export const reviewSentimentEnum = pgEnum('review_sentiment', [
  'positive', 'neutral', 'negative'
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'pending', 'submitted', 'responded', 'flagged', 'archived'
]);

export const externalPlatformEnum = pgEnum('external_platform', [
  'google', 'tripadvisor', 'yelp', 'facebook', 'trustpilot'
]);

// ============ AGENCIES ============
// Top-level tenant. Everything else belongs to an agency.
export const agencies = pgTable('agencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),         // Used for subdomain: {slug}.scoreflow.com
  customDomain: text('custom_domain').unique(),  // Optional: agency.com
  
  // Branding (white-label)
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#6366f1'),
  accentColor: text('accent_color').default('#14b8a6'),
  emailFromName: text('email_from_name'),
  emailFromAddress: text('email_from_address'),
  
  // Contact
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone'),
  
  // Billing (Stripe)
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('trial'),
  subscriptionTier: text('subscription_tier').default('starter'), // starter | pro | agency
  maxBusinesses: integer('max_businesses').default(5),
  trialEndsAt: timestamp('trial_ends_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  slugIdx: index('agencies_slug_idx').on(t.slug),
}));

// ============ USERS ============
// Supabase Auth handles auth; this extends it with app-level data.
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),                   // Matches Supabase auth.users.id
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull(),
  
  // Tenant assignment (nullable because platform_admin has no agency)
  agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'cascade' }),
  
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  agencyIdx: index('users_agency_idx').on(t.agencyId),
  emailIdx: index('users_email_idx').on(t.email),
}));

// ============ BUSINESSES ============
// A business is a client of an agency. e.g., "NOBU Restaurant Group"
export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'cascade' }).notNull(),
  
  name: text('name').notNull(),
  slug: text('slug').notNull(),                  // Unique within agency
  industry: text('industry'),                    // restaurant, salon, dental, etc.
  
  // Branding (for review page — overrides agency branding)
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color'),
  
  // Contact
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  
  // Google Business Profile link
  googleBusinessUrl: text('google_business_url'),
  tripadvisorUrl: text('tripadvisor_url'),
  yelpUrl: text('yelp_url'),
  
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  agencyBusinessUnique: unique().on(t.agencyId, t.slug),
  agencyIdx: index('businesses_agency_idx').on(t.agencyId),
}));

// ============ LOCATIONS ============
// A location is a physical place. A business can have many.
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'cascade' }).notNull(), // Denormalized for RLS
  
  name: text('name').notNull(),                  // e.g., "NOBU London"
  slug: text('slug').notNull(),                  // Used in review URL: /r/{slug}
  
  addressLine1: text('address_line_1'),
  addressLine2: text('address_line_2'),
  city: text('city'),
  region: text('region'),
  postalCode: text('postal_code'),
  country: text('country'),
  
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  
  // Location-specific review platform links (override business-level)
  googleBusinessUrl: text('google_business_url'),
  tripadvisorUrl: text('tripadvisor_url'),
  yelpUrl: text('yelp_url'),
  
  // POS integration (per location)
  posProvider: text('pos_provider'),             // square, toast, clover, lightspeed, null
  posAccessToken: text('pos_access_token'),      // Encrypted
  posLocationId: text('pos_location_id'),
  
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  slugIdx: index('locations_slug_idx').on(t.slug),
  businessIdx: index('locations_business_idx').on(t.businessId),
  agencyIdx: index('locations_agency_idx').on(t.agencyId),
  globalSlugUnique: unique().on(t.slug),         // Slugs are globally unique for clean URLs
}));

// ============ NFC TAGS ============
export const nfcTags = pgTable('nfc_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'cascade' }).notNull(),
  
  tagCode: text('tag_code').notNull().unique(),  // Short code in URL: /r/{slug}?t={tagCode}
  label: text('label'),                          // e.g., "Table 5", "Front door"
  
  scanCount: integer('scan_count').default(0),
  lastScannedAt: timestamp('last_scanned_at'),
  
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============ REVIEWS ============
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'cascade' }).notNull(),
  
  // Review content
  rating: integer('rating').notNull(),           // 0–10 NPS
  sentiment: reviewSentimentEnum('sentiment').notNull(),
  feedbackText: text('feedback_text'),
  tags: text('tags').array(),                    // ['food', 'service', 'ambience']
  
  // Order context
  orderNumber: text('order_number'),
  orderItems: jsonb('order_items'),              // [{ name, qty, price }]
  orderLookupSuccess: boolean('order_lookup_success').default(false),
  
  // AI-generated suggestions shown to user (for analysis)
  aiSuggestionsShown: jsonb('ai_suggestions_shown'),
  aiSuggestionChosen: text('ai_suggestion_chosen'),
  
  // External redirect tracking
  redirectedTo: externalPlatformEnum('redirected_to'),
  redirectedAt: timestamp('redirected_at'),
  
  // Service recovery (for unhappy customers)
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  wantsFollowUp: boolean('wants_follow_up').default(false),
  followedUpAt: timestamp('followed_up_at'),
  
  // Response from business
  responseText: text('response_text'),
  respondedBy: uuid('responded_by').references(() => users.id),
  respondedAt: timestamp('responded_at'),
  
  // NFC tag that was scanned
  nfcTagId: uuid('nfc_tag_id').references(() => nfcTags.id),
  
  // Metadata
  userAgent: text('user_agent'),
  ipHash: text('ip_hash'),                       // Hashed IP for fraud detection
  
  status: reviewStatusEnum('status').default('submitted'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  agencyIdx: index('reviews_agency_idx').on(t.agencyId),
  businessIdx: index('reviews_business_idx').on(t.businessId),
  locationIdx: index('reviews_location_idx').on(t.locationId),
  createdIdx: index('reviews_created_idx').on(t.createdAt),
  sentimentIdx: index('reviews_sentiment_idx').on(t.sentiment),
}));

// ============ SUBSCRIPTION PLANS ============
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),                  // starter, pro, agency
  displayName: text('display_name').notNull(),
  stripePriceId: text('stripe_price_id').notNull(),
  monthlyPrice: integer('monthly_price').notNull(), // Cents
  maxBusinesses: integer('max_businesses').notNull(),
  maxLocationsPerBusiness: integer('max_locations_per_business').notNull(),
  maxReviewsPerMonth: integer('max_reviews_per_month'), // null = unlimited
  features: jsonb('features'),                   // { aiSuggestions: true, customDomain: true, ... }
  isActive: boolean('is_active').default(true),
});

// ============ AUDIT LOG ============
// Track sensitive actions for compliance
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  agencyIdx: index('audit_logs_agency_idx').on(t.agencyId),
  createdIdx: index('audit_logs_created_idx').on(t.createdAt),
}));
```

### Row-Level Security (RLS) — CRITICAL

Supabase RLS policies must be written for every table. These enforce tenant isolation at the database level so that even if application code has bugs, data never leaks across agencies.

```sql
-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_tags ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's agency
CREATE OR REPLACE FUNCTION auth.agency_id() RETURNS uuid AS $$
  SELECT agency_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.user_role() RETURNS text AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE;

-- Agencies: platform admin sees all, agency users see only their own
CREATE POLICY "agencies_select" ON agencies
  FOR SELECT USING (
    auth.user_role() = 'platform_admin' OR id = auth.agency_id()
  );

-- Businesses: scoped to agency
CREATE POLICY "businesses_all" ON businesses
  FOR ALL USING (
    auth.user_role() = 'platform_admin' OR agency_id = auth.agency_id()
  );

-- Locations: scoped to agency
CREATE POLICY "locations_all" ON locations
  FOR ALL USING (
    auth.user_role() = 'platform_admin' OR agency_id = auth.agency_id()
  );

-- Reviews: scoped to agency (business/location users see their subset via app logic)
CREATE POLICY "reviews_all" ON reviews
  FOR ALL USING (
    auth.user_role() = 'platform_admin' OR agency_id = auth.agency_id()
  );

-- Public review submission: anonymous users can INSERT into reviews
-- (but not read others)
CREATE POLICY "reviews_public_insert" ON reviews
  FOR INSERT WITH CHECK (true);
```

---

## 5. Build Phases — Execute In Order

### Phase 0 — Project Setup (Day 1, ~2 hours)

1. `npx create-next-app@latest scoreflow --typescript --tailwind --app --src-dir --import-alias="@/*"`
2. Install core deps:
   ```bash
   npm install @supabase/supabase-js @supabase/ssr drizzle-orm postgres
   npm install stripe @stripe/stripe-js resend @google/generative-ai
   npm install recharts lucide-react date-fns zod react-hook-form @hookform/resolvers
   npm install -D drizzle-kit @types/node
   ```
3. Set up shadcn/ui: `npx shadcn@latest init`
4. Add initial components: `npx shadcn@latest add button input card dialog form select toast`
5. Create `.env.local` with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   DATABASE_URL=
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   RESEND_API_KEY=
   GEMINI_API_KEY=
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_ROOT_DOMAIN=scoreflow.com
   ```
6. Create Supabase project, get keys, run initial migration
7. Verify dev server runs and you can hit Supabase from it

**Stop point:** `npm run dev` loads a blank Next.js page and you can query Supabase.

### Phase 1 — Database & Auth (Days 2–3)

1. Implement complete schema from Section 4 in `src/lib/db/schema.ts`
2. Set up Drizzle migrations: `npx drizzle-kit generate` + push to Supabase
3. Write RLS policies (Section 4) and apply them via Supabase SQL editor
4. Create Supabase client wrappers in `src/lib/supabase/` (client, server, middleware)
5. Build auth pages: `/login`, `/signup`, `/forgot-password`
6. Implement middleware that:
   - Checks if request is on root domain → marketing site
   - Checks if subdomain matches an agency → agency portal
   - Checks if subdomain is `admin` → platform portal
   - Validates session on protected routes
7. Create a Supabase trigger `handle_new_user()` that auto-inserts into `public.users` when a Supabase auth user is created. The trigger must:
  - Copy `id` from `auth.users.id`
  - Copy `email` from `auth.users.email`
  - Read `role` and `agency_id` from `auth.users.raw_user_meta_data` (set during signup)
  - Default `role` to NULL if not provided (will be set by invitation flow)
  - Run as `SECURITY DEFINER` to bypass RLS during the insert

**Stop point:** You can sign up, log in, log out. Database queries filter by agency via RLS.

### Phase 2 — Platform Admin Portal (Days 4–5)

1. Build `(platform)` route group at `admin.scoreflow.com`
2. Recreate your existing Platform Overview dashboard (Image 2)
3. Build Agency management page — CRUD for agencies
4. Add "Create Agency" flow that:
   - Creates agency record
   - Creates agency owner user
   - Sends welcome email via Resend
   - Starts 14-day trial
5. Build Platform Analytics page (Image 4)
6. Build System Status page (Image 5)

**Stop point:** You can create agencies from the platform admin panel. Each agency gets its own subdomain.

### Phase 3 — Agency Portal (Days 6–9)

1. Build `(agency)` route group — resolves agency from subdomain via middleware
2. Agency Overview dashboard showing: total businesses, total reviews, MRR contribution
3. Businesses & Locations page (recreate Image 3 — but scoped to their agency only)
4. "Add Business" flow — creates business + initial location
5. "Add Location" flow — generates unique slug + NFC tag codes
6. Agency Analytics page
7. **Branding page** — upload logo, pick colors, set custom domain
8. **Billing page** — connect to Stripe Customer Portal
9. Settings page — invite staff members

**Stop point:** An agency can log in, create businesses, and see everything scoped to them.

### Phase 4 — Business Dashboard (Days 10–11)

1. Build `(business)` route group — for business owners to view their own data
2. Recreate Overview dashboard (Image 1)
3. Recreate Hub Dashboard for multi-location businesses (Image 8)
4. Reviews list page with filters (positive/neutral/negative, date range, location)
5. NFC Link Manager modal (Image 9) — show URLs per location
6. Individual location dashboard

**Stop point:** Business owners can see their data, filtered/scoped appropriately.

### Phase 5 — Public Review Flow (Days 12–14)

This is the customer-facing mobile page. Most important UX piece.

1. Route: `/r/[locationSlug]` — no auth required
2. Resolve location → agency → load branding
3. Multi-step flow:
   - Step 1: Order number input (optional) + rating (0–10)
   - Step 2: AI-generated review suggestions (rate-limited)
   - Step 3: Submit screen + **redirect to Google/TripAdvisor (ALL users)**
4. Implement the **legal review-gating redesign** (Section 9)
5. Mobile-first design matching Image 10–13

**Stop point:** You can scan a test NFC URL and complete the full review flow.

### Phase 6 — AI Integration (Day 15)

1. `src/lib/ai/gemini.ts` — Google Generative AI SDK wrapper
2. `src/lib/ai/prompts.ts` — prompt templates
3. API route `/api/ai/suggestions`:
   - Input: rating, order items (if available), business context, language
   - Output: 3 personalized review suggestions
   - Rate limit: 10 requests per IP per hour (Upstash Redis or in-memory)
4. Cost monitoring — log every call with token count
5. Cache common suggestions (same rating + similar order) for 24h

**Example prompt structure:**
```typescript
const prompt = `You are helping a customer write a genuine review for ${businessName}, a ${industry}.

The customer rated their experience ${rating}/10.
${orderItems ? `They ordered: ${orderItems.map(i => i.name).join(', ')}.` : ''}

Generate exactly 3 short, authentic review suggestions (max 25 words each) that reflect their experience level.
- If rating 9-10: enthusiastic, specific praise
- If rating 7-8: positive with mild nuance
- If rating 5-6: balanced, mentions what was okay and what wasn't
- If rating 0-4: constructive, not hostile

Return JSON only: {"suggestions": ["...", "...", "..."]}`;
```

**Stop point:** Review flow shows dynamic AI suggestions.

### Phase 7 — Stripe Billing (Days 16–17)

1. Create products/prices in Stripe dashboard (Starter $99, Pro $249, Agency $499)
2. `POST /api/stripe/checkout` — create Checkout Session for new agency
3. `POST /api/stripe/portal` — Customer Portal session for existing
4. `POST /api/stripe/webhook` — handle:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - Update `agencies.subscriptionStatus` accordingly
5. Enforce limits — block new business creation when over `maxBusinesses`
6. 14-day trial auto-conversion

**Stop point:** Agencies can upgrade, downgrade, cancel via Stripe.

### Phase 8 — Email & Notifications (Day 18)

1. React Email templates:
   - `welcome-agency.tsx` — sent on agency creation
   - `new-review-alert.tsx` — sent to business when new review comes in
   - `service-recovery.tsx` — sent to customer who had bad experience
   - `weekly-digest.tsx` — agency weekly summary
2. Resend integration in `src/lib/email/resend.ts`
3. Trigger: on `review.created`, send email if rating ≤ 6 to business owner

**Stop point:** Emails actually arrive in inboxes.

### Phase 9 — Square POS Integration (Days 19–20)

Start with Square only. Add others later.

1. OAuth flow: `/api/pos/square/connect` → Square OAuth → `/api/pos/square/callback`
2. Store encrypted access token in `locations.pos_access_token`
3. `/api/pos/square/lookup-order?orderId=X` — fetch real order from Square
4. Graceful fallback when POS not connected

**Stop point:** Order lookup works when Square is connected.

### Phase 10 — Polish & Launch Prep (Days 21–25)

1. Add error tracking (Sentry)
2. Add product analytics (PostHog)
3. Write marketing landing page (pricing, features, demo video)
4. SEO — sitemap, robots.txt, OG images
5. Legal pages — Terms, Privacy (use Termly or similar)
6. Set up production Supabase, Stripe (live keys), Vercel deploy
7. DNS — configure wildcard subdomains `*.scoreflow.com`
8. End-to-end manual test of entire agency signup flow

**Stop point:** Production deployment works. You can sign up a test agency end-to-end.

---

## 6. White-Label Subdomain Architecture

This is the most technically interesting part.

### How it works

- **`scoreflow.com`** → marketing site
- **`admin.scoreflow.com`** → platform admin portal (you)
- **`{agency-slug}.scoreflow.com`** → agency portal (e.g., `dhakadigital.scoreflow.com`)
- **`{custom-domain.com}`** → agency portal via custom domain (requires them to CNAME)

### Implementation

```typescript
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabaseResponse } = await updateSession(request);
  const hostname = request.headers.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;
  const url = request.nextUrl.clone();

  // Strip port in dev
  const cleanHostname = hostname.split(':')[0];

  // Root domain → marketing
  if (cleanHostname === rootDomain || cleanHostname === `www.${rootDomain}`) {
    url.pathname = `/(marketing)${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // admin.scoreflow.com → platform portal
  if (cleanHostname === `admin.${rootDomain}`) {
    url.pathname = `/(platform)${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Subdomain or custom domain → agency portal
  const subdomain = cleanHostname.replace(`.${rootDomain}`, '');
  
  // Look up agency by subdomain or custom domain
  const agency = await resolveAgency(cleanHostname, subdomain);
  
  if (!agency) {
    return NextResponse.redirect(new URL('/', `https://${rootDomain}`));
  }

  // Set agency in headers so pages can access it
  supabaseResponse.headers.set('x-agency-id', agency.id);
  supabaseResponse.headers.set('x-agency-slug', agency.slug);
  
  url.pathname = `/(agency)${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

### Custom domain flow
1. Agency enters `reviews.theiragency.com` in their branding settings
2. System generates verification TXT record
3. Agency adds TXT record to their DNS
4. System verifies ownership
5. Agency adds CNAME: `reviews.theiragency.com → cname.vercel-dns.com`
6. Vercel auto-issues SSL cert
7. Requests to their custom domain resolve to agency portal

---

## 7. Review Flow Rate Limiting & Fraud Prevention

Without this, a competitor or troll can flood a restaurant with fake reviews.

1. **IP rate limit**: Max 3 submissions per IP per hour per location (Upstash Redis)
2. **Device fingerprint**: Use FingerprintJS free tier to detect same device
3. **NFC validation**: Review URL must include valid `?t={tagCode}` parameter tied to a location's physical NFC tag
4. **Turnstile/hCaptcha**: Add invisible challenge if rate limit triggers
5. **Review age**: Flag submissions < 10 seconds after page load (bots)
6. **Agency-level moderation**: Allow agencies to flag + hide suspicious reviews

---

## 8. AI Cost Management

Gemini API costs money per call. At scale this adds up.

- Cache suggestions by (rating tier, industry, order hash) for 24 hours
- Only generate suggestions if user enters text area (save the call if they skip)
- Budget per agency per month — if exceeded, fall back to static suggestions
- Log every call with: tokens in, tokens out, cost, agencyId
- Monthly report per agency shows AI usage

Budget estimate:
- gemini-2.5-flash pricing: ~$0.30 per million input tokens, ~$2.50 per million output
- Average call: 500 input + 200 output tokens = ~$0.00065 per suggestion
- 10,000 reviews/month across all agencies = ~$6.50/month
- Pass this cost via usage-based add-on in Pro tier

---

## 9. CRITICAL: Legal Review-Gating Redesign

Your original flow filtered happy customers to Google and hid unhappy ones. This violates Google's review policies and FTC guidelines. Here is the compliant redesign.

### The rule
> **You must ask ALL customers for public reviews equally. You cannot filter by sentiment.**

### The compliant flow

**Step 1 — Rating (all customers):**
Customer rates 0–10. This is internal feedback, not a review yet.

**Step 2 — If rating ≥ 7 (happy):**
"Glad you enjoyed it! Would you share your experience publicly?"
→ Show Google, TripAdvisor, Yelp links
→ AI suggestions help them write faster

**Step 3 — If rating ≤ 6 (unhappy):**
"We're sorry that didn't meet expectations. We'd like to make this right."
→ Ask for optional contact info for service recovery
→ **THEN also show**: "We'd still value a public review — your honest feedback helps us improve"
→ Same Google/TripAdvisor links shown
→ Do not hide or discourage them

### Why this works
- Every customer sees the same public review prompt
- Unhappy customers get an extra service-recovery step BEFORE the review ask
- Businesses can respond to concerns privately before a public review is posted
- The business is not "gating" — they're prioritizing service recovery

### Legal cover copy for the UI
> "Your feedback helps us improve. Every customer is invited to share their honest experience — positive or negative — on public review sites. Thank you for taking the time."

**Put this copy on the review page footer. It proves non-discriminatory intent.**

---

## 10. Security Checklist

Before launching, verify every item:

- [ ] All tables have RLS enabled
- [ ] RLS policies tested with SQL queries impersonating different users
- [ ] All API routes validate session + role before any database operation
- [ ] Supabase service role key NEVER exposed to client
- [ ] All user inputs validated with Zod schemas
- [ ] SQL injection impossible (Drizzle parameterizes)
- [ ] XSS prevented (React escapes by default; no `dangerouslySetInnerHTML`)
- [ ] CSRF: Next.js Server Actions have built-in CSRF protection
- [ ] Rate limits on auth endpoints (signup, login, password reset)
- [ ] Rate limits on public review submission endpoint
- [ ] POS access tokens encrypted at rest (use Supabase Vault or pgsodium)
- [ ] Stripe webhook signature verified
- [ ] Environment variables never logged
- [ ] HTTPS only in production (Vercel default)
- [ ] HSTS header set
- [ ] Content Security Policy configured
- [ ] Audit log writes on sensitive actions (agency creation, user role changes, data exports)

---

## 11. Subscription Tier Definitions

```typescript
// src/lib/stripe/plans.ts
export const PLANS = {
  starter: {
    name: 'Starter',
    stripePriceId: 'price_xxx',
    monthlyPrice: 9900, // cents = $99
    maxBusinesses: 5,
    maxLocationsPerBusiness: 3,
    maxReviewsPerMonth: 500,
    features: {
      aiSuggestions: true,
      customBranding: true,
      customDomain: false,
      posIntegration: false,
      apiAccess: false,
      whiteLabel: true,
      support: 'email',
    },
  },
  pro: {
    name: 'Pro',
    stripePriceId: 'price_yyy',
    monthlyPrice: 24900, // $249
    maxBusinesses: 20,
    maxLocationsPerBusiness: 10,
    maxReviewsPerMonth: 5000,
    features: {
      aiSuggestions: true,
      customBranding: true,
      customDomain: true,
      posIntegration: true,
      apiAccess: false,
      whiteLabel: true,
      support: 'priority-email',
    },
  },
  agency: {
    name: 'Agency',
    stripePriceId: 'price_zzz',
    monthlyPrice: 49900, // $499
    maxBusinesses: -1, // unlimited
    maxLocationsPerBusiness: -1,
    maxReviewsPerMonth: -1,
    features: {
      aiSuggestions: true,
      customBranding: true,
      customDomain: true,
      posIntegration: true,
      apiAccess: true,
      whiteLabel: true,
      support: 'priority-phone',
    },
  },
} as const;
```

---

## 12. Cursor Execution Rules

Cursor on auto mode tends to do too much at once. Add these rules to a `.cursorrules` file:

```
# ScoreFlow Cursor Rules

1. Work in ONE phase at a time. Never jump between phases. Confirm before moving to next phase.
2. Never skip RLS policies. Every new table needs policies before it's usable.
3. Always check the BUILD_SPEC.md before starting a new file.
4. TypeScript strict mode only. No `any` types except in clearly marked edge cases.
5. All database writes must verify tenant scope. Never trust client-supplied agencyId or businessId.
6. All API routes must validate inputs with Zod.
7. For public routes (no auth), add rate limiting.
8. When adding a new feature, update the schema first, then the API, then the UI.
9. Commit after each working sub-feature. Don't batch huge commits.
10. When unsure, ask before proceeding.

# Multi-tenancy invariants (NEVER violate)
- Platform admin users: agency_id IS NULL, role = 'platform_admin'
- All other users: agency_id IS NOT NULL
- All businesses, locations, reviews MUST have agency_id set
- Never query across agencies in a single request (except from platform admin role)
- Subdomain determines tenant; don't trust req body to determine tenant

# UI conventions
- Use shadcn/ui components. Don't rewrite.
- Use Tailwind utility classes. No CSS modules.
- All client components marked 'use client' explicitly
- All forms use react-hook-form + zod resolver
- Toast notifications via shadcn sonner
```

---

## 13. First Week — What To Do Monday Morning

Do these in order. Don't skip.

1. Create Supabase account + project
2. Create Stripe account (test mode)
3. Create Resend account
4. Create Google AI Studio account + get Gemini API key (https://aistudio.google.com/apikey)
5. Create GitHub repo, clone locally
6. Run Phase 0 setup
7. Paste this entire BUILD_SPEC.md into repo root
8. Create `.cursorrules` with the rules in Section 12
9. Open Cursor, enable auto mode, feed it this spec, and tell it: **"Start Phase 0. Stop when Phase 0 is complete. Do not proceed to Phase 1 without my confirmation."**
10. Verify Phase 0 works, then repeat for each phase

---

## 14. What To Do When Stuck

- If Cursor generates broken code: revert, give it a smaller chunk of the phase
- If RLS policies block a legitimate query: read the Supabase docs on `auth.uid()` and service_role key usage
- If subdomain routing breaks in dev: use `localhost.scoreflow.test` with `/etc/hosts` entries
- If Stripe webhooks don't fire locally: use Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)
- If Drizzle migrations drift: regenerate from introspection

---

## End of Specification

Build time estimate: **4–6 weeks full-time for a competent engineer using Cursor**

First paying agency target: **Week 8–10 after this spec is complete**
