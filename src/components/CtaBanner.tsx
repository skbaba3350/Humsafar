import Link from 'next/link';
import Image from 'next/image';

export default function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-[#530822] text-white py-14 md:py-20 px-4 sm:px-6">
      {/* Corner floral decorations */}
      <div className="absolute inset-y-0 right-0 pointer-events-none opacity-85 flex items-center">
        <Image
          src="/assets/flower-br.png"
          alt=""
          width={180}
          height={160}
          className="w-24 sm:w-36 md:w-48 h-auto object-contain"
        />
      </div>
      <div className="absolute inset-y-0 left-0 pointer-events-none opacity-85 flex items-center">
        <Image
          src="/assets/flower-bl.png"
          alt=""
          width={180}
          height={160}
          className="w-24 sm:w-36 md:w-48 h-auto object-contain"
        />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FFF6EB]"
          style={{ lineHeight: 2.2 }}
        >
          اپنا تعارف اپنی شرائط پر شروع کریں
        </h2>
        <div className="pt-2">
          <Link
            href="/auth/signup"
            className="inline-block px-10 py-3 text-base sm:text-lg font-bold text-[#45071A] bg-white hover:bg-[#FFF5EC] rounded-full transition-all shadow-lg active:scale-95"
          >
            پروفائل بنائیں
          </Link>
        </div>
      </div>
    </section>
  );
}
