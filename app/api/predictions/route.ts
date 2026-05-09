import { NextRequest, NextResponse } from 'next/server';
import {
  getUserByToken, getUserPrediction, saveUserPrediction,
  getUserExtraPrediction, saveUserExtraPrediction, isDeadlinePassed,
} from '@/lib/data';
import type { MatchPrediction } from '@/types';

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-user-token');
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByToken(token);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const [prediction, extra] = await Promise.all([
    getUserPrediction(user.id),
    getUserExtraPrediction(user.id),
  ]);
  return NextResponse.json({ matches: prediction?.matches ?? [], extra: extra ?? null });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-user-token');
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const [user, deadlinePassed] = await Promise.all([
    getUserByToken(token),
    isDeadlinePassed(),
  ]);

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  if (deadlinePassed) return NextResponse.json({ error: 'El plazo de predicciones ha finalizado' }, { status: 403 });

  const body = await req.json();
  const { matches, extra } = body as {
    matches?: MatchPrediction[];
    extra?: { champion: string; mvp: string; topScorer: string };
  };

  // Each match is UPSERTed individually — unmodified matches stay untouched in DB
  if (matches) await saveUserPrediction({ userId: user.id, matches });
  if (extra)   await saveUserExtraPrediction({ userId: user.id, ...extra });

  return NextResponse.json({ ok: true });
}
