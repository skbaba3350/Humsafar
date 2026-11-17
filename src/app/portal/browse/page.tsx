'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import { 
  formatUrduMaritalStatus, 
  formatUrduGender 
} from '@/lib/utils';
import { 
  Heart, 
  Lock, 
  ShieldAlert, 
  UserX, 
  Accessibility, 
  Clock, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface PublicDirectoryItem {
  id: string;
  display_name: string;
  gender: string;
  city: string;
  marital_status: string;
  bio: string;
  interests: string[];
  partner_preferences: string;
  has_disability: boolean;
  avatar_url: string;
  disability_notes: string;
  has_photo_permission: boolean;
  has_note_permission: boolean;
  age: number;
}

export default function BrowsePage() {
  const supabase = createClient();

  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<PublicDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [filterCity, setFilterCity] = useState('');
  const [filterMaritalStatus, setFilterMaritalStatus] = useState('');
  const [filterMinAge, setFilterMinAge] = useState<number>(18);
  const [filterMaxAge, setFilterMaxAge] = useState<number>(70);

  // Requests sent tracking
  const [sentRequests, setSentRequests] = useState<Record<string, string>>({}); // profileId -> status

  // Action status message
  const [actionMsg, setActionMsg] = useState<{ id: string; text: string; success: boolean } | null>(null);

  // Modal for report
  const [reportingProfile, setReportingProfile] = useState<PublicDirectoryItem | null>(null);
  const [reportReason, setReportReason] = useState<any>('fake_profile');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setFetchError('براہ کرم دوبارہ لاگ اِن کریں۔');
        setLoading(false);
        return;
      }

      // 1. Get my profile to verify status
      const { data: myProf, error: myProfErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (myProfErr) throw myProfErr;
      setCurrentProfile(myProf as Profile);

      if (myProf?.status !== 'approved' && myProf?.role !== 'admin') {
        setLoading(false);
        return;
      }

      // 2. Query SECURE VIEW (public_directory) which hides raw birth_dates, notes and review notes
      const { data: allProfiles, error: dirErr } = await supabase
        .from('public_directory')
        .select('*')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (dirErr) throw dirErr;

      // 3. Get blocked users by me
      const { data: blockedList } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id);

      const blockedIds = new Set((blockedList || []).map((b) => b.blocked_id));

      // 4. Get active interest requests between me and others
      const { data: requests } = await supabase
        .from('interest_requests')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .in('status', ['pending', 'accepted']);

      const reqMap: Record<string, string> = {};
      (requests || []).forEach((r) => {
        const otherId = r.sender_id === user.id ? r.receiver_id : r.sender_id;
        reqMap[otherId] = r.status;
      });
      setSentRequests(reqMap);

      const filtered = (allProfiles || []).filter((p: any) => !blockedIds.has(p.id));
      setProfiles(filtered as PublicDirectoryItem[]);
    } catch (err: any) {
      console.error('Error loading browse profiles:', err);
      setFetchError(err.message || 'پروفائلز لوڈ کرنے میں مسئلہ پیش آیا۔');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!currentProfile) return;
    try {
      const { error } = await supabase.from('interest_requests').insert({
        sender_id: currentProfile.id,
        receiver_id: receiverId,
        status: 'pending',
      });

      if (error) throw error;

      setSentRequests((prev) => ({ ...prev, [receiverId]: 'pending' }));
      setActionMsg({
        id: receiverId,
        text: 'دلچسپی کی درخواست کامیابی سے ارسال کر دی گئی۔',
        success: true,
      });
    } catch (err: any) {
      setActionMsg({
        id: receiverId,
        text: err.message || 'درخواست بھیجنے میں رکاوٹ آئی۔',
        success: false,
      });
    }
  };

  const handleBlockUser = async (targetId: string, displayName: string) => {
    if (!confirm(`کیا آپ واقعی ${displayName} کو بلاک کرنا چاہتے ہیں؟ اس کے بعد نہ وہ آپ کو دیکھ سکیں گے اور نہ کوئی رابطہ ممکن ہو گا۔`)) {
      return;
    }
    if (!currentProfile) return;

    try {
      const { error } = await supabase.from('blocks').insert({
        blocker_id: currentProfile.id,
        blocked_id: targetId,
      });

      if (error) throw error;

      setProfiles((prev) => prev.filter((p) => p.id !== targetId));
      alert(`${displayName} کو کامیابی سے بلاک کر دیا گیا۔`);
    } catch (err: any) {
      alert(err.message || 'بلاک کرنے میں ناکامی ہوئی۔');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile || !reportingProfile) return;
    setReportSubmitting(true);

    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: currentProfile.id,
        reported_id: reportingProfile.id,
        reason: reportReason,
        details: reportDetails,
        status: 'pending',
      });

      if (error) throw error;

      alert('آپ کی شکایت ایڈمن کو موصول ہو گئی ہے اور اس کا نوٹس لیا جائے گا۔');
      setReportingProfile(null);
      setReportDetails('');
    } catch (err: any) {
      alert(err.message || 'رپورٹ درج کرنے میں مسئلہ پیش آیا۔');
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-[#850E35] font-bold">لوڈ ہو رہا ہے...</div>;
  }

  if (fetchError) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-xl mx-auto space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="font-bold text-rose-900">خرابی پیش آئی</h3>
        <p className="text-xs text-rose-800">{fetchError}</p>
        <button
          onClick={loadData}
          className="px-4 py-1.5 bg-[#850E35] text-white rounded-xl text-xs font-semibold"
        >
          دوبارہ کوشش کریں
        </button>
      </div>
    );
  }

  // If user is not approved
  if (currentProfile?.status !== 'approved' && currentProfile?.role !== 'admin') {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E8DFD5] text-center max-w-xl mx-auto space-y-4 my-8">
        <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#3D1D28]">
          پروفائل جائزے کے مراحل میں ہے
        </h2>
        <p className="text-sm text-[#5E3F4C] leading-relaxed">
          ہم سفر کی رازداری پالیسی کے تحت، صرف وہی ممبرز دوسرے ارکان کے رشتے تلاش کر سکتے ہیں جن کا اپنا پروفائل ایڈمن سے منظور شدہ ہو۔
          <br />
          براہ کرم اپنا پروفائل مکمل کر کے جائزے کے لیے جمع کروائیں یا ایڈمن کی توثیق کا انتظار فرمائیں۔
        </p>
      </div>
    );
  }

  // Filter profiles
  const displayedProfiles = profiles.filter((p) => {
    if (filterMinAge && p.age < filterMinAge) return false;
    if (filterMaxAge && p.age > filterMaxAge) return false;
    if (filterCity && !p.city.toLowerCase().includes(filterCity.toLowerCase())) return false;
    if (filterMaritalStatus && p.marital_status !== filterMaritalStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Search Header and Filters Bar */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-sm space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3D1D28]">رشتے تلاش کریں</h1>
          <p className="text-sm text-[#6E4F5C] mt-1">
            تصدیق شدہ اور منظور شدہ باوقار پروفائلز کی فہرست (رازداری تحفظ کے ساتھ)۔
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-[#F2ECE4]">
          <div>
            <label htmlFor="filter-city" className="block text-xs font-semibold text-[#3D1D28] mb-1">شہر سے تلاش کریں</label>
            <input
              id="filter-city"
              type="text"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              placeholder="شہر کا نام..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#D5C7B8] focus:ring-1 focus:ring-[#850E35] focus:outline-hidden text-right"
            />
          </div>

          <div>
            <label htmlFor="filter-marital" className="block text-xs font-semibold text-[#3D1D28] mb-1">ازدواجی حیثیت</label>
            <select
              id="filter-marital"
              value={filterMaritalStatus}
              onChange={(e) => setFilterMaritalStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#D5C7B8] focus:ring-1 focus:ring-[#850E35] focus:outline-hidden text-right bg-white"
            >
              <option value="">تمام حیثیتیں</option>
              <option value="unmarried">غیر شادی شدہ</option>
              <option value="divorced">طلاق یافتہ</option>
              <option value="widowed">بیوہ / رنڈوا</option>
              <option value="khula">خلع یافتہ</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-min-age" className="block text-xs font-semibold text-[#3D1D28] mb-1">کم از کم عمر</label>
            <input
              id="filter-min-age"
              type="number"
              min={18}
              max={100}
              value={filterMinAge}
              onChange={(e) => setFilterMinAge(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#D5C7B8] focus:ring-1 focus:ring-[#850E35] focus:outline-hidden text-right ltr-input"
            />
          </div>

          <div>
            <label htmlFor="filter-max-age" className="block text-xs font-semibold text-[#3D1D28] mb-1">زیادہ سے زیادہ عمر</label>
            <input
              id="filter-max-age"
              type="number"
              min={18}
              max={100}
              value={filterMaxAge}
              onChange={(e) => setFilterMaxAge(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#D5C7B8] focus:ring-1 focus:ring-[#850E35] focus:outline-hidden text-right ltr-input"
            />
          </div>
        </div>
      </div>

      {/* Profiles Grid */}
      {displayedProfiles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-[#7A5B67] border border-[#E8DFD5]">
          کوئی مماثل پروفائل نہیں ملا۔ فلٹرز تبدیل کر کے دوبارہ کوشش کریں۔
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProfiles.map((member) => {
            const requestState = sentRequests[member.id];

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header with Avatar or Lock */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#F2ECE4] pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#3D1D28]">
                        {member.display_name} ({member.age} سال)
                      </h3>
                      <p className="text-xs text-[#735160] mt-0.5">
                        {member.city} • {formatUrduMaritalStatus(member.marital_status)} • {formatUrduGender(member.gender)}
                      </p>
                    </div>

                    <div className="w-16 h-16 rounded-xl bg-[#F7EFE9] border border-[#E0D3C5] flex items-center justify-center overflow-hidden relative shrink-0">
                      {member.has_photo_permission && member.avatar_url ? (
                        <Image src={member.avatar_url} alt={member.display_name} fill className="object-cover" />
                      ) : (
                        <div className="text-center p-1" title="تصویر نجی ہے (صرف اجازت پر دستیاب)">
                          <Lock className="w-5 h-5 mx-auto text-[#850E35]" />
                          <span className="text-[9px] text-[#850E35] font-semibold block leading-tight">نجی تصویر</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges: Disability, etc. */}
                  {member.has_disability && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFE8F7] text-[#4F2582] text-xs font-semibold rounded-full">
                      <Accessibility className="w-3.5 h-3.5" />
                      <span>معذوری / وہیل چیئر صارف</span>
                    </div>
                  )}

                  {/* Bio */}
                  <div className="mt-3">
                    <p className="text-sm text-[#4F3642] leading-relaxed line-clamp-3">
                      {member.bio}
                    </p>
                  </div>

                  {/* Interests */}
                  {member.interests && member.interests.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {member.interests.slice(0, 3).map((int, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-[#FAF6F0] text-[#735160] text-xs rounded-md"
                        >
                          {int}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Private Disability Note ONLY if permitted by database view */}
                  {member.has_disability && (
                    <div className="mt-3 p-2.5 rounded-lg bg-[#FAF7FC] border border-[#E2D2F2] text-xs text-[#4F2582]">
                      <span className="font-bold">معذوری نوٹ:</span>{' '}
                      {member.has_note_permission && member.disability_notes ? (
                        member.disability_notes
                      ) : (
                        <span className="italic text-[#7E57A0]">نجی معلومات (صرف اجازت ملنے پر ظاہر ہوں گی)</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-[#F2ECE4] space-y-2">
                  {actionMsg?.id === member.id && (
                    <p className={`text-xs ${actionMsg.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {actionMsg.text}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    {requestState === 'pending' ? (
                      <span className="flex-1 py-2 text-center text-xs font-bold text-amber-800 bg-amber-50 rounded-xl border border-amber-200">
                        درخواست بھیجی جا چکی ہے
                      </span>
                    ) : requestState === 'accepted' ? (
                      <span className="flex-1 py-2 text-center text-xs font-bold text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200">
                        درخواست قبول شدہ ہے
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendRequest(member.id)}
                        className="flex-1 py-2 px-3 text-xs font-bold text-white bg-[#850E35] hover:bg-[#6D092A] rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span>دلچسپی کی درخواست</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleBlockUser(member.id, member.display_name)}
                      className="p-2 text-[#735160] hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-[#D5C7B8] transition"
                      title="بلاک کریں"
                      aria-label="بلاک کریں"
                    >
                      <UserX className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportingProfile(member)}
                      className="p-2 text-[#735160] hover:text-amber-700 hover:bg-amber-50 rounded-xl border border-[#D5C7B8] transition"
                      title="رپورٹ کریں"
                      aria-label="رپورٹ کریں"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reporting Modal */}
      {reportingProfile && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onKeyDown={(e) => { if (e.key === 'Escape') setReportingProfile(null); }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E8DFD5]">
            <div className="flex items-center justify-between border-b border-[#F0E6DC] pb-3">
              <h3 className="font-bold text-lg text-[#3D1D28] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>رپورٹ درج کریں ({reportingProfile.display_name})</span>
              </h3>
              <button
                type="button"
                onClick={() => setReportingProfile(null)}
                className="text-neutral-400 hover:text-neutral-600 text-lg p-1"
                aria-label="بند کریں"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label htmlFor="report-reason" className="block text-sm font-semibold text-[#3D1D28] mb-1">
                  رپورٹ کی وجہ
                </label>
                <select
                  id="report-reason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B8] text-right bg-white text-sm"
                >
                  <option value="fake_profile">جعلی پروفائل / غلط معلومات</option>
                  <option value="harassment">ہراسانی یا نامناسب رویہ</option>
                  <option value="asking_money">پیسے یا مالی مدد کا تقاضا</option>
                  <option value="inappropriate_content">نامناسب مواد</option>
                  <option value="other">دیگر وجہ</option>
                </select>
              </div>

              <div>
                <label htmlFor="report-details" className="block text-sm font-semibold text-[#3D1D28] mb-1">
                  مزید تفصیلات
                </label>
                <textarea
                  id="report-details"
                  rows={3}
                  required
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="واقعے کی مختصر تفصیل لکھیں تاکہ ایڈمن مناسب کارروائی کر سکے..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B8] text-right text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingProfile(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl disabled:opacity-60"
                >
                  {reportSubmitting ? 'جمع ہو رہی ہے...' : 'رپورٹ جمع کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
