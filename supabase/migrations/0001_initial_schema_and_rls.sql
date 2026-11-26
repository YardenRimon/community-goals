-- ============================================================================
-- Migration 0001: סכמת בסיס הנתונים, אינדקסים, טריגרים, RLS ו-Realtime
-- פרויקט: פלטפורמה לניהול תהליך בחירת ואיחוד יעדים קהילתיים
-- ============================================================================

-- 0. הרחבות נדרשות
create extension if not exists pgcrypto with schema extensions;

-- ============================================================================
-- 1. טבלאות הליבה (9 טבלאות בהתאמה מלאה ל-docs/DATABASE_SCHEMA.sql)
-- ============================================================================

-- 1.1 פרופילי משתמשים (מחובר ל-Supabase Auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name_he text not null,
  name_confirmed boolean not null default false,
  system_role text not null default 'member' check (system_role in ('super_admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.2 ארגונים / קהילות (לשימור ידע רב-שנתי)
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 1.3 אירועים / תהליכים תחת ארגון
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

-- 1.4 שולחנות / קבוצות באירוע (כולל קודים ואסימונים למשתתפים ולמנחה השולחן)
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
  participant_join_token text not null unique default encode(extensions.gen_random_bytes(8), 'hex'),
  -- שיוך מנחה לשולחן (קוד מנחה קצר + טוקן לקישור/QR מנחה)
  facilitator_join_code text not null unique,
  facilitator_join_token text not null unique default encode(extensions.gen_random_bytes(10), 'hex'),
  created_at timestamptz not null default now(),
  unique (event_id, table_number)
);

-- 1.5 משתתפי אירוע ושיוכם לשולחן ולתפקיד (תומך גם במשתתף ידני ללא טלפון)
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
  unique (event_id, user_id),
  check (
    user_id is not null
    or (manual_display_name is not null and btrim(manual_display_name) <> '')
  )
);

-- קישור FK מעגלי לתור הפעיל בשולחן לאחר יצירת טבלת המשתתפים
alter table public.event_tables
  add constraint event_tables_active_turn_participant_fkey
  foreign key (active_turn_participant_id)
  references public.event_participants(id)
  on delete set null;

-- 1.6 תיבות "יעד אחוד" סופיות ברמת כלל הקבוצות (שלב 4 - התוצר הסופי)
create table public.inter_group_unified_goals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  manual_sort_order int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.7 תיבות "יעד אחוד" ברמת השולחן הקבוצתי (שלב 2 -> שלב 3 -> עולים לשלב 4)
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

-- 1.8 יעדים אישיים (שלב 1 ושלב 2 - פרטיים לחלוטין כל עוד box_state = 'private')
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

-- 1.9 הצבעות דירוג בשולחן (שלב 3 - 7 נקודות למקום 1 ועד 1 נקודה למקום 7)
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
-- 2. אינדקסים לביצועים יציבים בשאילתות בזמן אמת
-- ============================================================================

create index idx_events_organization_id on public.events (organization_id);
create index idx_event_tables_event_id on public.event_tables (event_id);
create index idx_event_participants_event_id on public.event_participants (event_id);
create index idx_event_participants_table_id on public.event_participants (table_id);
create index idx_event_participants_user_id on public.event_participants (user_id);
create index idx_inter_group_unified_goals_event_id on public.inter_group_unified_goals (event_id);
create index idx_group_unified_goals_event_id on public.group_unified_goals (event_id);
create index idx_group_unified_goals_table_id on public.group_unified_goals (table_id);
create index idx_group_unified_goals_inter_id on public.group_unified_goals (inter_group_unified_goal_id);
create index idx_personal_goals_table_state on public.personal_goals (table_id, box_state);
create index idx_personal_goals_author_id on public.personal_goals (author_participant_id);
create index idx_personal_goals_group_unified_id on public.personal_goals (group_unified_goal_id);
create index idx_group_votes_table_id on public.group_votes (table_id);
create index idx_group_votes_voter_id on public.group_votes (voter_participant_id);
create index idx_group_votes_goal_id on public.group_votes (group_unified_goal_id);

-- ============================================================================
-- 3. טריגרים לעדכון אוטומטי ויצירת פרופיל בכניסה ראשונה
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_inter_group_unified_goals_updated_at
  before update on public.inter_group_unified_goals
  for each row execute function public.set_updated_at();

create trigger trg_group_unified_goals_updated_at
  before update on public.group_unified_goals
  for each row execute function public.set_updated_at();

create trigger trg_personal_goals_updated_at
  before update on public.personal_goals
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_default_name text;
begin
  v_default_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'משתתף חדש'
  );

  insert into public.profiles (id, email, display_name_he, name_confirmed, system_role)
  values (new.id, new.email, v_default_name, false, 'member')
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================================
-- 4. פונקציות עזר SECURITY DEFINER למניעת רקורסיית RLS
-- ============================================================================

