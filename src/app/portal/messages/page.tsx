'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Conversation, Profile } from '@/lib/types';
import { calculateAge, formatUrduMaritalStatus } from '@/lib/utils';
import { MessageSquare, ArrowLeft, Clock } from 'lucide-react';

export default function MessagesIndexPage() {
  const supabase = createClient();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: convs, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:profiles!conversations_user1_id_fkey(*),
          user2:profiles!conversations_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (convs) {
        // Map other user
        const formatted = convs.map((c) => {
          const otherUser = c.user1_id === user.id ? c.user2 : c.user1;
          return {
            ...c,
            other_user: otherUser,
          };
        });
        setConversations(formatted);
      }
      setLoading(false);
    }

    loadConversations();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-[#850E35]">لوڈ ہو رہا ہے...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs">
        <h1 className="text-2xl font-bold text-[#3D1D28]">نجی گفتگو</h1>
        <p className="text-sm text-[#6E4F5C] mt-1">
          باہمی رضامندی اور دلچسپی کی قبولیت کے بعد شروع ہونے والے محفوظ رابطے۔
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-[#7A5B67] border border-[#E8DFD5] space-y-3">
          <MessageSquare className="w-12 h-12 text-[#C69214] mx-auto" />
          <h3 className="text-lg font-bold text-[#3D1D28]">ابھی تک کوئی فعال گفتگو نہیں</h3>
          <p className="text-sm text-[#6E4F5C] max-w-md mx-auto">
            جب آپ کی بھیجی ہوئی دلچسپی کی درخواست قبول ہوگی، یا آپ کسی کی درخواست قبول کریں گے، تو یہاں آپ کی نجی گفتگو شروع ہو جائے گی۔
          </p>
          <div className="pt-2">
            <Link
              href="/portal/browse"
              className="inline-block px-5 py-2 bg-[#850E35] text-white rounded-xl text-xs font-bold hover:bg-[#6D092A]"
            >
              رشتے تلاش کریں
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const other: Profile = conv.other_user;
            const age = other ? calculateAge(other.birth_date) : 0;

            return (
              <Link
                key={conv.id}
                href={`/portal/messages/${conv.id}`}
                className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs hover:border-[#850E35]/40 hover:shadow-md transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FAF6F0] border border-[#D4AF37] flex items-center justify-center text-lg font-bold text-[#850E35]">
                    {other?.display_name?.charAt(0) || 'ہ'}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#3D1D28] group-hover:text-[#850E35] transition">
                      {other?.display_name} ({age} سال)
                    </h3>
                    <p className="text-xs text-[#735160]">
                      {other?.city} • {formatUrduMaritalStatus(other?.marital_status)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#850E35] font-bold">
                  <span>گفتگو کھولیں</span>
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
