import { NextRequest, NextResponse } from 'next/server';
import { getUserPrediction, getUserExtraPrediction, getUsers } from '@/lib/data';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const [prediction, extra] = await Promise.all([
    getUserPrediction(userId),
    getUserExtraPrediction(userId),
  ]);
  return NextResponse.json({
    user: { id: user.id, name: user.name },
    matches: prediction?.matches ?? [],
    extra: extra ?? null,
  });
}
