import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#530822] text-white py-12 md:py-20 px-4 sm:px-6">
      {/* Background floral flourishes */}
      <div className="absolute top-0 right-0 pointer-events-none opacity-85 z-0">
        <Image
          src="/assets/flower-tr.png"
          alt=""
          width={180}
          height={260}
          className="w-28 sm:w-44 md:w-56 h-auto object-contain"
        />
      </div>
      <div className="absolute top-0 left-0 pointer-events-none opacity-85 z-0">
        <Image
          src="/assets/flower-tl.png"
          alt=""
          width={180}
          height={260}
          className="w-24 sm:w-36 md:w-48 h-auto object-contain"
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Right column on desktop (First in RTL): Headings and Buttons */}
        <div className="md:col-span-7 flex flex-col items-start text-right space-y-4">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#FFF8EE] mb-2"
            style={{ lineHeight: 2.3 }}
          >
            ایک خوبصورت نئے
            <br />
            سفر کی شروعات
          </h1>
          
          <p
            className="text-base sm:text-lg md:text-xl text-[#F9DFD8] max-w-xl font-normal pt-2"
            style={{ lineHeight: 2.0 }}
          >
            اپنی پسند، رازداری اور باہمی رضامندی کے ساتھ شادی کا رشتہ تلاش کریں۔
          </p>

          <div className="pt-4 flex flex-wrap gap-4 items-center">
            <Link
              href="/auth/signup"
              className="px-8 py-3 text-base sm:text-lg font-bold text-[#45071A] bg-white hover:bg-[#FFF5EC] rounded-full transition-all shadow-md active:scale-95"
            >
              اپنا پروفائل بنائیں
            </Link>
            
            <a
              href="#steps"
              className="px-8 py-3 text-base sm:text-lg font-semibold text-white border-2 border-white/90 hover:bg-white/10 rounded-full transition-all active:scale-95"
            >
              طریقہ جانیں
            </a>
          </div>
        </div>

        {/* Left column on desktop (Second in RTL): Hero Arch Couple Image */}
        <div className="md:col-span-5 flex justify-center items-center">
          <div className="relative w-[290px] h-[360px] sm:w-[350px] sm:h-[430px] rounded-t-[180px] overflow-hidden border-4 border-[#D4AF37] shadow-2xl bg-[#3A0516]">
            <Image
              src="/assets/hero-couple.png"
              alt="باوقار شریکِ حیات اور مسرور جوڑا"
              fill
              className="object-cover object-top"
              priority
            />
          </div>
        </div>

      </div>
    </section>
  );
}
