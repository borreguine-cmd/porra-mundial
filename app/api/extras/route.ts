import { NextResponse } from 'next/server';
import { getUsers, getExtraPredictions, getExtraResults, getConfig } from '@/lib/data';

export async function GET() {
  const [users, extras, results, config] = await Promise.all([
    getUsers(),
    getExtraPredictions(),
    getExtraResults(),
    getConfig(),
  ]);

  const extrasMap = new Map(extras.map(e => [e.userId, e]));
  const resultsMap = new Map(results.map(r => [r.userId, r]));

  return NextResponse.json({
    realChampion: config.realChampion,
    realMVP: config.realMVP,
    realTopScorer: config.realTopScorer,
    entries: users.map(u => ({
      userId: u.id,
      userName: u.name,
      champion: extrasMap.get(u.id)?.champion ?? '',
      mvp: extrasMap.get(u.id)?.mvp ?? '',
      topScorer: extrasMap.get(u.id)?.topScorer ?? '',
      championCorrect: resultsMap.has(u.id) ? resultsMap.get(u.id)!.championCorrect : null,
      mvpCorrect: resultsMap.has(u.id) ? resultsMap.get(u.id)!.mvpCorrect : null,
      topScorerCorrect: resultsMap.has(u.id) ? resultsMap.get(u.id)!.topScorerCorrect : null,
    })),
  });
}
