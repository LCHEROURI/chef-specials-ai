create index prompt_files_user_idx
on public.prompt_files (user_id);

create index prompt_versions_created_by_idx
on public.prompt_versions (created_by);

create index templates_owner_idx
on public.templates (owner_id)
where owner_id is not null;
