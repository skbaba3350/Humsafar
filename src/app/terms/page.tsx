import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#45071A] mb-6">
          قواعد و ضوابط (Terms of Service)
        </h1>
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DFD5] shadow-xs space-y-6 text-base sm:text-lg text-[#3D1D28] leading-relaxed">
          <p className="font-semibold text-[#850E35]">
            «ہم سفر» معذوری کے ساتھ زندگی گزارنے والے باوقار بالغ افراد کے لیے ایک محدود، غیر تجارتی رشتہ تعارف پلیٹ فارم ہے۔
          </p>

          <h2 className="text-xl font-bold text-[#850E35]">۱۔ رکنیت کی اہلیت کا لازمی معیار</h2>
          <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-[#523A44]">
            <li>صرف ۱۸ سال یا اس سے زائد عمر کے بالغ افراد جو خود معذوری کے ساتھ زندگی گزار رہے ہوں، رکنیت کے اہل ہیں۔</li>
            <li>صرف بیوگی، طلاق یا بڑی عمر کا ہونا اکیلے اہلیت قائم نہیں کرتا۔ البتہ معذوری کے حامل افراد چاہے وہ غیر شادی شدہ ہوں، طلاق یافتہ ہوں یا بیوہ، بلا تفریقِ صنف اہل ہیں۔</li>
            <li>خاندان کے افراد یا معاونین مدد کر سکتے ہیں لیکن وہ درخواست گزار کی باخبر ذاتی رضامندی کے بغیر ان کی طرف سے ممبر نہیں بن سکتے۔</li>
          </ul>

          <h2 className="text-xl font-bold text-[#850E35]">۲۔ حقیقی حوالہ اور تصدیق کا عمل</h2>
          <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-[#523A44]">
            <li>رکنیت ذاتی جائزے اور کم از کم ایک قابلِ اعتماد حقیقی واقف کار سے خود مختار تصدیق کے بعد ہی منظور کی جاتی ہے۔</li>
            <li>محض دستاویزات، تصاویر یا دعوے منظوری کے لیے کافی نہیں ہیں۔</li>
            <li>اگر کسی درخواست کے لیے معتبر حوالہ قائم نہ ہو سکے تو درخواست مسترد یا زیرِ التوا رکھی جائے گی، تاہم اس کا مطلب یہ نہیں کہ فرد کو غیر معتبر کہا جائے۔</li>
          </ul>

          <h2 className="text-xl font-bold text-[#850E35]">۳۔ عدم ضمانت اور باہمی چھان بین (Disclaimer)</h2>
          <div className="p-4 bg-[#FAF0E6] rounded-xl border border-[#850E35]/20 text-sm sm:text-base text-[#3D1D28] space-y-2 font-medium">
            <p>
              منظوری کسی فرد کے کردار، نیت یا رشتے کی موزونیت کی ضمانت نہیں۔ ہر اگلا قدم آپ کی اپنی رضامندی سے ہوگا۔
            </p>
            <p className="text-xs text-[#6F4E5D]">
              ہم سفر کسی فرد کی اخلاقی ضمانت، مالی حیثیت یا رشتے کے کامیاب ہونے کا ضامن نہیں بنتا۔ دونوں فریقین اپنے طور پر خاندان اور واقف کاروں کے ذریعے چھان بین کرنے کے خود پابند ہیں۔
            </p>
          </div>

          <h2 className="text-xl font-bold text-[#850E35]">۴۔ حفاظت اور خلاف ورزی پر کارروائی</h2>
          <p className="text-sm sm:text-base text-[#523A44]">
            پلیٹ فارم پر کسی بھی قسم کی بدتمیزی، مالی تقاضا، نامناسب پیغامات یا ہراسانی پر اکاؤنٹ فوری طور پر معطل کیا جائے گا اور شکایت کے شواہد محفوظ کر کے متعلقہ قانونی کارروائی کا حق محفوظ رکھا جائے گا۔
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
