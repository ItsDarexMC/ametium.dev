-- Esquema de la base de datos de comentarios (Postgres / Neon)
-- Solo se necesita correr esto UNA VEZ. Ver README-COMMENTS.md.

create table if not exists comment_sessions (
    id          text primary key,          -- hash del valor de la cookie (ver session.js)
    discord_id  text not null,
    username    text not null,
    avatar      text,
    created_at  timestamptz not null default now(),
    expires_at  timestamptz not null
);

create table if not exists comments (
    id          serial primary key,
    discord_id  text not null unique,      -- un comentario por cuenta de Discord
    username    text not null,
    avatar      text,
    body        text not null,
    created_at  timestamptz not null default now()
);

create index if not exists comment_sessions_expires_idx on comment_sessions (expires_at);
