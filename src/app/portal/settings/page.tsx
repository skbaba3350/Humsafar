'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import { 
  Shield, 
  EyeOff, 
  Image as ImageIcon, 
  Trash2, 
  UserCheck, 
  Check, 
  X, 
  AlertTriangle 
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Lists
  const [photoPermissions, setPhotoPermissions] = useState<any[]>([]);
  const [notePermissions, setNotePermissions] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  // Hide profile toggle
  const [isHidden, setIsHidden] = useState(false);
  const [savingHide, setSavingHide] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get profile
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (prof) {
      setProfile(prof as Profile);
      setIsHidden(prof.is_hidden || false);
    }

    // Photo permissions granted by me
    const { data: pPerms } = await supabase
      .from('photo_permissions')
      .select('*, viewer:profiles!photo_permissions_viewer_id_fkey(*)')
      .eq('granter_id', user.id);

    // Note permissions granted by me
    const { data: nPerms } = await supabase
      .from('note_permissions')
      .select('*, viewer:profiles!note_permissions_viewer_id_fkey(*)')
      .eq('granter_id', user.id);

    // Blocked by me
    const { data: blocks } = await supabase
      .from('blocks')
      .select('*, blocked:profiles!blocks_blocked_id_fkey(*)')
      .eq('blocker_id', user.id);

    setPhotoPermissions(pPerms || []);
    setNotePermissions(nPerms || []);
    setBlockedUsers(blocks || []);
    setLoading(false);
  };

  const handleToggleHide = async () => {
    if (!profile) return;
    setSavingHide(true);
    try {
      const nextVal = !isHidden;
      const { error } = await supabase
        .from('profiles')
        .update({ is_hidden: nextVal })
        .eq('id', profile.id);

      if (error) throw error;
      setIsHidden(nextVal);
      alert(
        nextVal
          ? 'پروفائل اب تلاش سے چھپا دیا گیا ہے۔ نئی درخواستیں موصول نہیں ہوں گی۔'
          : 'پروفائل اب فعال اور تلاش میں ظاہر ہوگا۔'
      );
    } catch (err: any) {
      alert(err.message || 'سیٹنگز تبدیل کرنے میں دشواری ہوئی۔');
    } finally {
      setSavingHide(false);
    }
  };

  const handleRevokePhoto = async (id: string) => {
    try {
      const { error } = await supabase.from('photo_permissions').delete().eq('id', id);
      if (error) throw error;
      setPhotoPermissions((prev) => prev.filter((p) => p.id !== id));
      alert('تصویر دیکھنے کی اجازت کامیابی سے واپس لے لی گئی۔');
    } catch (err: any) {
      alert(err.message || 'اجازت واپس لینے میں رکاوٹ آئی۔');
    }
  };

  const handleRevokeNote = async (id: string) => {
    try {
      const { error } = await supabase.from('note_permissions').delete().eq('id', id);
      if (error) throw error;
      setNotePermissions((prev) => prev.filter((n) => n.id !== id));
      alert('نجی نوٹ دیکھنے کی اجازت واپس لے لی گئی۔');
    } catch (err: any) {
      alert(err.message || 'اجازت واپس لینے میں رکاوٹ آئی۔');
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      const { error } = await supabase.from('blocks').delete().eq('id', id);
      if (error) throw error;
      setBlockedUsers((prev) => prev.filter((b) => b.id !== id));
      alert('صارف کو ان بلاک کر دیا گیا۔');
    } catch (err: any) {
      alert(err.message || 'ان بلاک کرنے میں دشواری ہوئی۔');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'حذف کریں') {
      alert('براہ کرم خانے میں "حذف کریں" تحریر کریں۔');
      return;
    }
    if (!profile) return;
    setDeleting(true);

    try {
      // Delete user profile (cascades to all permissions, blocks, messages, requests)
      const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
      if (error) throw error;

      await supabase.auth.signOut();
      alert('آپ کا اکاؤنٹ اور تمام متعلقہ ڈیٹا کامیابی سے حذف کر دیا گیا ہے۔');
      router.push('/');
    } catch (err: any) {
      alert(err.message || 'اکاؤنٹ حذف کرنے میں ناکامی ہوئی۔');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-[#850E35]">لوڈ ہو رہا ہے...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs">
        <h1 className="text-2xl font-bold text-[#3D1D28]">رازداری اور سیٹنگز</h1>
        <p className="text-sm text-[#6E4F5C] mt-1">
          اپنی معلومات، تصاویر اور رابطوں کے مکمل اختیارات کا انتظام کریں۔
        </p>
      </div>

      {/* 1. Hide Profile Toggle */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#3D1D28] flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-[#850E35]" />
            <span>پروفائل کو تلاش سے چھپائیں</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#6E4F5C] max-w-xl">
            اگر آپ عارضی طور پر رشتے تلاش نہیں کرنا چاہتے، تو پروفائل چھپا سکتے ہیں۔ اس سے نیا کوئی ممبر آپ کا پروفائل نہیں دیکھ سکے گا اور نئی درخواستیں بند ہو جائیں گی۔
          </p>
        </div>

        <button
          type="button"
          disabled={savingHide}
          onClick={handleToggleHide}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            isHidden
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-emerald-700 text-white hover:bg-emerald-800'
          }`}
        >
          {isHidden ? 'چھپا ہوا ہے (آن)' : 'ظاہر ہے (آف)'}
        </button>
      </div>

      {/* 2. Photo Permissions Granted */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-[#3D1D28] flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#850E35]" />
          <span>تصویر دیکھنے کی مجاز افراد ({photoPermissions.length})</span>
        </h2>
        <p className="text-xs text-[#6E4F5C]">
          جن افراد کو آپ نے اپنی نجی تصویر دیکھنے کی اجازت دی ہوئی ہے۔ آپ کسی بھی لمحے یہ اجازت منسوخ کر سکتے ہیں۔
        </p>

        {photoPermissions.length === 0 ? (
          <p className="text-xs text-neutral-400 py-2">کسی ممبر کو تصویر دیکھنے کی اجازت نہیں دی گئی۔</p>
        ) : (
          <div className="divide-y divide-[#F2ECE4]">
            {photoPermissions.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#3D1D28]">
                    {p.viewer?.display_name || 'ممبر'} ({p.viewer?.city || ''})
                  </p>
                  <p className="text-[11px] text-[#8A6A78]">
                    تاریخِ اجازت: {new Date(p.granted_at).toLocaleDateString('ur-PK')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevokePhoto(p.id)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition"
                >
                  اجازت منسوخ کریں
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Note Permissions Granted */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-[#3D1D28] flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#850E35]" />
          <span>نجی نوٹ / معذوری نوٹ کے مجاز افراد ({notePermissions.length})</span>
        </h2>

        {notePermissions.length === 0 ? (
          <p className="text-xs text-neutral-400 py-2">کسی ممبر کو نجی نوٹ کی اجازت نہیں دی گئی۔</p>
        ) : (
          <div className="divide-y divide-[#F2ECE4]">
            {notePermissions.map((n) => (
              <div key={n.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#3D1D28]">
                    {n.viewer?.display_name || 'ممبر'} ({n.viewer?.city || ''})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevokeNote(n.id)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition"
                >
                  اجازت منسوخ کریں
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Blocked Users */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-[#3D1D28] flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#850E35]" />
          <span>بلاک شدہ افراد کی فہرست ({blockedUsers.length})</span>
        </h2>

        {blockedUsers.length === 0 ? (
          <p className="text-xs text-neutral-400 py-2">کوئی ممبر بلاک نہیں کیا گیا۔</p>
        ) : (
          <div className="divide-y divide-[#F2ECE4]">
            {blockedUsers.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#3D1D28]">
                    {b.blocked?.display_name || 'صارف'} ({b.blocked?.city || ''})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnblock(b.id)}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-[#3D1D28] rounded-lg text-xs font-semibold transition"
                >
                  ان بلاک کریں
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Delete Account Zone */}
      <div className="bg-rose-50/60 rounded-2xl p-6 border border-rose-200 space-y-3">
        <h2 className="text-lg font-bold text-rose-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-700" />
          <span>اکاؤنٹ ہمیشہ کے لیے حذف کریں</span>
        </h2>
        <p className="text-xs sm:text-sm text-rose-800 leading-relaxed max-w-xl">
          اکاؤنٹ حذف کرنے سے آپ کا پروفائل، تمام پیغامات، درخواستیں اور تصاویر فوری طور پر مکمل تلف کر دی جائیں گی اور یہ عمل ناقابلِ واپسی ہوگا۔
        </p>
        <div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>اکاؤنٹ حذف کریں</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200">
            <h3 className="text-lg font-bold text-rose-900">
              اکاؤنٹ حذف کرنے کی تصدیق
            </h3>
            <p className="text-sm text-[#4A2633] leading-relaxed">
              کیا آپ واقعی ہم سفر سے اپنا اکاؤنٹ حذف کرنا چاہتے ہیں؟ تصدیق کے لیے نیچے دیے گئے خانے میں <span className="font-bold text-rose-700">«حذف کریں»</span> لکھیں۔
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="حذف کریں"
              className="w-full px-3 py-2 rounded-xl border border-rose-300 focus:ring-2 focus:ring-rose-600 focus:outline-hidden text-right"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                منسوخ
              </button>
              <button
                type="button"
                disabled={deleting || deleteConfirmText !== 'حذف کریں'}
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl disabled:opacity-50"
              >
                {deleting ? 'حذف ہو رہا ہے...' : 'یقیناً حذف کریں'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
