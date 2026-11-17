import Link from 'next/link';

export default function CtaBanner() {
  return (
    <section className="bg-[#FAF8F5] pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto rounded-3xl bg-[#850E35] text-white p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
        
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-radial from-white/10 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FFF6EB]">
            اپنے سفر کا آغاز آج ہی کریں
          </h2>
          <p className="text-sm sm:text-base text-[#F9DFD8] leading-relaxed">
            معذوری کے ساتھ زندگی گزارنے والے باوقار بالغ افراد کے لیے ایک محفوظ اور تصدیق شدہ پلیٹ فارم۔
          </p>
          <div className="pt-2">
            <Link
              href="/auth/signup"
              className="inline-block px-8 py-3.5 text-base sm:text-lg font-bold text-[#850E35] bg-white hover:bg-[#FFF5EC] rounded-full transition-all shadow-md active:scale-95"
            >
              رکنیت کی درخواست جمع کریں
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
