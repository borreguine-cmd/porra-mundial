import { sql } from '@vercel/postgres';
import type { AppConfig, User, Prediction, ExtraPrediction, MatchResult, Team, GroupMatch, KnockoutMatch } from '@/types';
import teamsData from '@/data/teams.json';
import matchesData from '@/data/matches.json';

// Static data — bundled at build time, works on Vercel
export function getTeams(): Team[] {
  return teamsData as Team[];
}

export function getMatches(): { groups: GroupMatch[]; knockout: KnockoutMatch[] } {
  return matchesData as { groups: GroupMatch[]; knockout: KnockoutMatch[] };
}

/* ── Config ── */
export async function getConfig(): Promise<AppConfig> {
  const { rows } = await sql`SELECT * FROM config WHERE id = 1`;
  const r = rows[0];
  return {
    inviteToken: r.invite_token,
    adminPassword: r.admin_password,
    deadline: r.deadline,
    points: {
      correctWinner: r.points_correct_winner,
      exactScore: r.points_exact_score,
      advancesGroup: r.points_advances_group,
      advancesKnockout: r.points_advances_knockout,
      correctChampion: r.points_correct_champion,
      correctMVP: r.points_correct_mvp,
      correctTopScorer: r.points_correct_top_scorer,
    },
  };
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await sql`
    UPDATE config SET
      invite_token          = ${config.inviteToken},
      admin_password        = ${config.adminPassword},
      deadline              = ${config.deadline},
      points_correct_winner   = ${config.points.correctWinner},
      points_exact_score      = ${config.points.exactScore},
      points_advances_group   = ${config.points.advancesGroup},
      points_advances_knockout = ${config.points.advancesKnockout},
      points_correct_champion = ${config.points.correctChampion},
      points_correct_mvp      = ${config.points.correctMVP},
      points_correct_top_scorer = ${config.points.correctTopScorer}
    WHERE id = 1
  `;
}

/* ── Users ── */
export async function getUsers(): Promise<User[]> {
  const { rows } = await sql`SELECT id, name, token, created_at FROM users ORDER BY created_at`;
  return rows.map(r => ({ id: r.id, name: r.name, token: r.token, createdAt: r.created_at }));
}

export async function getUserByToken(token: string): Promise<User | undefined> {
  const { rows } = await sql`SELECT id, name, token, created_at FROM users WHERE token = ${token} LIMIT 1`;
  if (!rows[0]) return undefined;
  const r = rows[0];
  return { id: r.id, name: r.name, token: r.token, createdAt: r.created_at };
}

export async function createUser(name: string): Promise<User> {
  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const token = `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  await sql`INSERT INTO users (id, name, token) VALUES (${id}, ${name}, ${token})`;
  return { id, name, token, createdAt: new Date().toISOString() };
}

/* ── Predictions ── */
export async function getUserPrediction(userId: string): Promise<Prediction | undefined> {
  const { rows } = await sql`
    SELECT match_id, home_score, away_score, home_penalties, away_penalties
    FROM predictions WHERE user_id = ${userId}
  `;
  if (rows.length === 0) return undefined;
  return {
    userId,
    matches: rows.map(r => ({
      matchId: r.match_id,
      homeScore: r.home_score,
      awayScore: r.away_score,
      ...(r.home_penalties !== null ? { homePenalties: r.home_penalties } : {}),
      ...(r.away_penalties !== null ? { awayPenalties: r.away_penalties } : {}),
    })),
  };
}

export async function saveUserPrediction(prediction: Prediction): Promise<void> {
  // UPSERT each match individually — preserves unmodified matches automatically
  for (const m of prediction.matches) {
    await sql`
      INSERT INTO predictions (user_id, match_id, home_score, away_score, home_penalties, away_penalties)
      VALUES (${prediction.userId}, ${m.matchId}, ${m.homeScore}, ${m.awayScore},
              ${m.homePenalties ?? null}, ${m.awayPenalties ?? null})
      ON CONFLICT (user_id, match_id) DO UPDATE SET
        home_score      = EXCLUDED.home_score,
        away_score      = EXCLUDED.away_score,
        home_penalties  = EXCLUDED.home_penalties,
        away_penalties  = EXCLUDED.away_penalties
    `;
  }
}

export async function getPredictions(): Promise<Prediction[]> {
  const { rows } = await sql`
    SELECT user_id, match_id, home_score, away_score, home_penalties, away_penalties
    FROM predictions ORDER BY user_id
  `;
  const map = new Map<string, Prediction>();
  for (const r of rows) {
    if (!map.has(r.user_id)) map.set(r.user_id, { userId: r.user_id, matches: [] });
    map.get(r.user_id)!.matches.push({
      matchId: r.match_id,
      homeScore: r.home_score,
      awayScore: r.away_score,
      ...(r.home_penalties !== null ? { homePenalties: r.home_penalties } : {}),
      ...(r.away_penalties !== null ? { awayPenalties: r.away_penalties } : {}),
    });
  }
  return [...map.values()];
}

/* ── Extra predictions ── */
export async function getUserExtraPrediction(userId: string): Promise<ExtraPrediction | undefined> {
  const { rows } = await sql`SELECT * FROM extra_predictions WHERE user_id = ${userId} LIMIT 1`;
  if (!rows[0]) return undefined;
  const r = rows[0];
  return { userId: r.user_id, champion: r.champion, mvp: r.mvp, topScorer: r.top_scorer };
}

export async function saveUserExtraPrediction(extra: ExtraPrediction): Promise<void> {
  await sql`
    INSERT INTO extra_predictions (user_id, champion, mvp, top_scorer)
    VALUES (${extra.userId}, ${extra.champion}, ${extra.mvp}, ${extra.topScorer})
    ON CONFLICT (user_id) DO UPDATE SET
      champion   = EXCLUDED.champion,
      mvp        = EXCLUDED.mvp,
      top_scorer = EXCLUDED.top_scorer
  `;
}

export async function getExtraPredictions(): Promise<ExtraPrediction[]> {
  const { rows } = await sql`SELECT user_id, champion, mvp, top_scorer FROM extra_predictions`;
  return rows.map(r => ({ userId: r.user_id, champion: r.champion, mvp: r.mvp, topScorer: r.top_scorer }));
}

/* ── Results ── */
export async function getResults(): Promise<MatchResult[]> {
  const { rows } = await sql`
    SELECT match_id, home_score, away_score, home_penalties, away_penalties, played FROM results
  `;
  return rows.map(r => ({
    matchId: r.match_id,
    homeScore: r.home_score,
    awayScore: r.away_score,
    ...(r.home_penalties !== null ? { homePenalties: r.home_penalties } : {}),
    ...(r.away_penalties !== null ? { awayPenalties: r.away_penalties } : {}),
    played: r.played,
  }));
}

export async function saveMatchResult(result: MatchResult): Promise<void> {
  await sql`
    INSERT INTO results (match_id, home_score, away_score, home_penalties, away_penalties, played)
    VALUES (${result.matchId}, ${result.homeScore}, ${result.awayScore},
            ${result.homePenalties ?? null}, ${result.awayPenalties ?? null}, ${result.played})
    ON CONFLICT (match_id) DO UPDATE SET
      home_score     = EXCLUDED.home_score,
      away_score     = EXCLUDED.away_score,
      home_penalties = EXCLUDED.home_penalties,
      away_penalties = EXCLUDED.away_penalties,
      played         = EXCLUDED.played
  `;
}

/* ── Helpers ── */
export async function isDeadlinePassed(): Promise<boolean> {
  const config = await getConfig();
  if (!config.deadline) return false;
  return new Date() > new Date(config.deadline);
}
