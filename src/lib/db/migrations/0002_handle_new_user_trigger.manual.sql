-- =====================================================================
-- Handle new auth user -> insert into public.users
-- Apply this AFTER 0000_damp_microchip.manual.sql has been applied and
-- AFTER the RLS policies migration if you plan to enable RLS first.
-- Safe to re-run: uses CREATE OR REPLACE FUNCTION and DROP TRIGGER IF EXISTS.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    agency_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'agency_owner'::user_role),
    NULLIF(NEW.raw_user_meta_data->>'agency_id','')::uuid,
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