create or replace function public.get_my_system_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.system_role
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.system_role = 'super_admin'
  );
$$;

create or replace function public.is_event_member(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_participants ep
    where ep.event_id = p_event_id
      and ep.user_id = auth.uid()
  );
$$;

create or replace function public.is_event_facilitator(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_participants ep
    where ep.event_id = p_event_id
      and ep.user_id = auth.uid()
      and ep.table_role = 'facilitator'
  );
$$;

create or replace function public.is_table_member(p_table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_participants ep
    where ep.table_id = p_table_id
      and ep.user_id = auth.uid()
  );
$$;

create or replace function public.is_table_facilitator(p_table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_participants ep
    where ep.table_id = p_table_id
      and ep.user_id = auth.uid()
      and ep.table_role = 'facilitator'
  );
$$;

create or replace function public.is_own_participant(p_participant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_participants ep
    where ep.id = p_participant_id
      and ep.user_id = auth.uid()
  );
$$;

create or replace function public.is_manual_participant_in_facilitated_table(p_participant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_participants target_ep
    where target_ep.id = p_participant_id
      and target_ep.user_id is null
      and target_ep.manual_display_name is not null
      and public.is_table_facilitator(target_ep.table_id)
  );
$$;

-- ============================================================================
-- 5. פונקציות RPC מאובטחות (מוני פרטיות והצטרפות עם קוד / טוקן QR)
-- ============================================================================

-- 5.1 מונה יעדים פרטיים בשולחן ללא חשיפת התוכן שלהם לעולם
create or replace function public.get_table_private_goal_counts(p_table_id uuid)
returns table (
  author_participant_id uuid,
  private_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'נדרשת התחברות למערכת';
  end if;

  if not (
    public.is_super_admin()
    or public.is_table_member(p_table_id)
    or exists (
      select 1
      from public.event_tables et
      where et.id = p_table_id
        and public.is_event_facilitator(et.event_id)
    )
  ) then
    raise exception 'אין הרשאה לצפות בנתוני שולחן זה';
  end if;

  return query
  select
    ep.id as author_participant_id,
    count(pg.id)::bigint as private_count
  from public.event_participants ep
  left join public.personal_goals pg
    on pg.author_participant_id = ep.id
    and pg.table_id = p_table_id
    and pg.box_state = 'private'
  where ep.table_id = p_table_id
  group by ep.id;
end;
$$;

-- 5.2 הצטרפות מאובטחת לשולחן ותפקיד (משתתף / מנחה) לפי קוד קצר או טוקן קישור/QR
create or replace function public.join_table_with_access(
  p_code text default null,
  p_token text default null
)
returns table (
  participant_id uuid,
  event_id uuid,
  table_id uuid,
  table_number int,
  table_name text,
  table_role text,
  current_stage int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_code text;
  v_token text;
  v_table public.event_tables%rowtype;
  v_event_status text;
  v_role text;
  v_next_turn int;
  v_participant_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'נדרשת התחברות למערכת לפני הצטרפות לשולחן';
  end if;

  v_code := nullif(btrim(p_code), '');
  v_token := nullif(btrim(p_token), '');

  if v_code is null and v_token is null then
    raise exception 'יש להזין קוד שולחן או לפתוח קישור הצטרפות תקין';
  end if;

  if v_token is not null then
    select et.* into v_table
    from public.event_tables et
    where et.participant_join_token = v_token
       or et.facilitator_join_token = v_token
    limit 1;

    if not found then
      raise exception 'קישור ההצטרפות אינו תקף';
    end if;

    if v_table.facilitator_join_token = v_token then
      v_role := 'facilitator';
    else
      v_role := 'participant';
    end if;
  else
    select et.* into v_table
    from public.event_tables et
    where upper(et.participant_join_code) = upper(v_code)
       or upper(et.facilitator_join_code) = upper(v_code)
    limit 1;

    if not found then
      raise exception 'קוד השולחן לא נמצא, נא לבדוק ולהזין שוב';
    end if;

    if upper(v_table.facilitator_join_code) = upper(v_code) then
      v_role := 'facilitator';
    else
      v_role := 'participant';
    end if;
  end if;

  select e.status into v_event_status
  from public.events e
  where e.id = v_table.event_id;

  if v_event_status = 'locked' then
    select ep.id into v_participant_id
    from public.event_participants ep
    where ep.event_id = v_table.event_id
      and ep.user_id = v_user_id;

    if v_participant_id is null then
      raise exception 'האירוע נעול ולא ניתן לצרף אליו משתתפים חדשים';
    end if;
  end if;

  select coalesce(max(ep.turn_order), 0) + 1
  into v_next_turn
  from public.event_participants ep
  where ep.table_id = v_table.id;

  insert into public.event_participants (
    event_id,
    table_id,
    user_id,
    table_role,
    turn_order
  )
  values (
    v_table.event_id,
    v_table.id,
    v_user_id,
    v_role,
    v_next_turn
  )
  on conflict (event_id, user_id) do update
    set table_id = excluded.table_id,
        table_role = excluded.table_role,
        turn_order = case
          when public.event_participants.table_id = excluded.table_id
            then public.event_participants.turn_order
          else excluded.turn_order
        end
  returning id into v_participant_id;

  return query
  select
    v_participant_id,
    v_table.event_id,
    v_table.id,
    v_table.table_number,
    v_table.name,
    v_role,
    v_table.current_stage;
end;
$$;

revoke all on function public.get_table_private_goal_counts(uuid) from public;
grant execute on function public.get_table_private_goal_counts(uuid) to authenticated;

revoke all on function public.join_table_with_access(text, text) from public;
grant execute on function public.join_table_with_access(text, text) to authenticated;

-- ============================================================================
-- 6. הפעלת Row-Level Security (RLS) והגדרת מדיניות מלאה על כל 9 הטבלאות
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.events enable row level security;
alter table public.event_tables enable row level security;
alter table public.event_participants enable row level security;
alter table public.inter_group_unified_goals enable row level security;
alter table public.group_unified_goals enable row level security;
alter table public.personal_goals enable row level security;
alter table public.group_votes enable row level security;

-- 6.1 profiles
create policy "profiles_select_self_admin_or_comember"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_super_admin()
    or exists (
      select 1
      from public.event_participants ep_me
      join public.event_participants ep_other
        on ep_me.event_id = ep_other.event_id
      where ep_me.user_id = auth.uid()
        and ep_other.user_id = profiles.id
    )
  );

create policy "profiles_update_self_without_role_escalation"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and system_role = public.get_my_system_role()
  );

