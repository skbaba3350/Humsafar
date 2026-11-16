'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export default function FaqSection() {
  const faqs: FaqItem[] = [
    {
      id: 1,
      question: 'میرا پروفائل کون دیکھ سکے گا؟',
      answer:
        'عوامی ہوم پیج پر کوئی پروفائل یا تصویر کبھی ظاہر نہیں ہوتی۔ صرف پورٹل کے وہ فعال بالغ ارکان جن کا اپنا پروفائل ایڈمن سے منظور شدہ ہو، وہی دوسرے منظور شدہ ارکان کا محدود تعارف دیکھ سکتے ہیں۔ اس کے علاوہ آپ کسی بھی وقت سیٹنگز سے اپنا پروفائل تلاش سے چھپا سکتے ہیں۔',
    },
    {
      id: 2,
      question: 'کیا تصویر دینا ضروری ہے؟',
      answer:
        'تصویر فراہم کرنا مکمل طور پر اختیاری ہے۔ اگر آپ تصویر اپلوڈ بھی کرتے ہیں تو وہ مکمل پرائیویٹ رہتی ہے۔ آپ جسے خود اجازت دیں گے صرف وہی مخصوص ممبر آپ کی تصویر دیکھ سکے گا، اور آپ جب چاہیں یہ اجازت فوری واپس لے سکتے ہیں۔',
    },
    {
      id: 3,
      question: 'گفتگو کب شروع ہوگی؟',
      answer:
        'گفتگو صرف باہمی رضامندی سے شروع ہوتی ہے۔ جب آپ کسی کو دلچسپی کی درخواست بھیجیں اور وہ اسے قبول کر لے، یا کسی کی درخواست آپ قبول کریں، تب ہی دونوں کے درمیان ایک محفوظ اور نجی چیٹ ونڈو کھلتی ہے۔ یکطرفہ یا نامناسب پیغامات کی گنجائش نہیں ہے۔',
    },
  ];

  const [openId, setOpenId] = useState<number | null>(null);

  const toggle = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-[#FAF8F5] px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Title */}
        <div className="flex items-center justify-center gap-4 mb-12 sm:mb-16">
          <span className="hidden sm:inline-block h-px w-20 md:w-32 bg-linear-to-r from-transparent to-[#D4AF37]"></span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#3D1D28] text-center">
            عام سوالات
          </h2>
          <span className="hidden sm:inline-block h-px w-20 md:w-32 bg-linear-to-l from-transparent to-[#D4AF37]"></span>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="border border-[#E2D6C8] rounded-xl bg-white overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="w-full py-4 px-6 flex items-center justify-between text-right text-base sm:text-lg font-bold text-[#3D1D28] hover:bg-[#FFFDFB] transition-colors focus:outline-hidden"
                  aria-expanded={isOpen}
                >
                  <span className="leading-snug">{faq.question}</span>
                  <span className="text-[#850E35] shrink-0 ml-4">
                    {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-[#5E424D] text-sm sm:text-base leading-relaxed border-t border-[#F2ECE4] bg-[#FDFBF9]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
