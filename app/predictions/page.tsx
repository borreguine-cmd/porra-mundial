'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PredictionData {
  matches: { matchId: string }[];
  extra: { champion: string; mvp: string; topScorer: string } | null;
}

export default function PredictionsPage() {
  const router = useRouter();
  const [data, setData] = useState<PredictionData | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { router.replace('/join'); return; }
    setUserName(localStorage.getItem('userName') ?? '');

    fetch('/api/predictions', { headers: { 'x-user-token': token } })
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, [router]);

  const groupCount = data?.matches.filter(m => m.matchId.startsWith('G')).length ?? 0;
  const knockoutCount = data?.matches.filter(m => !m.matchId.startsWith('G')).length ?? 0;
  const hasExtras = !!(data?.extra?.champion);

  const steps = [
    {
      label: 'Fase de grupos',
      description: '72 partidos · 12 grupos',
      icon: '🗓️',
      href: '/predictions/groups',
      done: groupCount,
      total: 72,
    },
    {
      label: 'Eliminatorias',
      description: 'Octavos → Final',
      icon: '⚔️',
      href: '/predictions/knockouts',
      done: knockoutCount,
      total: 32,
    },
    {
      label: 'Extras',
      description: 'Campeón · MVP · Pichichi',
      icon: '🌟',
      href: '/predictions/extras',
      done: hasExtras ? 1 : 0,
      total: 1,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Hola, {userName || '...'} 👋
        </h1>
        <p className="text-gray-500 mt-1">Completa tus predicciones para el Mundial 2026</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map(step => {
          const pct = Math.round((step.done / step.total) * 100);
          const complete = step.done >= step.total;
          return (
            <Link key={step.href} href={step.href}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100 block"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{step.icon}</span>
                {complete && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Completo ✓</span>}
              </div>
              <h3 className="font-semibold text-gray-800 text-lg">{step.label}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{step.done} / {step.total}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${complete ? 'bg-green-500' : 'bg-green-700'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/standings"
          className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-100 flex items-center gap-4"
        >
          <span className="text-3xl">🏆</span>
          <div>
            <h3 className="font-semibold text-gray-800">Clasificación</h3>
            <p className="text-sm text-gray-500">Ver puntuación actual de todos</p>
          </div>
        </Link>
        <Link href="/players"
          className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-100 flex items-center gap-4"
        >
          <span className="text-3xl">👀</span>
          <div>
            <h3 className="font-semibold text-gray-800">Ver predicciones</h3>
            <p className="text-sm text-gray-500">Mira qué pusieron los demás</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
