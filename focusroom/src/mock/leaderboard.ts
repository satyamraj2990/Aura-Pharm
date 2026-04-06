export type LeaderboardEntry = {
  rank: number
  name: string
  totalHours: number
  sessions: number
  streak: number
}

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Alex Chen', totalHours: 127, sessions: 89, streak: 12 },
  { rank: 2, name: 'Sarah Kim', totalHours: 115, sessions: 76, streak: 8 },
  { rank: 3, name: 'Marcus Rodriguez', totalHours: 108, sessions: 92, streak: 15 },
  { rank: 4, name: 'Emma Thompson', totalHours: 95, sessions: 68, streak: 6 },
  { rank: 5, name: 'David Park', totalHours: 87, sessions: 71, streak: 9 },
  { rank: 6, name: 'Lisa Wang', totalHours: 82, sessions: 59, streak: 4 },
  { rank: 7, name: 'James Wilson', totalHours: 78, sessions: 85, streak: 11 },
  { rank: 8, name: 'Maria Garcia', totalHours: 74, sessions: 63, streak: 7 },
  { rank: 9, name: 'Robert Lee', totalHours: 69, sessions: 57, streak: 5 },
  { rank: 10, name: 'Anna Patel', totalHours: 65, sessions: 52, streak: 3 },
]