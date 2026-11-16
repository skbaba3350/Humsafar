'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  User, 
  Search, 
  HeartHandshake, 
  MessageSquare, 
  Settings, 
  LogOut, 
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';
import { Profile } from '@/lib/types';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) {
        setProfile(prof as Profile);
      }

      // Check pending received requests
      const { count } = await supabase
        .from('interest_requests')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      setPendingRequestsCount(count || 0);
      setLoading(false);
    }

    loadUser();
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navLinks = [
    { href: '/portal/profile', label: 'میرا پروفائل', icon: User },
    { href: '/portal/browse', label: 'رشتے تلاش کریں', icon: Search },
    { 
      href: '/portal/requests', 
      label: 'دلچسپی کی درخواستیں', 
      icon: HeartHandshake,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null
    },
    { href: '/portal/messages', label: 'نجی گفتگو', icon: MessageSquare },
    { href: '/portal/settings', label: 'رازداری اور سیٹنگز', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-[#850E35] font-bold">
        لوڈ ہو رہا ہے...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#E8DFD5] sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-block">
              <Image
                src="/assets/logo.png"
                alt="ہم سفر"
                width={120}
                height={38}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 bg-[#FCE6EC] text-[#850E35] rounded-full">
              ممبر پورٹل
            </span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all relative ${
                    isActive
                      ? 'bg-[#850E35] text-white shadow-2xs'
                      : 'text-[#4A2633] hover:bg-[#F7EFE9]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                  {link.badge ? (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {link.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* User badge and Log out */}
          <div className="flex items-center gap-3">
            {profile?.role === 'admin' && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1 px-3 py-1 text-xs font-bold bg-[#35082A] text-[#FFF6EB] rounded-lg hover:bg-[#25041C]"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>ایڈمن پینل</span>
              </Link>
            )}

            <span className="text-xs sm:text-sm font-bold text-[#3D1D28] hidden lg:inline">
              {profile?.display_name}
            </span>

            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-[#850E35] border border-[#850E35]/30 rounded-lg hover:bg-rose-50 transition flex items-center gap-1"
              title="لاگ آؤٹ"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">لاگ آؤٹ</span>
            </button>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#4A2633] rounded-lg hover:bg-neutral-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile menu items */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#E8DFD5] px-4 py-3 space-y-1">
            {profile?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-lg text-sm font-bold bg-[#35082A] text-white"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>ایڈمن پینل پر جائیں</span>
              </Link>
            )}
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-sm font-semibold ${
                    isActive
                      ? 'bg-[#850E35] text-white'
                      : 'text-[#4A2633] hover:bg-[#F7EFE9]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge ? (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold">
                      {link.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
