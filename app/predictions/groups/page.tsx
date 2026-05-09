'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import teamsData from '@/data/teams.json';
import matchesData from '@/data/matches.json';
import type { MatchPrediction } from '@/types';
import { calcGroupStandings } from '@/lib/brackets';

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];
const teamMap = Object.fromEntries(teamsData.map(t => [t.id, { name: t.name, flag: t.flag }]));

const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function fmtCEST(dt: string) {
  const d = new Date(new Date(dt).getTime() + 2 * 3600_000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
}

function MatchInputRow({
  m, prediction, onChange, locked,
}: {
  m: { id: string; home: string; away: string; matchday: number; datetime?: string };
  prediction: MatchPrediction | undefined;
  onChange: (p: MatchPrediction) => void;
  locked: boolean;
}) {
  const ht = teamMap[m.home];
  const at = teamMap[m.away];
  const [home, setHome] = useState(prediction?.homeScore?.toString() ?? '');
  const [away, setAway] = useState(prediction?.awayScore?.toString() ?? '');
  const loaded = useRef(!!prediction);

  useEffect(() => {
    if (!loaded.current && prediction) {
      setHome(prediction.homeScore.toString());
      setAway(prediction.awayScore.toString());
      loaded.current = true;
    }
  }, [prediction]);

  function handleInput(side: 'home' | 'away', raw: string) {
    const h = side === 'home' ? raw : home;
    const a = side === 'away' ? raw : away;
    if (side === 'home') setHome(raw); else setAway(raw);
    const hNum = parseInt(h);
    const aNum = parseInt(a);
    if (!isNaN(hNum) && hNum >= 0 && !isNaN(aNum) && aNum >= 0) {
      onChange({ matchId: m.id, homeScore: hNum, awayScore: aNum });
    }
  }

  return (
    <div className="flex items-center text-xs py-1 gap-1">
      <span className="flex-1 text-right flex items-center justify-end gap-1 min-w-0">
        <span className="truncate text-gray-700">{ht?.name}</span>
        <span className="flex-shrink-0 text-base">{ht?.flag}</span>
      </span>
      <div className="flex flex-col items-center flex-shrink-0">
        {locked ? (
          <span className={`w-14 text-center font-bold ${prediction ? 'text-gray-800' : 'text-gray-300'}`}>
            {prediction ? `${prediction.homeScore} – ${prediction.awayScore}` : '– –'}
          </span>
        ) : (
          <div className="flex items-center gap-0.5">
            <input
              type="number" min={0} max={99}
              value={home}
              onChange={e => handleInput('home', e.target.value)}
              className="w-9 text-center border border-gray-300 rounded py-0.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <span className="text-gray-400 font-bold px-0.5">–</span>
            <input
              type="number" min={0} max={99}
              value={away}
              onChange={e => handleInput('away', e.target.value)}
              className="w-9 text-center border border-gray-300 rounded py-0.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        )}
        {m.datetime && (
          <span className="text-[11px] text-gray-400 mt-0.5">{fmtCEST(m.datetime)}</span>
        )}
      </div>
      <span className="flex-1 flex items-center gap-1 min-w-0">
        <span className="flex-shrink-0 text-base">{at?.flag}</span>
        <span className="truncate text-gray-700">{at?.name}</span>
      </span>
    </div>
  );
}

function GroupPanel({
  groupId, predictions, onChange, locked,
}: {
  groupId: string;
  predictions: Map<string, MatchPrediction>;
  onChange: (p: MatchPrediction) => void;
  locked: boolean;
}) {
  const groupMatches = matchesData.groups.filter(m => m.group === groupId);
  const predList = [...predictions.values()];
  const standings = calcGroupStandings(groupId, groupMatches as never, predList);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-green-700 text-white px-3 py-2 flex items-center gap-2">
        <span className="font-bold text-sm">Grupo {groupId}</span>
        <div className="flex gap-1 ml-auto">
          {standings.map(s => (
            <span key={s.teamId} className="text-base leading-none" title={teamMap[s.teamId]?.name}>
              {teamMap[s.teamId]?.flag}
            </span>
          ))}
        </div>
      </div>

      {/* Live standings table */}
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 text-gray-400 border-b border-gray-100">
            <th className="text-left px-3 py-1.5 font-medium">Equipo</th>
            <th className="w-7 text-center font-medium">PJ</th>
            <th className="w-7 text-center font-medium">G</th>
            <th className="w-7 text-center font-medium">E</th>
            <th className="w-7 text-center font-medium">P</th>
            <th className="w-8 text-center font-medium">GF</th>
            <th className="w-8 text-center font-medium">GC</th>
            <th className="w-8 text-center font-medium">+/-</th>
            <th className="w-9 text-center font-bold text-gray-600">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const team = teamMap[s.teamId];
            const top2 = i < 2;
            const third = i === 2;
            return (
              <tr key={s.teamId} className={`border-b border-gray-50 ${top2 ? 'bg-green-50' : third ? 'bg-amber-50' : ''}`}>
                <td className="px-3 py-1.5 flex items-center gap-1.5">
                  <span className={`w-1 h-4 rounded-sm flex-shrink-0 ${top2 ? 'bg-green-500' : third ? 'bg-amber-400' : 'bg-gray-200'}`} />
                  <span className="text-sm">{team?.flag}</span>
                  <span className={`truncate max-w-[90px] ${top2 ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{team?.name}</span>
                </td>
                <td className="text-center text-gray-500">{s.played}</td>
                <td className="text-center text-gray-500">{s.won}</td>
                <td className="text-center text-gray-500">{s.drawn}</td>
                <td className="text-center text-gray-500">{s.lost}</td>
                <td className="text-center text-gray-500">{s.goalsFor}</td>
                <td className="text-center text-gray-500">{s.goalsAgainst}</td>
                <td className={`text-center ${s.goalDiff > 0 ? 'text-green-600' : s.goalDiff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {s.goalDiff > 0 ? '+' : ''}{s.goalDiff}
                </td>
                <td className={`text-center font-bold ${top2 ? 'text-green-700' : 'text-gray-700'}`}>{s.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Match inputs by matchday */}
      <div className="divide-y divide-gray-50">
        {[1, 2, 3].map(day => {
          const dayMatches = groupMatches.filter(m => m.matchday === day);
          return (
            <div key={day} className="px-3 py-1.5">
              <div className="text-xs text-gray-400 mb-1">Jornada {day}</div>
              {dayMatches.map(m => (
                <MatchInputRow
                  key={m.id}
                  m={m}
                  prediction={predictions.get(m.id)}
                  onChange={onChange}
                  locked={locked}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<Map<string, MatchPrediction>>(new Map());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeGroup, setActiveGroup] = useState('A');
  const [deadline, setDeadline] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const predictionsRef = useRef<Map<string, MatchPrediction>>(new Map());

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { router.replace('/join'); return; }

    fetch('/api/predictions', { headers: { 'x-user-token': token } })
      .then(r => r.json())
      .then(data => {
        const map = new Map<string, MatchPrediction>();
        for (const m of data.matches ?? []) map.set(m.matchId, m);
        setPredictions(map);
        predictionsRef.current = map;
      });

    fetch('/api/config').then(r => r.json()).then(cfg => setDeadline(cfg.deadline));
  }, [router]);

  const handleChange = useCallback((p: MatchPrediction) => {
    setPredictions(prev => {
      const next = new Map(prev).set(p.matchId, p);
      predictionsRef.current = next;
      return next;
    });
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const token = localStorage.getItem('userToken');
      if (!token) return;
      setSaving(true);
      try {
        const all = [...predictionsRef.current.values()];
        await fetch('/api/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-token': token },
          body: JSON.stringify({ matches: all }),
        });
        setSaved(true);
      } finally {
        setSaving(false);
      }
    }, 1500);
  }, []);

  const deadlinePassed = deadline ? new Date() > new Date(deadline) : false;
  const totalFilled = [...predictions.keys()].filter(k => k.startsWith('G')).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fase de grupos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalFilled} / 72 partidos completados</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-gray-400">Guardando...</span>}
          {saved && !saving && <span className="text-xs text-green-600">✓ Guardado</span>}
        </div>
      </div>

      {deadlinePassed && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm mb-4">
          ⏰ El plazo ha finalizado. Solo puedes consultar tus predicciones.
        </div>
      )}

      {/* Group tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {GROUPS.map(g => {
          const done = matchesData.groups.filter(m => m.group === g && predictions.has(m.id)).length;
          return (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeGroup === g
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Grupo {g}
              {done === 6 && <span className="ml-1 text-xs">✓</span>}
            </button>
          );
        })}
      </div>

      <GroupPanel
        groupId={activeGroup}
        predictions={predictions}
        onChange={deadlinePassed ? () => {} : handleChange}
        locked={deadlinePassed}
      />

      <div className="mt-4 flex justify-between">
        <button
          onClick={() => {
            const idx = GROUPS.indexOf(activeGroup);
            if (idx > 0) setActiveGroup(GROUPS[idx - 1]);
          }}
          disabled={activeGroup === 'A'}
          className="text-sm text-green-700 hover:text-green-900 disabled:text-gray-300 font-medium"
        >
          ← Grupo anterior
        </button>
        <button
          onClick={() => {
            const idx = GROUPS.indexOf(activeGroup);
            if (idx < GROUPS.length - 1) setActiveGroup(GROUPS[idx + 1]);
            else router.push('/predictions/knockouts');
          }}
          className="text-sm text-green-700 hover:text-green-900 font-medium"
        >
          {activeGroup === 'L' ? 'Ir a eliminatorias →' : 'Grupo siguiente →'}
        </button>
      </div>
    </div>
  );
}
