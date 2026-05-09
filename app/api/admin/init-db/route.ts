import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

function isAdmin(req: NextRequest): boolean {
  return req.headers.get('x-admin-session')?.startsWith('admin_') ?? false;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      token      TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS predictions (
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
    CREATE TABLE IF NOT EXISTS extra_predictions (
      user_id    TEXT PRIMARY KEY,
      champion   TEXT NOT NULL DEFAULT '',
      mvp        TEXT NOT NULL DEFAULT '',
      top_scorer TEXT NOT NULL DEFAULT ''
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS results (
      match_id       TEXT PRIMARY KEY,
      home_score     INTEGER NOT NULL DEFAULT 0,
      away_score     INTEGER NOT NULL DEFAULT 0,
      home_penalties INTEGER,
      away_penalties INTEGER,
      played         BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS config (
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

  // Seed config row if empty
  await sql`
    INSERT INTO config (id) VALUES (1)
    ON CONFLICT (id) DO NOTHING
  `;

  return NextResponse.json({ ok: true, message: 'Tablas creadas correctamente' });
}
