export type Role = "super_admin" | "event_admin" | "judge" | "student" | "public";

export type EventStatus = "draft" | "active" | "completed" | "cancelled";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: Role;
  organization_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  name: string;
  organization_name: string;
  logo_url?: string;
  banner_url?: string;
  description?: string;
  venue?: string;
  start_date: string;
  end_date: string;
  languages: string[];
  status: EventStatus;
  address?: string;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  event_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface Team {
  id: string;
  event_id: string;
  name: string;
  color: string;
  logo_url?: string;
  created_at: string;
}

export interface Participant {
  id: string;
  event_id: string;
  category_id: string;
  team_id?: string;
  name: string;
  photo_url?: string;
  gender: string;
  chest_number: string;
  mobile?: string;
  email?: string;
  address?: string;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface Competition {
  id: string;
  event_id: string;
  category_id: string;
  name: string;
  venue?: string;
  date: string;
  time: string;
  max_marks: number;
  instructions?: string;
  point_system_id?: string;
  status: "upcoming" | "ongoing" | "completed";
  created_at: string;
  updated_at: string;
}

export interface CompetitionJudge {
  id: string;
  competition_id: string;
  judge_id: string;
  created_at: string;
}

export interface Score {
  id: string;
  competition_id: string;
  participant_id: string;
  judge_id: string;
  marks: number;
  is_draft: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface PointSystem {
  id: string;
  event_id: string;
  name: string;
  first: number;
  second: number;
  third: number;
  participation: number;
  is_default: boolean;
  created_at: string;
}

export interface Penalty {
  id: string;
  event_id: string;
  name: string;
  points: number;
  created_at: string;
}

export interface PenaltyLog {
  id: string;
  event_id: string;
  participant_id: string;
  penalty_id: string;
  competition_id?: string;
  reason: string;
  created_at: string;
}

export interface Certificate {
  id: string;
  event_id: string;
  participant_id: string;
  competition_id?: string;
  type: "winner" | "runner_up" | "participation" | "merit";
  template_url?: string;
  issued_at: string;
}

export interface Poster {
  id: string;
  event_id: string;
  competition_id?: string;
  participant_id?: string;
  template_url: string;
  generated_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  event_id?: string;
  action: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  team_id: string;
  team_name: string;
  team_color: string;
  total_points: number;
  rank: number;
}

export interface ParticipantResult {
  participant: Participant;
  competition_name: string;
  category_name: string;
  marks: number;
  position: string;
  team_name?: string;
  team_color?: string;
}
