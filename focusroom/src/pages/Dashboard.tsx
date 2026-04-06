import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Camera,
  FileText,
  MessageCircle,
  Mic,
  Moon,
  Phone,
  Search,
  Video,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { Sidebar } from '../components/Sidebar'

const quickActions = [
  {
    sidebarLabel: 'Smart Room',
    label: 'Start Focus Session',
    description: 'Jump into a live focus room',
    icon: Camera,
    to: '/smart-room',
  },
  {
    sidebarLabel: 'Smart Room',
    label: 'Explore Rooms',
    description: 'Find rooms by intensity and topic',
    icon: Search,
    to: '/smart-room',
  },
  {
    sidebarLabel: 'Study Planner',
    label: 'Plan Sprint',
    description: 'Set your next deep-work block',
    icon: CalendarDays,
    to: '/study-planner',
  },
  {
    sidebarLabel: 'Ai Assistant',
    label: 'AI Coach',
    description: 'Get personalized focus guidance',
    icon: MessageCircle,
    to: '/ai-assistant',
  },
  {
    sidebarLabel: 'Analytics an Leaderboard',
    label: 'Session Records',
    description: 'View your duration and consistency logs',
    icon: FileText,
    to: '/analytics-leaderboard',
  },
  {
    sidebarLabel: 'Ai Assistant',
    label: 'Focus Chat',
    description: 'Stay accountable with your room',
    icon: Mic,
    to: '/ai-assistant',
  },
  {
    sidebarLabel: 'Nearby Educators',
    label: 'Mentor Call',
    description: 'Call support for study planning',
    icon: Phone,
    to: '/nearby-educators',
  },
  {
    sidebarLabel: 'Arcade Mode',
    label: 'Group Session',
    description: 'Multi-user accountability room',
    icon: Video,
    to: '/arcade-mode',
  },
]

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--text)]">
      <Sidebar />

      <main className="ml-72 p-6">
        <header className="mb-5 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] px-5 py-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-[var(--muted)]">Welcome back, Satyam • {user?.email ?? 'satyam@focusroom.app'}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white/5 text-[var(--text)]"
          >
            <Moon className="h-4 w-4" />
          </button>
        </header>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-4">
            <h2 className="text-lg font-semibold">Recent Focus Activity</h2>
            <ul className="mt-3 space-y-3 text-sm text-[var(--muted)]">
              <li className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20 text-pink-300">
                  <Camera className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-[var(--text)]">Completed Neural Recall deck</p>
                  <p className="text-xs text-[var(--muted)]">2 days ago • 24 flashcards mastered</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                  <Bell className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-[var(--text)]">Smart room checkpoint alert</p>
                  <p className="text-xs text-[var(--muted)]">3 days ago • Maintained 42-minute focus run</p>
                </div>
              </li>
            </ul>
          </div>

          <h2 className="mb-3 mt-5 text-2xl font-semibold">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              const gradients = [
                'from-pink-500 to-rose-400',
                'from-cyan-500 to-teal-400',
                'from-emerald-500 to-teal-400',
                'from-blue-500 to-violet-500',
                'from-sky-500 to-indigo-500',
                'from-fuchsia-500 to-violet-500',
                'from-teal-500 to-emerald-500',
                'from-amber-500 to-orange-500',
              ]

              return (
                <Link
                  key={action.label}
                  to={action.to}
                  className={`group rounded-2xl bg-gradient-to-br ${gradients[index]} p-4 text-white transition-transform duration-200 hover:-translate-y-1`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/80">
                      {action.sidebarLabel}
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold leading-tight">{action.label}</h3>
                  <p className="mt-1 text-sm text-white/85">{action.description}</p>
                </Link>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
