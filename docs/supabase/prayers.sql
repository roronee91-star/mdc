-- =====================================================================
-- 물댄동산교회 가상 성전: 기도제목을 모든 성도님이 함께 보기
--
-- 하는 법 (한 번만):
--   Supabase 대시보드 → 이 교회 프로젝트 → 왼쪽 메뉴 'SQL Editor'
--   → 'New query' → 이 글 전체를 붙여 넣기 → 'Run'
--   ("Success. No rows returned" 가 나오면 끝. 여러 번 실행해도 괜찮아요)
--
-- 어떻게 지켜지나요:
--   · 읽기는 누구나 (글, 분류, 이름, 함께 기도 수, 올린 시각만)
--   · 쓰기 · 지우기 · 함께 기도는 아래 세 함수로만 할 수 있고, 표를 직접 고치는 건 막혀 있어요
--   · 지우기는 글을 쓴 휴대폰만 (휴대폰에만 있는 비밀 열쇠로 확인. 열쇠 자체는 저장하지 않고 md5 값만 저장)
--   · 한 휴대폰에서 10분에 5개까지만 올릴 수 있어요 (도배 막기)
--   · 관리자는 대시보드 'Table Editor' → prayers 에서 어떤 글이든 지울 수 있어요
--   · 비밀 키(secret / service_role)는 필요 없어요. 화면은 공개용(Publishable) 키만 써요
-- =====================================================================

create table if not exists public.prayers (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) between 1 and 300),
  cat text not null default '기타' check (char_length(cat) between 1 and 20),
  name text not null default '' check (char_length(name) <= 12),
  prays integer not null default 0 check (prays >= 0),
  owner_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists prayers_created_at_idx on public.prayers (created_at desc);
create index if not exists prayers_owner_idx on public.prayers (owner_hash, created_at desc);

alter table public.prayers enable row level security;

-- 읽기: 누구나. 글쓴이 확인용 owner_hash 열은 못 읽게 열 단위로 허락
revoke all on public.prayers from anon, authenticated;
grant select (id, body, cat, name, prays, created_at) on public.prayers to anon, authenticated;
drop policy if exists "prayers readable by everyone" on public.prayers;
create policy "prayers readable by everyone" on public.prayers for select to anon, authenticated using (true);

-- 올리기: 새 기도제목 번호를 돌려줌
create or replace function public.add_prayer(p_body text, p_cat text, p_name text, p_owner text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  b text := btrim(coalesce(p_body, ''));
  h text := md5(coalesce(p_owner, ''));
  new_id uuid;
begin
  if char_length(b) < 1 or char_length(b) > 300 then raise exception 'prayer text must be 1-300 chars'; end if;
  if char_length(coalesce(p_owner, '')) < 16 then raise exception 'bad owner key'; end if;
  if (select count(*) from public.prayers p where p.owner_hash = h and p.created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'too many prayers, try later';
  end if;
  insert into public.prayers (body, cat, name, owner_hash)
  values (b, left(coalesce(nullif(btrim(p_cat), ''), '기타'), 20), left(btrim(coalesce(p_name, '')), 12), h)
  returning id into new_id;
  return new_id;
end $$;

-- 지우기: 글을 쓴 휴대폰의 열쇠가 맞을 때만
create or replace function public.delete_prayer(p_id uuid, p_owner text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from public.prayers where id = p_id and owner_hash = md5(coalesce(p_owner, ''));
  return found;
end $$;

-- 함께 기도해요: +1 또는 -1 (0 아래로는 안 내려감). 바뀐 수를 돌려줌
create or replace function public.pray_prayer(p_id uuid, p_delta integer)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.prayers set prays = greatest(0, prays + case when p_delta < 0 then -1 else 1 end)
  where id = p_id returning prays into n;
  return n;
end $$;

revoke all on function public.add_prayer(text, text, text, text) from public;
revoke all on function public.delete_prayer(uuid, text) from public;
revoke all on function public.pray_prayer(uuid, integer) from public;
grant execute on function public.add_prayer(text, text, text, text) to anon, authenticated;
grant execute on function public.delete_prayer(uuid, text) to anon, authenticated;
grant execute on function public.pray_prayer(uuid, integer) to anon, authenticated;

-- 화면이 새 표와 함수를 바로 알아보게
notify pgrst, 'reload schema';
