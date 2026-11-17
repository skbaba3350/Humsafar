'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5] border-b border-[#E8DFD5] shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Right side: Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-block relative">
            <Image
              src="/assets/logo.png"
              alt="ہم سفر"
              width={140}
              height={42}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[#3D1D28] font-medium text-base">
          <Link href="/" className="hover:text-[#850E35] transition-colors">
            ہوم
          </Link>
          <Link href="/#steps" className="hover:text-[#850E35] transition-colors">
            طریقہ کار
          </Link>
          <Link href="/#privacy" className="hover:text-[#850E35] transition-colors">
            رازداری
          </Link>
          <Link href="/#faq" className="hover:text-[#850E35] transition-colors">
            سوالات
          </Link>
        </nav>

        {/* Left side: Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="px-5 py-1.5 text-sm font-medium text-[#2E1820] bg-white border border-[#3D1D28] rounded-full hover:bg-neutral-50 transition-colors shadow-2xs"
          >
            لاگ اِن
          </Link>
          <Link
            href="/auth/signup"
            className="px-5 py-1.5 text-sm font-medium text-white bg-[#850E35] hover:bg-[#6D092A] rounded-full transition-colors shadow-2xs"
          >
            پروفائل بنائیں
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#3D1D28] rounded-md hover:bg-[#F2ECE4] focus:outline-hidden"
            aria-label="مینیو کھولیں"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF8F5] border-b border-[#E8DFD5] px-4 pt-3 pb-5 space-y-3">
          <div className="flex flex-col gap-3 text-right">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-[#3D1D28] hover:text-[#850E35] border-b border-neutral-100"
            >
              ہوم
            </Link>
            <Link
              href="/#steps"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-[#3D1D28] hover:text-[#850E35] border-b border-neutral-100"
            >
              طریقہ کار
            </Link>
            <Link
              href="/#privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-[#3D1D28] hover:text-[#850E35] border-b border-neutral-100"
            >
              رازداری
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-[#3D1D28] hover:text-[#850E35] border-b border-neutral-100"
            >
              سوالات
            </Link>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 text-sm font-medium text-[#2E1820] bg-white border border-[#3D1D28] rounded-full"
            >
              لاگ اِن
            </Link>
            <Link
              href="/auth/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 text-sm font-medium text-white bg-[#850E35] rounded-full"
            >
              پروفائل بنائیں
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
