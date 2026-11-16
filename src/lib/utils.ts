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
      return 'عورت';
    default:
      return gender;
  }
}

export function formatUrduStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'draft':
      return { label: 'ڈرافٹ (نامکمل)', color: 'bg-gray-100 text-gray-700 border-gray-300' };
    case 'pending_review':
      return { label: 'زیرِ جائزہ (انتظار)', color: 'bg-amber-50 text-amber-800 border-amber-300' };
    case 'approved':
      return { label: 'منظور شدہ (فعال)', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
    case 'changes_requested':
      return { label: 'ترمیم کی ضرورت', color: 'bg-rose-50 text-rose-800 border-rose-300' };
    case 'suspended':
      return { label: 'معطل شدہ', color: 'bg-red-100 text-red-900 border-red-400' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-300' };
  }
}
