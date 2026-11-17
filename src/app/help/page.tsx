'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MessageSquare, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function HelpPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#45071A] mb-3">
            رہنمائی اور مدد (ہیلپ سینٹر)
          </h1>
          <p className="text-base sm:text-lg text-[#6E4F5C]">
            ہماری معاون ٹیم آپ کی رازداری اور اطمینان کے لیے ہمیشہ حاضر ہے۔
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] flex items-center justify-center text-[#850E35]">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#3D1D28]">ای میل سپورٹ</h3>
            <p className="text-sm text-[#523A44] leading-relaxed">
              کسی بھی تکنیکی خرابی، پروفائل منظوری یا سوال کے لیے ہمیں ای میل ارسال کریں:
            </p>
            <p className="text-sm font-semibold text-[#850E35] dir-ltr text-right">
              support@humsafar.local
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] flex items-center justify-center text-[#850E35]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#3D1D28]">عام سوالات و جوابات</h3>
            <p className="text-sm text-[#523A44] leading-relaxed">
              عام ترجیحات، پرائیویسی کنٹرولز اور رابطے کے قواعد کے لیے ہمارے ہوم پیج پر سوالات کا سیکشن دیکھیں۔
            </p>
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DFD5] shadow-xs">
          <h2 className="text-xl font-bold text-[#3D1D28] mb-4">
            معاون ٹیم کو پیغام بھیجیں
          </h2>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-emerald-900">آپ کا پیغام موصول ہو گیا ہے!</p>
              <p className="text-sm text-emerald-700">ہماری ٹیم جلد از جلد آپ کے فراہم کردہ ای میل پر جواب دے گی۔</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="help-name" className="block text-sm font-semibold text-[#3D1D28] mb-1">
                    آپ کا نام
                  </label>
                  <input
                    id="help-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor="help-email" className="block text-sm font-semibold text-[#3D1D28] mb-1">
                    ای میل ایڈریس
                  </label>
                  <input
                    id="help-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right ltr-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="help-message" className="block text-sm font-semibold text-[#3D1D28] mb-1">
                  پیغام کی تفصیل
                </label>
                <textarea
                  id="help-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اپنا مسئلہ یا سوال یہاں تحریر کریں..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#850E35] hover:bg-[#6D092A] text-white font-bold rounded-xl transition shadow-xs"
              >
                پیغام ارسال کریں
              </button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
