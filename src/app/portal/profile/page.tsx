'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Profile, ApplicationReference } from '@/lib/types';
import { 
  calculateAge, 
  formatUrduMaritalStatus, 
  formatUrduStatus, 
  formatUrduGender,
  formatUrduReferenceStatus 
} from '@/lib/utils';
import { 
  Save, 
  Send, 
  Eye, 
  EyeOff, 
  Lock, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Accessibility,
  UserCheck,
  ShieldCheck,
  Plus,
  Trash2,
  Undo2,
  Globe,
  HelpCircle
} from 'lucide-react';

export default function ProfilePage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [references, setReferences] = useState<ApplicationReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [acknowledgementOpen, setAcknowledgementOpen] = useState(false);

  // Application & Profile Form States
  const [displayName, setDisplayName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [city, setCity] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<any>('unmarried');
  const [disabilityExplanation, setDisabilityExplanation] = useState('');
  const [accommodationNeeds, setAccommodationNeeds] = useState('');
  const [marriageIntentionStatement, setMarriageIntentionStatement] = useState('');
  const [consentReview, setConsentReview] = useState(false);
  const [consentReferences, setConsentReferences] = useState(false);
  
  const [bio, setBio] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [partnerPreferences, setPartnerPreferences] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Reconsideration & Additional info states
  const [reconsiderationText, setReconsiderationText] = useState('');
  const [additionalInfoText, setAdditionalInfoText] = useState('');

  // Add Reference Modal State
  const [refName, setRefName] = useState('');
  const [refRelationship, setRefRelationship] = useState('باہمی واقف کار');
  const [refContact, setRefContact] = useState('');
  const [refConsentConfirmed, setRefConsentConfirmed] = useState(false);
  const [addingRef, setAddingRef] = useState(false);

  useEffect(() => {
    fetchProfileAndReferences();
  }, []);

  const fetchProfileAndReferences = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (prof) {
      const p = prof as Profile;
      setProfile(p);
      setDisplayName(p.display_name || '');
      setLegalName(p.legal_name || '');
      setContactPhone(p.contact_phone || '');
      setBirthDate(p.birth_date || '');
      setGender(p.gender || 'female');
      setCity(p.city || '');
      setMaritalStatus(p.marital_status || 'unmarried');
      setDisabilityExplanation(p.disability_explanation || p.disability_notes || '');
      setAccommodationNeeds(p.accommodation_needs || '');
      setMarriageIntentionStatement(p.marriage_intention_statement || '');
      setConsentReview(p.applicant_consent_review || false);
      setConsentReferences(p.applicant_consent_references || false);
      setBio(p.bio || '');
      setInterestsText((p.interests || []).join('، '));
      setPartnerPreferences(p.partner_preferences || '');

      if (p.avatar_url) {
        if (p.avatar_url.startsWith('http')) {
          setAvatarUrl(p.avatar_url);
        } else {
          const { data: signed } = await supabase.storage
            .from('avatars')
            .createSignedUrl(p.avatar_url, 3600);
          setAvatarUrl(signed?.signedUrl || '');
        }
      } else {
        setAvatarUrl('');
      }

      // Fetch references
      const { data: refData } = await supabase
        .from('application_references')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: true });

      setReferences((refData || []) as ApplicationReference[]);
    }
    setLoading(false);
  };

  const handleAddReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!refName.trim() || !refContact.trim()) {
      alert('براہ کرم حوالے کا نام اور رابطہ درج کریں۔');
      return;
    }
    if (!refConsentConfirmed) {
      alert('براہ کرم تصدیق کریں کہ اس حوالے نے رابطے کی پیشگی رضامندی دی ہے۔');
      return;
    }

    setAddingRef(true);
    try {
      const { error } = await supabase.from('application_references').insert({
        profile_id: profile.id,
        reference_name: refName.trim(),
        relationship: refRelationship,
        contact_details: refContact.trim(),
        applicant_confirmed_consent: refConsentConfirmed,
      });

      if (error) throw error;

      setRefName('');
      setRefContact('');
      setRefConsentConfirmed(false);
      await fetchProfileAndReferences();
      setMsg({ type: 'success', text: 'حوالہ کامیابی سے شامل کر دیا گیا۔' });
    } catch (err: any) {
      alert(err.message || 'حوالہ شامل کرنے میں خرابی ہوئی۔');
    } finally {
      setAddingRef(false);
    }
  };

  const handleDeleteReference = async (refId: string) => {
    if (!confirm('کیا آپ واقعی اس حوالے کو حذف کرنا چاہتے ہیں؟')) return;
    try {
      const { error } = await supabase
        .from('application_references')
        .delete()
        .eq('id', refId);

      if (error) throw error;
      await fetchProfileAndReferences();
    } catch (err: any) {
      alert(err.message || 'حوالہ حذف کرنے میں رکاوٹ آئی۔');
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMsg(null);

    const age = calculateAge(birthDate);
    if (age < 18) {
      setMsg({ type: 'error', text: 'ہم سفر پر رکنیت کے لیے کم از کم عمر ۱۸ سال ہونی لازمی ہے۔' });
      setSaving(false);
      return;
    }

    if (!consentReview || !consentReferences) {
      setMsg({ type: 'error', text: 'جائزے اور حوالہ جات سے رابطے کی صریح رضامندی لازمی ہے۔' });
      setSaving(false);
      return;
    }

    if (references.length < 1) {
      setMsg({ type: 'error', text: 'درخواست جمع کروانے کے لیے کم از کم ایک قابلِ اعتماد حوالہ لازمی ہے۔' });
      setSaving(false);
      return;
    }

    try {
      const interests = interestsText
        .split(/[،,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const { error } = await supabase.rpc('submit_membership_application', {
        p_legal_name: legalName,
        p_birth_date: birthDate,
        p_contact_phone: contactPhone,
        p_city: city,
        p_marital_status: maritalStatus,
        p_disability_explanation: disabilityExplanation,
        p_accommodation_needs: accommodationNeeds,
        p_marriage_intention_statement: marriageIntentionStatement,
        p_applicant_consent_review: consentReview,
        p_applicant_consent_references: consentReferences,
        p_bio: bio,
        p_interests: interests,
        p_partner_preferences: partnerPreferences,
      });

      if (error) throw error;

      setAcknowledgementOpen(true);
      await fetchProfileAndReferences();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'درخواست جمع کروانے میں دشواری ہوئی۔' });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!profile) return;
    const nextState = !profile.is_published;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('member_toggle_publish', {
        p_is_published: nextState,
      });
      if (error) throw error;
      await fetchProfileAndReferences();
      setMsg({
        type: 'success',
        text: nextState
          ? 'آپ کا پروفائل اب منظور شدہ ممبرز کی تلاش میں شائع کر دیا گیا ہے۔'
          : 'آپ کا پروفائل ممبر ڈائریکٹری سے غیر شائع (چھپا) دیا گیا ہے۔',
      });
    } catch (err: any) {
      alert(err.message || 'پروفائل کی حالت بدلنے میں ناکامی ہوئی۔');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawApplication = async () => {
    if (!confirm('کیا آپ واقعی اپنی درخواست واپس لینا چاہتے ہیں؟')) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
        .eq('id', profile?.id);
      if (error) throw error;
      await fetchProfileAndReferences();
      setMsg({ type: 'success', text: 'درخواست کامیابی سے واپس لے لی گئی۔' });
    } catch (err: any) {
      alert(err.message || 'درخواست واپس لینے میں رکاوٹ آئی۔');
    } finally {
      setSaving(false);
    }
  };

  const handleReconsideration = async () => {
    if (!reconsiderationText.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('member_request_reconsideration', {
        p_statement: reconsiderationText.trim(),
      });
      if (error) throw error;
      setReconsiderationText('');
      await fetchProfileAndReferences();
      setMsg({ type: 'success', text: 'دوبارہ جائزے کی درخواست موصول ہو گئی ہے۔ شکریہ۔' });
    } catch (err: any) {
      alert(err.message || 'درخواست بھیجنے میں خرابی ہوئی۔');
    } finally {
      setSaving(false);
    }
  };

  const handleAdditionalInfoSubmit = async () => {
    if (!additionalInfoText.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('member_respond_additional_info', {
        p_response: additionalInfoText.trim(),
      });
      if (error) throw error;
      setAdditionalInfoText('');
      await fetchProfileAndReferences();
      setMsg({ type: 'success', text: 'اضافی معلومات ایڈمن کو بھیج دی گئی ہیں۔' });
    } catch (err: any) {
      alert(err.message || 'معلومات بھیجنے میں خرابی ہوئی۔');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !profile) return;
    const file = e.target.files[0];
    
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

      await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', profile.id);

      const { data: signedData } = await supabase.storage
        .from('avatars')
        .createSignedUrl(filePath, 3600);

      setAvatarUrl(signedData?.signedUrl || '');
      setMsg({
        type: 'success',
        text: 'تصویر پرائیویٹ محفوظ ہو گئی۔ یہ صرف آپ کی اجازت سے مخصوص ممبرز کو نظر آئے گی۔',
      });
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || 'تصویر اپلوڈ کرنے میں رکاوٹ آئی۔',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-[#850E35] font-bold">معلومات لوڈ ہو رہی ہیں...</div>;
  }

  if (!profile) return null;

  const statusInfo = formatUrduStatus(profile.status);
  const isApproved = profile.status === 'approved' && !profile.is_suspended;
  const isPendingReview = ['submitted', 'under_review', 'reference_verification_pending'].includes(profile.status);
  const isApplicationEditable = ['draft', 'additional_info_required', 'new_eligibility_review_required'].includes(profile.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Acknowledgement Dialog */}
      {acknowledgementOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 text-center border-2 border-[#D4AF37] shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#FAF0E6] text-[#850E35] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#3D1D28]">
              درخواست موصول ہو گئی ہے
            </h3>
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8DFD5] text-sm text-[#5C3F4B] leading-relaxed text-right space-y-2">
              <p className="font-bold text-[#850E35]">اہم وضاحت:</p>
              <p>
                درخواست جمع کروانا منظور شدہ رکنیت کا حامل نہیں بناتا۔ ایڈمنسٹریٹر آپ کے فراہم کردہ قابلِ اعتماد حقیقی حوالے سے خود رابطہ کر کے معذوری کی اہلیت اور بنیادی شناخت کی تصدیق کرے گا۔
              </p>
              <p>
                جائزے کا عمل مکمل ہونے تک آپ کا اسٹیٹس زیرِ جائزہ رہے گا۔
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAcknowledgementOpen(false)}
              className="w-full py-3 bg-[#850E35] hover:bg-[#6D092A] text-white font-bold rounded-xl transition"
            >
              ٹھیک ہے، سمجھ آگیا
            </button>
          </div>
        </div>
      )}

      {/* Existing account review required alert */}
      {profile.status === 'new_eligibility_review_required' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-700 shrink-0" />
            <h3 className="text-lg font-bold text-amber-900">
              ہم سفر کی تجدید شدہ پالیسی: معذوری کی اہلیت اور تصدیق کا نیا عمل درکار ہے
            </h3>
          </div>
          <p className="text-sm sm:text-base text-amber-900/90 leading-relaxed">
            ہم سفر اب خصوصی طور پر معذوری کے ساتھ زندگی گزارنے والے بالغ افراد کے لیے مختص ہے۔ نئے قواعد کے تحت تمام ارکان کے لیے معذوری کی وضاحت اور کم از کم ایک قابلِ اعتماد حقیقی حوالے سے تصدیق لازمی قرار دی گئی ہے۔ برائے کرم نیچے دی گئی درخواست مکمل کریں اور حوالہ فراہم کریں۔
          </p>
        </div>
      )}

      {/* Main Status Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#3D1D28]">
              {profile.display_name}
            </h1>
            <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {isApproved && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${profile.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}`}>
                {profile.is_published ? 'ڈائریکٹری میں شائع شدہ' : 'غیر شائع شدہ (مخفی)'}
              </span>
            )}
          </div>
          <p className="text-sm text-[#735160] mt-1">
            {profile.city} • {calculateAge(profile.birth_date)} سال • {formatUrduMaritalStatus(profile.marital_status)}
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isApproved && (
            <button
              type="button"
              disabled={saving}
              onClick={handleTogglePublish}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                profile.is_published
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {profile.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{profile.is_published ? 'پروفائل غیر شائع کریں' : 'پروفائل شائع کریں'}</span>
            </button>
          )}

          {isPendingReview && (
            <button
              type="button"
              disabled={saving}
              onClick={handleWithdrawApplication}
              className="px-4 py-2 bg-neutral-100 hover:bg-rose-50 hover:text-rose-700 text-[#523A44] rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Undo2 className="w-4 h-4" />
              <span>درخواست واپس لیں</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Messages */}
      {msg && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 text-sm ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* APPROVED MEMBER VIEW */}
      {isApproved && (
        <div className="space-y-6">
          {/* Approval Notice & Disclaimer */}
          <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#D4AF37]/40 space-y-2">
            <div className="flex items-center gap-2 text-[#850E35] font-bold text-sm sm:text-base">
              <ShieldCheck className="w-5 h-5" />
              <span>رکنیت کی تصدیق مکمل ہو چکی ہے</span>
            </div>
            <p className="text-xs sm:text-sm text-[#5C3F4B] leading-relaxed">
              منظوری کسی فرد کے کردار، نیت یا رشتے کی موزونیت کی ضمانت نہیں۔ ہر اگلا قدم آپ کی اپنی رضامندی سے ہوگا۔
            </p>
          </div>

          {/* Profile Publishing Control Banner */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-[#3D1D28]">
                ڈائریکٹری میں پروفائل کی نمائش (Publishing Control)
              </h3>
              <p className="text-xs sm:text-sm text-[#6F4E5D]">
                {profile.is_published
                  ? 'آپ کا پروفائل اس وقت دیگر منظور شدہ ممبرز کی تلاش میں ظاہر ہو رہا ہے۔'
                  : 'آپ کا پروفائل ابھی غیر شائع شدہ (مخفی) ہے۔ اسے تلاش میں دکھانے کے لیے شائع کریں۔'}
              </p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleTogglePublish}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                profile.is_published
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300'
                  : 'bg-[#850E35] hover:bg-[#6D092A] text-white shadow-xs'
              }`}
            >
              {profile.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{profile.is_published ? 'پروفائل ڈائریکٹری سے ہٹائیں' : 'ابھی شائع کریں'}</span>
            </button>
          </div>

          {/* Private Photo Box */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] shadow-xs flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-[#FAF0E6] border border-[#E8DFD5] flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={profile.display_name} fill className="object-cover" />
              ) : (
                <Lock className="w-8 h-8 text-[#850E35]/40" />
              )}
            </div>
            <div className="space-y-2 text-center sm:text-right flex-1">
              <h4 className="font-bold text-[#3D1D28]">نجی پروفائل تصویر</h4>
              <p className="text-xs text-[#6F4E5D] leading-relaxed">
                تصویر مکمل طور پر نجی اسٹوریج میں رہتی ہے اور عوامی تلاش میں کبھی نہیں دکھائی جاتی۔ یہ صرف اس مخصوص ممبر کو نظر آئے گی جسے آپ درخواست کے صفحے پر صریح اجازت دیں گے۔
              </p>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#850E35] border border-[#850E35]/30 rounded-xl text-xs font-semibold cursor-pointer transition">
                <Upload className="w-4 h-4" />
                <span>تصویر تبدیل کریں</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* PENDING REVIEW TRACKER */}
      {isPendingReview && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-[#850E35]" />
            <h3 className="text-xl font-bold text-[#3D1D28]">
              درخواست کا جائزہ اور پیش رفت
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8DFD5] text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="font-bold text-sm text-[#3D1D28]">۱۔ درخواست موصول</p>
              <p className="text-xs text-neutral-500">کوائف کا اندراج مکمل ہے</p>
            </div>
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8DFD5] text-center space-y-1">
              <Clock className="w-6 h-6 text-amber-600 mx-auto" />
              <p className="font-bold text-sm text-[#3D1D28]">۲۔ انفرادی جائزہ</p>
              <p className="text-xs text-neutral-500">اہلیت کی جانچ جاری ہے</p>
            </div>
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8DFD5] text-center space-y-1">
              <UserCheck className="w-6 h-6 text-purple-600 mx-auto" />
              <p className="font-bold text-sm text-[#3D1D28]">۳۔ حوالہ کی تصدیق</p>
              <p className="text-xs text-neutral-500">حقیقی واقف کار سے رابطہ</p>
            </div>
          </div>

          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-xs sm:text-sm text-blue-900 space-y-1">
            <p className="font-semibold">آپ کی معلومات کا تحفظ:</p>
            <p>
              آپ کی معذوری کی نجی تفصیل اور حوالہ دینے والوں کے رابطے ایڈمن کے پاس محفوظ ہیں اور کسی ممبر یا ڈائریکٹری میں ظاہر نہیں کیے جاتے۔
            </p>
          </div>
        </div>
      )}

      {/* ADDITIONAL INFO REQUIRED */}
      {profile.status === 'additional_info_required' && (
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-orange-900 font-bold text-lg">
            <AlertCircle className="w-5 h-5 text-orange-700" />
            <span>ایڈمن کی جانب سے مزید معلومات درکار ہیں</span>
          </div>
          {profile.review_notes && (
            <div className="bg-white p-4 rounded-xl border border-orange-200 text-sm text-[#3D1D28]">
              <strong>ایڈمن کا پیغام:</strong> {profile.review_notes}
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#3D1D28]">
              آپ کا جوابی وضاحتی بیان:
            </label>
            <textarea
              rows={3}
              value={additionalInfoText}
              onChange={(e) => setAdditionalInfoText(e.target.value)}
              placeholder="درکار معلومات یہاں تحریر کریں..."
              className="w-full px-4 py-2.5 rounded-xl border border-orange-300 focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-sm"
            />
            <button
              type="button"
              disabled={saving || !additionalInfoText.trim()}
              onClick={handleAdditionalInfoSubmit}
              className="px-6 py-2.5 bg-[#850E35] text-white font-bold rounded-xl text-sm transition hover:bg-[#6D092A] disabled:opacity-50"
            >
              جواب ارسال کریں
            </button>
          </div>
        </div>
      )}

      {/* NOT APPROVED / RECONSIDERATION */}
      {profile.status === 'not_approved' && (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-lg">
            <AlertCircle className="w-5 h-5 text-rose-700" />
            <span>درخواست منظور نہ ہو سکی</span>
          </div>
          <p className="text-sm text-rose-900/90 leading-relaxed">
            ہم کسی درخواست گزار کو غیر معتبر قرار نہیں دیتے۔ بعض اوقات حوالہ سے رابطہ قائم نہ ہو پانے یا اہلیت کی ناکافی تفصیل کے سبب منظوری ممکن نہیں ہو پاتی۔ اگر آپ کے پاس نیا معتبر حوالہ یا وضاحت موجود ہے تو آپ دوبارہ جائزے کی درخواست کر سکتے ہیں۔
          </p>
          {profile.review_notes && (
            <div className="bg-white p-3 rounded-xl border border-rose-200 text-xs text-[#3D1D28]">
              <strong>وجہ:</strong> {profile.review_notes}
            </div>
          )}
          <div className="space-y-2 pt-2">
            <label className="block text-sm font-semibold text-[#3D1D28]">
              دوبارہ جائزے کے لیے بیان / نئے حوالے کی وضاحت:
            </label>
            <textarea
              rows={3}
              value={reconsiderationText}
              onChange={(e) => setReconsiderationText(e.target.value)}
              placeholder="اپنا موقف یا نیا حوالہ تحریر کریں..."
              className="w-full px-4 py-2.5 rounded-xl border border-rose-300 focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-sm"
            />
            <button
              type="button"
              disabled={saving || !reconsiderationText.trim()}
              onClick={handleReconsideration}
              className="px-6 py-2.5 bg-[#850E35] text-white font-bold rounded-xl text-sm transition hover:bg-[#6D092A] disabled:opacity-50"
            >
              دوبارہ جائزے کی درخواست بھیجیں
            </button>
          </div>
        </div>
      )}

      {/* WITHDRAWN STATE */}
      {profile.status === 'withdrawn' && (
        <div className="bg-neutral-100 border border-neutral-300 p-6 rounded-2xl space-y-3">
          <h3 className="font-bold text-neutral-800">آپ کی درخواست واپس لی جا چکی ہے</h3>
          <p className="text-sm text-neutral-600">
            اگر آپ دوبارہ ہم سفر پر رکنیت کی درخواست جمع کروانا چاہتے ہیں تو نیچے فارم میں تفصیلات دیکھ کر جمع کروائیں۔
          </p>
        </div>
      )}

      {/* THE MEMBERSHIP APPLICATION FORM (For draft, new_eligibility_review_required, etc.) */}
      {isApplicationEditable && (
        <form onSubmit={handleSubmitApplication} className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-8">
          
          <div className="border-b border-[#E8DFD5] pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#3D1D28]">
              رکنیت کی باضابطہ درخواست
            </h2>
            <p className="text-xs sm:text-sm text-[#6F4E5D] mt-1">
              ہم سفر معذوری کے حامل بالغ افراد کے لیے ہے۔ اپنی نجی و تصدیقی معلومات درج کریں۔
            </p>
          </div>

          {/* Section 1: Private Legal Identity */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#850E35] flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>۱۔ نجی شناخت اور رابطہ (صرف ایڈمن جائزے کے لیے)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#3D1D28] mb-1">
                  مکمل قانونی نام *
                </label>
                <input
                  type="text"
                  required
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="شناختی دستاویز کے مطابق نام"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D1D28] mb-1">
                  رابطہ نمبر (موبائل / فون) *
                </label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-sm text-right ltr-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#3D1D28] mb-1">
                  تاریخِ پیدائش (عمر ۱۸ یا زائد) *
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D1D28] mb-1">
                  شہر یا علاقہ *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="لاہور، کراچی، اسلام آباد..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D1D28] mb-1">
                  ازدواجی حیثیت *
                </label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-sm bg-white"
                >
                  <option value="unmarried">غیر شادی شدہ</option>
                  <option value="divorced">طلاق یافتہ</option>
                  <option value="widowed">بیوہ / رنڈوا</option>
                  <option value="khula">خلع یافتہ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Disability Explanation & Accommodation */}
          <div className="space-y-4 pt-4 border-t border-[#E8DFD5]">
            <h3 className="text-base font-bold text-[#850E35] flex items-center gap-2">
              <Accessibility className="w-4 h-4" />
              <span>۲۔ معذوری کی نوعیت اور سہولت کی ضرورت (نجی تفصیل)</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#3D1D28] mb-1">
                معذوری کی مختصر وضاحت (پیدائشی، حادثاتی یا بیماری کا سبب) *
              </label>
              <textarea
                required
                rows={3}
                value={disabilityExplanation}
                onChange={(e) => setDisabilityExplanation(e.target.value)}
                placeholder="اپنی معذوری کی نوعیت مختصر الفاظ میں تحریر کریں..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-sm"
              />
              <p className="text-[11px] text-[#785966] mt-1">
                یہ وضاحت صرف ایڈمنسٹریٹر کے جائزے کے لیے ہے۔ یہ عوامی پروفائل میں شائع نہیں ہوتی۔
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D1D28] mb-1">
                کسی مخصوص رسائی یا سہولت کی ضرورت (Accessibility Needs):
              </label>
              <input
                type="text"
                value={accommodationNeeds}
                onChange={(e) => setAccommodationNeeds(e.target.value)}
                placeholder="وہیل چیئر، اسکرین ریڈر، سماعت یا دیگر..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D1D28] mb-1">
                شادی کے ارادے کی تصدیق کا بیان *
              </label>
              <textarea
                required
                rows={2}
                value={marriageIntentionStatement}
                onChange={(e) => setMarriageIntentionStatement(e.target.value)}
                placeholder="شادی کے مقصد اور ارادے کے بارے میں مختصر تصدیق..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-sm"
              />
            </div>
          </div>

          {/* Section 3: Trusted Real-World References */}
          <div className="space-y-4 pt-4 border-t border-[#E8DFD5]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#850E35] flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>۳۔ قابلِ اعتماد حقیقی حوالہ جات (کم از کم ایک حوالہ لازمی ہے)</span>
                </h3>
                <p className="text-xs text-[#735160] mt-0.5">
                  ایسا شخص جس سے ایڈمن رابطہ کر کے آپ کی معذوری کی اہلیت اور بنیادی شناخت کی تصدیق کر سکے۔
                </p>
              </div>
            </div>

            {/* List of existing references */}
            {references.length > 0 ? (
              <div className="space-y-2">
                {references.map((ref) => {
                  const refStatus = formatUrduReferenceStatus(ref.verification_status);
                  return (
                    <div
                      key={ref.id}
                      className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8DFD5] flex items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-[#3D1D28]">{ref.reference_name}</p>
                          <span className="text-xs text-[#735160]">({ref.relationship})</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${refStatus.color}`}>
                            {refStatus.label}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 dir-ltr text-right">{ref.contact_details}</p>
                      </div>

                      {ref.verification_status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReference(ref.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 transition"
                          title="حذف کریں"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                ابھی تک کوئی حوالہ شامل نہیں کیا گیا۔ درخواست جمع کروانے کے لیے نیچے دیے گئے فارم سے کم از کم ایک حوالہ شامل کریں۔
              </div>
            )}

            {/* Add Reference Sub-form */}
            <div className="p-4 bg-[#FAF0E6]/50 rounded-xl border border-[#850E35]/20 space-y-3">
              <p className="text-xs font-bold text-[#850E35]">نیا حوالہ شامل کریں:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={refName}
                  onChange={(e) => setRefName(e.target.value)}
                  placeholder="حوالے کا پورا نام"
                  className="px-3 py-2 bg-white rounded-lg border border-[#D5C7B8] text-xs focus:ring-1 focus:ring-[#850E35]"
                />
                <select
                  value={refRelationship}
                  onChange={(e) => setRefRelationship(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-[#D5C7B8] text-xs focus:ring-1 focus:ring-[#850E35]"
                >
                  <option value="باہمی واقف کار">باہمی واقف کار</option>
                  <option value="محلے کا معزز شخص">محلے کا معزز شخص</option>
                  <option value="استاد یا کولیگ">استاد یا کولیگ</option>
                  <option value="ڈاکٹر یا فزیو تھراپسٹ">معالج / فزیو تھراپسٹ</option>
                  <option value="دیگر باخبر فرد">دیگر باخبر فرد</option>
                </select>
                <input
                  type="text"
                  value={refContact}
                  onChange={(e) => setRefContact(e.target.value)}
                  placeholder="فون نمبر یا رابطہ"
                  className="px-3 py-2 bg-white rounded-lg border border-[#D5C7B8] text-xs focus:ring-1 focus:ring-[#850E35] text-right ltr-input"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ref-consent"
                  checked={refConsentConfirmed}
                  onChange={(e) => setRefConsentConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded text-[#850E35] focus:ring-[#850E35]"
                />
                <label htmlFor="ref-consent" className="text-xs text-[#3D1D28] font-medium">
                  میں تصدیق کرتا/کرتی ہوں کہ اس حوالے نے ہم سفر کی طرف سے تصدیقی رابطے کی پیشگی رضامندی دی ہے۔
                </label>
              </div>

              <button
                type="button"
                disabled={addingRef}
                onClick={handleAddReference}
                className="px-4 py-2 bg-[#850E35] hover:bg-[#6D092A] text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>حوالہ فہرست میں شامل کریں</span>
              </button>
            </div>
          </div>

          {/* Section 4: Public Profile Preferences */}
          <div className="space-y-4 pt-4 border-t border-[#E8DFD5]">
            <h3 className="text-base font-bold text-[#850E35] flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>۴۔ عمومی تعارف (منظوری کے بعد ڈائریکٹری کے لیے)</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#3D1D28] mb-1">
                نمائشی نام (Display Name) *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="طیبہ یا حمزہ (صرف نام)"
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D1D28] mb-1">
                مختصر ذاتی تعارف (Bio)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="اپنے مشاغل، پسند اور شخصیت کے بارے میں چند جملے..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D1D28] mb-1">
                شریکِ حیات کے لیے ترجیحات (Partner Preferences)
              </label>
              <textarea
                rows={2}
                value={partnerPreferences}
                onChange={(e) => setPartnerPreferences(e.target.value)}
                placeholder="آپ کس قسم کے رفیقِ حیات کی تلاش میں ہیں..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-sm"
              />
            </div>
          </div>

          {/* Section 5: Explicit Consents */}
          <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8DFD5] space-y-3 pt-4">
            <h4 className="text-xs font-bold text-[#3D1D28]">لازمی رضامندی کے اقرار نامے:</h4>

            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="consent-review"
                required
                checked={consentReview}
                onChange={(e) => setConsentReview(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-[#850E35] focus:ring-[#850E35]"
              />
              <label htmlFor="consent-review" className="text-xs text-[#4A2633] leading-relaxed">
                میں اپنے فراہم کردہ کوائف اور معذوری کی اہلیت کے آزادانہ جائزے پر مکمل باخبر رضامندی دیتا/دیتی ہوں۔
              </label>
            </div>

            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="consent-ref"
                required
                checked={consentReferences}
                onChange={(e) => setConsentReferences(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-[#850E35] focus:ring-[#850E35]"
              />
              <label htmlFor="consent-ref" className="text-xs text-[#4A2633] leading-relaxed">
                میں ایڈمنسٹریٹر کو نامزد کردہ حوالہ جات سے محدود تصدیقی مقاصد کے لیے رابطہ کرنے کی باضابطہ اجازت دیتا/دیتی ہوں۔
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#850E35] hover:bg-[#6D092A] text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send className="w-5 h-5" />
              <span>{saving ? 'درخواست جمع ہو رہی ہے...' : 'درخواست برائے جائزہ جمع کروائیں'}</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
