import type {
  MatchPrediction, MatchResult, PointsConfig,
  ExtraPrediction, GroupMatch, KnockoutMatch, StandingEntry, User
} from '@/types';
import { calcGroupStandings, resolveKnockoutSlot } from './brackets';

function getMatchWinner(home: number, away: number, hp?: number, ap?: number): 'home' | 'away' | 'draw' {
  if (home > away) return 'home';
  if (away > home) return 'away';
  if (hp !== undefined && ap !== undefined) return hp > ap ? 'home' : 'away';
  return 'draw';
}

export function calcMatchPoints(
  pred: MatchPrediction,
  result: MatchResult,
  cfg: PointsConfig
): number {
  let pts = 0;
  const predWinner = getMatchWinner(pred.homeScore, pred.awayScore, pred.homePenalties, pred.awayPenalties);
  const realWinner = getMatchWinner(result.homeScore, result.awayScore, result.homePenalties, result.awayPenalties);

  if (predWinner === realWinner) pts += cfg.correctWinner;

  if (
    pred.homeScore === result.homeScore &&
    pred.awayScore === result.awayScore &&
    (pred.homePenalties ?? undefined) === (result.homePenalties ?? undefined) &&
    (pred.awayPenalties ?? undefined) === (result.awayPenalties ?? undefined)
  ) {
    pts += cfg.exactScore;
  }

  return pts;
}

