'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Profile, Report } from '@/lib/types';
import { 
  calculateAge, 
  formatUrduMaritalStatus, 
  formatUrduStatus, 
  formatUrduGender 
} from '@/lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  Accessibility, 
  Clock, 
  Users,
  MessageSquare
} from 'lucide-react';

export default function AdminDashboardPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'reviews' | 'reports' | 'all'>('reviews');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Action modal
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'request_changes' | 'suspend' | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Fetch all profiles
    const { data: profData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch reports with related info and reported message
    const { data: repData } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(display_name, city),
        reported:profiles!reports_reported_id_fkey(display_name, city, status),
        message:messages!reports_reported_message_id_fkey(content, created_at)
      `)
      .order('created_at', { ascending: false });

    setProfiles((profData || []) as Profile[]);
    setReports(repData || []);
    setLoading(false);
  };

  const executeAdminAction = async () => {
    if (!selectedProfile || !actionType) return;
    setSubmittingAction(true);

    let nextStatus = selectedProfile.status;
    let auditAction = '';

    if (actionType === 'approve') {
      nextStatus = 'approved';
      auditAction = 'پروفائل کی منظوری دی گئی';
    } else if (actionType === 'request_changes') {
      nextStatus = 'changes_requested';
      auditAction = `ترمیم کا تقاضا کیا گیا: ${reviewNote}`;
    } else if (actionType === 'suspend') {
      nextStatus = 'suspended';
      auditAction = `اکاؤنٹ معطل کیا گیا: ${reviewNote}`;
    }

    try {
      // Use atomic RPC for security and audit logging
      const { error: rpcErr } = await supabase.rpc('admin_process_profile', {
        target_profile_id: selectedProfile.id,
        new_status: nextStatus,
        note: reviewNote,
      });

      if (rpcErr) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({
            status: nextStatus,
            review_notes: reviewNote,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedProfile.id);

        if (updateErr) throw updateErr;
      }

      alert('کارروائی کامیابی سے مکمل ہو گئی۔');
      setSelectedProfile(null);
      setActionType(null);
      setReviewNote('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'کارروائی کے دوران غلطی ہوئی۔');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const { error: rpcErr } = await supabase.rpc('admin_resolve_report', {
        target_report_id: reportId,
        new_status: status,
        note: status === 'resolved' ? 'شکایت کی تصدیق اور حل کر دیا گیا' : 'شکایت مسترد کر دی گئی',
      });

      if (rpcErr) {
        const { error } = await supabase
          .from('reports')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', reportId);

        if (error) throw error;
      }

      alert(`شکایت کو ${status === 'resolved' ? 'حل شدہ' : 'مسترد'} قرار دے دیا گیا۔`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'شکایت اپڈیٹ کرنے میں ناکامی ہوئی۔');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-[#850E35]">لوڈ ہو رہا ہے...</div>;
  }

  const pendingReviews = profiles.filter((p) => p.status === 'pending_review');
  const pendingReports = reports.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      
      {/* Header and Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#735160]">زیرِ جائزہ پروفائلز</p>
            <h3 className="text-2xl font-bold text-[#850E35] mt-1">{pendingReviews.length}</h3>
          </div>
          <Clock className="w-8 h-8 text-[#850E35]/40" />
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#735160]">زیرِ غور شکایات</p>
            <h3 className="text-2xl font-bold text-rose-700 mt-1">{pendingReports.length}</h3>
          </div>
          <ShieldAlert className="w-8 h-8 text-rose-600/40" />
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#735160]">کل ارکان کی تعداد</p>
            <h3 className="text-2xl font-bold text-[#3D1D28] mt-1">{profiles.length}</h3>
          </div>
          <Users className="w-8 h-8 text-[#3D1D28]/40" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#FAF6F0] p-1 rounded-xl border border-[#E8DFD5] max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
            activeTab === 'reviews' ? 'bg-white text-[#850E35] shadow-xs' : 'text-[#6D4F5C]'
          }`}
        >
          پروفائل جائزے ({pendingReviews.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
            activeTab === 'reports' ? 'bg-white text-rose-700 shadow-xs' : 'text-[#6D4F5C]'
          }`}
        >
          شکایات کی فہرست ({pendingReports.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
            activeTab === 'all' ? 'bg-white text-[#3D1D28] shadow-xs' : 'text-[#6D4F5C]'
          }`}
        >
          تمام ارکان ({profiles.length})
        </button>
      </div>

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {pendingReviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-[#7A5B67] border border-[#E8DFD5]">
              کوئی پروفائل زیرِ جائزہ نہیں ہے۔ سب کام مکمل ہے!
            </div>
          ) : (
            pendingReviews.map((p) => {
              const age = calculateAge(p.birth_date);
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-[#3D1D28]">
                        {p.display_name} ({age} سال)
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                        زیرِ جائزہ
                      </span>
                      {p.has_disability && (
                        <span className="text-xs px-2 py-0.5 bg-[#EFE8F7] text-[#4F2582] rounded-md font-semibold flex items-center gap-1">
                          <Accessibility className="w-3.5 h-3.5" />
                          <span>معذوری نوٹ شامل</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#735160]">
                      {p.city} • {formatUrduMaritalStatus(p.marital_status)} • {formatUrduGender(p.gender)}
                    </p>

                    <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#F0E6DC] text-sm text-[#4A2633] leading-relaxed">
                      <span className="font-bold text-xs text-[#850E35] block mb-1">تعارف:</span>
                      {p.bio}
                    </div>

                    {p.partner_preferences && (
                      <p className="text-xs text-[#6E4F5C]">
                        <span className="font-bold">ترجیحات:</span> {p.partner_preferences}
                      </p>
                    )}

                    {p.has_disability && p.disability_notes && (
                      <div className="p-2.5 rounded-lg bg-[#FAF7FC] border border-[#E2D2F2] text-xs text-[#4F2582]">
                        <span className="font-bold">رسائی نوٹ:</span> {p.disability_notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProfile(p);
                        setActionType('approve');
                        setReviewNote('پروفائل کی تمام معلومات معیاری ہیں اور اسے منظور کیا جاتا ہے۔');
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>منظور کریں</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProfile(p);
                        setActionType('request_changes');
                        setReviewNote('براہ کرم اپنا تعارف اور خاندانی پس منظر کچھ مزید تفصیل سے واضح فرمائیں۔');
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      <span>ترمیم کا تقاضا</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProfile(p);
                        setActionType('suspend');
                        setReviewNote('ہم سفر کی ضابطہ اخلاق کی خلاف ورزی کی بنا پر معطل کیا جا رہا ہے۔');
                      }}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>اکاؤنٹ معطل کریں</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-[#7A5B67] border border-[#E8DFD5]">
              کوئی شکایت یا رپورٹ درج نہیں ہے۔
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2ECE4] pb-3">
                  <div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
                      وجہ: {rep.reason === 'fake_profile' ? 'جعلی پروفائل' : rep.reason === 'harassment' ? 'ہراسانی' : rep.reason === 'asking_money' ? 'پیسے مانگنا' : 'دیگر'}
                    </span>
                    <h3 className="text-lg font-bold text-[#3D1D28] mt-1">
                      شکایت کنندہ: {rep.reporter?.display_name || 'ممبر'} بنام: {rep.reported?.display_name || 'ممبر'}
                    </h3>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold self-start sm:self-auto ${
                      rep.status === 'pending'
                        ? 'bg-amber-100 text-amber-900'
                        : rep.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    اسٹیٹس: {rep.status === 'pending' ? 'زیرِ غور' : rep.status === 'resolved' ? 'حل شدہ' : 'مسترد'}
                  </span>
                </div>

                <div className="text-sm text-[#4A2633] space-y-1">
                  <p className="font-semibold text-xs text-[#850E35]">تفصیلات:</p>
                  <p className="bg-[#FAF8F5] p-3 rounded-xl border border-[#F2ECE4]">{rep.details}</p>
                </div>

                {/* If a specific message was reported, ONLY show that message (strictly respecting privacy) */}
                {rep.message && (
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>رپورٹ شدہ مخصوص میسج کا متن (صرف یہی میسج ایڈمن کے لیے دستیاب ہے):</span>
                    </p>
                    <p className="text-sm text-rose-950 font-medium">"{rep.message.content}"</p>
                    <p className="text-[10px] text-rose-600">
                      تاریخِ پیغام: {new Date(rep.message.created_at).toLocaleString('ur-PK')}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {rep.status === 'pending' && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleResolveReport(rep.id, 'resolved')}
                      className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                    >
                      کارروائی مکمل / حل شدہ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveReport(rep.id, 'dismissed')}
                      className="px-4 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold"
                    >
                      شکایت غیر مصدقہ / مسترد
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* All Members Tab */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#FAF8F5] border-b border-[#E8DFD5] text-xs font-bold text-[#6D4F5C]">
                <tr>
                  <th className="p-4">نام</th>
                  <th className="p-4">شہر</th>
                  <th className="p-4">ازدواجی حیثیت</th>
                  <th className="p-4">رول</th>
                  <th className="p-4">اسٹیٹس</th>
                  <th className="p-4">ایکشن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {profiles.map((p) => {
                  const statusInfo = formatUrduStatus(p.status);
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]">
                      <td className="p-4 font-bold text-[#3D1D28]">{p.display_name}</td>
                      <td className="p-4 text-[#523A44]">{p.city}</td>
                      <td className="p-4 text-[#523A44]">{formatUrduMaritalStatus(p.marital_status)}</td>
                      <td className="p-4 text-xs font-semibold">{p.role === 'admin' ? 'ایڈمن' : 'ممبر'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProfile(p);
                            setActionType(p.status === 'approved' ? 'suspend' : 'approve');
                            setReviewNote('');
                          }}
                          className="text-xs text-[#850E35] font-bold hover:underline"
                        >
                          اسٹیٹس تبدیل کریں
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Action Modal */}
      {selectedProfile && actionType && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E8DFD5]">
            <h3 className="font-bold text-lg text-[#3D1D28]">
              {actionType === 'approve'
                ? `پروفائل منظوری (${selectedProfile.display_name})`
                : actionType === 'request_changes'
                ? `ترمیم کا تقاضا (${selectedProfile.display_name})`
                : `اکاؤنٹ معطلی (${selectedProfile.display_name})`}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#3D1D28] mb-1">
                ایڈمن کا فیصلہ / صارف کے لیے نوٹ:
              </label>
              <textarea
                rows={3}
                required
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="فیصلے کی تفصیل یا رہنمائی لکھیں..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#D5C7B8] text-right"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedProfile(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                منسوخ
              </button>

              <button
                type="button"
                disabled={submittingAction}
                onClick={executeAdminAction}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl disabled:opacity-50 ${
                  actionType === 'approve'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : actionType === 'request_changes'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {submittingAction ? 'جاری ہے...' : 'فیصلہ نافذ کریں'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
