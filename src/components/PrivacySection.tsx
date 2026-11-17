import { Image as ImageIcon, MessageSquare, ShieldCheck, Lock } from 'lucide-react';

export default function PrivacySection() {
  return (
    <section id="privacy" className="py-14 md:py-18 bg-[#35082A] text-white px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Title with decorative lines */}
        <div className="flex items-center justify-center gap-4">
          <span className="hidden sm:inline-block h-px w-16 md:w-28 bg-[#D4AF37]/60"></span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FFF6EB] text-center">
            آپ کی معلومات، آپ کے اختیار میں
          </h2>
          <span className="hidden sm:inline-block h-px w-16 md:w-28 bg-[#D4AF37]/60"></span>
        </div>

        {/* 3 Privacy Pillars with dividers */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#D4AF37]/40 gap-6 md:gap-0">
          
          {/* Point 1 (Rightmost in RTL) */}
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-14 h-14 rounded-full border border-[#D4AF37] flex items-center justify-center mb-4 bg-white/5">
              <ImageIcon className="w-7 h-7 text-[#E5B842]" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-[#FFF3E3]">
              تصویر آپ کی صریح اجازت سے
            </h3>
          </div>

          {/* Point 2 (Center) */}
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-14 h-14 rounded-full border border-[#D4AF37] flex items-center justify-center mb-4 bg-white/5">
              <MessageSquare className="w-7 h-7 text-[#E5B842]" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-[#FFF3E3]">
              گفتگو باہمی منظوری اور رضامندی سے
            </h3>
          </div>

          {/* Point 3 (Leftmost in RTL) */}
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-14 h-14 rounded-full border border-[#D4AF37] flex items-center justify-center mb-4 bg-white/5">
              <ShieldCheck className="w-7 h-7 text-[#E5B842]" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-[#FFF3E3]">
              بلاک، رپورٹ اور پروفائل چھپانے کا حق
            </h3>
          </div>

        </div>

        {/* Sensitive Privacy Guarantee & Disclaimer Banner */}
        <div className="bg-white/10 rounded-2xl p-6 border border-[#D4AF37]/30 text-center space-y-3 max-w-3xl mx-auto">
          <p className="text-base sm:text-lg text-[#FFF3E3] font-bold">
            آپ کی نجی معلومات اور حوالہ دینے والوں کی تفصیل دوسرے ممبرز کو نہیں دکھائی جائے گی۔
          </p>
          <p className="text-xs sm:text-sm text-[#F7DFD4] leading-relaxed">
            منظوری کسی فرد کے کردار، نیت یا رشتے کی موزونیت کی ضمانت نہیں۔ ہر اگلا قدم آپ کی اپنی رضامندی سے ہوگا۔
          </p>
        </div>

      </div>
    </section>
  );
}
