'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import teamsData from '@/data/teams.json';
import matchesData from '@/data/matches.json';
import type { MatchPrediction } from '@/types';
import { resolveKnockoutSlot } from '@/lib/brackets';

const teamMap = Object.fromEntries(teamsData.map(t => [t.id, { name: t.name, flag: t.flag }]));

const SH = 76;
const CW = 172;
const CW2 = 20;
const LINE = '#4b5563';

interface TeamSlot { id: string | null; score?: number; winner?: boolean; penalties?: number }
interface BMatch { id: string; home: TeamSlot; away: TeamSlot; hasPred: boolean }

/* ─── Connectors ─── */
function ConnRight({ slotH, isTop }: { slotH: number; isTop: boolean }) {
  return (
    <>
      <div style={{ position: 'absolute', right: -CW2, top: '50%', width: CW2, height: 2, backgroundColor: LINE, transform: 'translateY(-1px)' }} />
      <div style={{ position: 'absolute', right: -CW2, width: 2, backgroundColor: LINE, ...(isTop ? { top: '50%', height: slotH / 2 } : { bottom: '50%', height: slotH / 2 }) }} />
    </>
  );
}

function ConnLeft({ slotH, isTop }: { slotH: number; isTop: boolean }) {
  return (
    <>
      <div style={{ position: 'absolute', left: -CW2, top: '50%', width: CW2, height: 2, backgroundColor: LINE, transform: 'translateY(-1px)' }} />
      <div style={{ position: 'absolute', left: -CW2, width: 2, backgroundColor: LINE, ...(isTop ? { top: '50%', height: slotH / 2 } : { bottom: '50%', height: slotH / 2 }) }} />
    </>
  );
}

/* ─── Editable card ─── */
function EditableCard({ m, gold, onChange, locked }: {
  m: BMatch; gold?: boolean;
  onChange: (p: MatchPrediction) => void;
  locked: boolean;
}) {
  const [homeStr, setHomeStr] = useState(m.home.score?.toString() ?? '');
  const [awayStr, setAwayStr] = useState(m.away.score?.toString() ?? '');
  const loaded = useRef(m.hasPred);

  useEffect(() => {
    if (!loaded.current && m.hasPred) {
      setHomeStr(m.home.score?.toString() ?? '');
      setAwayStr(m.away.score?.toString() ?? '');
      loaded.current = true;
    }
  }, [m.hasPred, m.home.score, m.away.score]);

  const hNum = parseInt(homeStr);
  const aNum = parseInt(awayStr);
  const bothValid = !isNaN(hNum) && hNum >= 0 && !isNaN(aNum) && aNum >= 0;
  const isDraw = bothValid && hNum === aNum;

  function handleScore(side: 'home' | 'away', raw: string) {
    const h = side === 'home' ? raw : homeStr;
    const a = side === 'away' ? raw : awayStr;
    if (side === 'home') setHomeStr(raw); else setAwayStr(raw);
    const hn = parseInt(h);
    const an = parseInt(a);
    if (!isNaN(hn) && hn >= 0 && !isNaN(an) && an >= 0) {
      onChange({
        matchId: m.id,
        homeScore: hn,
        awayScore: an,
        homePenalties: m.home.penalties,
        awayPenalties: m.away.penalties,
      });
    }
  }

  function setPenalty(field: 'homePenalties' | 'awayPenalties', val: number) {
    if (!bothValid) return;
    onChange({ matchId: m.id, homeScore: hNum, awayScore: aNum, homePenalties: m.home.penalties, awayPenalties: m.away.penalties, [field]: val });
  }

  const rows = [
    { slot: m.home, side: 'home' as const, str: homeStr },
    { slot: m.away, side: 'away' as const, str: awayStr },
  ];

  return (
    <div style={{ width: CW }} className={`flex-shrink-0 rounded-lg overflow-hidden border-2 shadow-md ${gold ? 'border-yellow-400' : 'border-gray-600'} bg-gray-800`}>
      {rows.map(({ slot, side, str }, ri) => {
        const team = slot.id ? teamMap[slot.id] : null;
        const win = slot.winner && m.hasPred;
        return (
          <div key={ri}>
            {ri === 1 && <div className="h-px bg-gray-600" />}
            <div className={`flex items-center gap-1 px-2 py-1.5 ${win ? 'bg-green-900' : ''}`}>
              <span className="text-sm leading-none flex-shrink-0">{team?.flag ?? '🏳️'}</span>
              <span className={`text-xs flex-1 min-w-0 truncate ${win ? 'font-bold text-green-300' : slot.id ? 'text-gray-200' : 'text-gray-500 italic'}`}>
                {team?.name ?? (slot.id ? slot.id : '─')}
              </span>
              {slot.id && !locked ? (
                <input
                  type="number" min={0} max={99}
                  value={str}
                  onChange={e => handleScore(side, e.target.value)}
                  className="w-9 flex-shrink-0 text-center border border-gray-600 rounded py-0.5 text-xs font-bold bg-gray-700 text-gray-100 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              ) : slot.score !== undefined && (
                <span className={`text-xs font-bold tabular-nums flex-shrink-0 ${win ? 'text-green-300' : 'text-gray-400'}`}>
                  {slot.score}
                  {slot.penalties !== undefined && <span className="text-yellow-400 ml-0.5 text-[10px]">({slot.penalties})</span>}
                </span>
              )}
            </div>
          </div>
        );
      })}
      {isDraw && !locked && m.home.id && m.away.id && (
        <div className="px-2 py-1 bg-amber-900/30 border-t border-amber-700/50 flex items-center justify-center gap-1">
          <span className="text-[10px] text-amber-400">Pen:</span>
          <input type="number" min={0} max={20}
            value={m.home.penalties ?? ''}
            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setPenalty('homePenalties', v); }}
            className="w-7 text-center border border-amber-600 rounded py-0.5 text-[10px] font-bold bg-amber-900/50 text-amber-200 focus:outline-none"
          />
          <span className="text-amber-500 text-[10px]">–</span>
          <input type="number" min={0} max={20}
            value={m.away.penalties ?? ''}
            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setPenalty('awayPenalties', v); }}
            className="w-7 text-center border border-amber-600 rounded py-0.5 text-[10px] font-bold bg-amber-900/50 text-amber-200 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