create policy "profiles_manage_super_admin"
  on public.profiles for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- 6.2 organizations
create policy "organizations_select_admin_or_member"
  on public.organizations for select
  to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1
      from public.events e
      where e.organization_id = organizations.id
        and public.is_event_member(e.id)
    )
  );

create policy "organizations_insert_super_admin"
  on public.organizations for insert
  to authenticated
  with check (public.is_super_admin());

create policy "organizations_update_super_admin"
  on public.organizations for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "organizations_delete_super_admin"
  on public.organizations for delete
  to authenticated
  using (public.is_super_admin());

-- 6.3 events
create policy "events_select_admin_or_member"
  on public.events for select
  to authenticated
  using (
    public.is_super_admin()
    or public.is_event_member(id)
  );

create policy "events_insert_super_admin"
  on public.events for insert
  to authenticated
  with check (public.is_super_admin());

create policy "events_update_super_admin"
  on public.events for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "events_delete_super_admin"
  on public.events for delete
  to authenticated
  using (public.is_super_admin());

-- 6.4 event_tables (ללא REVOKE ברמת עמודות כדי לא לשבור Supabase Realtime)
create policy "event_tables_select_member_facilitator_or_admin"
  on public.event_tables for select
  to authenticated
  using (
    public.is_super_admin()
    or public.is_table_member(id)
    or public.is_event_facilitator(event_id)
  );

create policy "event_tables_insert_super_admin"
  on public.event_tables for insert
  to authenticated
  with check (public.is_super_admin());

create policy "event_tables_update_admin_or_table_facilitator"
  on public.event_tables for update
  to authenticated
  using (
    public.is_super_admin()
    or public.is_table_facilitator(id)
  )
  with check (
    public.is_super_admin()
    or public.is_table_facilitator(id)
  );

create policy "event_tables_delete_super_admin"
  on public.event_tables for delete
  to authenticated
  using (public.is_super_admin());

