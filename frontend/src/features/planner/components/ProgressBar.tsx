type ProgressBarProps = {
  completedDuration: number
  dailyGoal: number
  progressPercent: number
}

export function ProgressBar({ completedDuration, dailyGoal, progressPercent }: ProgressBarProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)]/80 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold tracking-[0.01em] text-[var(--text)]">Daily Progress</span>
        <span className="text-[var(--accent)]">{completedDuration} / {dailyGoal} min</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full bg-[var(--text)] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">{progressPercent}% of daily goal completed</p>
    </div>
  )
}
