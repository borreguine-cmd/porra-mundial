import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_Kv7ot8NXgsZO@ep-plain-hat-abohg820-pooler.eu-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require');

// Drop all tables
await sql`DROP TABLE IF EXISTS predictions`;
await sql`DROP TABLE IF EXISTS extra_predictions`;
await sql`DROP TABLE IF EXISTS results`;
await sql`DROP TABLE IF EXISTS users`;
await sql`DROP TABLE IF EXISTS config`;
console.log('✓ Tablas eliminadas');

// Recreate
await sql`
  CREATE TABLE users (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    token      TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE predictions (
    user_id        TEXT NOT NULL,
    match_id       TEXT NOT NULL,
    home_score     INTEGER NOT NULL,
    away_score     INTEGER NOT NULL,
    home_penalties INTEGER,
    away_penalties INTEGER,
    PRIMARY KEY (user_id, match_id)
  )
`;

await sql`
  CREATE TABLE extra_predictions (
    user_id    TEXT PRIMARY KEY,
    champion   TEXT NOT NULL DEFAULT '',
    mvp        TEXT NOT NULL DEFAULT '',
    top_scorer TEXT NOT NULL DEFAULT ''
  )
`;

await sql`
  CREATE TABLE results (
    match_id       TEXT PRIMARY KEY,
    home_score     INTEGER NOT NULL DEFAULT 0,
    away_score     INTEGER NOT NULL DEFAULT 0,
    home_penalties INTEGER,
    away_penalties INTEGER,
    played         BOOLEAN NOT NULL DEFAULT FALSE
  )
`;

await sql`
  CREATE TABLE config (
    id                        INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    invite_token              TEXT NOT NULL DEFAULT 'mundial2026',
    admin_password            TEXT NOT NULL DEFAULT 'admin2026',
    deadline                  TEXT,
    points_correct_winner     INTEGER NOT NULL DEFAULT 1,
    points_exact_score        INTEGER NOT NULL DEFAULT 3,
    points_advances_group     INTEGER NOT NULL DEFAULT 2,
    points_advances_knockout  INTEGER NOT NULL DEFAULT 3,
    points_correct_champion   INTEGER NOT NULL DEFAULT 10,
    points_correct_mvp        INTEGER NOT NULL DEFAULT 5,
    points_correct_top_scorer INTEGER NOT NULL DEFAULT 5
  )
`;

await sql`INSERT INTO config (id) VALUES (1)`;
console.log('✓ Tablas recreadas con datos limpios');
