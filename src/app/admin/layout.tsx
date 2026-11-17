'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Users, LogOut, ArrowRight, AlertTriangle } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_suspended')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin' || profile.is_suspended) {
        alert('اس صفحے تک رسائی صرف مجاز ایڈمن کو حاصل ہے۔');
        router.push('/portal/profile');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    }

    checkAdmin();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-[#850E35]">لوڈ ہو رہا ہے...</div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <header className="bg-[#35082A] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-block bg-white/10 px-3 py-1 rounded-xl">
              <Image
                src="/assets/logo.png"
                alt="ہم سفر"
                width={110}
                height={35}
                className="h-8 w-auto object-contain brightness-200"
              />
            </Link>
            <div className="flex items-center gap-1.5 text-xs font-bold bg-[#D4AF37] text-[#24041C] px-3 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4" />
              <span>ایڈمن کنٹرول روم</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/portal/profile"
              className="text-xs font-semibold text-[#F7EFE9] hover:underline flex items-center gap-1"
            >
              <span>ممبر پورٹل</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg text-white transition flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>لاگ آؤٹ</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
