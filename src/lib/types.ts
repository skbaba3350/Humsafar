export type ProfileStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'additional_info_required'
  | 'reference_verification_pending'
  | 'approved'
  | 'not_approved'
  | 'withdrawn'
  | 'new_eligibility_review_required';

export type UserRole = 'member' | 'admin';
export type MaritalStatus = 'unmarried' | 'divorced' | 'widowed' | 'khula';
export type Gender = 'male' | 'female';
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface ApplicationReference {
  id: string;
  profile_id: string;
  reference_name: string;
  relationship: string;
  contact_details: string;
  applicant_confirmed_consent: boolean;
  verification_status: 'pending' | 'verified' | 'unable_to_verify' | 'rejected';
  verified_by?: string | null;
  verification_method?: string;
  verification_notes?: string;
  knows_applicant?: boolean;
  relationship_nature?: string;
  confirms_disability_eligibility?: boolean;
  identity_consistent?: boolean;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformSettings {
  id: number;
  applications_paused: boolean;
  approvals_paused: boolean;
  pause_reason?: string;
  updated_at: string;
  updated_by?: string;
}

export interface Profile {
  id: string;
  display_name: string;
  legal_name?: string;
  birth_date: string;
  contact_phone?: string;
  gender: Gender;
  city: string;
  marital_status: MaritalStatus;
  bio: string;
  interests: string[];
  partner_preferences: string;
  has_disability: boolean;
  disability_notes: string;
  disability_explanation?: string;
  accommodation_needs?: string;
  marriage_intention_statement?: string;
  applicant_consent_review?: boolean;
  applicant_consent_references?: boolean;
  avatar_url: string;
  status: ProfileStatus;
  review_notes: string;
  is_published: boolean;
  is_hidden: boolean;
  is_suspended: boolean;
  role: UserRole;
  approved_at?: string | null;
  approved_by?: string | null;
  reconsideration_request?: string;
  applicant_response_notes?: string;
  verification_checklist?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Computed / client helper
  age?: number;
  has_photo_permission?: boolean;
  has_note_permission?: boolean;
  references?: ApplicationReference[];
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
