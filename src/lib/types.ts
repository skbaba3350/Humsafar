export type ProfileStatus = 'draft' | 'pending_review' | 'approved' | 'changes_requested' | 'suspended';
export type UserRole = 'member' | 'admin';
export type MaritalStatus = 'unmarried' | 'divorced' | 'widowed' | 'khula';
export type Gender = 'male' | 'female';
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface Profile {
  id: string;
  display_name: string;
  birth_date: string;
  gender: Gender;
  city: string;
  marital_status: MaritalStatus;
  bio: string;
  interests: string[];
  partner_preferences: string;
  has_disability: boolean;
  disability_notes: string;
  avatar_url: string;
  status: ProfileStatus;
  review_notes: string;
  is_hidden: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
  // Computed / client helper
  age?: number;
  has_photo_permission?: boolean;
  has_note_permission?: boolean;
}

export interface InterestRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  request_id: string | null;
  created_at: string;
  updated_at: string;
  other_user?: Profile;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: 'fake_profile' | 'harassment' | 'asking_money' | 'inappropriate_content' | 'other';
  details: string;
  reported_message_id?: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  admin_notes: string;
  created_at: string;
  reporter?: Profile;
  reported?: Profile;
  message?: Message;
}

export interface PhotoPermission {
  id: string;
  granter_id: string;
  viewer_id: string;
  granted_at: string;
  viewer?: Profile;
}

export interface NotePermission {
  id: string;
  granter_id: string;
  viewer_id: string;
  granted_at: string;
  viewer?: Profile;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  blocked?: Profile;
}
