import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HelpPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#45071A] mb-6">
          رہنمائی اور مدد
        </h1>
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DFD5] shadow-xs space-y-4 text-base sm:text-lg text-[#3D1D28] leading-relaxed">
          <p>
            ہم سفر پورٹل پر کسی بھی مسئلے یا رہنمائی کے لیے ہمارے ایڈمن سپورٹ سے رابطہ کیا جا سکتا ہے۔
          </p>
          <div className="border-t border-[#E8DFD5] pt-4 space-y-2">
            <p className="font-bold text-[#850E35]">اکاؤنٹ یا لاگ اِن کی پریشانی؟</p>
            <p className="text-sm sm:text-base text-[#523A44]">
              اگر پاس ورڈ بھول گئے ہوں تو لاگ اِن پیج پر پاس ورڈ ری سیٹ کا آپشن استعمال کریں۔
            </p>
          </div>
          <div className="border-t border-[#E8DFD5] pt-4 space-y-2">
            <p className="font-bold text-[#850E35]">شکایت یا رپورٹ درج کروانا</p>
            <p className="text-sm sm:text-base text-[#523A44]">
              کسی بھی ناگوار تجربے، نامناسب میسج یا مشکوک پروفائل کو براہِ راست رپورٹ بٹن سے ایڈمن کو بھیجیں۔
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
