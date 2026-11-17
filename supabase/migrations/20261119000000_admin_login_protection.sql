-- Administrative identity and moderation fields cannot be changed by a member.
-- Apply after the membership workflow migration.
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'
          AND is_suspended = false
    );
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Trusted server operations and authorized administrative RPCs run under
    -- their database owner. Direct browser operations run as authenticated.
    IF current_user IN ('anon', 'authenticated') AND NOT public.is_admin(auth.uid()) THEN
        IF NEW.id IS DISTINCT FROM OLD.id
           OR NEW.role IS DISTINCT FROM OLD.role
           OR NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
           OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
           OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
           OR NEW.verification_checklist IS DISTINCT FROM OLD.verification_checklist
           OR NEW.review_notes IS DISTINCT FROM OLD.review_notes THEN
            RAISE EXCEPTION 'Administrative profile fields cannot be changed by members'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_admin_fields ON public.profiles;
CREATE TRIGGER protect_profile_admin_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_fields();

-- Reject forged administrative or pre-approved profiles, including inserts that
-- explicitly set fields added after the original registration policy.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
    id = auth.uid() AND role = 'member' AND status = 'draft'
    AND is_suspended = false AND is_published = false
    AND approved_at IS NULL AND approved_by IS NULL
    AND verification_checklist = '{}'::jsonb
);

-- Resolve function names only in the intended schema for privileged functions.
DO $$
DECLARE f record;
BEGIN
    FOR f IN
        SELECT p.oid::regprocedure AS signature
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.prosecdef
    LOOP
        EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', f.signature);
    END LOOP;
END $$;
