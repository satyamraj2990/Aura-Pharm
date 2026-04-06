import { motion } from 'framer-motion'

type SkeletonProps = {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string
  height?: string
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
}: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-slate-700/50 animate-pulse'

  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  }

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse' }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-xl">
      <Skeleton variant="text" height="1.5rem" width="60%" className="mb-3" />
      <Skeleton variant="text" height="1rem" width="100%" className="mb-2" />
      <Skeleton variant="text" height="1rem" width="80%" className="mb-4" />
      <div className="flex items-center gap-2 mb-4">
        <Skeleton variant="circular" width="2rem" height="2rem" />
        <Skeleton variant="text" height="0.75rem" width="4rem" />
      </div>
      <Skeleton variant="rectangular" height="2.5rem" width="100%" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-5">
        <Skeleton variant="text" height="2rem" width="12rem" className="mb-2" />
        <Skeleton variant="text" height="0.875rem" width="20rem" />
      </div>

      {/* Main content skeleton */}
      <div className="rounded-3xl border border-slate-700/50 bg-slate-800/30 p-5">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-4 mb-6">
          <Skeleton variant="text" height="1.5rem" width="12rem" className="mb-3" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" width="2rem" height="2rem" />
              <div className="flex-1">
                <Skeleton variant="text" height="1rem" width="100%" className="mb-1" />
                <Skeleton variant="text" height="0.75rem" width="80%" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" width="2rem" height="2rem" />
              <div className="flex-1">
                <Skeleton variant="text" height="1rem" width="100%" className="mb-1" />
                <Skeleton variant="text" height="0.75rem" width="80%" />
              </div>
            </div>
          </div>
        </div>

        <Skeleton variant="text" height="2rem" width="10rem" className="mb-4" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-600/50 p-4">
              <div className="flex items-start justify-between gap-3 mb-4">
                <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
                <Skeleton variant="rectangular" width="3rem" height="1.25rem" className="rounded-full" />
              </div>
              <Skeleton variant="text" height="1.125rem" width="100%" className="mb-1" />
              <Skeleton variant="text" height="0.875rem" width="90%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}