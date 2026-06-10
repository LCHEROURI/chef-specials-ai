create extension if not exists pgcrypto with schema extensions;

create type public.account_plan as enum ('free', 'pro');
create type public.prompt_status as enum ('active', 'archived');
create type public.subscription_status as enum (
  'inactive',
  'trialing',
  'active',
  'past_due',
  'canceled'
);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  plan public.account_plan not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  prompt_text text not null check (char_length(prompt_text) between 1 and 100000),
  category text not null check (char_length(category) between 1 and 80),
  ai_platform text not null check (char_length(ai_platform) between 1 and 80),
  rating smallint check (rating between 1 and 5),
  favorite boolean not null default false,
  status public.prompt_status not null default 'active',
  search_document tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(prompt_text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(ai_platform, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  prompt_text text not null check (char_length(prompt_text) between 1 and 100000),
  change_notes text check (char_length(change_notes) <= 500),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (prompt_id, version_number)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create unique index tags_user_name_unique
on public.tags (user_id, lower(name));

create table public.prompt_tags (
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (prompt_id, tag_id)
);

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  folder_name text not null check (char_length(folder_name) between 1 and 80),
  color text not null default '#176b54'
    check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index folders_user_name_unique
on public.folders (user_id, lower(folder_name));

create table public.prompt_folders (
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  primary key (prompt_id, folder_id)
);

create table public.prompt_usage (
  prompt_id uuid primary key references public.prompts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_used timestamptz not null default now(),
  use_count bigint not null default 0 check (use_count >= 0),
  updated_at timestamptz not null default now()
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  prompt_text text not null check (char_length(prompt_text) between 1 and 100000),
  category text not null check (char_length(category) between 1 and 80),
  ai_platform text not null check (char_length(ai_platform) between 1 and 80),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (is_system and owner_id is null) or
    (not is_system and owner_id is not null)
  )
);

create table public.prompt_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan public.account_plan not null default 'free',
  status public.subscription_status not null default 'inactive',
  provider_customer_id text unique,
  provider_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prompts_user_updated_idx
on public.prompts (user_id, updated_at desc);
create index prompts_user_created_idx
on public.prompts (user_id, created_at desc);
create index prompts_user_favorite_idx
on public.prompts (user_id, favorite) where favorite;
create index prompts_user_status_idx
on public.prompts (user_id, status);
create index prompts_user_rating_idx
on public.prompts (user_id, rating desc);
create index prompts_user_category_idx
on public.prompts (user_id, category);
create index prompts_user_platform_idx
on public.prompts (user_id, ai_platform);
create index prompts_search_idx
on public.prompts using gin (search_document);
create index prompt_versions_prompt_created_idx
on public.prompt_versions (prompt_id, created_at desc);
create index prompt_tags_tag_idx on public.prompt_tags (tag_id);
create index prompt_folders_folder_idx on public.prompt_folders (folder_id);
create index prompt_usage_user_last_used_idx
on public.prompt_usage (user_id, last_used desc);
create index prompt_files_prompt_idx on public.prompt_files (prompt_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger prompts_set_updated_at
before update on public.prompts
for each row execute function private.set_updated_at();

create trigger folders_set_updated_at
before update on public.folders
for each row execute function private.set_updated_at();

create trigger prompt_usage_set_updated_at
before update on public.prompt_usage
for each row execute function private.set_updated_at();

create trigger templates_set_updated_at
before update on public.templates
for each row execute function private.set_updated_at();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'name', '')
  );

  insert into public.subscriptions (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function public.save_prompt(
  p_id uuid,
  p_title text,
  p_description text,
  p_prompt_text text,
  p_category text,
  p_ai_platform text,
  p_rating smallint,
  p_favorite boolean,
  p_status public.prompt_status,
  p_change_notes text default null
) returns public.prompts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_prompt public.prompts;
  v_existing public.prompts;
  v_next_version integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_id is null then
    insert into public.prompts (
      user_id,
      title,
      description,
      prompt_text,
      category,
      ai_platform,
      rating,
      favorite,
      status
    ) values (
      auth.uid(),
      p_title,
      coalesce(p_description, ''),
      p_prompt_text,
      p_category,
      p_ai_platform,
      p_rating,
      coalesce(p_favorite, false),
      coalesce(p_status, 'active')
    )
    returning * into v_prompt;

    insert into public.prompt_versions (
      prompt_id,
      version_number,
      prompt_text,
      change_notes,
      created_by
    ) values (
      v_prompt.id,
      1,
      v_prompt.prompt_text,
      coalesce(nullif(p_change_notes, ''), 'Initial version'),
      auth.uid()
    );
  else
    select *
    into v_existing
    from public.prompts
    where id = p_id
      and user_id = auth.uid()
    for update;

    if not found then
      raise exception 'Prompt not found';
    end if;

    update public.prompts
    set title = p_title,
        description = coalesce(p_description, ''),
        prompt_text = p_prompt_text,
        category = p_category,
        ai_platform = p_ai_platform,
        rating = p_rating,
        favorite = coalesce(p_favorite, false),
        status = coalesce(p_status, 'active')
    where id = p_id
    returning * into v_prompt;

    if v_existing.prompt_text is distinct from p_prompt_text then
      select coalesce(max(version_number), 0) + 1
      into v_next_version
      from public.prompt_versions
      where prompt_id = p_id;

      insert into public.prompt_versions (
        prompt_id,
        version_number,
        prompt_text,
        change_notes,
        created_by
      ) values (
        p_id,
        v_next_version,
        p_prompt_text,
        nullif(p_change_notes, ''),
        auth.uid()
      );
    end if;
  end if;

  return v_prompt;
end;
$$;

create or replace function public.search_prompts(
  p_query text default null,
  p_category text default null,
  p_platform text default null,
  p_min_rating smallint default null,
  p_favorite boolean default null,
  p_status public.prompt_status default null,
  p_created_from timestamptz default null,
  p_created_to timestamptz default null,
  p_tags text[] default null,
  p_sort text default 'updated_desc',
  p_limit integer default 24,
  p_offset integer default 0
) returns table (
  id uuid,
  user_id uuid,
  title text,
  description text,
  prompt_text text,
  category text,
  ai_platform text,
  rating smallint,
  favorite boolean,
  status public.prompt_status,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id,
    p.user_id,
    p.title,
    p.description,
    p.prompt_text,
    p.category,
    p.ai_platform,
    p.rating,
    p.favorite,
    p.status,
    p.created_at,
    p.updated_at,
    count(*) over () as total_count
  from public.prompts p
  where p.user_id = auth.uid()
    and (
      nullif(trim(p_query), '') is null
      or p.search_document @@ websearch_to_tsquery('english', p_query)
      or exists (
        select 1
        from public.prompt_tags pt
        join public.tags t on t.id = pt.tag_id
        where pt.prompt_id = p.id
          and t.user_id = auth.uid()
          and t.name ilike '%' || p_query || '%'
      )
    )
    and (p_category is null or p.category = p_category)
    and (p_platform is null or p.ai_platform = p_platform)
    and (p_min_rating is null or p.rating >= p_min_rating)
    and (p_favorite is null or p.favorite = p_favorite)
    and (p_status is null or p.status = p_status)
    and (p_created_from is null or p.created_at >= p_created_from)
    and (p_created_to is null or p.created_at <= p_created_to)
    and (
      p_tags is null
      or not exists (
        select 1
        from unnest(p_tags) requested_tag
        where not exists (
          select 1
          from public.prompt_tags pt
          join public.tags t on t.id = pt.tag_id
          where pt.prompt_id = p.id
            and t.user_id = auth.uid()
            and lower(t.name) = lower(requested_tag)
        )
      )
    )
  order by
    case when p_sort = 'created_desc' then p.created_at end desc,
    case when p_sort = 'created_asc' then p.created_at end asc,
    case when p_sort = 'title_asc' then lower(p.title) end asc,
    case when p_sort = 'title_desc' then lower(p.title) end desc,
    case when p_sort = 'rating_desc' then p.rating end desc nulls last,
    case when p_sort = 'used_desc' then (
      select u.use_count from public.prompt_usage u where u.prompt_id = p.id
    ) end desc nulls last,
    p.updated_at desc,
    p.id
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

create or replace function public.record_prompt_use(p_prompt_id uuid)
returns public.prompt_usage
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_usage public.prompt_usage;
begin
  if not exists (
    select 1
    from public.prompts
    where id = p_prompt_id
      and user_id = auth.uid()
  ) then
    raise exception 'Prompt not found';
  end if;

  insert into public.prompt_usage (
    prompt_id,
    user_id,
    last_used,
    use_count
  ) values (
    p_prompt_id,
    auth.uid(),
    now(),
    1
  )
  on conflict (prompt_id)
  do update set
    last_used = excluded.last_used,
    use_count = public.prompt_usage.use_count + 1
  returning * into v_usage;

  return v_usage;
end;
$$;

alter table public.profiles enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.tags enable row level security;
alter table public.prompt_tags enable row level security;
alter table public.folders enable row level security;
alter table public.prompt_folders enable row level security;
alter table public.prompt_usage enable row level security;
alter table public.templates enable row level security;
alter table public.prompt_files enable row level security;
alter table public.subscriptions enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy prompts_select_own on public.prompts
for select to authenticated
using ((select auth.uid()) = user_id);
create policy prompts_insert_own on public.prompts
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy prompts_update_own on public.prompts
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy prompts_delete_own on public.prompts
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy prompt_versions_select_own on public.prompt_versions
for select to authenticated
using (
  exists (
    select 1 from public.prompts p
    where p.id = prompt_id
      and p.user_id = (select auth.uid())
  )
);
create policy prompt_versions_insert_own on public.prompt_versions
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.prompts p
    where p.id = prompt_id
      and p.user_id = (select auth.uid())
  )
);

