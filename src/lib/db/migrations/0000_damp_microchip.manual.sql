CREATE TYPE "public"."external_platform" AS ENUM('google', 'tripadvisor', 'yelp', 'facebook', 'trustpilot');
CREATE TYPE "public"."review_sentiment" AS ENUM('positive', 'neutral', 'negative');
CREATE TYPE "public"."review_status" AS ENUM('pending', 'submitted', 'responded', 'flagged', 'archived');
CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'past_due', 'canceled', 'paused');
CREATE TYPE "public"."user_role" AS ENUM('platform_admin', 'agency_owner', 'agency_staff', 'business_owner', 'business_manager');

CREATE TABLE "agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"custom_domain" text,
	"logo_url" text,
	"primary_color" text DEFAULT '#6366f1',
	"accent_color" text DEFAULT '#14b8a6',
	"email_from_name" text,
	"email_from_address" text,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_status" "subscription_status" DEFAULT 'trial',
	"subscription_tier" text DEFAULT 'starter',
	"max_businesses" integer DEFAULT 5,
	"trial_ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agencies_slug_unique" UNIQUE("slug"),
	CONSTRAINT "agencies_custom_domain_unique" UNIQUE("custom_domain"),
	CONSTRAINT "agencies_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "agencies_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);

CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"industry" text,
	"logo_url" text,
	"primary_color" text,
	"contact_email" text,
	"contact_phone" text,
	"google_business_url" text,
	"tripadvisor_url" text,
	"yelp_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_agency_id_slug_unique" UNIQUE("agency_id","slug")
);

CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"agency_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"address_line_1" text,
	"address_line_2" text,
	"city" text,
	"region" text,
	"postal_code" text,
	"country" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"google_business_url" text,
	"tripadvisor_url" text,
	"yelp_url" text,
	"pos_provider" text,
	"pos_access_token" text,
	"pos_location_id" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "locations_slug_unique" UNIQUE("slug")
);

CREATE TABLE "nfc_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"agency_id" uuid NOT NULL,
	"tag_code" text NOT NULL,
	"label" text,
	"scan_count" integer DEFAULT 0,
	"last_scanned_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nfc_tags_tag_code_unique" UNIQUE("tag_code")
);

CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"agency_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"sentiment" "review_sentiment" NOT NULL,
	"feedback_text" text,
	"tags" text[],
	"order_number" text,
	"order_items" jsonb,
	"order_lookup_success" boolean DEFAULT false,
	"ai_suggestions_shown" jsonb,
	"ai_suggestion_chosen" text,
	"redirected_to" "external_platform",
	"redirected_at" timestamp,
	"customer_name" text,
	"customer_email" text,
	"customer_phone" text,
	"wants_follow_up" boolean DEFAULT false,
	"followed_up_at" timestamp,
	"response_text" text,
	"responded_by" uuid,
	"responded_at" timestamp,
	"nfc_tag_id" uuid,
	"user_agent" text,
	"ip_hash" text,
	"status" "review_status" DEFAULT 'submitted',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"monthly_price" integer NOT NULL,
	"max_businesses" integer NOT NULL,
	"max_locations_per_business" integer NOT NULL,
	"max_reviews_per_month" integer,
	"features" jsonb,
	"is_active" boolean DEFAULT true
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"role" "user_role" NOT NULL,
	"agency_id" uuid,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "locations" ADD CONSTRAINT "locations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "locations" ADD CONSTRAINT "locations_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "nfc_tags" ADD CONSTRAINT "nfc_tags_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "nfc_tags" ADD CONSTRAINT "nfc_tags_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_nfc_tag_id_nfc_tags_id_fk" FOREIGN KEY ("nfc_tag_id") REFERENCES "public"."nfc_tags"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "users" ADD CONSTRAINT "users_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "agencies_slug_idx" ON "agencies" USING btree ("slug");
CREATE INDEX "audit_logs_agency_idx" ON "audit_logs" USING btree ("agency_id");
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");
CREATE INDEX "businesses_agency_idx" ON "businesses" USING btree ("agency_id");
CREATE INDEX "locations_slug_idx" ON "locations" USING btree ("slug");
CREATE INDEX "locations_business_idx" ON "locations" USING btree ("business_id");
CREATE INDEX "locations_agency_idx" ON "locations" USING btree ("agency_id");
CREATE INDEX "reviews_agency_idx" ON "reviews" USING btree ("agency_id");
CREATE INDEX "reviews_business_idx" ON "reviews" USING btree ("business_id");
CREATE INDEX "reviews_location_idx" ON "reviews" USING btree ("location_id");
CREATE INDEX "reviews_created_idx" ON "reviews" USING btree ("created_at");
CREATE INDEX "reviews_sentiment_idx" ON "reviews" USING btree ("sentiment");
CREATE INDEX "users_agency_idx" ON "users" USING btree ("agency_id");
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");
