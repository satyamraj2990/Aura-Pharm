import { motion } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'

type SidebarFeaturePageProps = {
  title: string
  description: string
}

export function SidebarFeaturePage({ title, description }: SidebarFeaturePageProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <Sidebar />

      <main className="ml-72 p-6">
        <header className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-5 shadow-lg">
          <h1 className="font-display text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-slate-300">{description}</p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-5 shadow-lg transition-all duration-300 hover:border-slate-600/50 hover:bg-slate-800/50"
          >
            <h2 className="text-base font-semibold text-cyan-200">Live Module</h2>
            <p className="mt-2 text-sm text-slate-300">
              This section is active and route-isolated, so sidebar highlighting will not overlap with other items.
            </p>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-5 shadow-lg transition-all duration-300 hover:border-slate-600/50 hover:bg-slate-800/50"
          >
            <h2 className="text-base font-semibold text-cyan-200">Next Upgrade</h2>
            <p className="mt-2 text-sm text-slate-300">
              Add custom widgets, data sources, and actions specific to this sidebar feature.
            </p>
          </motion.article>
        </section>
      </main>
    </div>
  )
}
