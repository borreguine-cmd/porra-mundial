import { NextRequest, NextResponse } from 'next/server';
import { getResults, saveMatchResult } from '@/lib/data';
import type { MatchResult } from '@/types';

function isAdmin(req: NextRequest): boolean {
  return req.headers.get('x-admin-session')?.startsWith('admin_') ?? false;
}

export async function GET() {
  return NextResponse.json(await getResults());
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const result = await req.json() as MatchResult;
  if (!result.matchId) return NextResponse.json({ error: 'matchId requerido' }, { status: 400 });

  await saveMatchResult(result);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const results = await req.json() as MatchResult[];
  await Promise.all(results.map(r => saveMatchResult(r)));
  return NextResponse.json({ ok: true });
}
