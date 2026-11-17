import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#45071A] mb-6">
          رازداری اور ڈیٹا کے تحفظ کی پالیسی
        </h1>
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DFD5] shadow-xs space-y-6 text-base sm:text-lg text-[#3D1D28] leading-relaxed">
          <p className="font-semibold text-[#850E35]">
            «ہم سفر» پر آپ کی رازداری، ذاتی معلومات اور حوالہ جات کا تحفظ ہماری بنیادی ترجیح ہے۔
          </p>

          <h2 className="text-xl font-bold text-[#850E35]">۱۔ حوالہ جات اور نجی تفصیلات کا عدم افشا</h2>
          <p className="text-sm sm:text-base text-[#523A44]">
            آپ کی نجی معلومات، قانونی شناخت، رابطہ نمبر اور حوالہ دینے والوں کی تفصیل دوسرے ممبرز یا عمومی ڈائریکٹری میں کبھی ظاہر نہیں کی جاتی۔ یہ معلومات صرف مجاز ایڈمنسٹریٹر کے جائزے اور تصدیقی رابطے کے لیے محفوظ رکھی جاتی ہیں۔
          </p>

          <h2 className="text-xl font-bold text-[#850E35]">۲۔ معذوری کی نوعیت کا تحفظ</h2>
          <p className="text-sm sm:text-base text-[#523A44]">
            درخواست میں تحریر کردہ معذوری کی وضاحت اور رسائی کی ضرورت عوامی پروفائل کارڈ پر شائع نہیں کی جاتی۔ رکنیت کی اہلیت کی تصدیق کے بعد بھی تفصیلی معروضی معلومات مکمل طور پر نجی رہتی ہیں۔
          </p>

          <h2 className="text-xl font-bold text-[#850E35]">۳۔ پروفائل شائع کرنے کا ذاتی اختیار</h2>
          <p className="text-sm sm:text-base text-[#523A44]">
            رکنیت کی منظوری کے بعد بھی آپ کا پروفائل خود بخود ڈائریکٹری میں شائع نہیں ہوتا۔ ممبر کو خود پورٹل سے پروفائل شائع (Publish) کرنے یا چھپانے کا مکمل اختیار حاصل رہتا ہے۔
          </p>

          <h2 className="text-xl font-bold text-[#850E35]">۴۔ تصویر اور رابطے کی صریح اجازت</h2>
          <p className="text-sm sm:text-base text-[#523A44]">
            تصویر مکمل پرائیویٹ اسٹوریج میں رہتی ہے۔ جب آپ خود کسی مخصوص ممبر کو اجازت دیں گے صرف تبھی وہ تصویر دیکھ سکے گا، اور یہ اجازت کسی بھی وقت واپس لی جا سکتی ہے۔
          </p>

          <h2 className="text-xl font-bold text-[#850E35]">۵۔ کالز یا ویڈیو ریکارڈنگ کی ممانعت</h2>
          <p className="text-sm sm:text-base text-[#523A44]">
            ہم سفر کے جائزے کے دوران کسی قسم کی غیر ضروری ویڈیو یا آڈیو ریکارڈنگ نہیں کی جاتی اور نہ ہی کوئی حساس طبی دستاویزات یا مداخلت پر مبنی جسمانی معائنے طلب کیے جاتے ہیں۔ صرف تصدیق کا ایک مختصر معروضی نوٹ محفوظ کیا جاتا ہے۔
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
