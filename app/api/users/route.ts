import { NextRequest, NextResponse } from 'next/server';
import { getConfig, getUsers, createUser } from '@/lib/data';

export async function GET() {
  const users = (await getUsers()).map(({ id, name, createdAt }) => ({ id, name, createdAt }));
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { name, inviteToken } = await req.json();
  const [config, users] = await Promise.all([getConfig(), getUsers()]);

  if (!inviteToken || inviteToken !== config.inviteToken) {
    return NextResponse.json({ error: 'Token de invitación inválido' }, { status: 401 });
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Nombre inválido (mínimo 2 caracteres)' }, { status: 400 });
  }

  const trimmed = name.trim();
  const existing = users.find(u => u.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    return NextResponse.json({ id: existing.id, name: existing.name, token: existing.token });
  }

  const user = await createUser(trimmed);
  return NextResponse.json({ id: user.id, name: user.name, token: user.token });
}