create policy tags_all_own on public.tags
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy prompt_tags_select_own on public.prompt_tags
for select to authenticated
using (
  exists (
    select 1
    from public.prompts p
    join public.tags t on t.user_id = p.user_id
    where p.id = prompt_id
      and t.id = tag_id
      and p.user_id = (select auth.uid())
  )
);
create policy prompt_tags_insert_own on public.prompt_tags
for insert to authenticated
with check (
  exists (
    select 1
    from public.prompts p
    join public.tags t on t.user_id = p.user_id
    where p.id = prompt_id
      and t.id = tag_id
      and p.user_id = (select auth.uid())
  )
);
create policy prompt_tags_delete_own on public.prompt_tags
for delete to authenticated
using (
  exists (
    select 1
    from public.prompts p
    join public.tags t on t.user_id = p.user_id
    where p.id = prompt_id
      and t.id = tag_id
      and p.user_id = (select auth.uid())
  )
);

create policy folders_all_own on public.folders
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy prompt_folders_select_own on public.prompt_folders
for select to authenticated
using (
  exists (
    select 1
    from public.prompts p
    join public.folders f on f.user_id = p.user_id
    where p.id = prompt_id
      and f.id = folder_id
      and p.user_id = (select auth.uid())
  )
);
create policy prompt_folders_insert_own on public.prompt_folders
for insert to authenticated
with check (
  exists (
    select 1
    from public.prompts p
    join public.folders f on f.user_id = p.user_id
    where p.id = prompt_id
      and f.id = folder_id
      and p.user_id = (select auth.uid())
  )
);
create policy prompt_folders_delete_own on public.prompt_folders
for delete to authenticated
using (
  exists (
    select 1
    from public.prompts p
    join public.folders f on f.user_id = p.user_id
    where p.id = prompt_id
      and f.id = folder_id
      and p.user_id = (select auth.uid())
  )
);

