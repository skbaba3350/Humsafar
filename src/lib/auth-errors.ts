// Keep provider errors understandable without exposing raw service messages.
export function authEmailErrorMessage(error: unknown, fallback: string): string {
  const details = error as { code?: string; message?: string; status?: number } | null;
  const code = details?.code;
  const message = details?.message?.toLowerCase() || '';

  if (code === 'over_email_send_rate_limit' || message.includes('email rate limit exceeded')) {
    return 'فی الحال ای میل بھیجنے کی حد پوری ہو گئی ہے۔ براہِ کرم کچھ دیر بعد دوبارہ کوشش کریں۔ بار بار بٹن دبانے سے یہ حد ختم نہیں ہوگی۔';
  }
  if (code === 'over_request_rate_limit' || details?.status === 429) {
    return 'مختصر وقت میں بہت زیادہ درخواستیں کی گئی ہیں۔ براہِ کرم کچھ دیر بعد دوبارہ کوشش کریں۔';
  }
  if (code === 'email_address_not_authorized' || message.includes('email address not authorized')) {
    return 'اس وقت آپ کے ای میل ایڈریس پر تصدیقی پیغام نہیں بھیجا جا سکا۔ براہِ کرم انتظامیہ کو اطلاع دیں۔';
  }
  if (code === 'weak_password') {
    return 'براہِ کرم کم از کم ۱۲ حروف پر مشتمل مضبوط اور منفرد پاس ورڈ استعمال کریں۔';
  }
  return fallback;
}
