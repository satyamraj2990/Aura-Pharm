import { Trophy, Medal, Award } from 'lucide-react'
import { mockLeaderboard } from '../mock/leaderboard'

export function Leaderboard() {
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-[#081833] p-5">
      <h2 className="mb-4 text-lg font-semibold text-cyan-200">Global Leaderboard</h2>
      <div className="space-y-3">
        {mockLeaderboard.map((entry) => (
          <div
            key={entry.rank}
            className="flex items-center justify-between rounded-lg bg-[#0a1a2e] p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
                {entry.rank <= 3 ? (
                  entry.rank === 1 ? (
                    <Trophy className="h-4 w-4 text-yellow-400" />
                  ) : entry.rank === 2 ? (
                    <Medal className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Award className="h-4 w-4 text-amber-600" />
                  )
                ) : (
                  entry.rank
                )}
              </div>
              <div>
                <p className="font-medium text-slate-100">{entry.name}</p>
                <p className="text-xs text-slate-400">
                  {entry.sessions} sessions • {entry.streak} day streak
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-cyan-300">{entry.totalHours}h</p>
              <p className="text-xs text-slate-400">total focus</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}