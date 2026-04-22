export type AgencyRelationStatus = 'INVITED' | 'ACCEPTED' | 'REJECTED' | 'TERMINATED';
export type AgencyMemberRole = 'ADMIN' | 'MANAGER' | 'EDITOR';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';

export interface AgencyCreator {
  agency_id: string;
  creator_id: string;
  status: AgencyRelationStatus;
  role_in_agency: string | null;
  invited_at: Date;
  joined_at: Date | null;
}

export interface AgencyMember {
  agency_id: string;
  user_id: string;
  role: AgencyMemberRole;
  permissions: Record<string, any>;
  joined_at: Date;
}

export interface AgencyNote {
  id: string;
  agency_id: string;
  creator_id: string;
  author_id: string | null;
  body: string;
  is_pinned: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  agency_id: string;
  creator_id: string | null;
  campaign_id: string | null;
  assignee_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
