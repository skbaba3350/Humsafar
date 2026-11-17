-- ==============================================================================
-- Migration: 20261118000000_revised_disability_verification_workflow.sql
-- Humsafar Revised Scope: Exclusively for Adults Living with a Disability
-- Strict Application, Trusted Real-World Reference Verification, and Privacy Controls
-- ==============================================================================

-- 1. Extend PROFILES Table with Application & Review Fields
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Map any old statuses before applying new strict constraint
UPDATE public.profiles
SET status = CASE
    WHEN role = 'admin' THEN 'approved'
    ELSE 'new_eligibility_review_required'
END;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (
    status IN (
        'draft',
        'submitted',
        'under_review',
        'additional_info_required',
        'reference_verification_pending',
        'approved',
        'not_approved',
        'withdrawn',
        'new_eligibility_review_required'
    )
);

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS legal_name TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS contact_phone TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS disability_explanation TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS accommodation_needs TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS marriage_intention_statement TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS applicant_consent_review BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS applicant_consent_references BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS reconsideration_request TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS applicant_response_notes TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS verification_checklist JSONB DEFAULT '{}'::jsonb;

-- 2. Create Application References Table
CREATE TABLE IF NOT EXISTS public.application_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reference_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    contact_details TEXT NOT NULL,
    applicant_confirmed_consent BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'unable_to_verify', 'rejected')),
    verified_by UUID REFERENCES public.profiles(id),
    verification_method TEXT DEFAULT '', -- 'direct_call', 'in_person', 'mutual_known_contact'
    verification_notes TEXT DEFAULT '',
    knows_applicant BOOLEAN DEFAULT FALSE,
    relationship_nature TEXT DEFAULT '',
    confirms_disability_eligibility BOOLEAN DEFAULT FALSE,
    identity_consistent BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_application_references_profile ON public.application_references(profile_id);

-- 3. Create Platform Operational Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id INT PRIMARY KEY DEFAULT 1,
    applications_paused BOOLEAN NOT NULL DEFAULT FALSE,
    approvals_paused BOOLEAN NOT NULL DEFAULT FALSE,
    pause_reason TEXT DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES public.profiles(id),
    CONSTRAINT single_platform_settings_row CHECK (id = 1)
);

INSERT INTO public.platform_settings (id, applications_paused, approvals_paused)
VALUES (1, false, false)
ON CONFLICT (id) DO NOTHING;

