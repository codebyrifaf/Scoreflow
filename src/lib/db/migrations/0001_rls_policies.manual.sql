-- =====================================================================
-- ScoreFlow RLS Policies
-- Apply this AFTER 0000_damp_microchip.manual.sql has been applied.
-- Safe to re-run: all statements use IF EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper functions in the auth schema
-- These read the current user's role and agency from public.users
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_agency_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT agency_id FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'platform_admin'
  )
$$;

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.current_agency_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, anon;

-- ---------------------------------------------------------------------
-- Enable RLS on all tenant tables
-- ---------------------------------------------------------------------

ALTER TABLE public.agencies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_tags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- AGENCIES
-- Platform admin: full access
-- Agency users: can SELECT/UPDATE their own agency only
-- No one except platform admin can INSERT or DELETE agencies
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS agencies_select ON public.agencies;
CREATE POLICY agencies_select ON public.agencies FOR SELECT
  USING (public.is_platform_admin() OR id = public.current_agency_id());

DROP POLICY IF EXISTS agencies_update ON public.agencies;
CREATE POLICY agencies_update ON public.agencies FOR UPDATE
  USING (public.is_platform_admin() OR id = public.current_agency_id())
  WITH CHECK (public.is_platform_admin() OR id = public.current_agency_id());

DROP POLICY IF EXISTS agencies_insert ON public.agencies;
CREATE POLICY agencies_insert ON public.agencies FOR INSERT
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS agencies_delete ON public.agencies;
CREATE POLICY agencies_delete ON public.agencies FOR DELETE
  USING (public.is_platform_admin());

-- ---------------------------------------------------------------------
-- USERS
-- Platform admin: full access
-- Agency users: can see users in their own agency
-- Any authenticated user: can see their own row
-- Inserts happen via the handle_new_user trigger (SECURITY DEFINER), not via client
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS users_select ON public.users;
CREATE POLICY users_select ON public.users FOR SELECT
  USING (
    public.is_platform_admin()
    OR id = auth.uid()
    OR agency_id = public.current_agency_id()
  );

DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self ON public.users FOR UPDATE
  USING (id = auth.uid() OR public.is_platform_admin())
  WITH CHECK (id = auth.uid() OR public.is_platform_admin());

DROP POLICY IF EXISTS users_delete ON public.users;
CREATE POLICY users_delete ON public.users FOR DELETE
  USING (public.is_platform_admin());

-- ---------------------------------------------------------------------
-- BUSINESSES
-- Platform admin: full access
-- Agency users: full access to businesses in their agency
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS businesses_select ON public.businesses;
CREATE POLICY businesses_select ON public.businesses FOR SELECT
  USING (public.is_platform_admin() OR agency_id = public.current_agency_id());

DROP POLICY IF EXISTS businesses_insert ON public.businesses;
CREATE POLICY businesses_insert ON public.businesses FOR INSERT
  WITH CHECK (public.is_platform_admin() OR agency_id = public.current_agency_id());

DROP POLICY IF EXISTS businesses_update ON public.businesses;
CREATE POLICY businesses_update ON public.businesses FOR UPDATE
  USING (public.is_platform_admin() OR agency_id = public.current_agency_id())
  WITH CHECK (public.is_platform_admin() OR agency_id = public.current_agency_id());

DROP POLICY IF EXISTS businesses_delete ON public.businesses;
CREATE POLICY businesses_delete ON public.businesses FOR DELETE
  USING (public.is_platform_admin() OR agency_id = public.current_agency_id());

-- ---------------------------------------------------------------------
-- LOCATIONS
-- Same pattern as businesses. Also allow anonymous SELECT for the public
-- review page to resolve a location slug → agency branding.
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS locations_select_auth ON public.locations;
CREATE POLICY locations_select_auth ON public.locations FOR SELECT
  TO authenticated
  USING (public.is_platform_admin() OR agency_id = public.current_agency_id());

DROP POLICY IF EXISTS locations_select_public ON public.locations;
CREATE POLICY locations_select_public ON public.locations FOR SELECT
  TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS locations_insert ON public.locations;
