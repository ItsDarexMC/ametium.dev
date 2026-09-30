-- Esquema de la base de datos de comentarios (Postgres / Neon)
-- Solo se necesita correr esto UNA VEZ. Ver /api/setup-db.

create table if not exists comment_sessions (
    id          text primary key,
    discord_id  text not null,
    username    text not null,
    avatar      text,
    created_at  timestamptz not null default now(),
    expires_at  timestamptz not null
);

create table if not exists comments (
    id          serial primary key,
    discord_id  text not null unique,
    username    text not null,
    avatar      text,
    body        text not null,
    rating      numeric(2,1),
    created_at  timestamptz not null default now()
);

alter table comments add column if not exists rating numeric(2,1);

create index if not exists comment_sessions_expires_idx on comment_sessions (expires_at);
