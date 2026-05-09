'use client';

import teamsData from '@/data/teams.json';
import matchesData from '@/data/matches.json';
import type { MatchPrediction } from '@/types';
import { calcGroupStandings } from '@/lib/brackets';

const teamMap = Object.fromEntries(teamsData.map(t => [t.id, { name: t.name, flag: t.flag }]));
const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

function GroupTable({ groupId, predictions }: { groupId: string; predictions: MatchPrediction[] }) {
  const groupMatches = matchesData.groups.filter(m => m.group === groupId);
  const standings = calcGroupStandings(groupId, groupMatches as never, predictions);
  const predMap = new Map(predictions.map(p => [p.matchId, p]));

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

      {/* Standings table */}
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

      {/* Match results */}
      <div className="divide-y divide-gray-50">
        {[1, 2, 3].map(day => {
          const dayMatches = groupMatches.filter(m => m.matchday === day);
          return (
            <div key={day} className="px-3 py-1.5">
              <div className="text-xs text-gray-400 mb-1">Jornada {day}</div>
              {dayMatches.map(m => {
                const pred = predMap.get(m.id);
                const ht = teamMap[m.home];
                const at = teamMap[m.away];
                return (
                  <div key={m.id} className="flex items-center text-xs py-0.5 gap-1">
                    <span className="flex-1 text-right flex items-center justify-end gap-1 min-w-0">
                      <span className="truncate text-gray-700">{ht?.name}</span>
                      <span className="flex-shrink-0">{ht?.flag}</span>
                    </span>
                    <div className="flex flex-col items-center flex-shrink-0 w-16">
                      <span className={`font-bold ${pred ? 'text-gray-800' : 'text-gray-300'}`}>
                        {pred ? `${pred.homeScore} – ${pred.awayScore}` : '– –'}
                      </span>
                      {'datetime' in m && m.datetime && (
                        <span className="text-[10px] text-gray-400 leading-none">
                          {new Date(m.datetime).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <span className="flex-1 flex items-center gap-1 min-w-0">
                      <span className="flex-shrink-0">{at?.flag}</span>
                      <span className="truncate text-gray-700">{at?.name}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GroupStandingsView({ predictions }: { predictions: MatchPrediction[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {GROUPS.map(g => (
        <GroupTable key={g} groupId={g} predictions={predictions} />
      ))}
    </div>
  );
}
