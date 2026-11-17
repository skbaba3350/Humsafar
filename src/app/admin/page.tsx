'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Profile, ApplicationReference, Report, PlatformSettings } from '@/lib/types';
import { 
  calculateAge, 
  formatUrduMaritalStatus, 
  formatUrduStatus, 
  formatUrduGender,
  formatUrduReferenceStatus 
} from '@/lib/utils';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  Accessibility, 
  Clock, 
  Users,
  MessageSquare,
  Lock,
  Phone,
  UserCheck,
  CheckSquare,
  Square,
  PauseCircle,
  PlayCircle,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboardPage() {
  const supabase = createClient();

  // Active Queue Tab
  const [activeTab, setActiveTab] = useState<
    'submitted' | 'references' | 'under_review' | 'additional_info' | 'existing_review' | 'reports' | 'all' | 'settings'
  >('submitted');

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [references, setReferences] = useState<ApplicationReference[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Application Detail & Checklist Modal
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedProfileRefs, setSelectedProfileRefs] = useState<ApplicationReference[]>([]);
  const [checklistAdult, setChecklistAdult] = useState(false);
  const [checklistIdentity, setChecklistIdentity] = useState(false);
  const [checklistDisability, setChecklistDisability] = useState(false);
  const [checklistReference, setChecklistReference] = useState(false);
  const [approvalReason, setApprovalReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Reference Check Action Modal
  const [selectedRef, setSelectedRef] = useState<ApplicationReference | null>(null);
  const [refCheckMethod, setRefCheckMethod] = useState<'direct_call' | 'in_person' | 'mutual_known_contact'>('direct_call');
  const [refCheckNotes, setRefCheckNotes] = useState('');
  const [refKnowsApplicant, setRefKnowsApplicant] = useState(true);
  const [refConfirmsDisability, setRefConfirmsDisability] = useState(true);
  const [refIdentityConsistent, setRefIdentityConsistent] = useState(true);
  const [refOutcome, setRefOutcome] = useState<'verified' | 'unable_to_verify' | 'rejected'>('verified');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Fetch profiles
    const { data: profData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch reports with related info
    const { data: repData } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(display_name, city),
        reported:profiles!reports_reported_id_fkey(display_name, city, status),
        message:messages!reports_reported_message_id_fkey(content, created_at)
      `)
      .order('created_at', { ascending: false });

    // Fetch all references for admin
    const { data: refData } = await supabase
      .from('application_references')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch platform operational settings
    const { data: setts } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('id', 1)
      .single();

    setProfiles((profData || []) as Profile[]);
    setReports(repData || []);
    setReferences((refData || []) as ApplicationReference[]);
    if (setts) setPlatformSettings(setts as PlatformSettings);

    setLoading(false);
  };

  const openProfileReview = (prof: Profile) => {
    setSelectedProfile(prof);
    const profRefs = references.filter((r) => r.profile_id === prof.id);
    setSelectedProfileRefs(profRefs);
    
    // Auto populate checklist if age >= 18 and verified refs exist
    const age = calculateAge(prof.birth_date);
    setChecklistAdult(age >= 18);
    setChecklistIdentity(false);
    setChecklistDisability(false);
    const hasVerifiedRef = profRefs.some((r) => r.verification_status === 'verified' && r.confirms_disability_eligibility);
    setChecklistReference(hasVerifiedRef);
    setApprovalReason('شناختی و معذوری کوائف کی جانچ اور معتبر حوالے سے تصدیق مکمل ہونے پر منظوری دی گئی۔');
    setActionNotes('');
  };

  const handleApproveMembership = async () => {
    if (!selectedProfile) return;
    if (!checklistAdult || !checklistIdentity || !checklistDisability || !checklistReference) {
      alert('لازمی تصدیقی چیک لسٹ نامکمل ہے! تمام تصدیقی خانے پر کرنا ضروری ہے۔');
      return;
    }
    if (!approvalReason.trim()) {
      alert('برائے کرم منظوری کے فیصلے کی ٹھوس اور معروضی وجہ درج کریں۔');
      return;
    }

    setSubmittingAction(true);
    try {
      const { error } = await supabase.rpc('admin_approve_membership', {
        p_target_id: selectedProfile.id,
        p_adult_checked: checklistAdult,
        p_identity_checked: checklistIdentity,
        p_disability_checked: checklistDisability,
        p_reference_check_passed: checklistReference,
        p_decision_reason: approvalReason.trim(),
      });

      if (error) throw error;

      alert('رکنیت کی باضابطہ منظوری کامیابی سے محفوظ ہو گئی۔ پروفائل ممبر کے خود شائع کرنے تک غیر شائع رہے گا۔');
      setSelectedProfile(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'منظوری محفوظ کرنے میں رکاوٹ آئی۔');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUpdateApplicationState = async (nextStatus: string) => {
    if (!selectedProfile) return;
    if (!actionNotes.trim() && nextStatus === 'additional_info_required') {
      alert('اضافی معلومات طلب کرنے کے لیے تفصیل یا نوٹ لکھنا لازمی ہے۔');
      return;
    }

    setSubmittingAction(true);
    try {
      const { error } = await supabase.rpc('admin_update_application_state', {
        p_target_id: selectedProfile.id,
        p_next_status: nextStatus,
        p_notes: actionNotes.trim() || `اسٹیٹس کو ${nextStatus} میں تبدیل کیا گیا`,
      });

      if (error) throw error;

      alert('اسٹیٹس کامیابی سے اپڈیٹ ہو گیا۔');
      setSelectedProfile(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'اسٹیٹس اپڈیٹ کرنے میں غلطی ہوئی۔');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleVerifyReference = async () => {
    if (!selectedRef) return;
    if (!refCheckNotes.trim()) {
      alert('براہ کرم حوالے کی تصدیق کا مختصر اور معروضی نوٹ درج کریں۔');
      return;
    }

    setSubmittingAction(true);
    try {
      const { error } = await supabase.rpc('admin_verify_reference', {
        p_reference_id: selectedRef.id,
        p_verification_status: refOutcome,
        p_verification_method: refCheckMethod,
        p_verification_notes: refCheckNotes.trim(),
        p_knows_applicant: refKnowsApplicant,
        p_relationship_nature: selectedRef.relationship,
        p_confirms_disability_eligibility: refConfirmsDisability,
        p_identity_consistent: refIdentityConsistent,
      });

      if (error) throw error;

      alert('حوالے کی تصدیقی تفصیلات اور نتیجہ محفوظ ہو گئے۔');
      setSelectedRef(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'حوالے کی جانچ محفوظ کرنے میں ناکامی ہوئی۔');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleTogglePlatformPause = async (type: 'applications' | 'approvals') => {
    if (!platformSettings) return;
    const isPaused = type === 'applications' ? platformSettings.applications_paused : platformSettings.approvals_paused;
    const nextPaused = !isPaused;
    try {
      const updatePayload = type === 'applications' 
        ? { applications_paused: nextPaused, updated_at: new Date().toISOString() }
        : { approvals_paused: nextPaused, updated_at: new Date().toISOString() };

      const { error } = await supabase
        .from('platform_settings')
        .update(updatePayload)
        .eq('id', 1);

      if (error) throw error;
      await loadData();
      alert(`${type === 'applications' ? 'درخواستیں' : 'منظوری کا عمل'} کامیابی سے ${nextPaused ? 'موقوف (Pause)' : 'بحال'} کر دیا گیا۔`);
    } catch (err: any) {
      alert(err.message || 'سیٹنگ تبدیل کرنے میں رکاوٹ آئی۔');
    }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase.rpc('admin_resolve_report', {
        target_report_id: reportId,
        new_status: status,
        note: status === 'resolved' ? 'شکایت کی تصدیق اور حل کر دیا گیا' : 'شکایت مسترد کر دی گئی',
      });

      if (error) throw error;
      alert(`شکایت کو ${status === 'resolved' ? 'حل شدہ' : 'مسترد'} قرار دے دیا گیا۔`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'شکایت اپڈیٹ کرنے میں ناکامی ہوئی۔');
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-[#850E35] font-bold">ایڈمن پینل لوڈ ہو رہا ہے...</div>;
  }

  // Queue Counts
  const newApplications = profiles.filter((p) => p.status === 'submitted');
  const refsPending = profiles.filter((p) => p.status === 'reference_verification_pending');
  const underReview = profiles.filter((p) => p.status === 'under_review');
  const additionalInfoReq = profiles.filter((p) => p.status === 'additional_info_required');
  const existingRequiringReview = profiles.filter((p) => p.status === 'new_eligibility_review_required');
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const allMembers = profiles.filter((p) => p.role === 'member');

  return (
    <div className="space-y-6">
      
      {/* Platform Capacity Controls Alert Bar */}
      {platformSettings && (platformSettings.applications_paused || platformSettings.approvals_paused) && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
            <PauseCircle className="w-5 h-5 text-rose-700" />
            <span>
              انتباہ: {platformSettings.applications_paused ? 'نئی درخواستیں موقوف ہیں' : ''}
              {platformSettings.applications_paused && platformSettings.approvals_paused ? ' • ' : ''}
              {platformSettings.approvals_paused ? 'منظوری کا عمل عارضی طور پر موقوف ہے' : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="text-xs text-rose-800 underline font-semibold"
          >
            سیٹنگز دیکھیں
          </button>
        </div>
      )}

      {/* Top Header & Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('submitted')}
          className={`p-4 rounded-2xl border text-right transition ${activeTab === 'submitted' ? 'bg-[#FAF0E6] border-[#850E35]' : 'bg-white border-[#E8DFD5]'}`}
        >
          <span className="text-xs text-[#735160] font-semibold">نئی درخواستیں</span>
          <h3 className="text-2xl font-bold text-[#850E35] mt-1">{newApplications.length}</h3>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('references')}
          className={`p-4 rounded-2xl border text-right transition ${activeTab === 'references' ? 'bg-[#FAF0E6] border-[#850E35]' : 'bg-white border-[#E8DFD5]'}`}
        >
          <span className="text-xs text-[#735160] font-semibold">حوالہ جات زیرِ تصدیق</span>
          <h3 className="text-2xl font-bold text-purple-700 mt-1">{refsPending.length}</h3>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('under_review')}
          className={`p-4 rounded-2xl border text-right transition ${activeTab === 'under_review' ? 'bg-[#FAF0E6] border-[#850E35]' : 'bg-white border-[#E8DFD5]'}`}
        >
          <span className="text-xs text-[#735160] font-semibold">زیرِ حتمی جائزہ</span>
          <h3 className="text-2xl font-bold text-blue-700 mt-1">{underReview.length}</h3>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('additional_info')}
          className={`p-4 rounded-2xl border text-right transition ${activeTab === 'additional_info' ? 'bg-[#FAF0E6] border-[#850E35]' : 'bg-white border-[#E8DFD5]'}`}
        >
          <span className="text-xs text-[#735160] font-semibold">معلومات درکار</span>
          <h3 className="text-2xl font-bold text-orange-600 mt-1">{additionalInfoReq.length}</h3>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('existing_review')}
          className={`p-4 rounded-2xl border text-right transition ${activeTab === 'existing_review' ? 'bg-[#FAF0E6] border-[#850E35]' : 'bg-white border-[#E8DFD5]'}`}
        >
          <span className="text-xs text-[#735160] font-semibold">پرانے اکاؤنٹس کا جائزہ</span>
          <h3 className="text-2xl font-bold text-amber-700 mt-1">{existingRequiringReview.length}</h3>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`p-4 rounded-2xl border text-right transition ${activeTab === 'reports' ? 'bg-[#FAF0E6] border-[#850E35]' : 'bg-white border-[#E8DFD5]'}`}
        >
          <span className="text-xs text-[#735160] font-semibold">شکایات / رپورٹس</span>
          <h3 className="text-2xl font-bold text-rose-700 mt-1">{pendingReports.length}</h3>
        </button>
      </div>

      {/* Secondary Queue Tabs */}
      <div className="flex bg-[#FAF6F0] p-1.5 rounded-2xl border border-[#E8DFD5] overflow-x-auto text-xs font-bold gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('submitted')}
          className={`px-4 py-2 rounded-xl transition shrink-0 ${activeTab === 'submitted' ? 'bg-white text-[#850E35] shadow-xs' : 'text-[#6F4E5D]'}`}
        >
          نئی درخواستیں ({newApplications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('references')}
          className={`px-4 py-2 rounded-xl transition shrink-0 ${activeTab === 'references' ? 'bg-white text-[#850E35] shadow-xs' : 'text-[#6F4E5D]'}`}
        >
          حوالہ تصدیق کیو ({refsPending.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('under_review')}
          className={`px-4 py-2 rounded-xl transition shrink-0 ${activeTab === 'under_review' ? 'bg-white text-[#850E35] shadow-xs' : 'text-[#6F4E5D]'}`}
        >
          زیرِ فیصلہ ({underReview.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('additional_info')}
          className={`px-4 py-2 rounded-xl transition shrink-0 ${activeTab === 'additional_info' ? 'bg-white text-[#850E35] shadow-xs' : 'text-[#6F4E5D]'}`}
        >
          معلومات کا انتظار ({additionalInfoReq.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('existing_review')}
          className={`px-4 py-2 rounded-xl transition shrink-0 ${activeTab === 'existing_review' ? 'bg-white text-[#850E35] shadow-xs' : 'text-[#6F4E5D]'}`}
        >
          پرانے اکاؤنٹس ({existingRequiringReview.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl transition shrink-0 ${activeTab === 'reports' ? 'bg-white text-[#850E35] shadow-xs' : 'text-[#6F4E5D]'}`}
        >
          شکایات ({pendingReports.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl transition shrink-0 ${activeTab === 'all' ? 'bg-white text-[#850E35] shadow-xs' : 'text-[#6F4E5D]'}`}
        >
          تمام ممبرز ({allMembers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl transition shrink-0 ${activeTab === 'settings' ? 'bg-white text-[#850E35] shadow-xs' : 'text-[#6F4E5D]'}`}
        >
          پلیٹ فارم سیٹنگز
        </button>
      </div>

      {/* QUEUE 1: SUBMITTED APPLICATIONS */}
      {activeTab === 'submitted' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#3D1D28]">نئی موصول شدہ درخواستیں</h2>
            <span className="text-xs text-neutral-500">جائزہ لینے اور حوالہ کی تصدیق کے لیے درخواست کھولیں</span>
          </div>

          {newApplications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-[#735160] border border-[#E8DFD5]">
              اس وقت کوئی نئی درخواست زیرِ انتظار نہیں ہے۔
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newApplications.map((prof) => (
                <div key={prof.id} className="bg-white p-5 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-[#3D1D28] text-base">{prof.display_name}</h3>
                      <p className="text-xs text-neutral-500">{prof.city} • {calculateAge(prof.birth_date)} سال • {formatUrduMaritalStatus(prof.marital_status)}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full font-semibold border border-blue-200">
                      موصول شدہ
                    </span>
                  </div>

                  <div className="text-xs bg-[#FAF8F5] p-3 rounded-xl border border-[#E8DFD5] text-[#5C3F4B] line-clamp-2">
                    <strong>معذوری کی تفصیل:</strong> {prof.disability_explanation || 'کوئی وضاحت درج نہیں کی گئی'}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                      حوالہ جات: {references.filter((r) => r.profile_id === prof.id).length}
                    </span>
                    <button
                      type="button"
                      onClick={() => openProfileReview(prof)}
                      className="px-4 py-2 bg-[#850E35] hover:bg-[#6D092A] text-white text-xs font-bold rounded-xl transition"
                    >
                      تفصیلی جائزہ لیں
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUEUE 2: REFERENCES AWAITING VERIFICATION */}
      {activeTab === 'references' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#3D1D28]">حقیقی حوالہ جات کی خود مختار تصدیق</h2>
          {refsPending.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-[#735160] border border-[#E8DFD5]">
              حوالہ جات کی تصدیق کی کیو خالی ہے۔
            </div>
          ) : (
            <div className="space-y-3">
              {refsPending.map((prof) => {
                const profRefs = references.filter((r) => r.profile_id === prof.id);
                return (
                  <div key={prof.id} className="bg-white p-5 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-3">
                      <div>
                        <h3 className="font-bold text-[#3D1D28]">{prof.display_name} ({prof.legal_name || 'نامعلوم قانونی نام'})</h3>
                        <p className="text-xs text-neutral-500">{prof.city} • رابطہ نمبر: {prof.contact_phone || 'نامعلوم'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openProfileReview(prof)}
                        className="px-3 py-1.5 bg-[#FAF0E6] text-[#850E35] border border-[#850E35]/30 text-xs font-bold rounded-xl"
                      >
                        درخواست کا فارم دیکھیں
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#850E35]">درخواست گزار کے فراہم کردہ حوالہ جات:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {profRefs.map((r) => {
                          const refStatus = formatUrduReferenceStatus(r.verification_status);
                          return (
                            <div key={r.id} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8DFD5] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-[#3D1D28]">{r.reference_name}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${refStatus.color}`}>
                                  {refStatus.label}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-600">تعلق: {r.relationship}</p>
                              <p className="text-xs text-neutral-800 dir-ltr text-right font-mono">{r.contact_details}</p>
                              
                              {r.verification_status === 'pending' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRef(r);
                                    setRefCheckNotes('');
                                    setRefOutcome('verified');
                                  }}
                                  className="w-full py-1.5 bg-[#850E35] text-white text-xs font-bold rounded-lg mt-2"
                                >
                                  حوالہ سے تصدیقی رابطہ درج کریں
                                </button>
                              ) : (
                                <div className="text-[11px] text-neutral-500 bg-white p-2 rounded-lg border">
                                  <strong>نوٹ:</strong> {r.verification_notes || 'کوئی نوٹ نہیں'}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUEUE 3: DECISIONS UNDER REVIEW */}
      {activeTab === 'under_review' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#3D1D28]">حتمی فیصلے کے منتظر پروفائلز</h2>
          {underReview.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-[#735160] border border-[#E8DFD5]">
              کوئی درخواست زیرِ حتمی فیصلہ نہیں ہے۔
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {underReview.map((prof) => (
                <div key={prof.id} className="bg-white p-5 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#3D1D28]">{prof.display_name}</h3>
                    <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                      زیرِ حتمی فیصلہ
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">{prof.city} • {calculateAge(prof.birth_date)} سال</p>
                  <button
                    type="button"
                    onClick={() => openProfileReview(prof)}
                    className="w-full py-2 bg-[#850E35] text-white text-xs font-bold rounded-xl"
                  >
                    چیک لسٹ مکمل کر کے فیصلہ کریں
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUEUE 4: ADDITIONAL INFO REQUESTED */}
      {activeTab === 'additional_info' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#3D1D28]">اضافی معلومات کے منتظر پروفائلز</h2>
          {additionalInfoReq.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-[#735160] border border-[#E8DFD5]">
              کوئی اکاؤنٹ اس کیو میں نہیں ہے۔
            </div>
          ) : (
            <div className="space-y-3">
              {additionalInfoReq.map((prof) => (
                <div key={prof.id} className="bg-white p-5 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#3D1D28]">{prof.display_name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full border border-orange-200">
                      معلومات درکار
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600"><strong>ایڈمن کا مطلوبہ سوال:</strong> {prof.review_notes}</p>
                  {prof.applicant_response_notes && (
                    <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <strong>درخواست گزار کا موصول جواب:</strong> {prof.applicant_response_notes}
                    </p>
                  )}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => openProfileReview(prof)}
                      className="px-4 py-1.5 bg-[#850E35] text-white text-xs font-bold rounded-lg"
                    >
                      دوبارہ جائزہ لیں
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUEUE 5: EXISTING ACCOUNTS REQUIRING REVIEW */}
      {activeTab === 'existing_review' && (
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-300 text-xs sm:text-sm text-amber-900 leading-relaxed">
            <strong>نئی اہلیت کا اصول:</strong> پرانے تمام ممبرز کے اکاؤنٹس عارضی طور پر غیر شائع شدہ اور معلق کیے گئے ہیں جب تک وہ معذوری کی تصدیق اور حقیقی حوالہ جات جمع نہ کروائیں۔
          </div>

          {existingRequiringReview.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-[#735160] border border-[#E8DFD5]">
              تمام پرانے اکاؤنٹس کا جائزہ مکمل ہو چکا ہے۔
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {existingRequiringReview.map((prof) => (
                <div key={prof.id} className="bg-white p-5 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#3D1D28]">{prof.display_name}</h3>
                    <span className="text-xs px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-300 font-semibold">
                      نیا جائزہ درکار
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">{prof.city} • {calculateAge(prof.birth_date)} سال • {formatUrduMaritalStatus(prof.marital_status)}</p>
                  <p className="text-xs text-neutral-600 line-clamp-2">{prof.bio}</p>
                  <button
                    type="button"
                    onClick={() => openProfileReview(prof)}
                    className="w-full py-2 bg-[#850E35] text-white text-xs font-bold rounded-xl"
                  >
                    پروفائل دیکھیں
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUEUE 6: SAFETY REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#3D1D28]">حفاظتی شکایات اور رپورٹس</h2>
          {pendingReports.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-[#735160] border border-[#E8DFD5]">
              اس وقت کوئی زیرِ التوا رپورٹ موجود نہیں ہے۔
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReports.map((rep) => (
                <div key={rep.id} className="bg-white p-6 rounded-2xl border border-rose-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold">
                        شکایت برائے: {rep.reported?.display_name || 'نامعلوم'}
                      </span>
                      <p className="text-xs text-neutral-500 mt-1">رپورٹ کنندہ: {rep.reporter?.display_name || 'نامعلوم'}</p>
                    </div>
                    <span className="text-xs text-neutral-400">{new Date(rep.created_at).toLocaleDateString('ur-PK')}</span>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl text-xs text-[#3D1D28] space-y-1">
                    <p><strong>وجہ:</strong> {rep.reason}</p>
                    <p><strong>تفصیل:</strong> {rep.details}</p>
                    {rep.message && (
                      <p className="text-rose-800 bg-rose-50 p-2 rounded-lg mt-2">
                        <strong>رپورٹ شدہ پیغام:</strong> &quot;{rep.message.content}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleResolveReport(rep.id, 'resolved')}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
                    >
                      شکایت حل شدہ قرار دیں
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveReport(rep.id, 'dismissed')}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl"
                    >
                      بے بنیاد / مسترد کریں
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUEUE 7: ALL MEMBERS DIRECTORY & SUSPENSION */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#3D1D28]">تمام ممبرز کا ریکارڈ</h2>
          <div className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#E8DFD5] text-[#3D1D28]">
                  <tr>
                    <th className="p-3">نام</th>
                    <th className="p-3">شہر</th>
                    <th className="p-3">حیثیت</th>
                    <th className="p-3">شائع شدہ</th>
                    <th className="p-3">معطلی</th>
                    <th className="p-3">کارروائی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFD5]">
                  {allMembers.map((m) => {
                    const st = formatUrduStatus(m.status);
                    return (
                      <tr key={m.id} className="hover:bg-[#FAF8F5]">
                        <td className="p-3 font-bold">{m.display_name}</td>
                        <td className="p-3">{m.city}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="p-3">{m.is_published ? 'ہاں' : 'نہیں'}</td>
                        <td className="p-3">{m.is_suspended ? 'معطل' : 'فعال'}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => openProfileReview(m)}
                            className="px-3 py-1 bg-[#850E35] text-white rounded-lg text-xs"
                          >
                            تفصیل دیکھیں
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QUEUE 8: PLATFORM OPERATIONAL SETTINGS */}
      {activeTab === 'settings' && platformSettings && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-6 max-w-2xl">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#3D1D28]">پلیٹ فارم آپریشنل کنٹرولز</h2>
            <p className="text-xs text-neutral-500">
              جب ایڈمنسٹریٹرز کے پاس جائزے کی استطاعت کم ہو تو نئی درخواستیں یا منظوریاں عارضی طور پر موقوف کی جا سکتی ہیں۔
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8DFD5] flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#3D1D28]">نئی درخواستیں وصول کرنا</p>
                <p className="text-xs text-neutral-500">
                  {platformSettings.applications_paused ? 'اس وقت نئی درخواستیں موقوف ہیں' : 'اس وقت درخواستیں فعال ہیں'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePlatformPause('applications')}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition ${
                  platformSettings.applications_paused ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {platformSettings.applications_paused ? 'درخواستیں بحال کریں' : 'درخواستیں عارضی موقوف کریں'}
              </button>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8DFD5] flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#3D1D28]">منظوری کا عمل (Approvals)</p>
                <p className="text-xs text-neutral-500">
                  {platformSettings.approvals_paused ? 'اس وقت رکنیت کی منظوری موقوف ہے' : 'اس وقت منظوری کا عمل فعال ہے'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePlatformPause('approvals')}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition ${
                  platformSettings.approvals_paused ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {platformSettings.approvals_paused ? 'منظوری کا عمل بحال کریں' : 'منظوری موقوف کریں'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPLICIT REVIEW & APPROVAL CHECKLIST MODAL */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 border border-[#D4AF37] shadow-2xl my-8">
            
            <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#3D1D28]">
                  درخواست گزار کا انفرادی جائزہ: {selectedProfile.display_name}
                </h3>
                <p className="text-xs text-[#735160]">
                  قانونی نام: {selectedProfile.legal_name || 'نامعلوم'} • فون: {selectedProfile.contact_phone || 'نامعلوم'} • عمر: {calculateAge(selectedProfile.birth_date)} سال
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                className="text-neutral-400 hover:text-neutral-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Application Private Details Box */}
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8DFD5] text-xs text-[#3D1D28] space-y-2 max-h-48 overflow-y-auto">
              <p><strong>معذوری کی وضاحت:</strong> {selectedProfile.disability_explanation || selectedProfile.disability_notes || 'نہیں لکھی گئی'}</p>
              <p><strong>سہولت یا رسائی کی ضرورت:</strong> {selectedProfile.accommodation_needs || 'کوئی مخصوص ضرورت نہیں بتائی گئی'}</p>
              <p><strong>شادی کے ارادے کا بیان:</strong> {selectedProfile.marriage_intention_statement || 'نہیں لکھا گیا'}</p>
              <p><strong>رضامندی:</strong> جائزہ رضامندی: {selectedProfile.applicant_consent_review ? 'ہاں' : 'نہیں'} • حوالہ جات رابطہ رضامندی: {selectedProfile.applicant_consent_references ? 'ہاں' : 'نہیں'}</p>
              {selectedProfile.reconsideration_request && (
                <p className="text-amber-800 bg-amber-50 p-2 rounded">
                  <strong>دوبارہ جائزے کی استدعا:</strong> {selectedProfile.reconsideration_request}
                </p>
              )}
            </div>

            {/* Application References List & Verification Status */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#850E35]">حوالہ جات اور تصدیقی کیفیت:</h4>
              {selectedProfileRefs.length === 0 ? (
                <p className="text-xs text-rose-700">کوئی حوالہ درج نہیں کیا گیا۔</p>
              ) : (
                <div className="space-y-2">
                  {selectedProfileRefs.map((r) => {
                    const st = formatUrduReferenceStatus(r.verification_status);
                    return (
                      <div key={r.id} className="p-3 bg-white rounded-xl border border-[#E8DFD5] text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[#3D1D28]">{r.reference_name} ({r.relationship})</p>
                          <p className="text-neutral-500 dir-ltr text-right">{r.contact_details}</p>
                          {r.verification_notes && (
                            <p className="text-neutral-600 mt-1"><strong>نوٹ:</strong> {r.verification_notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] ${st.color}`}>
                            {st.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRef(r);
                              setRefCheckNotes(r.verification_notes || '');
                              setRefOutcome(r.verification_status === 'pending' ? 'verified' : r.verification_status);
                            }}
                            className="px-2.5 py-1 bg-[#850E35] text-white rounded-lg text-[11px]"
                          >
                            تصدیق درج کریں
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MANDATORY APPROVAL CHECKLIST */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-700" />
                <span>رکنیت کی منظوری کے لیے لازمی تصدیقی چیک لسٹ (تمام لازمی ہیں):</span>
              </h4>

              <div className="space-y-2 text-xs text-emerald-950">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklistAdult}
                    onChange={(e) => setChecklistAdult(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded"
                  />
                  <span>۱۔ بالغ ہونے کی تصدیق (عمر ۱۸ سال یا زائد ہے)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklistIdentity}
                    onChange={(e) => setChecklistIdentity(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded"
                  />
                  <span>۲۔ بنیادی شناختی کوائف اور قانونی نام کا جائزہ مکمل ہے</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklistDisability}
                    onChange={(e) => setChecklistDisability(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded"
                  />
                  <span>۳۔ معذوری کی اہلیت کا جائزہ مکمل ہے (دستاویزات کے بغیر بھی باخبر جانچ)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklistReference}
                    onChange={(e) => setChecklistReference(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded"
                  />
                  <span>۴۔ کم از کم ایک حقیقی و خود مختار معتبر حوالے کی تصدیق مکمل ہے</span>
                </label>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-emerald-950 mb-1">
                  منظوری کے فیصلے کی معروضی وجہ:
                </label>
                <input
                  type="text"
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-emerald-300 text-xs text-[#3D1D28]"
                />
              </div>

              <button
                type="button"
                disabled={submittingAction || !checklistAdult || !checklistIdentity || !checklistDisability || !checklistReference}
                onClick={handleApproveMembership}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                چیک لسٹ کی تصدیق کے ساتھ باضابطہ منظوری دیں
              </button>
            </div>

            {/* Other State Transitions */}
            <div className="space-y-3 pt-2 border-t border-[#E8DFD5]">
              <label className="block text-xs font-semibold text-[#3D1D28]">
                دیگر کارروائی کے لیے ایڈمن نوٹ (اگر معلومات طلب کرنی ہوں یا مسترد کرنا ہو):
              </label>
              <textarea
                rows={2}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="نوٹ تحریر کریں..."
                className="w-full px-3 py-2 rounded-xl border border-[#D5C7B8] text-xs text-[#3D1D28]"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleUpdateApplicationState('additional_info_required')}
                  className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-900 rounded-xl text-xs font-bold"
                >
                  مزید معلومات طلب کریں
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleUpdateApplicationState('reference_verification_pending')}
                  className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-xl text-xs font-bold"
                >
                  حوالہ تصدیق میں منتقل کریں
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleUpdateApplicationState('not_approved')}
                  className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl text-xs font-bold"
                >
                  درخواست مسترد کریں (تصدیق نہ ہو سکی)
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleUpdateApplicationState('suspended')}
                  className="px-3 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-bold"
                >
                  اکاؤنٹ معطل کریں
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* REFERENCE VERIFICATION CHECK MODAL */}
      {selectedRef && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 border border-[#D4AF37] shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-[#3D1D28]">حقیقی حوالے سے تصدیقی رابطہ</h3>
                <p className="text-xs text-neutral-500">{selectedRef.reference_name} ({selectedRef.relationship})</p>
              </div>
              <button type="button" onClick={() => setSelectedRef(null)} className="text-neutral-400 font-bold">✕</button>
            </div>

            <div className="text-xs bg-[#FAF8F5] p-3 rounded-xl border space-y-1">
              <p><strong>رابطہ نمبر:</strong> <span className="dir-ltr inline-block font-mono">{selectedRef.contact_details}</span></p>
              <p><strong>رہنما اصول:</strong> حوالے سے صرف باخبر تصدیق کریں کہ وہ درخواست گزار کو جانتے ہیں اور ان کی معذوری کی اہلیت سے آگاہ ہیں۔ کسی سے ذاتی یا حساس تفصیلات نہ پوچھیں۔</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">رابطے کا طریقہ کار:</label>
                <select
                  value={refCheckMethod}
                  onChange={(e: any) => setRefCheckMethod(e.target.value)}
                  className="w-full p-2 rounded-lg border bg-white"
                >
                  <option value="direct_call">براہِ راست فون کال</option>
                  <option value="mutual_known_contact">باہمی واقف کار کے ذریعے تصدیق</option>
                  <option value="in_person">روبرو ملاقات / جانچ</option>
                </select>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={refKnowsApplicant}
                    onChange={(e) => setRefKnowsApplicant(e.target.checked)}
                    className="w-4 h-4 text-[#850E35]"
                  />
                  <span>حوالہ درخواست گزار کو بذاتِ خود جانتا ہے</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={refConfirmsDisability}
                    onChange={(e) => setRefConfirmsDisability(e.target.checked)}
                    className="w-4 h-4 text-[#850E35]"
                  />
                  <span>حوالہ معذوری کی اہلیت کی براہِ راست تصدیق کرتا ہے</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={refIdentityConsistent}
                    onChange={(e) => setRefIdentityConsistent(e.target.checked)}
                    className="w-4 h-4 text-[#850E35]"
                  />
                  <span>شناختی کوائف درخواست کے مطابق ہیں</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold mb-1">تصدیق کا مختصر اور معروضی نوٹ:</label>
                <textarea
                  rows={2}
                  value={refCheckNotes}
                  onChange={(e) => setRefCheckNotes(e.target.value)}
                  placeholder="مختصر معروضی نتیجہ درج کریں..."
                  className="w-full p-2 rounded-lg border text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">حتمی تصدیقی نتیجہ:</label>
                <select
                  value={refOutcome}
                  onChange={(e: any) => setRefOutcome(e.target.value)}
                  className="w-full p-2 rounded-lg border bg-white"
                >
                  <option value="verified">تصدیق شدہ (اہلیت ثابت ہوئی)</option>
                  <option value="unable_to_verify">تصدیق ممکن نہ ہو سکی (رابطہ نہ ہوا یا معلومات ناکافی)</option>
                  <option value="rejected">غیر معتبر حوالہ (درخواست کے متضاد)</option>
                </select>
              </div>

              <button
                type="button"
                disabled={submittingAction || !refCheckNotes.trim()}
                onClick={handleVerifyReference}
                className="w-full py-2.5 bg-[#850E35] hover:bg-[#6D092A] text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                حوالے کی جانچ محفوظ کریں
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