CREATE POLICY locations_insert ON public.locations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin() OR agency_id = public.current_agency_id());

DROP POLICY IF EXISTS locations_update ON public.locations;
CREATE POLICY locations_update ON public.locations FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin() OR agency_id = public.current_agency_id())
  WITH CHECK (public.is_platform_admin() OR agency_id = public.current_agency_id());

DROP POLICY IF EXISTS locations_delete ON public.locations;
CREATE POLICY locations_delete ON public.locations FOR DELETE
  TO authenticated
  USING (public.is_platform_admin() OR agency_id = public.current_agency_id());

-- ---------------------------------------------------------------------
-- NFC_TAGS
-- Authenticated: scoped to agency
-- Anonymous: can SELECT active tags (to validate scanned tag_code on review page)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS nfc_tags_select_auth ON public.nfc_tags;
CREATE POLICY nfc_tags_select_auth ON public.nfc_tags FOR SELECT
  TO authenticated
  USING (public.is_platform_admin() OR agency_id = public.current_agency_id());

DROP POLICY IF EXISTS nfc_tags_select_public ON public.nfc_tags;
CREATE POLICY nfc_tags_select_public ON public.nfc_tags FOR SELECT
  TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS nfc_tags_insert ON public.nfc_tags;
CREATE POLICY nfc_tags_insert ON public.nfc_tags FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin() OR agency_id = public.current_agency_id());

DROP POLICY IF EXISTS nfc_tags_update ON public.nfc_tags;
CREATE POLICY nfc_tags_update ON public.nfc_tags FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin() OR agency_id = public.current_agency_id())
  WITH CHECK (public.is_platform_admin() OR agency_id = public.current_agency_id());

DROP POLICY IF EXISTS nfc_tags_delete ON public.nfc_tags;
CREATE POLICY nfc_tags_delete ON public.nfc_tags FOR DELETE
  TO authenticated
  USING (public.is_platform_admin() OR agency_id = public.current_agency_id());

-- ---------------------------------------------------------------------
-- REVIEWS
-- Authenticated: scoped to agency (read/update/delete)
-- Anonymous: can INSERT (public review submission). Cannot SELECT.
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS reviews_select ON public.reviews;
CREATE POLICY reviews_select ON public.reviews FOR SELECT
  TO authenticated
  USING (public.is_platform_admin() OR agency_id = public.current_agency_id());

DROP POLICY IF EXISTS reviews_insert_public ON public.reviews;
CREATE POLICY reviews_insert_public ON public.reviews FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS reviews_insert_auth ON public.reviews;
CREATE POLICY reviews_insert_auth ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin() OR agency_id = public.current_agency_id());

DROP POLICY IF EXISTS reviews_update ON public.reviews;
CREATE POLICY reviews_update ON public.reviews FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin() OR agency_id = public.current_agency_id())
  WITH CHECK (public.is_platform_admin() OR agency_id = public.current_agency_id());

DROP POLICY IF EXISTS reviews_delete ON public.reviews;
CREATE POLICY reviews_delete ON public.reviews FOR DELETE
  TO authenticated
  USING (public.is_platform_admin() OR agency_id = public.current_agency_id());

-- ---------------------------------------------------------------------
-- SUBSCRIPTION_PLANS
-- Everyone authenticated can read (needed for pricing page logic).
-- Only platform admin can modify.
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS subscription_plans_select ON public.subscription_plans;
CREATE POLICY subscription_plans_select ON public.subscription_plans FOR SELECT
  USING (true);

DROP POLICY IF EXISTS subscription_plans_modify ON public.subscription_plans;
CREATE POLICY subscription_plans_modify ON public.subscription_plans FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------------------------------------------------------------------
-- AUDIT_LOGS
-- Platform admin: read all
-- Agency users: read their own agency's logs
-- Inserts only via SECURITY DEFINER server functions (no direct client insert)
-- No updates, no deletes (append-only)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT
  USING (public.is_platform_admin() OR agency_id = public.current_agency_id());

-- No insert/update/delete policies = no one can write directly.
-- Server code must use service_role key to insert audit log entries.

-- =====================================================================
-- End of RLS policies
-- =====================================================================
