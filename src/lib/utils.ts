import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(birthDateString: string): number {
  if (!birthDateString) return 0;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function formatUrduMaritalStatus(status: string): string {
  switch (status) {
    case 'unmarried':
      return 'غیر شادی شدہ';
    case 'divorced':
      return 'طلاق یافتہ';
    case 'widowed':
      return 'بیوہ / رنڈوا';
    case 'khula':
      return 'خلع یافتہ';
    default:
      return status;
  }
}

export function formatUrduGender(gender: string): string {
  switch (gender) {
    case 'male':
      return 'مرد';
    case 'female':
      return 'خاتون';
    default:
      return gender;
  }
}

export function formatUrduStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'draft':
      return { label: 'ڈرافٹ (نامکمل درخواست)', color: 'bg-neutral-100 text-neutral-700 border-neutral-300' };
    case 'submitted':
      return { label: 'درخواست موصول (ابتدائی جائزہ)', color: 'bg-blue-50 text-blue-800 border-blue-200' };
    case 'under_review':
      return { label: 'زیرِ انفرادی جائزہ', color: 'bg-amber-50 text-amber-800 border-amber-300' };
    case 'additional_info_required':
      return { label: 'مزید معلومات درکار', color: 'bg-orange-50 text-orange-800 border-orange-300' };
    case 'reference_verification_pending':
      return { label: 'حوالہ جات کی تصدیق جاری', color: 'bg-purple-50 text-purple-800 border-purple-300' };
    case 'approved':
      return { label: 'منظور شدہ ممبر', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
    case 'not_approved':
      return { label: 'جائزہ نا مکمل / تصدیق نہ ہو سکی', color: 'bg-rose-50 text-rose-800 border-rose-300' };
    case 'withdrawn':
      return { label: 'درخواست واپس لے لی گئی', color: 'bg-neutral-100 text-neutral-600 border-neutral-300' };
    case 'new_eligibility_review_required':
      return { label: 'معذوری کی اہلیت کا نیا جائزہ درکار', color: 'bg-amber-100 text-amber-900 border-amber-400' };
    case 'suspended':
      return { label: 'اکاؤنٹ معطل شدہ', color: 'bg-red-100 text-red-900 border-red-400' };
    default:
      return { label: status, color: 'bg-neutral-100 text-neutral-700 border-neutral-300' };
  }
}

export function formatUrduReferenceStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'pending':
      return { label: 'تصدیق زیرِ انتظار', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'verified':
      return { label: 'تصدیق شدہ حوالہ', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    case 'unable_to_verify':
      return { label: 'تصدیق ممکن نہ ہو سکی', color: 'bg-neutral-100 text-neutral-700 border-neutral-300' };
    case 'rejected':
      return { label: 'غیر معتبر حوالہ', color: 'bg-rose-50 text-rose-800 border-rose-200' };
    default:
      return { label: status, color: 'bg-neutral-100 text-neutral-700 border-neutral-200' };
  }
}
