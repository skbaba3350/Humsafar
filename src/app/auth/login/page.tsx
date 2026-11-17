'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogIn, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInErr) {
        throw signInErr;
      }

      // Check user role
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'admin') {
          setPassword('');
          router.replace('/admin');
        } else {
          setPassword('');
          router.replace('/portal/profile');
        }
      }
    } catch {
      setError('لاگ اِن میں دشواری ہوئی۔ براہ کرم تفصیلات دوبارہ چیک کریں۔');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block mb-4">
          <Image
            src="/assets/logo.png"
            alt="ہم سفر"
            width={160}
            height={50}
            className="h-12 w-auto mx-auto object-contain"
          />
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#3D1D28]">
          اپنے اکاؤنٹ میں لاگ اِن ہوں
        </h2>
        <p className="mt-2 text-sm text-[#5C3F4B]">
          یا{' '}
          <Link href="/auth/signup" className="font-bold text-[#850E35] hover:underline">
            نیا پروفائل رجسٹر کریں
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-[#E8DFD5] sm:px-10">
          
          {error && (
            <div role="alert" className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-[#3D1D28] mb-1">
                ای میل ایڈریس
              </label>
              <input
                id="login-email"
                name="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right ltr-input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-sm font-semibold text-[#3D1D28]">
                  پاس ورڈ
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-[#850E35] hover:underline"
                >
                  پاس ورڈ بھول گئے؟
                </Link>
              </div>
              <input
                id="login-password"
                name="password"
                autoComplete="current-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right ltr-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white font-bold bg-[#850E35] hover:bg-[#6D092A] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LogIn className="w-5 h-5" />
              <span>{loading ? 'لاگ اِن ہو رہا ہے...' : 'لاگ اِن'}</span>
            </button>
          </form>


        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-[#850E35] font-semibold flex items-center justify-center gap-1">
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>واپس ہوم پیج پر جائیں</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
