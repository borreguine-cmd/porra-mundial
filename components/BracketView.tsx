'use client';

import teamsData from '@/data/teams.json';
import matchesData from '@/data/matches.json';
import type { MatchPrediction } from '@/types';
import { resolveKnockoutSlot } from '@/lib/brackets';

const teamMap = Object.fromEntries(teamsData.map(t => [t.id, { name: t.name, flag: t.flag }]));

const SH = 100;  // slot height px (per R32 slot)
const CW = 156;  // card width px
const CW2 = 20;  // connector width px
const LINE = '#4b5563'; // connector color

interface TeamSlot { id: string | null; score?: number; winner?: boolean; penalties?: number }
interface BMatch { id: string; home: TeamSlot; away: TeamSlot; hasPred: boolean }

/* ─── Match card ─────────────────────────────────────────────── */
function Card({ m, gold }: { m: BMatch; gold?: boolean }) {
  const rows = [
    { slot: m.home, label: 'home' },
    { slot: m.away, label: 'away' },
  ];
  return (
    <div
      style={{ width: CW }}
      className={`flex-shrink-0 rounded-lg overflow-hidden border-2 shadow-md
        ${gold ? 'border-yellow-400' : 'border-gray-600'} bg-gray-800`}
    >
      {rows.map(({ slot }, ri) => {
        const team = slot.id ? teamMap[slot.id] : null;
        const win = slot.winner && m.hasPred;
        return (
          <div key={ri}>
            {ri === 1 && <div className="h-px bg-gray-600" />}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 ${win ? 'bg-green-900' : ''}`}>
              <span className="text-base leading-none flex-shrink-0">{team?.flag ?? '🏳️'}</span>
              <span className={`text-xs flex-1 min-w-0 truncate ${win ? 'font-bold text-green-300' : slot.id ? 'text-gray-200' : 'text-gray-500 italic'}`}>
                {team?.name ?? (slot.id ? slot.id : '─')}
              </span>
              {slot.score !== undefined && (
                <span className={`text-xs font-bold tabular-nums ml-1 flex-shrink-0
                  ${win ? 'text-green-300' : 'text-gray-400'}`}>
                  {slot.score}
                  {slot.penalties !== undefined && (
                    <span className="text-yellow-400 ml-0.5 text-[10px]">({slot.penalties})</span>
                  )}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Build match data from predictions ─────────────────────── */
function buildMatch(
  id: string,
  groupPreds: MatchPrediction[],
  koPredMap: Map<string, MatchPrediction>
): BMatch {
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
    id,
    hasPred: !!pred,
    home: {
      id: homeId,
      score: pred?.homeScore,
      winner: homeWinner,
      penalties: pred && pred.homeScore === pred.awayScore ? pred.homePenalties : undefined,
    },
    away: {
      id: awayId,
      score: pred?.awayScore,
      winner: awayWinner,
      penalties: pred && pred.homeScore === pred.awayScore ? pred.awayPenalties : undefined,
    },
  };
}

/* ─── Connector lines (absolutely positioned SVG-like divs) ─── */
function ConnRight({ slotH, isTop }: { slotH: number; isTop: boolean }) {
  return (
    <>
      {/* horizontal stub right */}
      <div style={{
        position: 'absolute', right: -CW2, top: '50%',
        width: CW2, height: 2, backgroundColor: LINE, transform: 'translateY(-1px)',
      }} />
      {/* vertical to midpoint of pair */}
      <div style={{
        position: 'absolute', right: -CW2, width: 2, backgroundColor: LINE,
        ...(isTop ? { top: '50%', height: slotH / 2 } : { bottom: '50%', height: slotH / 2 }),
      }} />
    </>
  );
}

function ConnLeft({ slotH, isTop }: { slotH: number; isTop: boolean }) {
  return (
    <>
      <div style={{
        position: 'absolute', left: -CW2, top: '50%',
        width: CW2, height: 2, backgroundColor: LINE, transform: 'translateY(-1px)',
      }} />
      <div style={{
        position: 'absolute', left: -CW2, width: 2, backgroundColor: LINE,
        ...(isTop ? { top: '50%', height: slotH / 2 } : { bottom: '50%', height: slotH / 2 }),
      }} />
    </>
  );
}

/* ─── A column of match slots ────────────────────────────────── */
function Col({
  matches, spm, label, cr, cl,
}: {
  matches: BMatch[];
  spm: number;      // slots per match
  label: string;
  cr?: boolean;     // connector right
  cl?: boolean;     // connector left
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
          <Card m={m} />
          {cr && <ConnRight slotH={slotH} isTop={i % 2 === 0} />}
        </div>
      ))}
    </div>
  );
}

/* ─── Stage label strip ──────────────────────────────────────── */
const LABELS: Record<string, string> = {
  r32: 'Octavos (32)', r16: 'Octavos (16)', qf: 'Cuartos',
  sf: 'Semifinal', final: '🏆 Final', third: '3.er puesto',
};

/* ═══ Main export ════════════════════════════════════════════════ */
export default function BracketView({ predictions }: { predictions: MatchPrediction[] }) {
  const groupPreds = predictions.filter(p => p.matchId.startsWith('G'));
  const koPredMap = new Map<string, MatchPrediction>(
    matchesData.knockout.flatMap(km => {
      const p = predictions.find(x => x.matchId === km.id);
      return p ? [[km.id, p] as [string, MatchPrediction]] : [];
    })
  );
  const bm = (id: string) => buildMatch(id, groupPreds, koPredMap);

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

  const totalH = SH * 8;

  return (
    <div className="rounded-2xl bg-gray-900 p-4 overflow-x-auto">
      {/* ── Main bracket ── */}
      <div className="flex items-start min-w-max" style={{ gap: CW2 }}>
        <Col matches={leftR32}  spm={1} label={LABELS.r32} cr />
        <Col matches={leftR16}  spm={2} label={LABELS.r16} cr cl />
        <Col matches={leftQF}   spm={4} label={LABELS.qf}  cr cl />
        <Col matches={leftSF}   spm={8} label={LABELS.sf}  cr cl />

        {/* ── Final (center) ── */}
        <div style={{ width: CW, flexShrink: 0 }}>
          <div className="text-center text-[10px] font-bold text-yellow-400 uppercase tracking-wide mb-2 h-4">
            🏆 Final
          </div>
          <div style={{ height: totalH }} className="flex items-center justify-center">
            <Card m={finalM} gold />
          </div>
        </div>

        <Col matches={rightSF}  spm={8} label={LABELS.sf}  cl cr />
        <Col matches={rightQF}  spm={4} label={LABELS.qf}  cl cr />
        <Col matches={rightR16} spm={2} label={LABELS.r16} cl cr />
        <Col matches={rightR32} spm={1} label={LABELS.r32} cl />
      </div>

      {/* ── Third place ── */}
      <div className="mt-5 flex flex-col items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          🥉 Tercer y cuarto puesto
        </span>
        <Card m={thirdM} />
      </div>

      {/* ── Legend ── */}
      <div className="mt-4 flex items-center gap-4 text-[10px] text-gray-500 justify-center flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-900 inline-block border border-green-700" />
          Ganador predicho
        </span>
        <span className="flex items-center gap-1">
          <span className="text-yellow-400 text-[10px]">(n)</span>
          Ganó en penaltis
        </span>
        <span className="flex items-center gap-1 italic text-gray-600">─ = equipo pendiente</span>
      </div>
    </div>
  );
}
