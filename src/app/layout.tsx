import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ہم سفر - ایک خوبصورت نئے سفر کی شروعات',
  description: 'سنجیدگی سے پہلی یا دوبارہ شادی کا رشتہ تلاش کرنے والے بالغ افراد کے لیے باوقار، محفوظ اور نجی پلیٹ فارم۔',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ur" dir="rtl">
      <body className="min-h-screen flex flex-col font-urdu selection:bg-pink-200 selection:text-burgundy-900">
        {children}
      </body>
    </html>
  );
}
