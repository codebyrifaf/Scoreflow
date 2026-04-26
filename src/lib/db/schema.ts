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
export const agencies = pgTable('agencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),         // Used for subdomain: {slug}.scoreflow.com
  customDomain: text('custom_domain').unique(),  // Optional: agency.com
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#6366f1'),
  accentColor: text('accent_color').default('#14b8a6'),
  emailFromName: text('email_from_name'),
  emailFromAddress: text('email_from_address'),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone'),
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
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),                   // Matches Supabase auth.users.id
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull(),
  agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'cascade' }),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  agencyIdx: index('users_agency_idx').on(t.agencyId),
  emailIdx: index('users_email_idx').on(t.email),
}));

// ============ BUSINESSES ============
export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),                  // Unique within agency
  industry: text('industry'),                    // restaurant, salon, dental, etc.
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
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
  googleBusinessUrl: text('google_business_url'),
  tripadvisorUrl: text('tripadvisor_url'),
  yelpUrl: text('yelp_url'),
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
  rating: integer('rating').notNull(),           // 0–10 NPS
  sentiment: reviewSentimentEnum('sentiment').notNull(),
  feedbackText: text('feedback_text'),
  tags: text('tags').array(),                    // ['food', 'service', 'ambience']
  orderNumber: text('order_number'),
  orderItems: jsonb('order_items'),              // [{ name, qty, price }]
  orderLookupSuccess: boolean('order_lookup_success').default(false),
  aiSuggestionsShown: jsonb('ai_suggestions_shown'),
  aiSuggestionChosen: text('ai_suggestion_chosen'),
  redirectedTo: externalPlatformEnum('redirected_to'),
  redirectedAt: timestamp('redirected_at'),
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  wantsFollowUp: boolean('wants_follow_up').default(false),
  followedUpAt: timestamp('followed_up_at'),
  responseText: text('response_text'),
  respondedBy: uuid('responded_by').references(() => users.id),
  respondedAt: timestamp('responded_at'),
  nfcTagId: uuid('nfc_tag_id').references(() => nfcTags.id),
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
