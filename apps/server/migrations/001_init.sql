create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists users (
  id text primary key,
  email text unique,
  display_name text,
  anonymous boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create table if not exists anonymous_sessions (
  id text primary key,
  code text unique,
  user_id text references users(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index if not exists anonymous_sessions_code_idx on anonymous_sessions(code);
create index if not exists anonymous_sessions_expires_at_idx on anonymous_sessions(expires_at);

create table if not exists devices (
  id text primary key,
  user_id text references users(id) on delete set null,
  session_id text references anonymous_sessions(id) on delete cascade,
  role text check (role in ('pc', 'mobile')),
  trust_token_hash text,
  trusted_until timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index if not exists devices_user_id_idx on devices(user_id);
create index if not exists devices_session_id_idx on devices(session_id);
create index if not exists devices_trust_token_hash_idx on devices(trust_token_hash);

create table if not exists pairings (
  id text primary key,
  session_id text references anonymous_sessions(id) on delete cascade,
  pc_device_id text references devices(id) on delete set null,
  mobile_device_id text references devices(id) on delete set null,
  code_hash text,
  status text not null default 'created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index if not exists pairings_session_id_idx on pairings(session_id);
create index if not exists pairings_status_idx on pairings(status);

create table if not exists transfers (
  id text primary key,
  session_id text references anonymous_sessions(id) on delete cascade,
  from_role text check (from_role in ('pc', 'mobile')),
  to_role text check (to_role in ('pc', 'mobile')),
  file_name text,
  mime_type text,
  size_bytes bigint,
  status text not null,
  storage_key text,
  storage_driver text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index if not exists transfers_session_id_idx on transfers(session_id);
create index if not exists transfers_status_idx on transfers(status);
create index if not exists transfers_expires_at_idx on transfers(expires_at);

create table if not exists upload_sessions (
  id text primary key,
  transfer_id text references transfers(id) on delete cascade,
  session_id text references anonymous_sessions(id) on delete cascade,
  status text not null,
  provider_upload_id text,
  storage_key text,
  part_size_bytes bigint,
  total_parts integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index if not exists upload_sessions_transfer_id_idx on upload_sessions(transfer_id);
create index if not exists upload_sessions_session_id_idx on upload_sessions(session_id);
create index if not exists upload_sessions_status_idx on upload_sessions(status);

create table if not exists upload_parts (
  id text primary key,
  upload_session_id text not null references upload_sessions(id) on delete cascade,
  part_number integer not null,
  etag text,
  checksum_sha256 text,
  size_bytes bigint,
  status text not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb,
  unique(upload_session_id, part_number)
);

create index if not exists upload_parts_upload_session_id_idx on upload_parts(upload_session_id);
create index if not exists upload_parts_checksum_idx on upload_parts(checksum_sha256);

create table if not exists locale_preferences (
  id text primary key,
  user_id text references users(id) on delete cascade,
  device_id text references devices(id) on delete cascade,
  locale text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index if not exists locale_preferences_user_id_idx on locale_preferences(user_id);
create index if not exists locale_preferences_device_id_idx on locale_preferences(device_id);

create table if not exists audit_logs (
  id text primary key,
  event_type text not null,
  session_id text,
  transfer_id text,
  actor text,
  created_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index if not exists audit_logs_event_type_idx on audit_logs(event_type);
create index if not exists audit_logs_session_id_idx on audit_logs(session_id);
create index if not exists audit_logs_transfer_id_idx on audit_logs(transfer_id);
create index if not exists audit_logs_created_at_idx on audit_logs(created_at);
