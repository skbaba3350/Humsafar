import Image from 'next/image';

export default function WelcomeSection() {
  return (
    <section className="py-14 md:py-20 bg-[#FDEFF2] px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Right side (RTL first): Text */}
        <div className="md:col-span-6 flex flex-col items-start text-right space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#3D0A1C] pb-2">
            ہر نئے آغاز کی
            <br />
            اپنی کہانی ہے
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-[#5F2436] leading-loose max-w-lg">
            پہلی یا دوبارہ شادی کے خواہش مند بالغ افراد کو خوش آمدید۔
          </p>
        </div>

        {/* Left side (RTL second): Family/Adults Illustration Image */}
        <div className="md:col-span-6 flex justify-center">
          <div className="relative w-full max-w-[520px] h-[250px] sm:h-[300px] md:h-[340px] rounded-2xl overflow-hidden shadow-lg border-2 border-white/90 bg-[#FAF6F0]">
            <Image
              src="/assets/welcome-family.png"
              alt="پہلی یا دوبارہ شادی کے خواہشمند باوقار بالغ افراد"
              fill
              className="object-cover object-center"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