/* ─── Column ─── */
function Col({ matches, spm, label, cr, cl, onChange, locked }: {
  matches: BMatch[]; spm: number; label: string;
  cr?: boolean; cl?: boolean;
  onChange: (p: MatchPrediction) => void;
  locked: boolean;
}) {
  const slotH = SH * spm;
  return (
    <div style={{ width: CW, flexShrink: 0 }}>
      <div className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 h-4">
        {label}
      </div>
      {matches.map((m, i) => (
        <div key={m.id} style={{ height: slotH, position: 'relative' }} className="flex items-center justify-center">
          {cl && <ConnLeft slotH={slotH} isTop={i % 2 === 0} />}
          <EditableCard m={m} onChange={onChange} locked={locked} />
          {cr && <ConnRight slotH={slotH} isTop={i % 2 === 0} />}
        </div>
      ))}
    </div>
  );
}

const LABELS: Record<string, string> = {
  r32: 'Octavos (32)', r16: 'Octavos (16)', qf: 'Cuartos', sf: 'Semifinal',
};

/* ═══ Main ═══ */
export default function KnockoutsPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<Map<string, MatchPrediction>>(new Map());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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
  const onChangeFn = deadlinePassed ? () => {} : handleChange;

  const groupPreds = [...predictions.values()].filter(p => p.matchId.startsWith('G'));
  const koPredMap = new Map<string, MatchPrediction>(
    matchesData.knockout.flatMap(km => {
      const p = predictions.get(km.id);
      return p ? [[km.id, p] as [string, MatchPrediction]] : [];
    })
  );

  function bm(id: string): BMatch {
    const km = matchesData.knockout.find(m => m.id === id)!;
    const homeId = resolveKnockoutSlot(km.homeSlot, matchesData.groups as never, groupPreds, koPredMap);
    const awayId = resolveKnockoutSlot(km.awaySlot, matchesData.groups as never, groupPreds, koPredMap);
    const pred = koPredMap.get(id);
    let homeWinner = false, awayWinner = false;
    if (pred) {
      const { homeScore: hs, awayScore: as_, homePenalties: hp, awayPenalties: ap } = pred;
      homeWinner = hs > as_ || (hs === as_ && (hp ?? 0) > (ap ?? 0));
      awayWinner = !homeWinner;
    }
    return {
      id, hasPred: !!pred,
      home: { id: homeId, score: pred?.homeScore, winner: homeWinner, penalties: pred && pred.homeScore === pred.awayScore ? pred.homePenalties : undefined },
      away: { id: awayId, score: pred?.awayScore, winner: awayWinner, penalties: pred && pred.homeScore === pred.awayScore ? pred.awayPenalties : undefined },
    };
  }

  const leftR32  = ['R32_1','R32_2','R32_3','R32_4','R32_5','R32_6','R32_7','R32_8'].map(bm);
  const leftR16  = ['R16_1','R16_2','R16_3','R16_4'].map(bm);
  const leftQF   = ['QF_1','QF_2'].map(bm);
  const leftSF   = [bm('SF_1')];
  const finalM   = bm('FINAL');
  const rightSF  = [bm('SF_2')];
  const rightQF  = ['QF_3','QF_4'].map(bm);
  const rightR16 = ['R16_5','R16_6','R16_7','R16_8'].map(bm);
  const rightR32 = ['R32_9','R32_10','R32_11','R32_12','R32_13','R32_14','R32_15','R32_16'].map(bm);
  const thirdM   = bm('3RD');
  const totalH   = SH * 8;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Eliminatorias</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Los equipos se calculan según tus predicciones de grupos
          </p>
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

      <div className="rounded-2xl bg-gray-900 p-4 overflow-x-auto">
        <div className="flex items-start min-w-max" style={{ gap: CW2 }}>
          <Col matches={leftR32}  spm={1} label={LABELS.r32} cr onChange={onChangeFn} locked={deadlinePassed} />
          <Col matches={leftR16}  spm={2} label={LABELS.r16} cr cl onChange={onChangeFn} locked={deadlinePassed} />
          <Col matches={leftQF}   spm={4} label={LABELS.qf}  cr cl onChange={onChangeFn} locked={deadlinePassed} />
          <Col matches={leftSF}   spm={8} label={LABELS.sf}  cr cl onChange={onChangeFn} locked={deadlinePassed} />

          <div style={{ width: CW, flexShrink: 0 }}>
            <div className="text-center text-[10px] font-bold text-yellow-400 uppercase tracking-wide mb-2 h-4">
              🏆 Final
            </div>
            <div style={{ height: totalH }} className="flex items-center justify-center">
              <EditableCard m={finalM} gold onChange={onChangeFn} locked={deadlinePassed} />
            </div>
          </div>

          <Col matches={rightSF}  spm={8} label={LABELS.sf}  cl cr onChange={onChangeFn} locked={deadlinePassed} />
          <Col matches={rightQF}  spm={4} label={LABELS.qf}  cl cr onChange={onChangeFn} locked={deadlinePassed} />
          <Col matches={rightR16} spm={2} label={LABELS.r16} cl cr onChange={onChangeFn} locked={deadlinePassed} />
          <Col matches={rightR32} spm={1} label={LABELS.r32} cl onChange={onChangeFn} locked={deadlinePassed} />
        </div>

        <div className="mt-5 flex flex-col items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            🥉 Tercer y cuarto puesto
          </span>
          <EditableCard m={thirdM} onChange={onChangeFn} locked={deadlinePassed} />
        </div>

        <div className="mt-4 flex items-center gap-4 text-[10px] text-gray-500 justify-center flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-900 inline-block border border-green-700" />
            Ganador predicho
          </span>
          <span className="flex items-center gap-1">
            <span className="text-yellow-400 text-[10px]">(n)</span>
            Ganó en penaltis
          </span>
          <span className="flex items-center gap-1">
            <span className="text-amber-400 text-[10px]">Pen:</span>
            Empate → añade penaltis
          </span>
          <span className="flex items-center gap-1 italic text-gray-600">─ = equipo pendiente</span>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => router.push('/predictions/extras')}
          className="text-sm text-green-700 hover:text-green-900 font-medium"
        >
          Ir a extras → Campeón, MVP, Pichichi
        </button>
      </div>
    </div>
  );
}
