import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#45071A] mb-6">
          شرائط و ضوابط
        </h1>
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DFD5] shadow-xs space-y-4 text-base sm:text-lg text-[#3D1D28] leading-relaxed">
          <p>
            ہم سفر پورٹل کو استعمال کرنے والے تمام ارکان درج ذیل شرائط کے پابند ہیں:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-[#523A44]">
            <li>صرف ۱۸ سال یا اس سے زیادہ عمر کے بالغ افراد ہی رجسٹریشن کر سکتے ہیں۔</li>
            <li>پروفائل میں فراہم کردہ تمام معلومات کا سچا اور حقیقی ہونا لازمی ہے۔</li>
            <li>کسی بھی قسم کی ہراسانی، نامناسب رویہ یا مالی تقاضا اکاؤنٹ کی فوری معطلی کا سبب بنے گا۔</li>
            <li>پلیٹ فارم سنجیدہ نکاح اور شادی کے مقاصد کے لیے مخصوص ہے۔</li>
          </ul>
        </div>
      </div>
      <Footer />
    </main>
  );
}