create policy prompt_usage_select_own on public.prompt_usage
for select to authenticated
using ((select auth.uid()) = user_id);
create policy prompt_usage_insert_own on public.prompt_usage
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.prompts p
    where p.id = prompt_id
      and p.user_id = (select auth.uid())
  )
);
create policy prompt_usage_update_own on public.prompt_usage
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy templates_select_available on public.templates
for select to authenticated
using (is_system or owner_id = (select auth.uid()));
create policy templates_insert_own on public.templates
for insert to authenticated
with check (
  not is_system
  and owner_id = (select auth.uid())
);
create policy templates_update_own on public.templates
for update to authenticated
using (
  not is_system
  and owner_id = (select auth.uid())
)
with check (
  not is_system
  and owner_id = (select auth.uid())
);
create policy templates_delete_own on public.templates
for delete to authenticated
using (
  not is_system
  and owner_id = (select auth.uid())
);

create policy prompt_files_all_own on public.prompt_files
for all to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.prompts p
    where p.id = prompt_id
      and p.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.prompts p
    where p.id = prompt_id
      and p.user_id = (select auth.uid())
  )
);

create policy subscriptions_select_own on public.subscriptions
for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public
to authenticated;
grant execute on function public.save_prompt(
  uuid,
  text,
  text,
  text,
  text,
  text,
  smallint,
  boolean,
  public.prompt_status,
  text
) to authenticated;
grant execute on function public.search_prompts(
  text,
  text,
  text,
  smallint,
  boolean,
  public.prompt_status,
  timestamptz,
  timestamptz,
  text[],
  text,
  integer,
  integer
) to authenticated;
grant execute on function public.record_prompt_use(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('prompt-files', 'prompt-files', false, 10485760)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

create policy prompt_files_objects_select_own on storage.objects
for select to authenticated
using (
  bucket_id = 'prompt-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy prompt_files_objects_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'prompt-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy prompt_files_objects_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'prompt-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'prompt-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy prompt_files_objects_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'prompt-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
