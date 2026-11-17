import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    // Verify current authenticated session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'غیر مجاز درخواست۔ براہ کرم دوبارہ لاگ اِن کریں۔' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // 1. Delete all avatar files in storage for this user
    try {
      const { data: files } = await adminClient.storage.from('avatars').list(user.id);
      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${user.id}/${f.name}`);
        await adminClient.storage.from('avatars').remove(filePaths);
      }
    } catch (storageErr) {
      console.warn('Storage delete warning:', storageErr);
    }

    // 2. Delete from public.profiles (cascades to requests, messages, conversations, permissions, blocks)
    await adminClient.from('profiles').delete().eq('id', user.id);

    // 3. Delete from auth.users permanently
    const { error: deleteUserErr } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteUserErr) {
      console.error('Auth user delete error:', deleteUserErr);
    }

    // Sign out session
    await supabase.auth.signOut();

    return NextResponse.json({ success: true, message: 'اکاؤنٹ اور تمام ڈیٹا مستقل طور پر حذف کر دیا گیا۔' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'اکاؤنٹ حذف کرنے میں ناکامی ہوئی۔' }, { status: 500 });
  }
}
