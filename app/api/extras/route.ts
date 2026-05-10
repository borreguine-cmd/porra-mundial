import { NextResponse } from 'next/server';
import { getUsers, getExtraPredictions } from '@/lib/data';

export async function GET() {
  const [users, extras] = await Promise.all([getUsers(), getExtraPredictions()]);
  const extrasMap = new Map(extras.map(e => [e.userId, e]));
  const result = users.map(u => ({
    userId: u.id,
    userName: u.name,
    champion: extrasMap.get(u.id)?.champion ?? '',
    mvp: extrasMap.get(u.id)?.mvp ?? '',
    topScorer: extrasMap.get(u.id)?.topScorer ?? '',
  }));
  return NextResponse.json(result);
}
