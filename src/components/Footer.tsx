import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[#FAF8F5] border-t border-[#E8DFD5] py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Right side in RTL: Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-block">
            <Image
              src="/assets/logo-footer.png"
              alt="ہم سفر"
              width={130}
              height={40}
              className="h-9 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Left side in RTL: Links separated by vertical dividers */}
        <div className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base text-[#4A2633] font-medium">
          <Link href="/about" className="hover:text-[#850E35] transition-colors">
            تعارف
          </Link>
          <span className="text-[#C69214]">|</span>
          <Link href="/privacy" className="hover:text-[#850E35] transition-colors">
            رازداری
          </Link>
          <span className="text-[#C69214]">|</span>
          <Link href="/terms" className="hover:text-[#850E35] transition-colors">
            شرائط
          </Link>
          <span className="text-[#C69214]">|</span>
          <Link href="/help" className="hover:text-[#850E35] transition-colors">
            مدد
          </Link>
        </div>

      </div>
    </footer>
  );
}
