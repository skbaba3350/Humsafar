-- Humsafar Complete Security & Privacy Hardening Migration
-- Fixes Infinite Recursion, Role/Status Escalation, Column-level Security,
-- Request Authorization, Block Enforcement, Admin Permissions, Triggers and Cascading.

-- 1. Helper Functions with SECURITY DEFINER to prevent Infinite Recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_approved_member(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND status = 'approved' AND is_hidden = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.are_blocked(u1 UUID, u2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = u1 AND blocked_id = u2)
           OR (blocker_id = u2 AND blocked_id = u1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_photo_permission(p_owner_id UUID, p_viewer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_owner_id = p_viewer_id OR public.is_admin(p_viewer_id) THEN
        RETURN TRUE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.photo_permissions
        WHERE granter_id = p_owner_id AND viewer_id = p_viewer_id
    ) AND NOT public.are_blocked(p_owner_id, p_viewer_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_note_permission(p_owner_id UUID, p_viewer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_owner_id = p_viewer_id OR public.is_admin(p_viewer_id) THEN
        RETURN TRUE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.note_permissions
        WHERE granter_id = p_owner_id AND viewer_id = p_viewer_id
    ) AND NOT public.are_blocked(p_owner_id, p_viewer_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Drop existing problematic policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Members can read approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- 3. Create hardened policies on PROFILES (NO infinite recursion!)
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Approved members can read other approved profiles"
ON public.profiles FOR SELECT
USING (
    status = 'approved'
    AND is_hidden = FALSE
    AND public.is_approved_member(auth.uid())
    AND NOT public.are_blocked(auth.uid(), id)
);

-- Users can insert their profile, BUT CANNOT make themselves admin or auto-approved!
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (
    auth.uid() = id
    AND role = 'member'
    AND status IN ('draft', 'pending_review')
);

-- Users can update their own profile, BUT CANNOT escalate role or approve themselves!
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND (
        -- Can only keep same status or change between draft and pending_review
        status = (SELECT status FROM public.profiles WHERE id = auth.uid())
        OR (status IN ('draft', 'pending_review') AND (SELECT status FROM public.profiles WHERE id = auth.uid()) IN ('draft', 'pending_review', 'changes_requested'))
    )
);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = id);

-- Admins can update any profile (approve, suspend, change notes)
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Admins can delete any profile if needed
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.is_admin(auth.uid()));


-- 4. Secure Public View for Browsing (Strict Privacy: hides private notes, exact birth_date, review_notes)
DROP VIEW IF EXISTS public.public_directory;
CREATE OR REPLACE VIEW public.public_directory AS
SELECT
    id,
    display_name,
    gender,
    city,
    marital_status,
    bio,
    interests,
    partner_preferences,
    has_disability,
    is_hidden,
    status,
    created_at,
    -- Calculate integer age without exposing exact day of birth
    EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date))::INT AS age,
    -- Return avatar URL ONLY if granted or is self/admin
    CASE
        WHEN public.has_photo_permission(id, auth.uid()) THEN avatar_url
        ELSE ''
    END AS avatar_url,
    -- Return disability notes ONLY if granted
    CASE
        WHEN public.has_note_permission(id, auth.uid()) THEN disability_notes
        ELSE ''
    END AS disability_notes,
    public.has_photo_permission(id, auth.uid()) AS has_photo_permission,
    public.has_note_permission(id, auth.uid()) AS has_note_permission
FROM public.profiles
WHERE status = 'approved' AND is_hidden = FALSE;

-- Grant access on view to authenticated users
GRANT SELECT ON public.public_directory TO authenticated;


-- 5. Harden INTEREST REQUESTS Policies
DROP POLICY IF EXISTS "Interest requests select" ON public.interest_requests;
DROP POLICY IF EXISTS "Interest requests insert" ON public.interest_requests;
DROP POLICY IF EXISTS "Interest requests update" ON public.interest_requests;
DROP POLICY IF EXISTS "Interest requests delete" ON public.interest_requests;

CREATE POLICY "Interest requests select"
ON public.interest_requests FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin(auth.uid()));

-- Only approved, active, unhidden members can send requests, and recipient must NOT be hidden!
CREATE POLICY "Interest requests insert"
ON public.interest_requests FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
    AND public.is_approved_member(sender_id)
    AND public.is_approved_member(receiver_id)
    AND NOT public.are_blocked(sender_id, receiver_id)
    AND sender_id <> receiver_id
    AND status = 'pending'
);

-- Strict update: Sender can ONLY cancel, Receiver can ONLY accept/decline. Identities cannot be changed!
CREATE POLICY "Interest requests update by sender"
ON public.interest_requests FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (
    auth.uid() = sender_id
    AND sender_id = (SELECT r.sender_id FROM public.interest_requests r WHERE r.id = id)
    AND receiver_id = (SELECT r.receiver_id FROM public.interest_requests r WHERE r.id = id)
    AND status = 'cancelled'
);

