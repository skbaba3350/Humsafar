'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('پاس ورڈ کم از کم ۱۲ حروف پر مشتمل ہونا چاہیے۔');
      return;
    }

    if (password !== confirmPassword) {
      setError('دونوں پاس ورڈز ایک جیسے نہیں ہیں۔');
      return;
    }

    setLoading(true);

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateErr) throw updateErr;

      setSuccess(true);
      setTimeout(() => {
        router.push('/portal/profile');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'پاس ورڈ اپڈیٹ کرنے میں دشواری پیش آئی۔');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
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
        <h2 className="text-2xl font-bold text-[#3D1D28]">نیا پاس ورڈ مقرر کریں</h2>
        <p className="mt-2 text-sm text-[#5C3F4B]">
          اپنے اکاؤنٹ کے لیے نیا اور محفوظ پاس ورڈ درج کریں۔
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-[#E8DFD5] sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-lg text-[#3D1D28]">پاس ورڈ کامیابی سے بدل دیا گیا!</h3>
              <p className="text-xs text-[#6E4F5C]">آپ کو اپنے پروفائل پر منتقل کیا جا رہا ہے...</p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleUpdatePassword}>
              <div>
                <label htmlFor="new-pass" className="block text-sm font-semibold text-[#3D1D28] mb-1">
                  نیا پاس ورڈ
                </label>
                <input
                  id="new-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right ltr-input"
                />
              </div>

              <div>
                <label htmlFor="confirm-pass" className="block text-sm font-semibold text-[#3D1D28] mb-1">
                  پاس ورڈ کی تصدیق
                </label>
                <input
                  id="confirm-pass"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right ltr-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-white font-bold bg-[#850E35] hover:bg-[#6D092A] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <KeyRound className="w-5 h-5" />
                <span>{loading ? 'محفوظ ہو رہا ہے...' : 'پاس ورڈ محفوظ کریں'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
