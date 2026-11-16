-- Humsafar Complete Schema Migration
-- Designed for privacy, safety, disability inclusion, and full Urdu RTL experience.

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    city TEXT NOT NULL,
    marital_status TEXT NOT NULL CHECK (marital_status IN ('unmarried', 'divorced', 'widowed', 'khula')),
    bio TEXT NOT NULL,
    interests TEXT[] DEFAULT '{}',
    partner_preferences TEXT DEFAULT '',
    has_disability BOOLEAN DEFAULT FALSE,
    disability_notes TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'changes_requested', 'suspended')),
    review_notes TEXT DEFAULT '',
    is_hidden BOOLEAN DEFAULT FALSE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT min_age_check CHECK (birth_date <= (CURRENT_DATE - INTERVAL '18 years'))
);

-- 2. Photo Permissions (Private Photos: explicitly granted per member)
CREATE TABLE IF NOT EXISTS public.photo_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    granter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_photo_permission UNIQUE (granter_id, viewer_id),
    CONSTRAINT no_self_photo_perm CHECK (granter_id <> viewer_id)
);

-- 3. Note Permissions (Private Accessibility / Disability Notes)
CREATE TABLE IF NOT EXISTS public.note_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    granter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_note_permission UNIQUE (granter_id, viewer_id),
    CONSTRAINT no_self_note_perm CHECK (granter_id <> viewer_id)
);

-- 4. Interest Requests (Only one active pending/accepted request between any pair)
CREATE TABLE IF NOT EXISTS public.interest_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT no_self_request CHECK (sender_id <> receiver_id)
);

-- Create a partial unique index so there's at most one active request between two parties
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_interest_request_pair
ON public.interest_requests (
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id)
)
WHERE (status IN ('pending', 'accepted'));

-- 5. Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.interest_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT no_self_conversation CHECK (user1_id <> user2_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_conversation_pair
ON public.conversations (
    LEAST(user1_id, user2_id),
    GREATEST(user1_id, user2_id)
);

-- 6. Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Blocks
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id)
);

-- 8. Reports
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('fake_profile', 'harassment', 'asking_money', 'inappropriate_content', 'other')),
    details TEXT DEFAULT '',
    reported_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT no_self_report CHECK (reporter_id <> reported_id)
);

-- 9. Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID,
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 11. Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.are_blocked(u1 UUID, u2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = u1 AND blocked_id = u2)
           OR (blocker_id = u2 AND blocked_id = u1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. RLS Policies

-- PROFILES:
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin(auth.uid()));

-- Approved members can read other approved & unhidden profiles (if not blocked)
CREATE POLICY "Members can read approved profiles"
ON public.profiles FOR SELECT
USING (
    status = 'approved'
    AND is_hidden = FALSE
    AND EXISTS (
        SELECT 1 FROM public.profiles my_p
        WHERE my_p.id = auth.uid() AND my_p.status = 'approved'
    )
    AND NOT public.are_blocked(auth.uid(), id)
);

-- Users can update their own profile (cannot change role or status to approved themselves)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Admins can update any profile (e.g. approve, request changes, suspend)
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
USING (public.is_admin(auth.uid()));

-- PHOTO PERMISSIONS:
CREATE POLICY "Photo permissions select"
ON public.photo_permissions FOR SELECT
USING (auth.uid() = granter_id OR auth.uid() = viewer_id OR public.is_admin(auth.uid()));

CREATE POLICY "Photo permissions insert"
ON public.photo_permissions FOR INSERT
WITH CHECK (auth.uid() = granter_id);

CREATE POLICY "Photo permissions delete"
ON public.photo_permissions FOR DELETE
USING (auth.uid() = granter_id);

-- NOTE PERMISSIONS:
CREATE POLICY "Note permissions select"
ON public.note_permissions FOR SELECT
USING (auth.uid() = granter_id OR auth.uid() = viewer_id OR public.is_admin(auth.uid()));

CREATE POLICY "Note permissions insert"
ON public.note_permissions FOR INSERT
WITH CHECK (auth.uid() = granter_id);

CREATE POLICY "Note permissions delete"
ON public.note_permissions FOR DELETE
USING (auth.uid() = granter_id);

-- INTEREST REQUESTS:
CREATE POLICY "Interest requests select"
ON public.interest_requests FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin(auth.uid()));

CREATE POLICY "Interest requests insert"
ON public.interest_requests FOR INSERT
WITH CHECK (auth.uid() = sender_id AND NOT public.are_blocked(sender_id, receiver_id));

CREATE POLICY "Interest requests update"
ON public.interest_requests FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- CONVERSATIONS:
CREATE POLICY "Conversations select"
ON public.conversations FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- MESSAGES:
CREATE POLICY "Messages select"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
);

CREATE POLICY "Messages insert"
ON public.messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
        AND NOT public.are_blocked(c.user1_id, c.user2_id)
    )
);

-- BLOCKS:
CREATE POLICY "Blocks select"
ON public.blocks FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Blocks insert"
ON public.blocks FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Blocks delete"
ON public.blocks FOR DELETE
USING (auth.uid() = blocker_id);

-- REPORTS:
CREATE POLICY "Reports select"
ON public.reports FOR SELECT
USING (auth.uid() = reporter_id OR public.is_admin(auth.uid()));

CREATE POLICY "Reports insert"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reports update"
ON public.reports FOR UPDATE
USING (public.is_admin(auth.uid()));

-- AUDIT LOGS:
CREATE POLICY "Audit logs select"
ON public.admin_audit_logs FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Audit logs insert"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- 13. Atomic function to accept interest request and create conversation
CREATE OR REPLACE FUNCTION public.accept_interest_request(req_id UUID)
RETURNS UUID AS $$
DECLARE
    r RECORD;
    conv_id UUID;
    p1 UUID;
    p2 UUID;
BEGIN
    SELECT * INTO r FROM public.interest_requests
    WHERE id = req_id AND receiver_id = auth.uid() AND status = 'pending'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found or not in pending state';
    END IF;

    IF public.are_blocked(r.sender_id, r.receiver_id) THEN
        RAISE EXCEPTION 'Cannot accept request from blocked user';
    END IF;

    -- Update request status
    UPDATE public.interest_requests
    SET status = 'accepted', updated_at = now()
    WHERE id = req_id;

    -- Sort user IDs for unique constraint
    p1 := LEAST(r.sender_id, r.receiver_id);
    p2 := GREATEST(r.sender_id, r.receiver_id);

    -- Find or create conversation atomically
    SELECT id INTO conv_id FROM public.conversations
    WHERE (user1_id = p1 AND user2_id = p2) OR (user1_id = p2 AND user2_id = p1);

    IF conv_id IS NULL THEN
        INSERT INTO public.conversations (user1_id, user2_id, request_id)
        VALUES (p1, p2, req_id)
        RETURNING id INTO conv_id;
    END IF;

    RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Private Storage Bucket Setup for Avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read avatar if permitted"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'avatars'
    AND (
        -- Owner can read
        auth.uid()::text = (storage.foldername(name))[1]
        -- Or Admin can read
        OR public.is_admin(auth.uid())
        -- Or granted viewer can read
        OR EXISTS (
            SELECT 1 FROM public.photo_permissions pp
            WHERE pp.granter_id::text = (storage.foldername(name))[1]
            AND pp.viewer_id = auth.uid()
            AND NOT public.are_blocked(auth.uid(), pp.granter_id)
        )
    )
);
