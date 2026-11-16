-- Seed data for Humsafar Local Testing
-- Includes 1 Admin and 4 Members (covering disability, divorce, widowed, and pending review)

DO $$
DECLARE
    admin_id UUID := '11111111-1111-1111-1111-111111111111';
    tayyaba_id UUID := '22222222-2222-2222-2222-222222222222';
    hamza_id UUID := '33333333-3333-3333-3333-333333333333';
    imran_id UUID := '44444444-4444-4444-4444-444444444444';
    fatima_id UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
    -- 1. Insert into auth.users if not exists
    -- Password is Password123!
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

    -- Also insert into auth.identities
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES
    (admin_id, admin_id, json_build_object('sub', admin_id::text, 'email', 'admin@humsafar.local'), 'email', admin_id::text, now(), now(), now()),
    (tayyaba_id, tayyaba_id, json_build_object('sub', tayyaba_id::text, 'email', 'tayyaba@humsafar.local'), 'email', tayyaba_id::text, now(), now(), now()),
    (hamza_id, hamza_id, json_build_object('sub', hamza_id::text, 'email', 'hamza@humsafar.local'), 'email', hamza_id::text, now(), now(), now()),
    (imran_id, imran_id, json_build_object('sub', imran_id::text, 'email', 'imran@humsafar.local'), 'email', imran_id::text, now(), now(), now()),
    (fatima_id, fatima_id, json_build_object('sub', fatima_id::text, 'email', 'fatima@humsafar.local'), 'email', fatima_id::text, now(), now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- 2. Insert Profiles
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
