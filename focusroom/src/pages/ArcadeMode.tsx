import React from 'react'
import { Gamepad2, Play, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Sidebar } from '../components/Sidebar'

const games = [
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'Classic 9x9 number puzzle. Red highlights on errors.',
    icon: Trophy,
    path: '/arcade-mode/sudoku',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'queens',
    title: 'Queens',
    description: 'Place exactly 1 Queen per row, column, and colored region.',
    icon: Gamepad2,
    path: '/arcade-mode/queens',
    color: 'from-pink-500 to-rose-500',
  },
]

export function ArcadeModePage() {
  return (
    <div className="flex min-h-screen w-full bg-[var(--bg)] text-[var(--text)]">
      <Sidebar />
      <main className="ml-72 flex w-full flex-col items-center p-8">
        <header className="mb-8 flex w-full max-w-4xl items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] px-6 py-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Arcade Menu</h1>
              <p className="text-sm text-[var(--muted)]">Choose a game to sharpen your mind during breaks.</p>
            </div>
          </div>
        </header>

        <div className="w-full max-w-4xl grid gap-6 sm:grid-cols-2">
          {games.map((game) => {
            const Icon = game.icon
            return (
              <div
                key={game.id}
                className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-all hover:shadow-[var(--card-glow)] hover:-translate-y-1"
              >
                <div
                  className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${game.color} opacity-20 blur-xl transition-opacity group-hover:opacity-40`}
                />
                <Icon className="mb-4 h-8 w-8 text-[var(--accent)]" />
                <h3 className="mb-2 font-display text-xl font-bold">{game.title}</h3>
                <p className="mb-6 text-sm text-[var(--muted)]">{game.description}</p>
                <Link
                  to={game.path}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  <Play className="h-4 w-4" /> Play Now
                </Link>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
