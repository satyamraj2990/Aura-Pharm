import { TrendingUp, Clock, Flame, Target } from 'lucide-react'

export function Analytics() {
  // Mock user stats - in real app, fetch from sessions
  const userStats = {
    totalHours: 45,
    totalSessions: 32,
    currentStreak: 7,
    weeklyGoal: 50, // hours
    weeklyProgress: 35,
  }

  const progressPercentage = (userStats.weeklyProgress / userStats.weeklyGoal) * 100

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-300/15 bg-[#081833] p-5">
        <h2 className="mb-4 text-lg font-semibold text-cyan-200">Your Analytics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-[#0a1a2e] p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-slate-400">Total Hours</span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-100">{userStats.totalHours}h</p>
          </div>
          <div className="rounded-lg bg-[#0a1a2e] p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-slate-400">Sessions</span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-100">{userStats.totalSessions}</p>
          </div>
          <div className="rounded-lg bg-[#0a1a2e] p-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-slate-400">Current Streak</span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-100">{userStats.currentStreak} days</p>
          </div>
          <div className="rounded-lg bg-[#0a1a2e] p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm text-slate-400">Weekly Progress</span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-100">{userStats.weeklyProgress}/{userStats.weeklyGoal}h</p>
            <div className="mt-2 h-2 rounded-full bg-slate-700">
              <div
                className="h-2 rounded-full bg-cyan-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}