import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#45071A] mb-6">
          ہم سفر کا تعارف
        </h1>
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DFD5] shadow-xs space-y-4 text-lg text-[#3D1D28] leading-relaxed">
          <p>
            «ہم سفر» ایک ایسا باوقار اور سنجیدہ رشتہ پلیٹ فارم ہے جو پہلی یا دوبارہ شادی کے خواہشمند بالغ افراد کے لیے ڈیزائن کیا گیا ہے۔
          </p>
          <p>
            ہماری اولین ترجیح ان افراد کو مساوی، محفوظ اور احترام پر مبنی موقع فراہم کرنا ہے جو طلاق یافتہ ہیں، جن کے شریکِ حیات وفات پا چکے ہیں، یا جو معذوری (Disability) کے ساتھ خود مختار اور پُراعتماد زندگی گزار رہے ہیں۔
          </p>
          <h2 className="text-2xl font-bold text-[#850E35] pt-4">ہمارے بنیادی اصول</h2>
          <ul className="list-disc list-inside space-y-2 text-base text-[#523A44]">
            <li>عوامی تشہیر سے پاک نجی ماحول</li>
            <li>تصویر اور تفصیلی کوائف پر مکمل ذاتی کنٹرول</li>
            <li>ایڈمن کے ذریعے ہر پروفائل کی انسانی جانچ پڑتال</li>
            <li>باہمی رضامندی کے بغیر گفتگو کا کوئی امکان نہیں</li>
          </ul>
        </div>
      </div>
      <Footer />
    </main>
  );
}