-- 6.5 event_participants
create policy "event_participants_select_member_facilitator_or_admin"
  on public.event_participants for select
  to authenticated
  using (
    public.is_super_admin()
    or public.is_table_member(table_id)
    or public.is_event_facilitator(event_id)
  );

create policy "event_participants_insert_admin_or_manual_by_facilitator"
  on public.event_participants for insert
  to authenticated
  with check (
    public.is_super_admin()
    or (
      user_id is null
      and table_role = 'participant'
      and manual_display_name is not null
      and btrim(manual_display_name) <> ''
      and public.is_table_facilitator(table_id)
    )
  );

create policy "event_participants_update_admin_or_table_facilitator"
  on public.event_participants for update
  to authenticated
  using (
    public.is_super_admin()
    or public.is_table_facilitator(table_id)
  )
  with check (
    public.is_super_admin()
    or public.is_table_facilitator(table_id)
  );

create policy "event_participants_delete_admin_or_manual_by_facilitator"
  on public.event_participants for delete
  to authenticated
  using (
    public.is_super_admin()
    or (
      user_id is null
      and table_role = 'participant'
      and public.is_table_facilitator(table_id)
    )
  );

-- 6.6 personal_goals (אבטחת פרטיות מוחלטת במצב private)
create policy "personal_goals_select_strict_privacy"
  on public.personal_goals for select
  to authenticated
  using (
    (
      box_state = 'private'
      and (
        public.is_own_participant(author_participant_id)
        or public.is_manual_participant_in_facilitated_table(author_participant_id)
      )
    )
    or (
      box_state in ('proposal', 'unified')
      and (
        public.is_super_admin()
        or public.is_table_member(table_id)
        or public.is_event_facilitator(event_id)
      )
    )
  );

create policy "personal_goals_insert_own_or_manual_private_only"
  on public.personal_goals for insert
  to authenticated
  with check (
    box_state = 'private'
    and is_proposal_starter = false
    and group_unified_goal_id is null
    and exists (
      select 1
      from public.event_participants ep
      where ep.id = author_participant_id
        and ep.table_id = personal_goals.table_id
        and ep.event_id = personal_goals.event_id
    )
    and (
      public.is_own_participant(author_participant_id)
      or public.is_manual_participant_in_facilitated_table(author_participant_id)
    )
  );

create policy "personal_goals_update_author_or_manual_facilitator"
  on public.personal_goals for update
  to authenticated
  using (
    box_state in ('private', 'proposal')
    and (
      public.is_own_participant(author_participant_id)
      or public.is_manual_participant_in_facilitated_table(author_participant_id)
    )
  )
  with check (
    box_state in ('private', 'proposal')
    and group_unified_goal_id is null
    and (
      public.is_own_participant(author_participant_id)
      or public.is_manual_participant_in_facilitated_table(author_participant_id)
    )
  );

-- הערת פיתוח חשובה (RETURNING / .select()):
-- כאשר מנחה שולחן או super_admin מחזירים יעד של משתתף אחר למצב box_state = 'private',
-- אסור לבצע .select() אחרי .update() ב-Supabase Client (כלומר ללא RETURNING),
-- מפני שמדיניות SELECT חוסמת קריאת שורות במצב 'private' שלא שייכות למבצע הפעולה.
create policy "personal_goals_update_visible_by_facilitator_or_admin"
  on public.personal_goals for update
  to authenticated
  using (
    box_state in ('proposal', 'unified')
    and (
      public.is_table_facilitator(table_id)
      or public.is_super_admin()
    )
  )
  with check (
    box_state in ('private', 'proposal', 'unified')
    and (
      public.is_table_facilitator(table_id)
      or public.is_super_admin()
    )
  );

create policy "personal_goals_delete_private_only"
  on public.personal_goals for delete
  to authenticated
  using (
    box_state = 'private'
    and (
      public.is_own_participant(author_participant_id)
      or public.is_manual_participant_in_facilitated_table(author_participant_id)
    )
  );

-- 6.7 group_unified_goals
create policy "group_unified_goals_select_member_facilitator_or_admin"
  on public.group_unified_goals for select
  to authenticated
  using (
    public.is_super_admin()
    or public.is_table_member(table_id)
    or public.is_event_facilitator(event_id)
  );

create policy "group_unified_goals_insert_admin_or_table_facilitator"
  on public.group_unified_goals for insert
  to authenticated
  with check (
    public.is_super_admin()
    or public.is_table_facilitator(table_id)
  );

