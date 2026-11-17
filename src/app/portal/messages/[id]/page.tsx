'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, Message } from '@/lib/types';
import { calculateAge, formatUrduMaritalStatus } from '@/lib/utils';
import { 
  Send, 
  ArrowRight, 
  ShieldAlert, 
  UserX, 
  Lock, 
  CheckCheck,
  AlertCircle 
} from 'lucide-react';

export default function ConversationDetailPage() {
  const params = useParams();
  const convId = params.id as string;
  const router = useRouter();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Report message state
  const [reportingMsgId, setReportingMsgId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('harassment');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    loadConversation();

    // Setup polling for messages every 3 seconds for local reliability
    const interval = setInterval(() => {
      fetchNewMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [convId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Fetch conversation details
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:profiles!conversations_user1_id_fkey(*),
        user2:profiles!conversations_user2_id_fkey(*)
      `)
      .eq('id', convId)
      .single();

    if (convErr || !conv) {
      alert('گفتگو دستیاب نہیں ہے یا آپ کو رسائی کی اجازت نہیں ہے۔');
      router.push('/portal/messages');
      return;
    }

    const other = conv.user1_id === user.id ? conv.user2 : conv.user1;
    if (!other) {
      alert('مخالف ممبر کا اکاؤنٹ دستیاب نہیں ہے۔');
      router.push('/portal/messages');
      return;
    }
    setOtherUser(other);

    // Check if blocked
    const { data: isBlocked } = await supabase
      .from('blocks')
      .select('id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${other.id}),and(blocker_id.eq.${other.id},blocked_id.eq.${user.id})`);

    if (isBlocked && isBlocked.length > 0) {
      alert('اس ممبر کے ساتھ رابطہ بلاک ہو چکا ہے۔');
      router.push('/portal/messages');
      return;
    }

    // Fetch messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    setMessages(msgs || []);
    setLoading(false);
  };

  const fetchNewMessages = async () => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (msgs) {
      setMessages((prev) => {
        if (msgs.length !== prev.length || (msgs.length > 0 && msgs[msgs.length - 1].id !== prev[prev.length - 1]?.id)) {
          return msgs;
        }
        return prev;
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || sending) return;
    setSending(true);

    try {
      const { data, error } = await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: currentUserId,
        content: inputContent.trim(),
      }).select().single();

      if (error) throw error;

      setInputContent('');
      if (data) {
        setMessages((prev) => [...prev, data as Message]);
      }
    } catch (err: any) {
      alert(err.message || 'پیغام ارسال کرنے میں ناکامی ہوئی۔');
    } finally {
      setSending(false);
    }
  };

  const handleBlockUser = async () => {
    if (!otherUser) return;
    if (!confirm(`کیا آپ واقعی ${otherUser.display_name} کو بلاک کرنا چاہتے ہیں؟ گفتگو فوری طور پر بند ہو جائے گی۔`)) {
      return;
    }

    try {
      const { error: blockErr } = await supabase.from('blocks').insert({
        blocker_id: currentUserId,
        blocked_id: otherUser.id,
      });
      if (blockErr) throw blockErr;
      alert('صارف کو کامیابی سے بلاک کر دیا گیا۔');
      router.push('/portal/messages');
    } catch (err: any) {
      alert(err.message || 'بلاک کرنے میں دشواری ہوئی۔');
    }
  };

  const handleReportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherUser || !reportingMsgId) return;

    try {
      const { error: repErr } = await supabase.from('reports').insert({
        reporter_id: currentUserId,
        reported_id: otherUser.id,
        reason: reportReason as any,
        details: reportDetails,
        reported_message_id: reportingMsgId,
        status: 'pending',
      });
      if (repErr) throw repErr;
      alert('رپورٹ ایڈمن کو موصول ہو گئی ہے۔ شکریہ۔');
      setReportingMsgId(null);
      setReportDetails('');
    } catch (err: any) {
      alert(err.message || 'رپورٹ بھیجنے میں خرابی ہوئی۔');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-[#850E35]">لوڈ ہو رہا ہے...</div>;
  }

  const otherAge = otherUser ? calculateAge(otherUser.birth_date) : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto bg-white rounded-2xl border border-[#E8DFD5] shadow-sm overflow-hidden">
      
      {/* Chat Header */}
      <div className="bg-[#FAF8F5] border-b border-[#E8DFD5] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/messages"
            className="p-1.5 text-[#3D1D28] hover:bg-neutral-200/50 rounded-lg"
            title="پیچھے جائیں"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="w-10 h-10 rounded-full bg-[#850E35] text-white flex items-center justify-center font-bold">
            {otherUser?.display_name?.charAt(0) || 'ہ'}
          </div>

          <div>
            <h2 className="font-bold text-[#3D1D28] text-base">
              {otherUser?.display_name} ({otherAge} سال)
            </h2>
            <p className="text-xs text-[#735160]">
              {otherUser?.city} • {formatUrduMaritalStatus(otherUser?.marital_status || '')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBlockUser}
            className="p-2 text-[#735160] hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-neutral-200 text-xs flex items-center gap-1 transition"
            title="اس ممبر کو بلاک کریں"
          >
            <UserX className="w-4 h-4" />
            <span className="hidden sm:inline">بلاک کریں</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FFFDFB]">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-[#8A6A78] text-sm">
            گفتگو کا آغاز باوقار سلام سے کریں۔
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs relative ${
                    isMe
                      ? 'bg-[#850E35] text-white rounded-br-xs'
                      : 'bg-[#F2ECE4] text-[#2E1820] rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <span
                    className={`text-[10px] block mt-1 text-left ${
                      isMe ? 'text-pink-200' : 'text-neutral-500'
                    }`}
                  >
                    {new Date(m.created_at).toLocaleTimeString('ur-PK', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {!isMe && (
                  <button
                    type="button"
                    onClick={() => setReportingMsgId(m.id)}
                    className="opacity-0 group-hover:opacity-100 text-[10px] text-rose-700 hover:underline mt-1 transition"
                  >
                    اس پیغام کی رپورٹ کریں
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-4 bg-[#FAF8F5] border-t border-[#E8DFD5] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          placeholder="شائستہ اور باوقار پیغام تحریر کریں..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-[#D5C7B8] focus:ring-2 focus:ring-[#850E35] focus:outline-hidden text-right text-sm bg-white"
        />

        <button
          type="submit"
          disabled={!inputContent.trim() || sending}
          className="px-5 py-2.5 bg-[#850E35] hover:bg-[#6D092A] text-white rounded-xl text-sm font-bold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">{sending ? 'بھیج رہا ہے...' : 'بھیجیں'}</span>
        </button>
      </form>

      {/* Report Specific Message Modal */}
      {reportingMsgId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E8DFD5]">
            <h3 className="font-bold text-lg text-[#3D1D28] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>پیغام کی رپورٹ درج کریں</span>
            </h3>

            <form onSubmit={handleReportMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                  رپورٹ کی وجہ
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B8] text-right bg-white text-sm"
                >
                  <option value="harassment">ہراسانی یا نازیبا کلمات</option>
                  <option value="asking_money">پیسے یا رقم مانگنا</option>
                  <option value="inappropriate_content">نامناسب مواد</option>
                  <option value="other">دیگر خلاف ورزی</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3D1D28] mb-1">
                  تفصیل
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="مختصر وضاحت لکھیں..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B8] text-right text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingMsgId(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  منسوخ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl"
                >
                  رپورٹ جمع کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
