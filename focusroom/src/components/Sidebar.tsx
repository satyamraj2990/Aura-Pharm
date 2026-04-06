import { Bot, CalendarCheck2, DoorOpen, Gamepad2, Gauge, GraduationCap, LogOut, Trophy } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

import { logout } from '../services/auth'

const navItems = [
  { label: 'Dashboard', subtitle: 'Overview', icon: Gauge, to: '/dashboard' },
  { label: 'Study Planner', subtitle: 'Plan sessions', icon: CalendarCheck2, to: '/study-planner' },
  { label: 'Smart Room', subtitle: 'Join sessions', icon: DoorOpen, to: '/smart-room' },
  { label: 'Nearby Educators', subtitle: 'Find mentors', icon: GraduationCap, to: '/nearby-educators' },
  { label: 'Analytics an Leaderboard', subtitle: 'Progress + ranks', icon: Trophy, to: '/analytics-leaderboard' },
  { label: 'Ai Assistant', subtitle: 'Study copilot', icon: Bot, to: '/ai-assistant' },
  { label: 'Arcade Mode', subtitle: 'Focus challenges', icon: Gamepad2, to: '/arcade-mode' },
]

export function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-700/50 bg-slate-900/95 backdrop-blur-xl px-4 pb-4 pt-5 shadow-2xl">
      <div className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-3 shadow-lg">
        <h2 className="font-display text-xl font-semibold text-cyan-300">Satyam</h2>
        <p className="text-xs text-slate-300">Premium • Verified</p>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
            <span>Health Score</span>
            <span className="font-semibold text-emerald-300">91%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-700/60">
            <div className="h-full w-[91%] rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-sm" />
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end
              className={({ isActive }) =>
                [
                  'group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-white shadow-lg shadow-cyan-500/10 border border-cyan-400/30'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:shadow-md',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 opacity-0 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'group-hover:opacity-50'}`} />
                  <span className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-lg' : 'bg-slate-800/50 group-hover:bg-slate-700/70'}`}>
                    <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  </span>
                  <span className="relative leading-tight">
                    <span className={`block font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'group-hover:text-white'}`}>{item.label}</span>
                    <span className={`text-xs opacity-80 transition-colors duration-300 ${isActive ? 'text-cyan-100' : 'text-slate-400 group-hover:text-slate-300'}`}>{item.subtitle}</span>
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 inline-flex w-full items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm text-red-100 transition-all duration-300 hover:bg-red-500/20 hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/10 backdrop-blur-sm"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </aside>
  )
}