create policy "group_unified_goals_update_admin_or_event_facilitator"
  on public.group_unified_goals for update
  to authenticated
  using (
    public.is_super_admin()
    or public.is_table_facilitator(table_id)
    or public.is_event_facilitator(event_id)
  )
  with check (
    public.is_super_admin()
    or public.is_table_facilitator(table_id)
    or public.is_event_facilitator(event_id)
  );

create policy "group_unified_goals_delete_admin_or_table_facilitator"
  on public.group_unified_goals for delete
  to authenticated
  using (
    public.is_super_admin()
    or public.is_table_facilitator(table_id)
  );

-- 6.8 group_votes
create policy "group_votes_select_member_facilitator_or_admin"
  on public.group_votes for select
  to authenticated
  using (
    public.is_super_admin()
    or public.is_table_member(table_id)
    or public.is_event_facilitator(event_id)
  );

create policy "group_votes_insert_unlocked_voter_or_admin"
  on public.group_votes for insert
  to authenticated
  with check (
    public.is_super_admin()
    or (
      (
        public.is_own_participant(voter_participant_id)
        or public.is_manual_participant_in_facilitated_table(voter_participant_id)
      )
      and exists (
        select 1
        from public.event_tables et
        where et.id = table_id
          and et.voting_locked = false
      )
    )
  );

create policy "group_votes_update_unlocked_voter_or_admin"
  on public.group_votes for update
  to authenticated
  using (
    public.is_super_admin()
    or (
      (
        public.is_own_participant(voter_participant_id)
        or public.is_manual_participant_in_facilitated_table(voter_participant_id)
      )
      and exists (
        select 1
        from public.event_tables et
        where et.id = table_id
          and et.voting_locked = false
      )
    )
  )
  with check (
    public.is_super_admin()
    or (
      (
        public.is_own_participant(voter_participant_id)
        or public.is_manual_participant_in_facilitated_table(voter_participant_id)
      )
      and exists (
        select 1
        from public.event_tables et
        where et.id = table_id
          and et.voting_locked = false
      )
    )
  );

create policy "group_votes_delete_unlocked_voter_or_admin"
  on public.group_votes for delete
  to authenticated
  using (
    public.is_super_admin()
    or (
      (
        public.is_own_participant(voter_participant_id)
        or public.is_manual_participant_in_facilitated_table(voter_participant_id)
      )
      and exists (
        select 1
        from public.event_tables et
        where et.id = table_id
          and et.voting_locked = false
      )
    )
  );

-- 6.9 inter_group_unified_goals (גלוי למנחים במהלך שלב 4, ולמשתתפים לאחר נעילת האירוע)
create policy "inter_group_unified_goals_select_facilitator_or_locked_member"
  on public.inter_group_unified_goals for select
  to authenticated
  using (
    public.is_super_admin()
    or public.is_event_facilitator(event_id)
    or (
      public.is_event_member(event_id)
      and exists (
        select 1
        from public.events e
        where e.id = event_id
          and e.status = 'locked'
      )
    )
  );

create policy "inter_group_unified_goals_insert_facilitator_or_admin"
  on public.inter_group_unified_goals for insert
  to authenticated
  with check (
    public.is_super_admin()
    or public.is_event_facilitator(event_id)
  );

create policy "inter_group_unified_goals_update_facilitator_or_admin"
  on public.inter_group_unified_goals for update
  to authenticated
  using (
    public.is_super_admin()
    or public.is_event_facilitator(event_id)
  )
  with check (
    public.is_super_admin()
    or public.is_event_facilitator(event_id)
  );

create policy "inter_group_unified_goals_delete_facilitator_or_admin"
  on public.inter_group_unified_goals for delete
  to authenticated
  using (
    public.is_super_admin()
    or public.is_event_facilitator(event_id)
  );

-- ============================================================================
-- 7. הפעלת Supabase Realtime על 7 הטבלאות הפעילות
-- ============================================================================

alter table public.events replica identity full;
alter table public.event_tables replica identity full;
alter table public.event_participants replica identity full;
alter table public.personal_goals replica identity full;
alter table public.group_unified_goals replica identity full;
alter table public.group_votes replica identity full;
alter table public.inter_group_unified_goals replica identity full;

do $$
declare
  v_table text;
  v_tables text[] := array[
    'events',
    'event_tables',
    'event_participants',
    'personal_goals',
    'group_unified_goals',
    'group_votes',
    'inter_group_unified_goals'
  ];
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach v_table in array v_tables loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = v_table
      ) then
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      end if;
    end loop;
  end if;
end $$;
