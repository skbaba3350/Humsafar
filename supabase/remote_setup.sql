-- ==========================================================
-- ہم سفر (Humsafar) - Complete Remote Supabase Setup Script
-- Copy and run this entire script in Supabase Dashboard -> SQL Editor
-- ==========================================================

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

-- 2. Photo Permissions (Private Photos)
CREATE TABLE IF NOT EXISTS public.photo_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    granter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_photo_permission UNIQUE (granter_id, viewer_id),
    CONSTRAINT no_self_photo_perm CHECK (granter_id <> viewer_id)
);

-- 3. Note Permissions (Private Accessibility Notes)
CREATE TABLE IF NOT EXISTS public.note_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    granter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_note_permission UNIQUE (granter_id, viewer_id),
    CONSTRAINT no_self_note_perm CHECK (granter_id <> viewer_id)
);

-- 4. Interest Requests
CREATE TABLE IF NOT EXISTS public.interest_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT no_self_request CHECK (sender_id <> receiver_id)
);

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

-- 10. Enable RLS
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
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Members can read approved profiles" ON public.profiles;
CREATE POLICY "Members can read approved profiles" ON public.profiles FOR SELECT USING (
    status = 'approved' AND is_hidden = FALSE
    AND EXISTS (SELECT 1 FROM public.profiles my_p WHERE my_p.id = auth.uid() AND my_p.status = 'approved')
    AND NOT public.are_blocked(auth.uid(), id)
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid()));

-- Permissions Policies
DROP POLICY IF EXISTS "Photo permissions select" ON public.photo_permissions;
CREATE POLICY "Photo permissions select" ON public.photo_permissions FOR SELECT
USING (auth.uid() = granter_id OR auth.uid() = viewer_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Photo permissions insert" ON public.photo_permissions;
CREATE POLICY "Photo permissions insert" ON public.photo_permissions FOR INSERT WITH CHECK (auth.uid() = granter_id);

DROP POLICY IF EXISTS "Photo permissions delete" ON public.photo_permissions;
CREATE POLICY "Photo permissions delete" ON public.photo_permissions FOR DELETE USING (auth.uid() = granter_id);

DROP POLICY IF EXISTS "Note permissions select" ON public.note_permissions;
CREATE POLICY "Note permissions select" ON public.note_permissions FOR SELECT
USING (auth.uid() = granter_id OR auth.uid() = viewer_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Note permissions insert" ON public.note_permissions;
CREATE POLICY "Note permissions insert" ON public.note_permissions FOR INSERT WITH CHECK (auth.uid() = granter_id);

DROP POLICY IF EXISTS "Note permissions delete" ON public.note_permissions;
CREATE POLICY "Note permissions delete" ON public.note_permissions FOR DELETE USING (auth.uid() = granter_id);

-- Requests Policies
DROP POLICY IF EXISTS "Interest requests select" ON public.interest_requests;
CREATE POLICY "Interest requests select" ON public.interest_requests FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Interest requests insert" ON public.interest_requests;
CREATE POLICY "Interest requests insert" ON public.interest_requests FOR INSERT
WITH CHECK (auth.uid() = sender_id AND NOT public.are_blocked(sender_id, receiver_id));

DROP POLICY IF EXISTS "Interest requests update" ON public.interest_requests;
CREATE POLICY "Interest requests update" ON public.interest_requests FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Conversations Policies
DROP POLICY IF EXISTS "Conversations select" ON public.conversations;
CREATE POLICY "Conversations select" ON public.conversations FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages Policies
DROP POLICY IF EXISTS "Messages select" ON public.messages;
CREATE POLICY "Messages select" ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Messages insert" ON public.messages;
CREATE POLICY "Messages insert" ON public.messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
        AND NOT public.are_blocked(c.user1_id, c.user2_id)
    )
);

-- Blocks & Reports Policies
DROP POLICY IF EXISTS "Blocks select" ON public.blocks;
CREATE POLICY "Blocks select" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id);
DROP POLICY IF EXISTS "Blocks insert" ON public.blocks;
CREATE POLICY "Blocks insert" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
DROP POLICY IF EXISTS "Blocks delete" ON public.blocks;
CREATE POLICY "Blocks delete" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Reports select" ON public.reports;
CREATE POLICY "Reports select" ON public.reports FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Reports insert" ON public.reports;
CREATE POLICY "Reports insert" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Reports update" ON public.reports;
CREATE POLICY "Reports update" ON public.reports FOR UPDATE USING (public.is_admin(auth.uid()));

