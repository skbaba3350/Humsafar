'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, InterestRequest } from '@/lib/types';
import { calculateAge, formatUrduMaritalStatus } from '@/lib/utils';
import { 
  HeartHandshake, 
  Check, 
  X, 
  Undo2, 
  MessageSquare, 
  Eye, 
  Lock, 
  ShieldAlert, 
  Clock 
} from 'lucide-react';

export default function RequestsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Load received requests
    const { data: recData } = await supabase
      .from('interest_requests')
      .select('*, sender:profiles!interest_requests_sender_id_fkey(*)')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });

    // Load sent requests
    const { data: sentData } = await supabase
      .from('interest_requests')
      .select('*, receiver:profiles!interest_requests_receiver_id_fkey(*)')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    setReceivedRequests(recData || []);
    setSentRequests(sentData || []);
    setLoading(false);
  };

  const handleAccept = async (reqId: string) => {
    setActionLoading(reqId);
    try {
      // Call Postgres atomic stored procedure
      const { data: convId, error } = await supabase.rpc('accept_interest_request', {
        req_id: reqId,
      });

      if (error) throw error;

      alert('درخواست قبول کر لی گئی! آپ اب نجی گفتگو میں رابطہ کر سکتے ہیں۔');
      await loadRequests();
      if (convId) {
        router.push(`/portal/messages/${convId}`);
      }
    } catch (err: any) {
      alert(err.message || 'درخواست قبول کرنے میں رکاوٹ آئی۔');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (reqId: string) => {
    if (!confirm('کیا آپ واقعی اس درخواست کو مسترد کرنا چاہتے ہیں؟')) return;
    setActionLoading(reqId);
    try {
      const { error } = await supabase
        .from('interest_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', reqId);

      if (error) throw error;
      await loadRequests();
    } catch (err: any) {
      alert(err.message || 'درخواست رد کرنے میں دشواری ہوئی۔');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdraw = async (reqId: string) => {
    if (!confirm('کیا آپ بھیجی گئی درخواست واپس لینا چاہتے ہیں؟')) return;
    setActionLoading(reqId);
    try {
      const { error } = await supabase
        .from('interest_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', reqId);

      if (error) throw error;
      await loadRequests();
    } catch (err: any) {
      alert(err.message || 'درخواست واپس لینے میں دشواری ہوئی۔');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGrantPhoto = async (otherUserId: string) => {
    try {
      const { error } = await supabase.from('photo_permissions').upsert({
        granter_id: currentUserId,
        viewer_id: otherUserId,
      });
      if (error) throw error;
      alert('تصویر دیکھنے کی اجازت فراہم کر دی گئی۔');
    } catch (err: any) {
      alert(err.message || 'اجازت دینے میں مسئلہ پیش آیا۔');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-[#850E35]">لوڈ ہو رہا ہے...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3D1D28]">دلچسپی کی درخواستیں</h1>
          <p className="text-sm text-[#6E4F5C] mt-1">
            موصول شدہ اور بھیجی گئی درخواستوں کا انتظام کریں۔
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex bg-[#FAF6F0] p-1 rounded-xl border border-[#E8DFD5]">
          <button
            type="button"
            onClick={() => setActiveTab('received')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === 'received'
                ? 'bg-white text-[#850E35] shadow-xs'
                : 'text-[#6D4F5C] hover:text-[#3D1D28]'
            }`}
          >
            موصول شدہ ({receivedRequests.filter((r) => r.status === 'pending').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === 'sent'
                ? 'bg-white text-[#850E35] shadow-xs'
                : 'text-[#6D4F5C] hover:text-[#3D1D28]'
            }`}
          >
            بھیجی گئی ({sentRequests.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'received' ? (
        receivedRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-[#7A5B67] border border-[#E8DFD5]">
            فی الحال کوئی موصول شدہ درخواست نہیں ہے۔
          </div>
        ) : (
          <div className="space-y-4">
            {receivedRequests.map((req) => {
              const sender: Profile = req.sender;
              const age = sender ? calculateAge(sender.birth_date) : 0;
              const isPending = req.status === 'pending';

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-[#3D1D28]">
                        {sender?.display_name} ({age} سال)
                      </h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          req.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {req.status === 'pending'
                          ? 'زیرِ انتظار'
                          : req.status === 'accepted'
                          ? 'قبول شدہ'
                          : 'مسترد شدہ'}
                      </span>
                    </div>

                    <p className="text-xs text-[#735160]">
                      {sender?.city} • {formatUrduMaritalStatus(sender?.marital_status)}
                    </p>

                    <p className="text-sm text-[#4F3642] max-w-xl line-clamp-2 pt-1">
                      {sender?.bio}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          disabled={actionLoading === req.id}
                          onClick={() => handleAccept(req.id)}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <Check className="w-4 h-4" />
                          <span>قبول کریں</span>
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading === req.id}
                          onClick={() => handleDecline(req.id)}
                          className="px-4 py-2 bg-neutral-100 hover:bg-rose-50 hover:text-rose-700 text-[#523A44] rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>انکار کریں</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleGrantPhoto(sender.id)}
                          className="px-3 py-2 bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#850E35] border border-[#850E35]/20 rounded-xl text-xs font-medium transition"
                          title="اس ممبر کو اپنی نجی تصویر دیکھنے کی اجازت دیں"
                        >
                          تصویر دکھانے کی اجازت دیں
                        </button>
                      </>
                    ) : req.status === 'accepted' ? (
                      <Link
                        href="/portal/messages"
                        className="px-4 py-2 bg-[#850E35] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>گفتگو کھولیں</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-neutral-400">یہ درخواست ختم ہو چکی ہے۔</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : sentRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-[#7A5B67] border border-[#E8DFD5]">
          آپ نے ابھی تک کسی کو دلچسپی کی درخواست نہیں بھیجی۔
        </div>
      ) : (
        <div className="space-y-4">
          {sentRequests.map((req) => {
            const receiver: Profile = req.receiver;
            const age = receiver ? calculateAge(receiver.birth_date) : 0;
            const isPending = req.status === 'pending';

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-[#3D1D28]">
                      {receiver?.display_name} ({age} سال)
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'cancelled'
                          ? 'bg-neutral-100 text-neutral-500'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {req.status === 'pending'
                        ? 'زیرِ انتظار'
                        : req.status === 'accepted'
                        ? 'قبول شدہ'
                        : req.status === 'cancelled'
                        ? 'واپس لی گئی'
                        : 'مسترد شدہ'}
                    </span>
                  </div>

                  <p className="text-xs text-[#735160]">
                    {receiver?.city} • {formatUrduMaritalStatus(receiver?.marital_status)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isPending && (
                    <button
                      type="button"
                      disabled={actionLoading === req.id}
                      onClick={() => handleWithdraw(req.id)}
                      className="px-4 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Undo2 className="w-4 h-4" />
                      <span>درخواست واپس لیں</span>
                    </button>
                  )}

                  {req.status === 'accepted' && (
                    <Link
                      href="/portal/messages"
                      className="px-4 py-2 bg-[#850E35] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>گفتگو کھولیں</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
