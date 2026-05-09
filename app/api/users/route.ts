import { NextRequest, NextResponse } from 'next/server';
import { getConfig, getUserByName, createUser, setUserPassword, verifyPassword } from '@/lib/data';

export async function GET() {
  const { getUsers } = await import('@/lib/data');
  const users = (await getUsers()).map(({ id, name, createdAt }) => ({ id, name, createdAt }));
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { name, password, inviteToken } = await req.json();

  if (!inviteToken) return NextResponse.json({ error: 'Token de invitación inválido' }, { status: 401 });
  if (!name || typeof name !== 'string' || name.trim().length < 2)
    return NextResponse.json({ error: 'Nombre inválido (mínimo 2 caracteres)' }, { status: 400 });
  if (!password || typeof password !== 'string' || password.length < 4)
    return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 });

  const config = await getConfig();
  if (inviteToken !== config.inviteToken)
    return NextResponse.json({ error: 'Token de invitación inválido' }, { status: 401 });

  const trimmed = name.trim();
  const found = await getUserByName(trimmed);

  if (found) {
    if (found.passwordHash === null) {
      // Usuario creado antes de implementar contraseñas — asignar contraseña ahora
      await setUserPassword(found.user.id, password);
      return NextResponse.json({ id: found.user.id, name: found.user.name, token: found.user.token });
    }
    if (!verifyPassword(password, found.passwordHash))
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    return NextResponse.json({ id: found.user.id, name: found.user.name, token: found.user.token });
  }

  const user = await createUser(trimmed, password);
  return NextResponse.json({ id: user.id, name: user.name, token: user.token });
}