-- 4. Update Security Definier Helper Functions
CREATE OR REPLACE FUNCTION public.is_approved_member(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    p_status TEXT;
    p_role TEXT;
    p_suspended BOOLEAN;
BEGIN
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT status, role, is_suspended INTO p_status, p_role, p_suspended
    FROM public.profiles
    WHERE id = user_id;

    IF p_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    RETURN (p_status = 'approved' AND (p_suspended IS FALSE OR p_suspended IS NULL));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Secure Directory View: Only for Approved, Published Members
DROP VIEW IF EXISTS public.public_directory;
-- The revised directory changes the previous view's column layout.
DROP VIEW IF EXISTS public.public_directory;
CREATE OR REPLACE VIEW public.public_directory AS
SELECT
    p.id,
    p.display_name,
    p.gender,
    p.city,
    p.marital_status,
    p.bio,
    p.interests,
    p.partner_preferences,
    p.status,
    p.is_published,
    p.created_at,
    EXTRACT(YEAR FROM age(CURRENT_DATE, p.birth_date))::INT AS age,
    CASE
        WHEN auth.uid() = p.id OR public.is_admin(auth.uid()) OR public.has_photo_permission(p.id, auth.uid())
        THEN p.avatar_url
        ELSE ''
    END AS avatar_url
FROM public.profiles p
WHERE
    p.role = 'member'
    AND p.status = 'approved'
    AND p.is_published = true
    AND p.is_hidden = false
    AND (p.is_suspended IS FALSE OR p.is_suspended IS NULL)
    AND public.is_approved_member(auth.uid());

-- 6. Atomic RPC: Submit Membership Application
CREATE OR REPLACE FUNCTION public.submit_membership_application(
    p_legal_name TEXT,
    p_birth_date DATE,
    p_contact_phone TEXT,
    p_city TEXT,
    p_marital_status TEXT,
    p_disability_explanation TEXT,
    p_accommodation_needs TEXT,
    p_marriage_intention_statement TEXT,
    p_applicant_consent_review BOOLEAN,
    p_applicant_consent_references BOOLEAN,
    p_bio TEXT DEFAULT '',
    p_interests TEXT[] DEFAULT '{}',
    p_partner_preferences TEXT DEFAULT ''
)
RETURNS VOID AS $$
DECLARE
    cur_user UUID := auth.uid();
    cur_status TEXT;
    is_paused BOOLEAN;
    ref_count INT;
BEGIN
    IF cur_user IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT applications_paused INTO is_paused FROM public.platform_settings WHERE id = 1;
    IF is_paused IS TRUE THEN
        RAISE EXCEPTION 'فی الوقت نئے جائزے کی درخواستیں عارضی طور پر موقوف ہیں۔ براہ کرم کچھ دیر بعد کوشش کریں۔';
    END IF;

    IF p_birth_date > (CURRENT_DATE - INTERVAL '18 years') THEN
        RAISE EXCEPTION 'ہم سفر پر رکنیت کے لیے کم از کم عمر ۱۸ سال ہونا لازمی ہے۔';
    END IF;

    IF p_legal_name IS NULL OR length(trim(p_legal_name)) < 2 THEN
        RAISE EXCEPTION 'برائے کرم اپنا مکمل قانونی نام درج کریں۔';
    END IF;

    IF p_contact_phone IS NULL OR length(trim(p_contact_phone)) < 7 THEN
        RAISE EXCEPTION 'برائے کرم قابلِ رابطہ فون نمبر یا طریقہ درج کریں۔';
    END IF;

    IF p_disability_explanation IS NULL OR length(trim(p_disability_explanation)) < 5 THEN
        RAISE EXCEPTION 'برائے کرم اپنی معذوری کی مختصر وضاحت تحریر کریں۔';
    END IF;

    IF p_marriage_intention_statement IS NULL OR length(trim(p_marriage_intention_statement)) < 5 THEN
        RAISE EXCEPTION 'شادی کے ارادے کا وضاحتی بیان ضروری ہے۔';
    END IF;

    IF p_applicant_consent_review IS NOT TRUE OR p_applicant_consent_references IS NOT TRUE THEN
        RAISE EXCEPTION 'جائزے کے طریقہ کار اور حوالہ جات سے رابطے کی صریح رضامندی لازمی ہے۔';
    END IF;

    -- Check at least 1 reference with applicant_confirmed_consent
    SELECT count(*) INTO ref_count
    FROM public.application_references
    WHERE profile_id = cur_user AND applicant_confirmed_consent = TRUE;

    IF ref_count < 1 THEN
        RAISE EXCEPTION 'درخواست جمع کروانے سے پہلے کم از کم ایک قابلِ اعتماد حوالہ اور ان کی رضامندی کا اندراج لازمی ہے۔';
    END IF;

    SELECT status INTO cur_status FROM public.profiles WHERE id = cur_user;

    UPDATE public.profiles
    SET legal_name = trim(p_legal_name),
        birth_date = p_birth_date,
        contact_phone = trim(p_contact_phone),
        city = trim(p_city),
        marital_status = p_marital_status,
        disability_explanation = trim(p_disability_explanation),
        accommodation_needs = trim(coalesce(p_accommodation_needs, '')),
        marriage_intention_statement = trim(p_marriage_intention_statement),
        applicant_consent_review = p_applicant_consent_review,
        applicant_consent_references = p_applicant_consent_references,
        bio = coalesce(p_bio, bio),
        interests = coalesce(p_interests, interests),
        partner_preferences = coalesce(p_partner_preferences, partner_preferences),
        status = 'submitted',
        is_published = false,
        updated_at = now()
    WHERE id = cur_user;

    INSERT INTO public.admin_audit_logs (admin_id, target_id, action, details)
    VALUES (cur_user, cur_user, 'Application Submitted', 'Applicant submitted membership application for review');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Atomic RPC: Admin Reference Verification Check
CREATE OR REPLACE FUNCTION public.admin_verify_reference(
    p_reference_id UUID,
    p_verification_status TEXT,
    p_verification_method TEXT,
    p_verification_notes TEXT,
    p_knows_applicant BOOLEAN,
    p_relationship_nature TEXT,
    p_confirms_disability_eligibility BOOLEAN,
    p_identity_consistent BOOLEAN
)
RETURNS VOID AS $$
DECLARE
    cur_admin UUID := auth.uid();
    r_prof_id UUID;
BEGIN
    IF NOT public.is_admin(cur_admin) THEN
        RAISE EXCEPTION 'Only administrators can perform reference verification';
    END IF;

    IF p_verification_status NOT IN ('pending', 'verified', 'unable_to_verify', 'rejected') THEN
        RAISE EXCEPTION 'Invalid verification status';
    END IF;

    SELECT profile_id INTO r_prof_id FROM public.application_references WHERE id = p_reference_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reference record not found';
    END IF;

    UPDATE public.application_references
    SET verification_status = p_verification_status,
        verification_method = p_verification_method,
        verification_notes = trim(p_verification_notes),
        knows_applicant = p_knows_applicant,
        relationship_nature = trim(p_relationship_nature),
        confirms_disability_eligibility = p_confirms_disability_eligibility,
        identity_consistent = p_identity_consistent,
        verified_by = cur_admin,
        verified_at = now(),
        updated_at = now()
    WHERE id = p_reference_id;

    -- Update profile status to reference_verification_pending if under review
    UPDATE public.profiles
    SET status = 'reference_verification_pending',
        updated_at = now()
    WHERE id = r_prof_id AND status IN ('submitted', 'under_review');

    INSERT INTO public.admin_audit_logs (admin_id, target_id, action, details)
    VALUES (cur_admin, r_prof_id, 'Reference Checked', 'Reference ' || p_reference_id::text || ' outcome: ' || p_verification_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Atomic RPC: Admin Application Approval (Requires Full Verified Checklist)
CREATE OR REPLACE FUNCTION public.admin_approve_membership(
    p_target_id UUID,
    p_adult_checked BOOLEAN,
    p_identity_checked BOOLEAN,
    p_disability_checked BOOLEAN,
    p_reference_check_passed BOOLEAN,
    p_decision_reason TEXT
)
RETURNS VOID AS $$
DECLARE
    cur_admin UUID := auth.uid();
    prof RECORD;
    is_paused BOOLEAN;
    verified_ref_count INT;
BEGIN
    IF NOT public.is_admin(cur_admin) THEN
        RAISE EXCEPTION 'Only administrators can approve membership';
    END IF;

    SELECT approvals_paused INTO is_paused FROM public.platform_settings WHERE id = 1;
    IF is_paused IS TRUE THEN
        RAISE EXCEPTION 'Platform approvals are currently paused';
    END IF;

    IF p_adult_checked IS NOT TRUE OR
       p_identity_checked IS NOT TRUE OR
       p_disability_checked IS NOT TRUE OR
       p_reference_check_passed IS NOT TRUE THEN
        RAISE EXCEPTION 'Incomplete checklist: all verification checks must be completed before approval';
    END IF;

    SELECT * INTO prof FROM public.profiles WHERE id = p_target_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    IF prof.birth_date > (CURRENT_DATE - INTERVAL '18 years') THEN
        RAISE EXCEPTION 'Applicant is under 18 years of age';
    END IF;

    IF prof.applicant_consent_review IS NOT TRUE OR prof.applicant_consent_references IS NOT TRUE THEN
        RAISE EXCEPTION 'Applicant consent was not recorded';
    END IF;

    -- Must have at least one verified reference confirming disability eligibility
    SELECT count(*) INTO verified_ref_count
    FROM public.application_references
    WHERE profile_id = p_target_id
      AND verification_status = 'verified'
      AND confirms_disability_eligibility = TRUE
      AND knows_applicant = TRUE;

    IF verified_ref_count < 1 THEN
        RAISE EXCEPTION 'At least one independently established trusted reference check must be verified with disability confirmation';
    END IF;

    -- Update profile to approved
    -- IMPORTANT: Approval alone must NOT publish the profile (is_published remains false)
    UPDATE public.profiles
    SET status = 'approved',
        is_published = false,
        approved_at = now(),
        approved_by = cur_admin,
        review_notes = trim(p_decision_reason),
        verification_checklist = jsonb_build_object(
            'adult_checked', true,
            'identity_checked', true,
            'disability_checked', true,
            'reference_check_passed', true,
            'verified_reference_count', verified_ref_count,
            'decision_reason', trim(p_decision_reason),
            'approved_at', now(),
            'approved_by', cur_admin
        ),
        updated_at = now()
    WHERE id = p_target_id;

    INSERT INTO public.admin_audit_logs (admin_id, target_id, action, details)
    VALUES (cur_admin, p_target_id, 'Membership Approved', 'Approved membership with verified references and checklist');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Atomic RPC: Admin Transition Application State
CREATE OR REPLACE FUNCTION public.admin_update_application_state(
    p_target_id UUID,
    p_next_status TEXT,
    p_notes TEXT
)
RETURNS VOID AS $$
DECLARE
    cur_admin UUID := auth.uid();
BEGIN
    IF NOT public.is_admin(cur_admin) THEN
        RAISE EXCEPTION 'Only administrators can perform this action';
    END IF;

    IF p_next_status NOT IN ('under_review', 'additional_info_required', 'reference_verification_pending', 'not_approved', 'withdrawn', 'suspended', 'new_eligibility_review_required') THEN
        RAISE EXCEPTION 'Invalid status transition';
    END IF;

    UPDATE public.profiles
    SET status = p_next_status,
        review_notes = trim(p_notes),
        updated_at = now()
    WHERE id = p_target_id;

    INSERT INTO public.admin_audit_logs (admin_id, target_id, action, details)
    VALUES (cur_admin, p_target_id, 'Application Status Changed: ' || p_next_status, p_notes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Atomic RPC: Member Profile Publish / Unpublish Toggle
CREATE OR REPLACE FUNCTION public.member_toggle_publish(p_is_published BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE
    cur_user UUID := auth.uid();
    prof RECORD;
BEGIN
    IF cur_user IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO prof FROM public.profiles WHERE id = cur_user;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    IF prof.status <> 'approved' THEN
        RAISE EXCEPTION 'Only approved members can publish their profile';
    END IF;

    IF prof.is_suspended IS TRUE THEN
        RAISE EXCEPTION 'Suspended accounts cannot publish their profile';
    END IF;

    UPDATE public.profiles
    SET is_published = p_is_published,
        updated_at = now()
    WHERE id = cur_user;

    RETURN p_is_published;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Atomic RPC: Member Reconsideration Request
CREATE OR REPLACE FUNCTION public.member_request_reconsideration(p_statement TEXT)
RETURNS VOID AS $$
DECLARE
    cur_user UUID := auth.uid();
    cur_status TEXT;
BEGIN
    IF cur_user IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT status INTO cur_status FROM public.profiles WHERE id = cur_user;
    IF cur_status NOT IN ('not_approved', 'withdrawn') THEN
        RAISE EXCEPTION 'Reconsideration can only be requested for non-approved or withdrawn applications';
    END IF;

    UPDATE public.profiles
    SET reconsideration_request = trim(p_statement),
        status = 'submitted',
        updated_at = now()
    WHERE id = cur_user;

    INSERT INTO public.admin_audit_logs (admin_id, target_id, action, details)
    VALUES (cur_user, cur_user, 'Reconsideration Requested', p_statement);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Atomic RPC: Member Response to Additional Information Request
CREATE OR REPLACE FUNCTION public.member_respond_additional_info(p_response TEXT)
RETURNS VOID AS $$
DECLARE
    cur_user UUID := auth.uid();
    cur_status TEXT;
BEGIN
    IF cur_user IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT status INTO cur_status FROM public.profiles WHERE id = cur_user;
    IF cur_status <> 'additional_info_required' THEN
        RAISE EXCEPTION 'No additional information was requested';
    END IF;

    UPDATE public.profiles
    SET applicant_response_notes = trim(p_response),
        status = 'submitted',
        updated_at = now()
    WHERE id = cur_user;

    INSERT INTO public.admin_audit_logs (admin_id, target_id, action, details)
    VALUES (cur_user, cur_user, 'Additional Info Submitted', p_response);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. RLS Policies on application_references
ALTER TABLE public.application_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own references" ON public.application_references;
CREATE POLICY "Users can read own references"
ON public.application_references FOR SELECT
USING (
    profile_id = auth.uid() OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own references" ON public.application_references;
CREATE POLICY "Users can insert own references"
ON public.application_references FOR INSERT
WITH CHECK (
    profile_id = auth.uid()
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.status IN ('draft', 'submitted', 'additional_info_required', 'new_eligibility_review_required', 'under_review')
        )
    )
);

DROP POLICY IF EXISTS "Users can update own references" ON public.application_references;
CREATE POLICY "Users can update own references"
ON public.application_references FOR UPDATE
USING (
    profile_id = auth.uid() OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own unverified references" ON public.application_references;
CREATE POLICY "Users can delete own unverified references"
ON public.application_references FOR DELETE
USING (
    profile_id = auth.uid()
    AND verification_status = 'pending'
);

-- 14. RLS on Platform Settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view platform settings" ON public.platform_settings;
CREATE POLICY "Anyone authenticated can view platform settings"
ON public.platform_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Only admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Only admins can update platform settings"
ON public.platform_settings FOR UPDATE
USING (public.is_admin(auth.uid()));

-- 15. Harden PROFILES Update Policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    -- Cannot escalate role
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    -- Cannot self-approve or self-unsuspend
    AND (
        (status = (SELECT status FROM public.profiles WHERE id = auth.uid()))
        OR (status IN ('draft', 'submitted', 'withdrawn') AND (SELECT status FROM public.profiles WHERE id = auth.uid()) IN ('draft', 'submitted', 'additional_info_required', 'new_eligibility_review_required', 'withdrawn'))
    )
    -- Cannot change approved_by or verification_checklist
    AND (approved_by IS NOT DISTINCT FROM (SELECT approved_by FROM public.profiles WHERE id = auth.uid()))
);

-- 16. Harden INTEREST REQUESTS and MESSAGES
DROP POLICY IF EXISTS "Interest requests insert" ON public.interest_requests;
CREATE POLICY "Interest requests insert"
ON public.interest_requests FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
    AND public.is_approved_member(sender_id)
    AND public.is_approved_member(receiver_id)
    AND NOT public.are_blocked(sender_id, receiver_id)
    -- Receiver profile must be published!
    AND EXISTS (
        SELECT 1 FROM public.profiles r
        WHERE r.id = receiver_id
        AND r.is_published = true
        AND r.is_hidden = false
    )
);

DROP POLICY IF EXISTS "Messages insert" ON public.messages;
CREATE POLICY "Messages insert"
ON public.messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
    AND public.is_approved_member(sender_id)
    AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
        AND public.is_approved_member(c.user1_id)
        AND public.is_approved_member(c.user2_id)
        AND NOT public.are_blocked(c.user1_id, c.user2_id)
    )
);

-- 17. Safe Repeatable Migration for Existing Accounts:
-- Require new eligibility review for all non-admin members
UPDATE public.profiles
SET status = 'new_eligibility_review_required',
    is_published = false,
    updated_at = now()
WHERE role = 'member'
  AND status <> 'new_eligibility_review_required';
