import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#45071A] mb-6">
          رازداری کی پالیسی
        </h1>
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DFD5] shadow-xs space-y-5 text-base sm:text-lg text-[#3D1D28] leading-relaxed">
          <p>
            «ہم سفر» پر آپ کی رازداری اور سلامتی ہماری اولین ذمے داری ہے۔
          </p>
          <h2 className="text-xl font-bold text-[#850E35]">۱۔ عوامی نمائش پر مکمل پابندی</h2>
          <p className="text-sm sm:text-base text-[#523A44]">
            کوئی بھی غیر لاگ اِن صارف یا عام ویب وزٹر آپ کا نام، عمر، شہر یا تصویر نہیں دیکھ سکتا۔ صرف منظور شدہ تصدیق شدہ ممبرز ہی بنیادی تعارف دیکھ سکتے ہیں۔
          </p>
          <h2 className="text-xl font-bold text-[#850E35]">۲۔ تصویر اور نجی نوٹس کا تحفظ</h2>
          <p className="text-sm sm:text-base text-[#523A44]">
            آپ کی تصویر اور رسائی یا معذوری کے نجی نوٹس ڈیفالٹ طور پر محفوظ اور چھپے ہوئے ہیں۔ آپ جسے خود اجازت دیں گے، صرف وہی دیکھ سکے گا، اور آپ کسی بھی لمحے یہ اجازت منسوخ کر سکتے ہیں۔
          </p>
          <h2 className="text-xl font-bold text-[#850E35]">۳۔ ڈیٹا کا خاتمہ</h2>
          <p className="text-sm sm:text-base text-[#523A44]">
            اکاؤنٹ حذف کرنے پر آپ کا تمام ریکارڈ ڈیٹا بیس اور اسٹوریج سے ہمیشہ کے لیے مٹا دیا جاتا ہے۔
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
