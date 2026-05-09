import type { GroupMatch, GroupStanding, MatchPrediction } from '@/types';

export function calcGroupStandings(
  groupId: string,
  groupMatches: GroupMatch[],
  predictions: MatchPrediction[]
): GroupStanding[] {
  const predMap = new Map(predictions.map(p => [p.matchId, p]));
  const standings = new Map<string, GroupStanding>();

  const initTeam = (id: string): GroupStanding => ({
    teamId: id, points: 0, played: 0, won: 0, drawn: 0, lost: 0,
    goalsFor: 0, goalsAgainst: 0, goalDiff: 0,
  });

  for (const m of groupMatches.filter(m => m.group === groupId)) {
    if (!standings.has(m.home)) standings.set(m.home, initTeam(m.home));
    if (!standings.has(m.away)) standings.set(m.away, initTeam(m.away));

    const pred = predMap.get(m.id);
    if (pred === undefined) continue;

    const h = standings.get(m.home)!;
    const a = standings.get(m.away)!;
    const { homeScore: hs, awayScore: as_ } = pred;

    h.played++; a.played++;
    h.goalsFor += hs; h.goalsAgainst += as_;
    a.goalsFor += as_; a.goalsAgainst += hs;

    if (hs > as_) {
      h.won++; h.points += 3; a.lost++;
    } else if (hs < as_) {
      a.won++; a.points += 3; h.lost++;
    } else {
      h.drawn++; h.points += 1; a.drawn++; a.points += 1;
    }

    h.goalDiff = h.goalsFor - h.goalsAgainst;
    a.goalDiff = a.goalsFor - a.goalsAgainst;
  }

  return [...standings.values()].sort((a, b) =>
    b.points - a.points ||
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor
  );
}

export function resolveKnockoutSlot(
  slot: string,
  groupMatches: GroupMatch[],
  predictions: MatchPrediction[],
  knockoutPredMap: Map<string, MatchPrediction>
): string | null {
  // Group slots: "1A", "2B", etc.
  const groupSlot = slot.match(/^([1-4])([A-L])$/);
  if (groupSlot) {
    const pos = parseInt(groupSlot[1]) - 1;
    const groupId = groupSlot[2];
    const standings = calcGroupStandings(groupId, groupMatches, predictions);
    return standings[pos]?.teamId ?? null;
  }

  // 3rd place best teams: "3rd_best_1" through "3rd_best_8"
  const thirdSlot = slot.match(/^3rd_best_(\d+)$/);
  if (thirdSlot) {
    const idx = parseInt(thirdSlot[1]) - 1;
    const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    const thirds = groups.map(g => {
      const standings = calcGroupStandings(g, groupMatches, predictions);
      return standings[2];
    }).filter(Boolean) as GroupStanding[];

    thirds.sort((a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor
    );

    return thirds[idx]?.teamId ?? null;
  }

  // Knockout winner: "W_R32_1", "W_R16_3", "W_QF_2", "W_SF_1"
  const winnerSlot = slot.match(/^W_(.+)$/);
  if (winnerSlot) {
    const matchId = winnerSlot[1];
    const pred = knockoutPredMap.get(matchId);
    if (!pred) return null;

    const homeTeam = resolveKnockoutSlot(
      getKnockoutMatchSlot(matchId, 'home'),
      groupMatches, predictions, knockoutPredMap
    );
    const awayTeam = resolveKnockoutSlot(
      getKnockoutMatchSlot(matchId, 'away'),
      groupMatches, predictions, knockoutPredMap
    );

    const { homeScore: hs, awayScore: as_, homePenalties: hp, awayPenalties: ap } = pred;
    if (hs > as_) return homeTeam;
    if (hs < as_) return awayTeam;
    if (hp !== undefined && ap !== undefined) {
      return hp > ap ? homeTeam : awayTeam;
    }
    return homeTeam; // default
  }

  // Knockout loser (for 3rd place match)
  const loserSlot = slot.match(/^L_(.+)$/);
  if (loserSlot) {
    const matchId = loserSlot[1];
    const pred = knockoutPredMap.get(matchId);
    if (!pred) return null;

    const homeTeam = resolveKnockoutSlot(
      getKnockoutMatchSlot(matchId, 'home'),
      groupMatches, predictions, knockoutPredMap
    );
    const awayTeam = resolveKnockoutSlot(
      getKnockoutMatchSlot(matchId, 'away'),
      groupMatches, predictions, knockoutPredMap
    );

    const { homeScore: hs, awayScore: as_, homePenalties: hp, awayPenalties: ap } = pred;
    if (hs > as_) return awayTeam;
    if (hs < as_) return homeTeam;
    if (hp !== undefined && ap !== undefined) {
      return hp > ap ? awayTeam : homeTeam;
    }
    return awayTeam;
  }

  return null;
}

// Returns the slot string for a given side of a knockout match
function getKnockoutMatchSlot(matchId: string, side: 'home' | 'away'): string {
  const slots: Record<string, { home: string; away: string }> = {
    R32_1:  { home: '1A',        away: '2B'        },
    R32_2:  { home: '1B',        away: '2A'        },
    R32_3:  { home: '1C',        away: '2D'        },
    R32_4:  { home: '1D',        away: '2C'        },
    R32_5:  { home: '1E',        away: '2F'        },
    R32_6:  { home: '1F',        away: '2E'        },
    R32_7:  { home: '1G',        away: '2H'        },
    R32_8:  { home: '1H',        away: '2G'        },
    R32_9:  { home: '1I',        away: '2J'        },
    R32_10: { home: '1J',        away: '2I'        },
    R32_11: { home: '1K',        away: '2L'        },
    R32_12: { home: '1L',        away: '2K'        },
    R32_13: { home: '3rd_best_1',away: '3rd_best_2'},
    R32_14: { home: '3rd_best_3',away: '3rd_best_4'},
    R32_15: { home: '3rd_best_5',away: '3rd_best_6'},
    R32_16: { home: '3rd_best_7',away: '3rd_best_8'},
    R16_1:  { home: 'W_R32_1',   away: 'W_R32_2'  },
    R16_2:  { home: 'W_R32_3',   away: 'W_R32_4'  },
    R16_3:  { home: 'W_R32_5',   away: 'W_R32_6'  },
    R16_4:  { home: 'W_R32_7',   away: 'W_R32_8'  },
    R16_5:  { home: 'W_R32_9',   away: 'W_R32_10' },
    R16_6:  { home: 'W_R32_11',  away: 'W_R32_12' },
    R16_7:  { home: 'W_R32_13',  away: 'W_R32_14' },
    R16_8:  { home: 'W_R32_15',  away: 'W_R32_16' },
    QF_1:   { home: 'W_R16_1',   away: 'W_R16_2'  },
    QF_2:   { home: 'W_R16_3',   away: 'W_R16_4'  },
    QF_3:   { home: 'W_R16_5',   away: 'W_R16_6'  },
    QF_4:   { home: 'W_R16_7',   away: 'W_R16_8'  },
    SF_1:   { home: 'W_QF_1',    away: 'W_QF_2'   },
    SF_2:   { home: 'W_QF_3',    away: 'W_QF_4'   },
    '3RD':  { home: 'L_SF_1',    away: 'L_SF_2'   },
    FINAL:  { home: 'W_SF_1',    away: 'W_SF_2'   },
  };
  return slots[matchId]?.[side] ?? '';
}
