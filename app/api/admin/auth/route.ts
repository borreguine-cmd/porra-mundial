import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/data';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const config = await getConfig();

  if (password !== config.adminPassword) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }

  // Simple session token for admin (not cryptographically secure, fine for local use)
  const sessionToken = `admin_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return NextResponse.json({ sessionToken });
}
