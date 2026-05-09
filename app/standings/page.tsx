'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StandingEntry } from '@/types';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function StandingsPage() {
  const router = useRouter();
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { router.replace('/join'); return; }
    setMyId(localStorage.getItem('userId') ?? '');

    fetch('/api/standings')
      .then(r => r.json())
      .then(data => setStandings(data))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-4xl">⏳</div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🏆 Clasificación</h1>
        <p className="text-sm text-gray-500 mt-0.5">Puntuación acumulada de todos los participantes</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-green-700 text-white text-sm">
              <th className="px-4 py-3 text-left w-10">#</th>
              <th className="px-4 py-3 text-left">Participante</th>
              <th className="px-4 py-3 text-center">Pts</th>
              <th className="px-4 py-3 text-center hidden sm:table-cell">1X2</th>
              <th className="px-4 py-3 text-center hidden sm:table-cell">Exacto</th>
              <th className="px-4 py-3 text-center hidden sm:table-cell">Clasif.</th>
              <th className="px-4 py-3 text-center hidden sm:table-cell">Elim.</th>
              <th className="px-4 py-3 text-center hidden sm:table-cell">Campeón</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr
                key={s.userId}
                className={`border-t border-gray-100 text-sm ${
                  s.userId === myId ? 'bg-green-50 font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-4 py-3 text-center">
                  {i < 3 ? MEDALS[i] : <span className="text-gray-500">{i + 1}</span>}
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-900">{s.userName}</span>
                  {s.userId === myId && <span className="ml-2 text-xs text-green-600">(tú)</span>}
                </td>
                <td className="px-4 py-3 text-center font-bold text-green-700 text-base">
                  {s.totalPoints}
                </td>
                <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">
                  {s.breakdown.groupWinner}
                </td>
                <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">
                  {s.breakdown.exactScore}
                </td>
                <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">
                  {s.breakdown.advancesGroup}
                </td>
                <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">
                  {s.breakdown.advancesKnockout}
                </td>
                <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">
                  {s.breakdown.champion}
                </td>
              </tr>
            ))}
            {standings.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  Aún no hay participantes con predicciones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100 text-xs text-gray-500">
        <strong className="text-gray-700">Sistema de puntos:</strong>{' '}
        1X2 = acertar ganador · Exacto = resultado exacto · Clasif. = equipos que pasan de grupos · Elim. = avanza en eliminatorias · Campeón = acertar el campeón
      </div>
    </div>
  );
}
