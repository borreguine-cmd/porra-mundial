'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import teamsData from '@/data/teams.json';
import type { MatchPrediction } from '@/types';
import { resolveKnockoutSlot } from '@/lib/brackets';
import matchesData from '@/data/matches.json';

const teamMap = Object.fromEntries(teamsData.map(t => [t.id, { name: t.name, flag: t.flag }]));

export default function ExtrasPage() {
  const router = useRouter();
  const [mvp, setMvp] = useState('');
  const [topScorer, setTopScorer] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [deadline, setDeadline] = useState<string | null>(null);
  const [allPredictions, setAllPredictions] = useState<MatchPrediction[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { router.replace('/join'); return; }

    fetch('/api/predictions', { headers: { 'x-user-token': token } })
      .then(r => r.json())
      .then(data => {
        setAllPredictions(data.matches ?? []);
        if (data.extra) {
          setMvp(data.extra.mvp ?? '');
          setTopScorer(data.extra.topScorer ?? '');
        }
      });

    fetch('/api/config').then(r => r.json()).then(cfg => setDeadline(cfg.deadline));
  }, [router]);

  // Derive champion from Final prediction
  const groupPreds = allPredictions.filter(p => p.matchId.startsWith('G'));
  const knockoutPredMap = new Map<string, MatchPrediction>(
    matchesData.knockout.map(km => {
      const pred = allPredictions.find(p => p.matchId === km.id);
      return pred ? [km.id, pred] : null;
    }).filter(Boolean) as [string, MatchPrediction][]
  );

  const championId = resolveKnockoutSlot('W_FINAL', matchesData.groups as never, groupPreds, knockoutPredMap);
  const champion = championId ? teamMap[championId] : null;

  const deadlinePassed = deadline ? new Date() > new Date(deadline) : false;

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': token },
        body: JSON.stringify({
          extra: {
            champion: championId ?? '',
            mvp: mvp.trim(),
            topScorer: topScorer.trim(),
          },
        }),
      });
      if (res.ok) setSaved(true);
      else setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Extras del torneo</h1>
        <p className="text-sm text-gray-500 mt-0.5">El campeón se deduce de tu predicción de la Final</p>
      </div>

      {deadlinePassed && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm mb-4">
          ⏰ El plazo ha finalizado. Solo puedes consultar tus predicciones.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Champion — read-only, derived from Final prediction */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🏆</span>
            <h2 className="font-bold text-gray-800 text-lg">Campeón del mundo</h2>
          </div>
          {champion ? (
            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
              <span className="text-3xl">{champion.flag}</span>
              <div>
                <p className="font-bold text-gray-900 text-lg">{champion.name}</p>
                <p className="text-xs text-gray-500">Según tu predicción de la Final</p>
              </div>
              <span className="ml-auto text-2xl">🏆</span>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl px-4 py-4 text-center text-gray-400 text-sm">
              Completa las eliminatorias para ver tu campeón predicho
            </div>
          )}
        </div>

        {/* MVP */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⭐</span>
            <h2 className="font-bold text-gray-800 text-lg">MVP del torneo</h2>
          </div>
          <input
            type="text"
            value={mvp}
            onChange={e => !deadlinePassed && setMvp(e.target.value)}
            readOnly={deadlinePassed}
            placeholder="Nombre del jugador"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 read-only:bg-gray-50"
          />
        </div>

        {/* Top scorer */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">👟</span>
            <h2 className="font-bold text-gray-800 text-lg">Pichichi (máximo goleador)</h2>
          </div>
          <input
            type="text"
            value={topScorer}
            onChange={e => !deadlinePassed && setTopScorer(e.target.value)}
            readOnly={deadlinePassed}
            placeholder="Nombre del jugador"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 read-only:bg-gray-50"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        {saved && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
            ✓ Guardado correctamente
          </div>
        )}

        {!deadlinePassed && (
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl disabled:bg-gray-400 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        )}
      </form>
    </div>
  );
}
