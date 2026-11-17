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
      question: 'ہم سفر پر رکنیت کی اہلیت کا کیا معیار ہے؟',
      answer:
        'ہم سفر خصوصی طور پر ۱۸ سال یا زائد عمر کے ان بالغ افراد کے لیے ہے جو خود کسی پیدائشی، حادثاتی یا بیماری کے سبب پیدا ہونے والی معذوری کے ساتھ زندگی گزار رہے ہوں۔ بیوگی، طلاق یا بڑی عمر کا ہونا اکیلے رکنیت کا حقدار نہیں بناتا۔ البتہ معذوری کے حامل افراد چاہے وہ غیر شادی شدہ ہوں، طلاق یافتہ ہوں یا بیوہ، سب کے لیے یکساں معیار ہے۔',
    },
    {
      id: 2,
      question: 'رکنیت کی منظوری کا طریقہ کار کیا ہے؟',
      answer:
        'ہم سفر پر فوری یا خودکار رکنیت نہیں ملتی۔ درخواست جمع کروانے کے بعد ایڈمن کی جانب سے کم از کم ایک ایسے باخبر اور معتبر حقیقی حوالے سے رابطہ کر کے اہلیت کی خود مختار تصدیق کی جاتی ہے جسے ایڈمن پہلے سے جانتا ہو یا جس کی ساکھ قائم کی جا سکے۔ محض دستاویزات یا دعوے منظوری کے لیے کافی نہیں ہیں۔',
    },
    {
      id: 3,
      question: 'کیا میری معذوری کی تفصیل اور حوالہ جات دوسروں کو نظر آئیں گے؟',
      answer:
        'ہرگز نہیں۔ آپ کی قانونی شناخت، معذوری کی تفصیلی وضاحت، رہائشی تفصیلات اور حوالہ دینے والوں کی معلومات صرف مجاز ایڈمن کے جائزے تک محدود رہتی ہیں۔ ممبر ڈائریکٹری میں یہ حساس معلومات کبھی شامل نہیں ہوتیں۔',
    },
    {
      id: 4,
      question: 'کیا منظوری کا مطلب کردار یا رشتے کی گارنٹی ہے؟',
      answer:
        'منظوری کسی فرد کے کردار، نیت یا رشتے کی موزونیت کی ضمانت نہیں۔ یہ صرف اس بات کی تصدیق ہے کہ فرد کی معذوری اور بنیادی شناخت کے متعلق حقیقی حوالے سے رابطہ مکمل ہوا ہے۔ ہر اگلا قدم آپ کی اپنی آزادانہ رضامندی سے ہوگا۔',
    },
    {
      id: 5,
      question: 'کیا تصویر دینا اور پروفائل شائع کرنا لازمی ہے؟',
      answer:
        'تصویر فراہم کرنا مکمل اختیاری ہے اور نجی رہتی ہے جو صرف آپ کی صریح اجازت سے مخصوص ممبر کو دکھائی جا سکتی ہے۔ اس کے علاوہ منظوری کے بعد بھی آپ کا پروفائل خود بخود شائع نہیں ہوتا بلکہ آپ کو خود پورٹل سے پروفائل شائع کرنے کا اختیار ہوتا ہے۔',
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
          <span className="hidden sm:inline-block h-px w-20 md:w-32 bg-gradient-to-r from-transparent to-[#D4AF37]"></span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#3D1D28] text-center">
            عام سوالات و جوابات
          </h2>
          <span className="hidden sm:inline-block h-px w-20 md:w-32 bg-gradient-to-l from-transparent to-[#D4AF37]"></span>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="border border-[#E2D6C8] rounded-xl bg-white overflow-hidden transition-all shadow-xs"
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