export function calcUserPoints(
  user: User,
  userPrediction: MatchPrediction[],
  extraPrediction: ExtraPrediction | undefined,
  results: MatchResult[],
  groupMatches: GroupMatch[],
  knockoutMatches: KnockoutMatch[],
  cfg: PointsConfig
): StandingEntry {
  const predMap = new Map(userPrediction.map(p => [p.matchId, p]));
  const resultMap = new Map(results.filter(r => r.played).map(r => [r.matchId, r]));
  const knockoutPredMap = new Map(
    knockoutMatches.map(km => {
      const pred = predMap.get(km.id);
      return [km.id, pred] as [string, MatchPrediction | undefined];
    }).filter(([, v]) => v !== undefined) as [string, MatchPrediction][]
  );

  let groupWinner = 0;
  let exactScore = 0;
  let exactPosition = 0;
  let advancesGroup = 0;
  let advancesKnockout = 0;
  let champion = 0;
  let mvp = 0;
  let topScorer = 0;

  // Group stage points
  for (const match of groupMatches) {
    const pred = predMap.get(match.id);
    const result = resultMap.get(match.id);
    if (!pred || !result) continue;

    const pts = calcMatchPoints(pred, result, cfg);
    const predWinner = getMatchWinner(pred.homeScore, pred.awayScore);
    const realWinner = getMatchWinner(result.homeScore, result.awayScore);
    if (predWinner === realWinner) groupWinner += cfg.correctWinner;
    if (pts > cfg.correctWinner) exactScore += cfg.exactScore;
  }

  // Group advancement points — only when all group matches have results
  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  for (const g of groups) {
    const gMatchIds = groupMatches.filter(m => m.group === g).map(m => m.id);
    if (!gMatchIds.every(id => resultMap.has(id))) continue;

    const predStandings = calcGroupStandings(g, groupMatches, userPrediction);
    const realStandings = calcGroupStandings(g, groupMatches,
      groupMatches.map(m => {
        const r = resultMap.get(m.id);
        if (!r) return null;
        return { matchId: m.id, homeScore: r.homeScore, awayScore: r.awayScore } as MatchPrediction;
      }).filter(Boolean) as MatchPrediction[]
    );

    const predAdvanced = new Set([predStandings[0]?.teamId, predStandings[1]?.teamId]);
    const realAdvanced = new Set([realStandings[0]?.teamId, realStandings[1]?.teamId]);

    for (const team of predAdvanced) {
      if (team && realAdvanced.has(team)) advancesGroup += cfg.advancesGroup;
    }

    // Exact position scoring
    const posPts = [cfg.exactPos1, cfg.exactPos2, cfg.exactPos3, cfg.exactPos4];
    for (let pos = 0; pos < 4; pos++) {
      if (posPts[pos] > 0 && predStandings[pos]?.teamId && predStandings[pos].teamId === realStandings[pos]?.teamId) {
        exactPosition += posPts[pos];
      }
    }
  }

  // Knockout stage points
  const knockoutStages: Array<KnockoutMatch['stage']> = ['r32', 'r16', 'qf', 'sf', 'third', 'final'];
  for (const stage of knockoutStages) {
    const stageMatches = knockoutMatches.filter(m => m.stage === stage);
    for (const match of stageMatches) {
      const pred = predMap.get(match.id);
      const result = resultMap.get(match.id);
      if (!pred || !result) continue;

      const pts = calcMatchPoints(pred, result, cfg);
      const predWinner = getMatchWinner(pred.homeScore, pred.awayScore, pred.homePenalties, pred.awayPenalties);
      const realWinner = getMatchWinner(result.homeScore, result.awayScore, result.homePenalties, result.awayPenalties);
      if (predWinner === realWinner) groupWinner += cfg.correctWinner;
      if (pts > cfg.correctWinner) exactScore += cfg.exactScore;

      // Who advances from this knockout match
      const predWinnerTeam = resolveKnockoutSlot(
        predWinner === 'home' ? match.homeSlot : match.awaySlot,
        groupMatches, userPrediction, knockoutPredMap
      );
      const realResultPred: MatchPrediction = {
        matchId: match.id,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        homePenalties: result.homePenalties,
        awayPenalties: result.awayPenalties,
      };
      const realKnockoutPredMap = new Map(
        knockoutMatches.map(km => {
          const r = resultMap.get(km.id);
          if (!r) return null;
          return [km.id, { matchId: km.id, homeScore: r.homeScore, awayScore: r.awayScore, homePenalties: r.homePenalties, awayPenalties: r.awayPenalties } as MatchPrediction];
        }).filter(Boolean) as [string, MatchPrediction][]
      );
      const realResultsAsPreds = groupMatches.map(m => {
        const r = resultMap.get(m.id);
        if (!r) return null;
        return { matchId: m.id, homeScore: r.homeScore, awayScore: r.awayScore } as MatchPrediction;
      }).filter(Boolean) as MatchPrediction[];

      const realWinnerSlot = realWinner === 'home' ? match.homeSlot : match.awaySlot;
      const realWinnerTeam = resolveKnockoutSlot(realWinnerSlot, groupMatches, realResultsAsPreds, realKnockoutPredMap);

      if (predWinnerTeam && realWinnerTeam && predWinnerTeam === realWinnerTeam) {
        advancesKnockout += cfg.advancesKnockout;
      }
    }
  }

  // Extra predictions
  if (extraPrediction) {
    const finalResult = resultMap.get('FINAL');
    if (finalResult) {
      const realKnockoutPredMap = new Map(
        knockoutMatches.map(km => {
          const r = resultMap.get(km.id);
          if (!r) return null;
          return [km.id, { matchId: km.id, homeScore: r.homeScore, awayScore: r.awayScore, homePenalties: r.homePenalties, awayPenalties: r.awayPenalties } as MatchPrediction];
        }).filter(Boolean) as [string, MatchPrediction][]
      );
      const realResultsAsPreds = groupMatches.map(m => {
        const r = resultMap.get(m.id);
        if (!r) return null;
        return { matchId: m.id, homeScore: r.homeScore, awayScore: r.awayScore } as MatchPrediction;
      }).filter(Boolean) as MatchPrediction[];

      const realWinner = getMatchWinner(finalResult.homeScore, finalResult.awayScore, finalResult.homePenalties, finalResult.awayPenalties);
      const finalMatch = knockoutMatches.find(m => m.id === 'FINAL')!;
      const realChampSlot = realWinner === 'home' ? finalMatch.homeSlot : finalMatch.awaySlot;
      const realChamp = resolveKnockoutSlot(realChampSlot, groupMatches, realResultsAsPreds, realKnockoutPredMap);

      if (realChamp && extraPrediction.champion === realChamp) champion += cfg.correctChampion;
    }

    // MVP and top scorer require admin to have recorded them separately
    // They will be compared to the stored extra_results when implemented
  }

  const totalPoints = groupWinner + exactScore + exactPosition + advancesGroup + advancesKnockout + champion + mvp + topScorer;

  return {
    userId: user.id,
    userName: user.name,
    totalPoints,
    breakdown: { groupWinner, exactScore, exactPosition, advancesGroup, advancesKnockout, champion, mvp, topScorer },
  };
}
