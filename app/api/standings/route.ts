import { NextResponse } from 'next/server';
import { getUsers, getPredictions, getExtraPredictions, getResults, getMatches, getConfig } from '@/lib/data';
import { calcUserPoints } from '@/lib/points';

export async function GET() {
  const [users, predictions, extras, results, config] = await Promise.all([
    getUsers(),
    getPredictions(),
    getExtraPredictions(),
    getResults(),
    getConfig(),
  ]);

  const { groups: groupMatches, knockout: knockoutMatches } = getMatches();
  const { points: cfg } = config;

  const standings = users.map(user => {
    const userPred = predictions.find(p => p.userId === user.id);
    const userExtra = extras.find(e => e.userId === user.id);
    return calcUserPoints(user, userPred?.matches ?? [], userExtra, results, groupMatches, knockoutMatches, cfg);
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  return NextResponse.json(standings);
}
