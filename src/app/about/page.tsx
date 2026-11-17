import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#45071A] mb-6">
          ہم سفر کا تعارف اور مقصد
        </h1>
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DFD5] shadow-xs space-y-5 text-base sm:text-lg text-[#3D1D28] leading-relaxed">
          <p className="font-semibold text-[#850E35]">
            «ہم سفر» معذوری کے ساتھ زندگی گزارنے والے بالغ افراد کے لیے شادی کے تعارف کی ایک محدود اور باوقار غیر تجارتی کوشش ہے۔
          </p>
          <p>
            ہماری رکنیت کا دائرہ کار خصوصی طور پر ۱۸ سال یا اس سے زائد عمر کے ان افراد کے لیے مختص ہے جو خود کسی بھی نوعیت کی معذوری (چاہے وہ پیدائشی ہو یا کسی حادثے یا بیماری کے سبب لاحق ہوئی ہو) کے ساتھ باوقار زندگی گزار رہے ہوں۔
          </p>
          <p className="p-4 bg-[#FAF0E6] rounded-xl border border-[#850E35]/20 text-sm sm:text-base text-[#3D1D28]">
            <strong>اہلیت کا واضح اصول:</strong> صرف بیوگی، طلاق، بڑی عمر یا دوبارہ شادی کی خواہش اکیلے رکنیت کی اہلیت قائم نہیں کرتی۔ معذوری کے حامل افراد چاہے وہ غیر شادی شدہ ہوں، طلاق یافتہ ہوں یا بیوہ، بلا تفریقِ صنف اہل ہیں۔
          </p>

          <h2 className="text-2xl font-bold text-[#850E35] pt-2">رکنیت کا طریقہ اور حقیقی تصدیق</h2>
          <p>
            رکنیت ذاتی جائزے اور قابلِ اعتماد حقیقی حوالوں سے تصدیق کے بعد منظور کی جاتی ہے۔ صرف دستاویزات منظوری کے لیے کافی نہیں ہیں۔ ایڈمن کم از کم ایک ایسے حقیقی واقف کار سے رابطہ کرتا ہے جس کی ساکھ خود مختار طور پر قائم ہو سکے تاکہ درخواست گزار کی معذوری کی اہلیت اور بنیادی شناخت کی تصدیق کی جا سکے۔
          </p>

          <h2 className="text-2xl font-bold text-[#850E35] pt-2">رازداری اور ذمہ داری</h2>
          <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-[#523A44]">
            <li>آپ کی نجی معلومات اور حوالہ دینے والوں کی تفصیل دوسرے ممبرز کو نہیں دکھائی جائے گی۔</li>
            <li>منظوری کسی فرد کے کردار، نیت یا رشتے کی موزونیت کی ضمانت نہیں۔ ہر اگلا قدم آپ کی اپنی رضامندی سے ہوگا۔</li>
            <li>منظوری کے بعد بھی پروفائل تب تک شائع نہیں ہوتا جب تک آپ خود اسے شائع نہ کریں۔</li>
            <li>تصویر اور نجی گفتگو صرف مخصوص ممبر کو باہمی اجازت کے بعد ہی ممکن ہے۔</li>
          </ul>
        </div>
      </div>
      <Footer />
    </main>
  );
}