-- Audit Logs Policy
DROP POLICY IF EXISTS "Audit logs select" ON public.admin_audit_logs;
CREATE POLICY "Audit logs select" ON public.admin_audit_logs FOR SELECT USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Audit logs insert" ON public.admin_audit_logs;
CREATE POLICY "Audit logs insert" ON public.admin_audit_logs FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

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

    UPDATE public.interest_requests
    SET status = 'accepted', updated_at = now()
    WHERE id = req_id;

    p1 := LEAST(r.sender_id, r.receiver_id);
    p2 := GREATEST(r.sender_id, r.receiver_id);

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

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can read avatar if permitted" ON storage.objects;
CREATE POLICY "Users can read avatar if permitted" ON storage.objects FOR SELECT
USING (
    bucket_id = 'avatars' AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.photo_permissions pp
            WHERE pp.granter_id::text = (storage.foldername(name))[1]
            AND pp.viewer_id = auth.uid()
            AND NOT public.are_blocked(auth.uid(), pp.granter_id)
        )
    )
);

-- ==========================================================
-- 15. SEED DATA (5 Test Accounts with Password: Password123!)
-- ==========================================================
DO $$
DECLARE
    admin_id UUID := '11111111-1111-1111-1111-111111111111';
    tayyaba_id UUID := '22222222-2222-2222-2222-222222222222';
    hamza_id UUID := '33333333-3333-3333-3333-333333333333';
    imran_id UUID := '44444444-4444-4444-4444-444444444444';
    fatima_id UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        phone_change, phone_change_token, email_change_token_current, reauthentication_token,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES
    (
        '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
        'admin@humsafar.local', crypt('Password123!', gen_salt('bf')), now(),
        '', '', '', '', '', '', '', '',
        '{"provider":"email","providers":["email"]}', '{"display_name":"ایڈمن منتظم"}', now(), now()
    ),
    (
        '00000000-0000-0000-0000-000000000000', tayyaba_id, 'authenticated', 'authenticated',
        'tayyaba@humsafar.local', crypt('Password123!', gen_salt('bf')), now(),
        '', '', '', '', '', '', '', '',
        '{"provider":"email","providers":["email"]}', '{"display_name":"طیبہ فاروق"}', now(), now()
    ),
    (
        '00000000-0000-0000-0000-000000000000', hamza_id, 'authenticated', 'authenticated',
        'hamza@humsafar.local', crypt('Password123!', gen_salt('bf')), now(),
        '', '', '', '', '', '', '', '',
        '{"provider":"email","providers":["email"]}', '{"display_name":"حمزہ رشید"}', now(), now()
    ),
    (
        '00000000-0000-0000-0000-000000000000', imran_id, 'authenticated', 'authenticated',
        'imran@humsafar.local', crypt('Password123!', gen_salt('bf')), now(),
        '', '', '', '', '', '', '', '',
        '{"provider":"email","providers":["email"]}', '{"display_name":"عمران شبیر"}', now(), now()
    ),
    (
        '00000000-0000-0000-0000-000000000000', fatima_id, 'authenticated', 'authenticated',
        'fatima@humsafar.local', crypt('Password123!', gen_salt('bf')), now(),
        '', '', '', '', '', '', '', '',
        '{"provider":"email","providers":["email"]}', '{"display_name":"فاطمہ نور"}', now(), now()
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES
    (admin_id, admin_id, json_build_object('sub', admin_id::text, 'email', 'admin@humsafar.local'), 'email', admin_id::text, now(), now(), now()),
    (tayyaba_id, tayyaba_id, json_build_object('sub', tayyaba_id::text, 'email', 'tayyaba@humsafar.local'), 'email', tayyaba_id::text, now(), now(), now()),
    (hamza_id, hamza_id, json_build_object('sub', hamza_id::text, 'email', 'hamza@humsafar.local'), 'email', hamza_id::text, now(), now(), now()),
    (imran_id, imran_id, json_build_object('sub', imran_id::text, 'email', 'imran@humsafar.local'), 'email', imran_id::text, now(), now(), now()),
    (fatima_id, fatima_id, json_build_object('sub', fatima_id::text, 'email', 'fatima@humsafar.local'), 'email', fatima_id::text, now(), now(), now())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (
        id, display_name, birth_date, gender, city, marital_status, bio, interests,
        partner_preferences, has_disability, disability_notes, avatar_url,
        status, review_notes, is_hidden, role
    ) VALUES
    (
        admin_id, 'ایڈمن منتظم', '1990-01-01', 'male', 'اسلام آباد', 'unmarried',
        'ہم سفر پورٹل کی انتظامیہ اور کوالٹی اشورینس۔', ARRAY['انتظامیہ', 'کتابیں'],
        '', false, '', '', 'approved', '', false, 'admin'
    ),
    (
        tayyaba_id, 'طیبہ فاروق', '1998-05-14', 'female', 'لاہور', 'unmarried',
        'سافٹ ویئر انجینئر ہوں۔ خود مختار زندگی گزارتی ہوں۔ کتابیں پڑھنا اور باغبانی پسند ہے۔ ایک باوقار، باشعور اور مخلص شریکِ حیات مطلوب ہے جو رشتوں میں برابری اور عزت پر یقین رکھتا ہو۔',
        ARRAY['کتابیں', 'باغبانی', 'ٹیکنالوجی', 'سفر'],
        'تعلیم یافتہ، سلجھا ہوا اور مثبت سوچ کا حامل فرد ہو۔',
        true, 'بچپن سے وہیل چیئر استعمال کرتی ہوں۔ روزمرہ کے امور اور دفتری کام خود مختاری سے سنبھالتی ہوں۔ قابلِ رسائی ماحول ترجیح ہے۔',
        '/assets/demo-tayyaba.png',
        'approved', 'پروفائل منظور ہے', false, 'member'
    ),
    (
        hamza_id, 'حمزہ رشید', '1992-09-20', 'male', 'اسلام آباد', 'divorced',
        'بینکنگ کے شعبے سے وابستہ ہوں۔ باہمی عزت اور ذہنی ہم آہنگی کو شادی کی بنیاد سمجھتا ہوں۔ سادگی اور شفافیت پسند ہے۔',
        ARRAY['سیاحت', 'فٹنس', 'فوٹوگرافی'],
        'سنجیدہ، صابر اور نیک دل شریکِ حیات ہو۔ بچوں کے حوالے سے باہمی مشاورت سے فیصلہ ہو گا۔',
        false, '', '/assets/demo-hamza.png',
        'approved', 'پروفائل منظور ہے', false, 'member'
    ),
    (
        imran_id, 'عمران شبیر', '1988-02-10', 'male', 'کراچی', 'widowed',
        'اپنا کاروبار ہے۔ شریکِ حیات کی وفات کے بعد زندگی میں دوبارہ سکون، محبت اور مخلص ساتھی کی تلاش ہے۔ فیملی اقدار عزیز ہیں۔',
        ARRAY['بزنس', 'سیر و تفریح', 'مطالعہ'],
        'گھریلو اور شائستہ طبیعت کی حامل خاتون، جو رشتوں کی قدر دان ہو۔',
        false, '', '/assets/demo-imran.png',
        'approved', 'پروفائل منظور ہے', false, 'member'
    ),
    (
        fatima_id, 'فاطمہ نور', '1997-11-01', 'female', 'راولپنڈی', 'unmarried',
        'تعلیمی ادارے میں تدریس سے منسلک ہوں۔ دینی و اخلاقی اقدار کا احترام کرتی ہوں۔',
        ARRAY['تدریس', 'دستکاری', 'شاعری'],
        'مخلص، باعمل اور باوقار خاندان کا فرد ہو۔',
        false, '', '',
        'pending_review', '', false, 'member'
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        birth_date = EXCLUDED.birth_date,
        city = EXCLUDED.city,
        marital_status = EXCLUDED.marital_status,
        bio = EXCLUDED.bio,
        status = EXCLUDED.status,
        role = EXCLUDED.role;

END $$;
