'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Player { id: string; name: string; createdAt: string }

export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { router.replace('/join'); return; }

    fetch('/api/users')
      .then(r => r.json())
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="flex items-center justify-center py-20"><div className="text-4xl">⏳</div></div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">👀 Ver predicciones</h1>
        <p className="text-sm text-gray-500 mt-0.5">Selecciona un participante para ver sus predicciones</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {players.map(p => (
          <Link
            key={p.id}
            href={`/players/${p.id}`}
            className="bg-white rounded-xl border border-gray-100 px-5 py-4 hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-lg flex-shrink-0">
              {p.name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-800 truncate">{p.name}</div>
              <div className="text-xs text-gray-400">
                Unido {new Date(p.createdAt).toLocaleDateString('es-ES')}
              </div>
            </div>
          </Link>
        ))}
        {players.length === 0 && (
          <div className="col-span-3 text-center py-10 text-gray-400">
            Aún no hay participantes
          </div>
        )}
      </div>
    </div>
  );
}
