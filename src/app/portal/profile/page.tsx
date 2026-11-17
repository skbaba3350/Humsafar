'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import { 
  calculateAge, 
  formatUrduMaritalStatus, 
  formatUrduStatus, 
  formatUrduGender 
} from '@/lib/utils';
import { 
  Save, 
  Send, 
  Eye, 
  Lock, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Accessibility 
} from 'lucide-react';

export default function ProfilePage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [city, setCity] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<any>('unmarried');
  const [bio, setBio] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [partnerPreferences, setPartnerPreferences] = useState('');
  const [hasDisability, setHasDisability] = useState(false);
  const [disabilityNotes, setDisabilityNotes] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
        setDisplayName(data.display_name || '');
        setBirthDate(data.birth_date || '');
        setGender(data.gender || 'female');
        setCity(data.city || '');
        setMaritalStatus(data.marital_status || 'unmarried');
        setBio(data.bio || '');
        setInterestsText((data.interests || []).join('، '));
        setPartnerPreferences(data.partner_preferences || '');
        setHasDisability(data.has_disability || false);
        setDisabilityNotes(data.disability_notes || '');
        
        if (data.avatar_url) {
          if (data.avatar_url.startsWith('http')) {
            setAvatarUrl(data.avatar_url);
          } else {
            const { data: signed } = await supabase.storage
              .from('avatars')
              .createSignedUrl(data.avatar_url, 3600);
            setAvatarUrl(signed?.signedUrl || '');
          }
        } else {
          setAvatarUrl('');
        }
      }
      setLoading(false);
    }

    fetchProfile();
  }, []);

  const handleSave = async (submitForReview: boolean = false) => {
    if (!profile) return;
    setSaving(true);
    setMsg(null);

    const interests = interestsText
      .split(/[،,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const newStatus = submitForReview ? 'pending_review' : profile.status === 'approved' ? 'pending_review' : profile.status;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          birth_date: birthDate,
          gender,
          city,
          marital_status: maritalStatus,
          bio,
          interests,
          partner_preferences: partnerPreferences,
          has_disability: hasDisability,
          disability_notes: disabilityNotes,
          avatar_url: avatarUrl,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              display_name: displayName,
              birth_date: birthDate,
              gender,
              city,
              marital_status: maritalStatus,
              bio,
              interests,
              partner_preferences: partnerPreferences,
              has_disability: hasDisability,
              disability_notes: disabilityNotes,
              avatar_url: avatarUrl,
              status: newStatus,
            }
          : null
      );

      setMsg({
        type: 'success',
        text: submitForReview
          ? 'پروفائل جائزے کے لیے بھیج دیا گیا ہے۔ ایڈمن جلد اس کا معائنہ کرے گا۔'
          : 'تبدیلیاں کامیابی سے محفوظ ہو گئیں۔',
      });
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || 'ڈیٹا محفوظ کرنے میں ناکامی ہوئی۔ براہ کرم فیلڈز چیک کریں۔',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !profile) return;
    const file = e.target.files[0];
    
    // Check type and size (max 5MB)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('صرف JPG، PNG یا WEBP تصاویر اپلوڈ کی جا سکتی ہیں۔');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('تصویر کا حجم ۵ میگا بائٹ سے کم ہونا چاہیے۔');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.id}/avatar.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update avatar_url with filePath in database
      await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', profile.id);

      // Create signed URL for display from private bucket
      const { data: signedData } = await supabase.storage
        .from('avatars')
        .createSignedUrl(filePath, 3600);

      setAvatarUrl(signedData?.signedUrl || '');
      setMsg({
        type: 'success',
        text: 'تصویر پرائیویٹ اسٹوریج میں محفوظ ہو گئی۔ یہ صرف آپ کی اجازت سے دوسروں کو نظر آئے گی۔',
      });
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || 'تصویر اپلوڈ کرنے میں رکاوٹ آئی۔',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-[#850E35]">لوڈ ہو رہا ہے...</div>;
  }

  const statusInfo = formatUrduStatus(profile?.status || 'draft');
  const userAge = calculateAge(birthDate);

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Status and Action Buttons */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#3D1D28]">میرا پروفائل</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-[#6E4F5C] mt-1">
            اپنی ذاتی ترجیحات اور بنیادی تفصیلات کا انتظام کریں۔
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 text-sm font-semibold text-[#4A2633] bg-[#F7EFE9] hover:bg-[#EFE3D9] rounded-xl transition flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            <span>{previewMode ? 'ترمیم موڈ' : 'پیش منظر (Preview)'}</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#523A44] hover:bg-[#3D2B32] rounded-xl transition flex items-center gap-1.5 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>ڈرافٹ محفوظ کریں</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="px-5 py-2 text-sm font-bold text-white bg-[#850E35] hover:bg-[#6D092A] rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span>جائزے کے لیے بھیجیں</span>
          </button>
        </div>
      </div>

      {/* Review Notes Alert if changes requested or rejected */}
      {profile?.review_notes && profile.status === 'changes_requested' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-900 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-base">ایڈمن کی جانب سے ترمیم کی ہدایت:</h3>
            <p className="text-sm mt-1 text-rose-800">{profile.review_notes}</p>
          </div>
        </div>
      )}

      {/* Notice Message */}
      {msg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {previewMode ? (
        /* Preview View (What other approved members will see) */
        <div className="bg-white rounded-2xl p-8 border border-[#E8DFD5] shadow-sm space-y-6">
          <div className="border-b border-[#F0E6DC] pb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#850E35] bg-[#FCE6EC] px-3 py-1 rounded-full">
                دوسرے ممبرز کا پیش منظر (Public/Approved Member View)
              </span>
              <h2 className="text-2xl font-bold text-[#3D1D28] mt-2">
                {displayName} ({userAge} سال)
              </h2>
              <p className="text-sm text-[#735160]">
                {city} • {formatUrduMaritalStatus(maritalStatus)} • {formatUrduGender(gender)}
              </p>
            </div>

            <div className="w-24 h-24 rounded-2xl bg-[#F7EFE9] border border-[#E0D3C5] flex items-center justify-center overflow-hidden relative">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
              ) : (
                <div className="text-center p-2 text-xs text-[#8A6A78]">
                  <Lock className="w-6 h-6 mx-auto mb-1 text-[#850E35]" />
                  <span>تصویر صرف اجازت پر</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#3D1D28] mb-2">مختصر تعارف:</h3>
            <p className="text-[#4F3642] leading-relaxed whitespace-pre-line bg-[#FAF8F5] p-4 rounded-xl border border-[#EFE5DB]">
              {bio || 'کوئی تعارف درج نہیں کیا گیا۔'}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#3D1D28] mb-2">دلچسپیاں اور مشاغل:</h3>
            <div className="flex flex-wrap gap-2">
              {interestsText
                .split(/[،,]/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[#FDECE2] text-[#8C3A0D] rounded-full text-sm font-medium"
                  >
                    {interest}
                  </span>
                ))}
            </div>
          </div>

          {partnerPreferences && (
            <div>
              <h3 className="text-lg font-bold text-[#3D1D28] mb-2">شریکِ حیات سے متعلق ترجیحات:</h3>
              <p className="text-[#4F3642] bg-[#FAF8F5] p-4 rounded-xl border border-[#EFE5DB]">
                {partnerPreferences}
              </p>
            </div>
          )}

          {hasDisability && (
            <div className="bg-[#EFE8F7] p-4 rounded-xl border border-[#D5C2E8]">
              <div className="flex items-center gap-2 text-[#4F2582] font-bold text-base mb-1">
                <Accessibility className="w-5 h-5" />
                <span>رسائی اور روزمرہ سہولیات سے متعلق نوٹ (نجی):</span>
              </div>
              <p className="text-sm text-[#4F2582]/90 leading-relaxed">
                {disabilityNotes || 'معلومات صرف انفرادی اجازت حاصل کرنے والے ممبر کو نظر آئیں گی۔'}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Edit Form */
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DFD5] shadow-xs space-y-6">
          
          {/* Avatar and Private Photo note */}
          <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8DFD5] flex flex-col sm:flex-row items-center gap-6">
            <div className="w-28 h-28 rounded-2xl bg-white border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden relative shadow-xs">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="پروفائل تصویر" fill className="object-cover" />
              ) : (
                <div className="text-center p-2 text-xs text-[#8A6A78]">
                  <Lock className="w-6 h-6 mx-auto mb-1 text-[#850E35]" />
                  <span>کوئی تصویر نہیں</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-right">
              <h3 className="text-lg font-bold text-[#3D1D28] flex items-center justify-center sm:justify-start gap-1.5">
                <Lock className="w-4 h-4 text-[#850E35]" />
                <span>نجی تصویر (اختیاری)</span>
              </h3>
              <p className="text-xs text-[#6B4B58] max-w-lg">
                تصویر فراہم کرنا مکمل اختیاری ہے۔ یہ کسی غیر متعلقہ ممبر کو نہیں دکھائی جاتی، جب تک کہ آپ خود اسے دیکھنے کی اجازت نہ دیں۔
              </p>
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#3D1D28] hover:bg-neutral-50 rounded-xl text-xs font-bold text-[#3D1D28] cursor-pointer shadow-2xs">
                  <Upload className="w-4 h-4" />
                  <span>نئی تصویر اپلوڈ کریں</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                نامِ نمائش (Display Name)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                تاریخِ پیدائش (صرف عمر {userAge} سال ظاہر ہوگی)
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right ltr-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                صنف
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right bg-white"
              >
                <option value="female">عورت</option>
                <option value="male">مرد</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                شہر
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                ازدواجی حیثیت
              </label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right bg-white"
              >
                <option value="unmarried">غیر شادی شدہ</option>
                <option value="divorced">طلاق یافتہ</option>
                <option value="widowed">بیوہ / رنڈوا</option>
                <option value="khula">خلع یافتہ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
              مختصر تعارف (Bio)
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="اپنے بارے میں، فیملی پس منظر، پیشے اور اقدار کے حوالے سے شائستہ انداز میں تحریر کریں..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
              دلچسپیاں اور مشاغل (کوما یا اردو کوما سے الگ کریں)
            </label>
            <input
              type="text"
              value={interestsText}
              onChange={(e) => setInterestsText(e.target.value)}
              placeholder="جیسے: کتابیں، باغبانی، سیر و تفریح، شاعری"
              className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
              شریکِ حیات سے متعلق ترجیحات
            </label>
            <textarea
              rows={3}
              value={partnerPreferences}
              onChange={(e) => setPartnerPreferences(e.target.value)}
              placeholder="عمر، تعلیم، خاندانی اقدار یا مزاج کے حوالے سے اپنی توقعات لکھیں..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right"
            />
          </div>

          {/* Disability and Accessibility Section */}
          <div className="border border-[#E2D2F2] bg-[#FAF7FC] p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasDisability"
                checked={hasDisability}
                onChange={(e) => setHasDisability(e.target.checked)}
                className="w-5 h-5 text-[#850E35] rounded-md focus:ring-[#850E35]"
              />
              <label htmlFor="hasDisability" className="font-bold text-sm sm:text-base text-[#35082A] cursor-pointer">
                کیا آپ کسی جسمانی معذوری، وہیل چیئر یا خصوصی رسائی کی ضرورت کے ساتھ زندگی گزار رہے ہیں؟
              </label>
            </div>

            {hasDisability && (
              <div className="space-y-2 pt-2 border-t border-[#E2D2F2]">
                <label className="block text-sm font-semibold text-[#4F2582]">
                  رسائی یا روزمرہ ضروریات سے متعلق نوٹ (اختیاری اور نجی):
                </label>
                <textarea
                  rows={3}
                  value={disabilityNotes}
                  onChange={(e) => setDisabilityNotes(e.target.value)}
                  placeholder="جیسے: وہیل چیئر استعمال کرتا/کرتی ہوں، ریمپ اور گراؤنڈ فلور سہولت ترجیح ہے۔ یہ نوٹ نجی رہے گا اور صرف اس کو دکھائی دے گا جسے آپ اجازت دیں گے۔"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CDB5E6] focus:ring-2 focus:ring-[#4F2582] focus:outline-hidden text-right bg-white"
                />
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
