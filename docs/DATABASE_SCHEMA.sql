-- ============================================================================
-- סכמת בסיס הנתונים והרשאות אבטחה (PostgreSQL / Supabase)
-- פרויקט: פלטפורמה לניהול תהליך בחירת ואיחוד יעדים קהילתיים
-- ============================================================================

-- 1. פרופילי משתמשים (מחובר ל-Supabase Auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name_he text not null,
  system_role text not null default 'member' check (system_role in ('super_admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. ארגונים / קהילות (לשימור ידע רב-שנתי)
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 3. אירועים / תהליכים תחת ארגון
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  event_date date not null default current_date,
  status text not null default 'draft' check (status in ('draft', 'active', 'locked')),
  votes_per_participant int not null default 7,
  advancing_goals_per_group int not null default 10,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 4. שולחנות / קבוצות באירוע (כולל קודים ואסימונים למשתתפים ולמנחה השולחן)
create table public.event_tables (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  table_number int not null,
  name text not null,
  current_stage int not null default 1 check (current_stage in (1, 2, 3)),
  round_number int not null default 1,
  active_turn_participant_id uuid,
  has_presented_in_turn boolean not null default false,
  open_round_mode boolean not null default false,
  voting_locked boolean not null default false,
  -- שיוך משתתפים לשולחן (קוד קצר + טוקן לקישור/QR)
  participant_join_code text not null unique,
  participant_join_token text not null unique default encode(gen_random_bytes(8), 'hex'),
  -- שיוך מנחה לשולחן (קוד מנחה קצר + טוקן לקישור/QR מנחה)
  facilitator_join_code text not null unique,
  facilitator_join_token text not null unique default encode(gen_random_bytes(10), 'hex'),
  created_at timestamptz not null default now(),
  unique (event_id, table_number)
);

-- 5. משתתפי אירוע ושיוכם לשולחן ולתפקיד (תומך גם במשתתף ידני ללא טלפון)
create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  table_id uuid not null references public.event_tables(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  manual_display_name text, -- עבור משתתף ללא טלפון שהוזן ע"י המנחה
  table_role text not null default 'participant' check (table_role in ('participant', 'facilitator')),
  turn_order int not null default 0,
  presented_in_round int not null default 0,
  joined_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- 6. תיבות "יעד אחוד" סופיות ברמת כלל הקבוצות (שלב 4 - התוצר הסופי)
create table public.inter_group_unified_goals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  manual_sort_order int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. תיבות "יעד אחוד" ברמת השולחן הקבוצתי (שלב 2 -> שלב 3 -> עולים לשלב 4)
create table public.group_unified_goals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  table_id uuid not null references public.event_tables(id) on delete cascade,
  title text not null,
  advances_to_stage4 boolean not null default false,
  stage4_box_state text not null default 'unassigned' check (stage4_box_state in ('unassigned', 'proposal', 'unified')),
  inter_group_unified_goal_id uuid references public.inter_group_unified_goals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. יעדים אישיים (שלב 1 ושלב 2 - פרטיים לחלוטין כל עוד box_state = 'private')
create table public.personal_goals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  table_id uuid not null references public.event_tables(id) on delete cascade,
  author_participant_id uuid not null references public.event_participants(id) on delete cascade,
  content text not null,
  box_state text not null default 'private' check (box_state in ('private', 'proposal', 'unified')),
  is_proposal_starter boolean not null default false,
  group_unified_goal_id uuid references public.group_unified_goals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. הצבעות דירוג בשולחן (שלב 3 - 7 נקודות למקום 1 ועד 1 נקודה למקום 7)
create table public.group_votes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  table_id uuid not null references public.event_tables(id) on delete cascade,
  voter_participant_id uuid not null references public.event_participants(id) on delete cascade,
  group_unified_goal_id uuid not null references public.group_unified_goals(id) on delete cascade,
  rank_position int not null check (rank_position between 1 and 7),
  points int not null check (points between 1 and 7),
  created_at timestamptz not null default now(),
  unique (table_id, voter_participant_id, group_unified_goal_id),
  unique (table_id, voter_participant_id, rank_position)
);

-- ============================================================================
-- עקרון אבטחת פרטיות ב-Row Level Security (RLS) על personal_goals:
-- יעד במצב box_state = 'private' נגיש לקריאה ולעריכה אך ורק למחבר היעד עצמו
-- (או למנחה השולחן רק אם הוזן ידנית עבור משתתף ללא טלפון).
-- רק כאשר המשתתף לוחץ "הצג לכולם" (box_state IN ('proposal', 'unified')),
-- היעד הופך גלוי לחברי השולחן ולמנחים באירוע.
-- ============================================================================
