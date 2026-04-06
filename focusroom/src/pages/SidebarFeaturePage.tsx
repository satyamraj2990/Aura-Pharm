import { Sidebar } from '../components/Sidebar'
import { Analytics } from '../components/Analytics'
import { Leaderboard } from '../components/Leaderboard'

type SidebarFeaturePageProps = {
  title: string
  description: string
}

export function SidebarFeaturePage({ title, description }: SidebarFeaturePageProps) {
  return (
    <div className="min-h-screen w-full bg-[#020b1f] text-slate-100">
      <Sidebar />

      <main className="ml-72 p-6">
        <header className="mb-6 rounded-2xl border border-cyan-300/15 bg-[#081833] p-5">
          <h1 className="font-display text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-slate-300">{description}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Analytics />
          <Leaderboard />
        </div>
      </main>
    </div>
  )
}
