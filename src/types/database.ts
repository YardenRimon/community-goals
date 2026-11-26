export type SystemRole = 'super_admin' | 'member';
export type EventStatus = 'draft' | 'active' | 'locked';
export type TableStage = 1 | 2 | 3;
export type TableRole = 'participant' | 'facilitator';
export type PersonalGoalBoxState = 'private' | 'proposal' | 'unified';
export type Stage4BoxState = 'unassigned' | 'proposal' | 'unified';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name_he: string;
          name_confirmed: boolean;
          system_role: SystemRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name_he: string;
          name_confirmed?: boolean;
          system_role?: SystemRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name_he?: string;
          name_confirmed?: boolean;
          system_role?: SystemRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'organizations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          event_date: string;
          status: EventStatus;
          votes_per_participant: number;
          advancing_goals_per_group: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          event_date?: string;
          status?: EventStatus;
          votes_per_participant?: number;
          advancing_goals_per_group?: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          event_date?: string;
          status?: EventStatus;
          votes_per_participant?: number;
          advancing_goals_per_group?: number;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'events_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'events_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      event_tables: {
        Row: {
          id: string;
          event_id: string;
          table_number: number;
          name: string;
          current_stage: TableStage;
          round_number: number;
          active_turn_participant_id: string | null;
          has_presented_in_turn: boolean;
          open_round_mode: boolean;
          voting_locked: boolean;
          participant_join_code: string;
          participant_join_token: string;
          facilitator_join_code: string;
          facilitator_join_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          table_number: number;
          name: string;
          current_stage?: TableStage;
          round_number?: number;
          active_turn_participant_id?: string | null;
          has_presented_in_turn?: boolean;
          open_round_mode?: boolean;
          voting_locked?: boolean;
          participant_join_code: string;
          participant_join_token?: string;
          facilitator_join_code: string;
          facilitator_join_token?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          table_number?: number;
          name?: string;
          current_stage?: TableStage;
          round_number?: number;
          active_turn_participant_id?: string | null;
          has_presented_in_turn?: boolean;
          open_round_mode?: boolean;
          voting_locked?: boolean;
          participant_join_code?: string;
          participant_join_token?: string;
          facilitator_join_code?: string;
          facilitator_join_token?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_tables_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_tables_active_turn_participant_fkey';
            columns: ['active_turn_participant_id'];
            isOneToOne: false;
            referencedRelation: 'event_participants';
            referencedColumns: ['id'];
          },
        ];
      };
      event_participants: {
        Row: {
          id: string;
          event_id: string;
          table_id: string;
          user_id: string | null;
          manual_display_name: string | null;
          table_role: TableRole;
          turn_order: number;
          presented_in_round: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          table_id: string;
          user_id?: string | null;
          manual_display_name?: string | null;
          table_role?: TableRole;
          turn_order?: number;
          presented_in_round?: number;
          joined_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          table_id?: string;
          user_id?: string | null;
          manual_display_name?: string | null;
          table_role?: TableRole;
          turn_order?: number;
          presented_in_round?: number;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_participants_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_participants_table_id_fkey';
            columns: ['table_id'];
            isOneToOne: false;
            referencedRelation: 'event_tables';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_participants_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      inter_group_unified_goals: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          manual_sort_order: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          manual_sort_order?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          title?: string;
          manual_sort_order?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inter_group_unified_goals_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      group_unified_goals: {
        Row: {
          id: string;
          event_id: string;
          table_id: string;
          title: string;
          advances_to_stage4: boolean;
          stage4_box_state: Stage4BoxState;
          inter_group_unified_goal_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          table_id: string;
          title: string;
          advances_to_stage4?: boolean;
          stage4_box_state?: Stage4BoxState;
          inter_group_unified_goal_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          table_id?: string;
          title?: string;
          advances_to_stage4?: boolean;
          stage4_box_state?: Stage4BoxState;
          inter_group_unified_goal_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_unified_goals_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_unified_goals_table_id_fkey';
            columns: ['table_id'];
            isOneToOne: false;
            referencedRelation: 'event_tables';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_unified_goals_inter_group_unified_goal_id_fkey';
            columns: ['inter_group_unified_goal_id'];
            isOneToOne: false;
            referencedRelation: 'inter_group_unified_goals';
            referencedColumns: ['id'];
          },
        ];
      };
      personal_goals: {
        Row: {
          id: string;
          event_id: string;
          table_id: string;
          author_participant_id: string;
          content: string;
          box_state: PersonalGoalBoxState;
          is_proposal_starter: boolean;
          group_unified_goal_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          table_id: string;
          author_participant_id: string;
          content: string;
          box_state?: PersonalGoalBoxState;
          is_proposal_starter?: boolean;
          group_unified_goal_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          table_id?: string;
          author_participant_id?: string;
          content?: string;
          box_state?: PersonalGoalBoxState;
          is_proposal_starter?: boolean;
          group_unified_goal_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'personal_goals_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'personal_goals_table_id_fkey';
            columns: ['table_id'];
            isOneToOne: false;
            referencedRelation: 'event_tables';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'personal_goals_author_participant_id_fkey';
            columns: ['author_participant_id'];
            isOneToOne: false;
            referencedRelation: 'event_participants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'personal_goals_group_unified_goal_id_fkey';
            columns: ['group_unified_goal_id'];
            isOneToOne: false;
            referencedRelation: 'group_unified_goals';
            referencedColumns: ['id'];
          },
        ];
      };
      group_votes: {
        Row: {
          id: string;
          event_id: string;
          table_id: string;
          voter_participant_id: string;
          group_unified_goal_id: string;
          rank_position: number;
          points: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          table_id: string;
          voter_participant_id: string;
          group_unified_goal_id: string;
          rank_position: number;
          points: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          table_id?: string;
          voter_participant_id?: string;
          group_unified_goal_id?: string;
          rank_position?: number;
          points?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_votes_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_votes_table_id_fkey';
            columns: ['table_id'];
            isOneToOne: false;
            referencedRelation: 'event_tables';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_votes_voter_participant_id_fkey';
            columns: ['voter_participant_id'];
            isOneToOne: false;
            referencedRelation: 'event_participants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_votes_group_unified_goal_id_fkey';
            columns: ['group_unified_goal_id'];
            isOneToOne: false;
            referencedRelation: 'group_unified_goals';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_table_private_goal_counts: {
        Args: {
          p_table_id: string;
        };
        Returns: {
          author_participant_id: string;
          private_count: number;
        }[];
      };
      join_table_with_access: {
        Args: {
          p_code?: string | null;
          p_token?: string | null;
        };
        Returns: {
          participant_id: string;
          event_id: string;
          table_id: string;
          table_number: number;
          table_name: string;
          table_role: TableRole;
          current_stage: TableStage;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
