import { NextRequest, NextResponse } from 'next/server';
import { getUsers, getExtraPredictions, getExtraResults, saveExtraResult } from '@/lib/data';
import type { ExtraResult } from '@/types';

function isAdmin(req: NextRequest): boolean {
  return req.headers.get('x-admin-session')?.startsWith('admin_') ?? false;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const [users, extras, results] = await Promise.all([
    getUsers(),
    getExtraPredictions(),
    getExtraResults(),
  ]);

  const extrasMap = new Map(extras.map(e => [e.userId, e]));
  const resultsMap = new Map(results.map(r => [r.userId, r]));

  return NextResponse.json(users.map(u => ({
    userId: u.id,
    userName: u.name,
    champion: extrasMap.get(u.id)?.champion ?? '',
    mvp: extrasMap.get(u.id)?.mvp ?? '',
    topScorer: extrasMap.get(u.id)?.topScorer ?? '',
    championCorrect: resultsMap.has(u.id) ? resultsMap.get(u.id)!.championCorrect : null,
    mvpCorrect: resultsMap.has(u.id) ? resultsMap.get(u.id)!.mvpCorrect : null,
    topScorerCorrect: resultsMap.has(u.id) ? resultsMap.get(u.id)!.topScorerCorrect : null,
  })));
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { overrides } = await req.json() as { overrides: ExtraResult[] };
  await Promise.all(overrides.map(saveExtraResult));
  return NextResponse.json({ ok: true });
}
