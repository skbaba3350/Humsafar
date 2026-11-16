import { User, Mail, MessageCircle } from 'lucide-react';

export default function StepsSection() {
  const steps = [
    {
      id: 1,
      icon: User,
      title: 'اپنا تعارف بنائیں',
      desc: 'اپنی بنیادی معلومات اور پسند کی ترجیحات کے ساتھ پروفائل تیار کریں۔',
      bg: 'bg-[#FCE6EC]',
      iconColor: 'text-[#850E35]',
    },
    {
      id: 2,
      icon: Mail,
      title: 'دلچسپی کی درخواست بھیجیں',
      desc: 'مناسب پروفائل دیکھ کر اپنی دلچسپی کی درخواست بھیجیں۔',
      bg: 'bg-[#FDECE2]',
      iconColor: 'text-[#C65D21]',
    },
    {
      id: 3,
      icon: MessageCircle,
      title: 'دونوں کی رضامندی سے بات شروع کریں',
      desc: 'دلچسپی کی تصدیق کے بعد باہمی رضامندی سے گفتگو کا آغاز کریں۔',
      bg: 'bg-[#EFE8F7]',
      iconColor: 'text-[#6B3FA0]',
    },
  ];

  return (
    <section id="steps" className="py-16 md:py-24 bg-[#FAF8F5] px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Title with golden divider lines */}
        <div className="flex items-center justify-center gap-4 mb-12 sm:mb-16">
          <span className="hidden sm:inline-block h-px w-20 md:w-32 bg-linear-to-r from-transparent to-[#D4AF37]"></span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#3D1D28] text-center">
            رشتہ تلاش کرنے کا آسان طریقہ
          </h2>
          <span className="hidden sm:inline-block h-px w-20 md:w-32 bg-linear-to-l from-transparent to-[#D4AF37]"></span>
        </div>

        {/* Three step cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`${step.bg} rounded-2xl p-8 flex flex-col items-center text-center shadow-xs border border-black/5 hover:shadow-md transition-shadow duration-200`}
              >
                <div className="w-16 h-16 rounded-full bg-white/70 flex items-center justify-center mb-5 shadow-2xs">
                  <Icon className={`w-8 h-8 ${step.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-[#2D1A22] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm sm:text-base text-[#523A44] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
