import { NextRequest, NextResponse } from 'next/server';
import { getConfig, saveConfig } from '@/lib/data';

function isAdmin(req: NextRequest): boolean {
  return req.headers.get('x-admin-session')?.startsWith('admin_') ?? false;
}

export async function GET() {
  const config = await getConfig();
  const { adminPassword: _, ...safe } = config;
  return NextResponse.json(safe);
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const updates = await req.json();
  const current = await getConfig();

  const { adminPassword: _ignored, ...rest } = updates;
  const updated = { ...current, ...rest };
  if (rest.points) updated.points = { ...current.points, ...rest.points };

  await saveConfig(updated);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { newPassword } = await req.json();
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 4) {
    return NextResponse.json({ error: 'Contraseña demasiado corta (mínimo 4 caracteres)' }, { status: 400 });
  }

  const config = await getConfig();
  config.adminPassword = newPassword;
  await saveConfig(config);
  return NextResponse.json({ ok: true });
}
