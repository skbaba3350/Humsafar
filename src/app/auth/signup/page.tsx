'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { calculateAge } from '@/lib/utils';
import { authEmailErrorMessage } from '@/lib/auth-errors';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [city, setCity] = useState('لاہور');
  const [maritalStatus, setMaritalStatus] = useState<'unmarried' | 'divorced' | 'widowed' | 'khula'>('unmarried');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const submitting = useRef(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    setError('');

    // Check age 18+
    const age = calculateAge(birthDate);
    if (age < 18) {
      setError('ہم سفر پر رجسٹریشن کے لیے کم از کم عمر ۱۸ سال ہونی لازمی ہے۔');
      return;
    }

    if (password.length < 12) {
      setError('پاس ورڈ کم از کم ۱۲ حروف پر مشتمل ہونا چاہیے۔');
      return;
    }

    submitting.current = true;
    setLoading(true);

    try {
      // 1. Supabase auth signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName,
            birth_date: birthDate,
            gender,
            city,
            marital_status: maritalStatus,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // A database trigger creates a member-only profile before email confirmation.
        setSuccess(true);
      }
    } catch (err: unknown) {
      setError(authEmailErrorMessage(err, 'رجسٹریشن مکمل نہیں ہو سکی۔ براہِ کرم اپنی معلومات اور انٹرنیٹ کنکشن چیک کریں۔'));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
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
          رکنیت کے لیے اکاؤنٹ بنائیں
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#850E35] font-semibold bg-[#FAF0E6] p-2.5 rounded-xl border border-[#850E35]/20 max-w-md mx-auto">
          ہم سفر خصوصی طور پر معذوری کے ساتھ زندگی گزارنے والے ۱۸ سال یا زائد عمر کے بالغ افراد کے لیے ہے۔ رجسٹریشن کے بعد حقیقی حوالے سے تصدیق درکار ہوگی۔
        </p>
        <p className="mt-2 text-sm text-[#5C3F4B]">
          پہلے سے اکاؤنٹ موجود ہے؟{' '}
          <Link href="/auth/login" className="font-bold text-[#850E35] hover:underline">
            لاگ اِن ہوں
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-[#E8DFD5] sm:px-10">
          
          {success ? (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#3D1D28]">
                اپنی ای میل کی تصدیق کریں
              </h3>
              <p className="text-sm text-[#5C3F4B] max-w-md mx-auto leading-relaxed">
                اپنے ان باکس اور اسپیم فولڈر میں تصدیقی لنک چیک کریں۔ ای میل کی تصدیق کے بعد لاگ اِن کریں۔ اگر پہلے سے اکاؤنٹ موجود ہے تو لاگ اِن یا پاس ورڈ بحال کرنے کا اختیار استعمال کریں۔
              </p>
              <div className="pt-4">
                <Link
                  href="/auth/login"
                  className="inline-block px-6 py-2.5 bg-[#850E35] text-white font-bold rounded-xl hover:bg-[#6D092A] transition"
                >
                  لاگ اِن صفحہ کھولیں
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div role="alert" className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSignup}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                      نامِ نمائش (Display Name)
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="جیسے: مریم یا علی"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                      تاریخِ پیدائش (کم از کم ۱۸ سال)
                    </label>
                    <input
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right ltr-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                      صنف
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right bg-white"
                    >
                      <option value="female">خاتون</option>
                      <option value="male">مرد</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                      شہر
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="لاہور، اسلام آباد..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                      ازدواجی حیثیت
                    </label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right bg-white"
                    >
                      <option value="unmarried">غیر شادی شدہ</option>
                      <option value="divorced">طلاق یافتہ</option>
                      <option value="widowed">بیوہ / رنڈوا</option>
                      <option value="khula">خلع یافتہ</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F0E6DC]">
                  <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                    ای میل ایڈریس
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right ltr-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                    پاس ورڈ (کم از کم ۱۲ حروف)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={12}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right ltr-input"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl text-white font-bold bg-[#850E35] hover:bg-[#6D092A] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>{loading ? 'رجسٹریشن جاری ہے...' : 'پروفائل رجسٹر کریں'}</span>
                  </button>
                </div>
              </form>
            </>
          )}

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
