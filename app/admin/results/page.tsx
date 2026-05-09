'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import teamsData from '@/data/teams.json';
import matchesData from '@/data/matches.json';
import type { MatchResult } from '@/types';

const teamMap = Object.fromEntries(teamsData.map(t => [t.id, { name: t.name, flag: t.flag }]));
const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];
const STAGE_LABELS: Record<string, string> = {
  r32: 'Octavos (32)', r16: 'Octavos (16)', qf: 'Cuartos', sf: 'Semifinales', third: '3.º puesto', final: 'FINAL',
};

type TabType = 'groups' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';

function ResultRow({
  matchId, home, away, result, onChange,
}: {
  matchId: string;
  home: string;
  away: string;
  result: MatchResult | undefined;
  onChange: (r: MatchResult) => void;
}) {
  const ht = teamMap[home] ?? { name: home, flag: '🏳️' };
  const at = teamMap[away] ?? { name: away, flag: '🏳️' };
  const played = result?.played ?? false;
  const isDraw = played && result && result.homeScore === result.awayScore;

  function set(field: string, val: number | boolean) {
    const base: MatchResult = result ?? { matchId, homeScore: 0, awayScore: 0, played: false };
    onChange({ ...base, [field]: val });
  }

  return (
    <div className={`px-4 py-3 rounded-xl mb-2 border ${played ? 'bg-green-900/20 border-green-700/40' : 'bg-gray-800 border-gray-700'}`}>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={played}
            onChange={e => set('played', e.target.checked)}
            className="accent-green-500"
          />
          Jugado
        </label>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm text-white flex-1 text-right flex items-center justify-end gap-1">
            {ht.name} <span>{ht.flag}</span>
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number" min={0} max={99}
              value={result?.homeScore ?? ''}
              onChange={e => set('homeScore', parseInt(e.target.value) || 0)}
              disabled={!played}
              className="w-12 text-center bg-gray-700 text-white border border-gray-600 rounded-md py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-40"
            />
            <span className="text-gray-500">–</span>
            <input
              type="number" min={0} max={99}
              value={result?.awayScore ?? ''}
              onChange={e => set('awayScore', parseInt(e.target.value) || 0)}
              disabled={!played}
              className="w-12 text-center bg-gray-700 text-white border border-gray-600 rounded-md py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-40"
            />
          </div>
          <span className="text-sm text-white flex-1 flex items-center gap-1">
            <span>{at.flag}</span> {at.name}
          </span>
        </div>
      </div>

      {isDraw && (
        <div className="mt-2 flex items-center gap-2 pl-16 text-sm">
          <span className="text-amber-400 text-xs">Penaltis:</span>
          <input type="number" min={0} max={20}
            value={result?.homePenalties ?? ''}
            onChange={e => set('homePenalties', parseInt(e.target.value) || 0)}
            className="w-10 text-center bg-gray-700 text-white border border-amber-500 rounded py-1 text-sm font-bold"
          />
          <span className="text-gray-500">–</span>
          <input type="number" min={0} max={20}
            value={result?.awayPenalties ?? ''}
            onChange={e => set('awayPenalties', parseInt(e.target.value) || 0)}
            className="w-10 text-center bg-gray-700 text-white border border-amber-500 rounded py-1 text-sm font-bold"
          />
        </div>
      )}
    </div>
  );
}

export default function AdminResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<Map<string, MatchResult>>(new Map());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('groups');
  const [activeGroup, setActiveGroup] = useState('A');

  useEffect(() => {
    const session = localStorage.getItem('adminSession');
    if (!session) { router.replace('/admin'); return; }

    fetch('/api/results')
      .then(r => r.json())
      .then((data: MatchResult[]) => {
        const map = new Map(data.map(r => [r.matchId, r]));
        setResults(map);
      });
  }, [router]);

  function handleChange(r: MatchResult) {
    setResults(prev => new Map(prev).set(r.matchId, r));
    setSaved(false);
  }

  async function saveAll() {
    const session = localStorage.getItem('adminSession');
    if (!session) return;
    setSaving(true);
    try {
      await fetch('/api/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-session': session },
        body: JSON.stringify([...results.values()]),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'groups', label: '🗓️ Grupos' },
    { key: 'r32', label: 'Octavos 32' },
    { key: 'r16', label: 'Octavos 16' },
    { key: 'qf', label: 'Cuartos' },
    { key: 'sf', label: 'Semis' },
    { key: 'third', label: '3.º' },
    { key: 'final', label: '🏆 Final' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-white text-sm">← Dashboard</Link>
          <h1 className="text-2xl font-bold">📊 Introducir resultados</h1>
        </div>

        {/* Stage tabs */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.key ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'groups' && (
          <>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {GROUPS.map(g => (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    activeGroup === g ? 'bg-green-700' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Grupo {g}
                </button>
              ))}
            </div>
            {matchesData.groups.filter(m => m.group === activeGroup).map(m => (
              <ResultRow key={m.id} matchId={m.id} home={m.home} away={m.away}
                result={results.get(m.id)} onChange={handleChange} />
            ))}
          </>
        )}

        {activeTab !== 'groups' && (
          <>
            {matchesData.knockout.filter(m => m.stage === activeTab).map(m => (
              <ResultRow key={m.id} matchId={m.id} home={m.homeSlot} away={m.awaySlot}
                result={results.get(m.id)} onChange={handleChange} />
            ))}
          </>
        )}

        <div className="flex items-center justify-between mt-4">
          {saved && !saving && <span className="text-green-400 text-sm">✓ Guardado</span>}
          <div className="ml-auto">
            <button
              onClick={saveAll}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar resultados'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
