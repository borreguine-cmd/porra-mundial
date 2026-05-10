export interface Team {
  id: string;
  name: string;
  flag: string;
  group: string;
}

export interface GroupMatch {
  id: string;
  stage: 'group';
  group: string;
  matchday: number;
  home: string;
  away: string;
  datetime: string; // ISO UTC, e.g. "2026-06-11T20:00:00Z"
}

export interface KnockoutMatch {
  id: string;
  stage: 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';
  homeSlot: string;
  awaySlot: string;
}

export type Match = GroupMatch | KnockoutMatch;

export interface MatchPrediction {
  matchId: string;
  homeScore: number;
  awayScore: number;
  homePenalties?: number;
  awayPenalties?: number;
}

export interface Prediction {
  userId: string;
  matches: MatchPrediction[];
}

export interface ExtraPrediction {
  userId: string;
  champion: string;
  mvp: string;
  topScorer: string;
}

export interface User {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  homePenalties?: number;
  awayPenalties?: number;
  played: boolean;
}

export interface PointsConfig {
  correctWinner: number;
  exactScore: number;
  advancesGroup: number;
  advancesKnockout: number;
  correctChampion: number;
  correctMVP: number;
  correctTopScorer: number;
  exactPos1: number;
  exactPos2: number;
  exactPos3: number;
  exactPos4: number;
}

export interface AppConfig {
  inviteToken: string;
  adminPassword: string;
  deadline: string | null;
  points: PointsConfig;
}

export interface GroupStanding {
  teamId: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
}

export interface StandingEntry {
  userId: string;
  userName: string;
  totalPoints: number;
  breakdown: {
    groupWinner: number;
    exactScore: number;
    exactPosition: number;
    advancesGroup: number;
    advancesKnockout: number;
    champion: number;
    mvp: number;
    topScorer: number;
  };
}
