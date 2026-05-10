'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import teamsData from '@/data/teams.json';
import type { StandingEntry } from '@/types';

const teamMap = Object.fromEntries(teamsData.map(t => [t.id, { name: t.name, flag: t.flag }]));
const MEDALS = ['🥇', '🥈', '🥉'];

interface ExtraEntry {
  userId: string;
  userName: string;
  champion: string;
  mvp: string;
  topScorer: string;
  championCorrect: boolean | null;
  mvpCorrect: boolean | null;
  topScorerCorrect: boolean | null;
}

interface ExtrasResponse {
  realChampion: string | null;
  realMVP: string | null;
  realTopScorer: string | null;
  entries: ExtraEntry[];
}

function CorrectBadge({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-gray-300 text-xs">—</span>;
  return value
    ? <span className="text-green-600 font-bold text-sm">✓</span>
    : <span className="text-red-500 font-bold text-sm">✗</span>;
}

export default function StandingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'points' | 'extras'>('points');
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [extrasData, setExtrasData] = useState<ExtrasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { router.replace('/join'); return; }
    setMyId(localStorage.getItem('userId') ?? '');

    Promise.all([
      fetch('/api/standings').then(r => r.json()),
      fetch('/api/extras').then(r => r.json()),
    ]).then(([s, e]) => {
      setStandings(s);
      setExtrasData(e);
    }).finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-4xl">⏳</div>
    </div>
  );

  const extras = extrasData?.entries ?? [];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">🏆 Clasificación</h1>
        <p className="text-sm text-gray-500 mt-0.5">Puntuación acumulada de todos los participantes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['points', 'extras'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t ? 'bg-green-700 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t === 'points' ? '📊 Puntos' : '⭐ Campeón / MVP / Pichichi'}
          </button>
        ))}
      </div>

      {tab === 'points' && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-green-700 text-white text-sm">
                  <th className="px-4 py-3 text-left w-10">#</th>
                  <th className="px-4 py-3 text-left">Participante</th>
                  <th className="px-4 py-3 text-center font-bold">Pts</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">1X2</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Exacto</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Posición</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Clasif.</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Elim.</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Extras</th>
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
                    <td className="px-4 py-3 text-center font-bold text-green-700 text-base">{s.totalPoints}</td>
                    <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">{s.breakdown.groupWinner}</td>
                    <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">{s.breakdown.exactScore}</td>
                    <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">{s.breakdown.exactPosition}</td>
                    <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">{s.breakdown.advancesGroup}</td>
                    <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">{s.breakdown.advancesKnockout}</td>
                    <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">
                      {s.breakdown.champion + s.breakdown.mvp + s.breakdown.topScorer}
                    </td>
                  </tr>
                ))}
                {standings.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                      Aún no hay participantes con predicciones
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100 text-xs text-gray-500">
            <strong className="text-gray-700">Columnas:</strong>{' '}
            1X2 = ganador · Exacto = resultado exacto · Posición = 1º/2º/3º/4º exacto por grupo · Clasif. = top 2 por grupo · Elim. = avanza por ronda · Extras = campeón + MVP + pichichi
          </div>
        </>
      )}

      {tab === 'extras' && (
        <div className="space-y-4">
          {/* Real results banner */}
          {(extrasData?.realChampion || extrasData?.realMVP || extrasData?.realTopScorer) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-2">Resultado real</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {extrasData.realChampion && (
                  <div>
                    <span className="text-gray-500 text-xs">Campeón: </span>
                    {(() => {
                      const t = teamMap[extrasData.realChampion!];
                      return t
                        ? <span className="font-semibold">{t.flag} {t.name}</span>
                        : <span className="font-semibold">{extrasData.realChampion}</span>;
                    })()}
                  </div>
                )}
                {extrasData.realMVP && (
                  <div>
                    <span className="text-gray-500 text-xs">MVP: </span>
                    <span className="font-semibold">{extrasData.realMVP}</span>
                  </div>
                )}
                {extrasData.realTopScorer && (
                  <div>
                    <span className="text-gray-500 text-xs">Pichichi: </span>
                    <span className="font-semibold">{extrasData.realTopScorer}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="px-4 py-3 text-left">Participante</th>
                  <th className="px-4 py-3 text-left">Campeón</th>
                  <th className="px-4 py-3 text-center w-8"></th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">MVP</th>
                  <th className="px-4 py-3 text-center w-8 hidden sm:table-cell"></th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Pichichi</th>
                  <th className="px-4 py-3 text-center w-8 hidden sm:table-cell"></th>
                </tr>
              </thead>
              <tbody>
                {extras.map((e, i) => {
                  const champ = teamMap[e.champion];
                  const isMe = e.userId === myId;
                  return (
                    <tr key={e.userId} className={`border-t border-gray-100 ${isMe ? 'bg-green-50 font-semibold' : i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        {e.userName}
                        {isMe && <span className="ml-2 text-xs text-green-600">(tú)</span>}
                      </td>
                      <td className="px-4 py-3">
                        {champ
                          ? <span className="flex items-center gap-1.5"><span className="text-lg">{champ.flag}</span><span>{champ.name}</span></span>
                          : <span className="text-gray-400 italic">{e.champion || '—'}</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-center"><CorrectBadge value={e.championCorrect} /></td>
                      <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">{e.mvp || <span className="text-gray-400 italic">—</span>}</td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell"><CorrectBadge value={e.mvpCorrect} /></td>
                      <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">{e.topScorer || <span className="text-gray-400 italic">—</span>}</td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell"><CorrectBadge value={e.topScorerCorrect} /></td>
                    </tr>
                  );
                })}
                {extras.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      Nadie ha rellenado predicciones especiales aún
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
