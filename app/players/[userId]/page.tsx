'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import teamsData from '@/data/teams.json';
import type { MatchPrediction } from '@/types';
import GroupStandingsView from '@/components/GroupStandingsView';
import BracketView from '@/components/BracketView';

const teamMap = Object.fromEntries(teamsData.map(t => [t.id, { name: t.name, flag: t.flag }]));

interface PlayerData {
  user: { id: string; name: string };
  matches: MatchPrediction[];
  extra: { champion: string; mvp: string; topScorer: string } | null;
}

type Tab = 'grupos' | 'bracket' | 'extras';

export default function PlayerPredictionsPage() {
  const router = useRouter();
  const { userId } = useParams<{ userId: string }>();
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('grupos');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { router.replace('/join'); return; }
    fetch(`/api/predictions/${userId}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [router, userId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20"><div className="text-4xl">⏳</div></div>
  );
  if (!data) return <div className="text-center py-10 text-gray-400">Usuario no encontrado</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'grupos',   label: '🗓️ Grupos' },
    { key: 'bracket',  label: '🏆 Bracket' },
    { key: 'extras',   label: '⭐ Extras' },
  ];

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Link href="/players" className="text-green-700 hover:text-green-900 text-sm">← Volver</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{data.user.name}</h1>
          <p className="text-sm text-gray-500">{data.matches.length} predicciones realizadas</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-green-700 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'grupos' && (
        <GroupStandingsView predictions={data.matches} />
      )}

      {tab === 'bracket' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Equipos calculados automáticamente desde sus predicciones de grupos y eliminatorias.
          </p>
          <BracketView predictions={data.matches} />
        </div>
      )}

      {tab === 'extras' && (
        <div className="space-y-4 max-w-sm">
          {data.extra ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🏆</span>
                  <span className="font-semibold text-gray-700">Campeón</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {teamMap[data.extra.champion]?.flag} {teamMap[data.extra.champion]?.name ?? data.extra.champion}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">⭐</span>
                  <span className="font-semibold text-gray-700">MVP</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{data.extra.mvp || '–'}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">👟</span>
                  <span className="font-semibold text-gray-700">Pichichi</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{data.extra.topScorer || '–'}</p>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400">
              Aún no ha rellenado los extras
            </div>
          )}
        </div>
      )}
    </div>
  );
}