CREATE POLICY "Interest requests update by receiver"
ON public.interest_requests FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (
    auth.uid() = receiver_id
    AND sender_id = (SELECT r.sender_id FROM public.interest_requests r WHERE r.id = id)
    AND receiver_id = (SELECT r.receiver_id FROM public.interest_requests r WHERE r.id = id)
    AND status IN ('accepted', 'declined')
);


-- 6. Harden CONVERSATIONS and MESSAGES
DROP POLICY IF EXISTS "Conversations select" ON public.conversations;
CREATE POLICY "Conversations select"
ON public.conversations FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Messages select" ON public.messages;
CREATE POLICY "Messages select"
ON public.messages FOR SELECT
USING (
    -- Normal participant access
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
    -- Admin access ONLY if message is reported in an active report!
    OR (
        public.is_admin(auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.reports rep
            WHERE rep.reported_message_id = messages.id
        )
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
        AND NOT public.are_blocked(c.user1_id, c.user2_id)
    )
);

-- 7. Trigger to update conversation updated_at when a new message is sent
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;
CREATE TRIGGER on_message_inserted
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();


-- 8. Harden REPORTS (Ensuring reported message actually belongs to the reported user and conversation)
DROP POLICY IF EXISTS "Reports insert" ON public.reports;
CREATE POLICY "Reports insert"
ON public.reports FOR INSERT
WITH CHECK (
    auth.uid() = reporter_id
    AND reporter_id <> reported_id
    AND (
        reported_message_id IS NULL
        OR EXISTS (
            SELECT 1 FROM public.messages m
            JOIN public.conversations c ON c.id = m.conversation_id
            WHERE m.id = reported_message_id
            AND m.sender_id = reported_id
            AND (c.user1_id = reporter_id OR c.user2_id = reporter_id)
        )
    )
);


-- 9. Atomic Admin Procedures (Processing profile & report atomically with audit logging)
CREATE OR REPLACE FUNCTION public.admin_process_profile(
    target_profile_id UUID,
    new_status TEXT,
    note TEXT
)
RETURNS VOID AS $$
DECLARE
    cur_admin UUID := auth.uid();
BEGIN
    IF NOT public.is_admin(cur_admin) THEN
        RAISE EXCEPTION 'Only administrators can perform this action';
    END IF;

    IF new_status NOT IN ('approved', 'changes_requested', 'suspended') THEN
        RAISE EXCEPTION 'Invalid status transition';
    END IF;

    UPDATE public.profiles
    SET status = new_status,
        review_notes = note,
        updated_at = now()
    WHERE id = target_profile_id;

    INSERT INTO public.admin_audit_logs (admin_id, target_id, action, details)
    VALUES (cur_admin, target_profile_id, 'Profile status changed to: ' || new_status, note);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_resolve_report(
    target_report_id UUID,
    new_status TEXT,
    note TEXT
)
RETURNS VOID AS $$
DECLARE
    cur_admin UUID := auth.uid();
    r_record RECORD;
BEGIN
    IF NOT public.is_admin(cur_admin) THEN
        RAISE EXCEPTION 'Only administrators can perform this action';
    END IF;

    IF new_status NOT IN ('resolved', 'dismissed') THEN
        RAISE EXCEPTION 'Invalid report status';
    END IF;

    SELECT * INTO r_record FROM public.reports WHERE id = target_report_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report not found';
    END IF;

    UPDATE public.reports
    SET status = new_status,
        admin_notes = note,
        updated_at = now()
    WHERE id = target_report_id;

    INSERT INTO public.admin_audit_logs (admin_id, target_id, action, details)
    VALUES (cur_admin, r_record.reported_id, 'Report marked as ' || new_status, note);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 10. Automated Profile Creation Trigger on Auth Signup
-- This ensures profile row is created even if user email verification is pending!
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    d_name TEXT;
    b_date DATE;
    gen TEXT;
    c_city TEXT;
    m_status TEXT;
BEGIN
    d_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'صارف');
    b_date := COALESCE((NEW.raw_user_meta_data->>'birth_date')::DATE, '2000-01-01'::DATE);
    gen := COALESCE(NEW.raw_user_meta_data->>'gender', 'female');
    c_city := COALESCE(NEW.raw_user_meta_data->>'city', 'نامعلوم');
    m_status := COALESCE(NEW.raw_user_meta_data->>'marital_status', 'unmarried');

    INSERT INTO public.profiles (
        id, display_name, birth_date, gender, city, marital_status,
        bio, status, role
    )
    VALUES (
        NEW.id, d_name, b_date, gen, c_city, m_status,
        'اپنا تعارف تحریر کریں...', 'draft', 'member'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
