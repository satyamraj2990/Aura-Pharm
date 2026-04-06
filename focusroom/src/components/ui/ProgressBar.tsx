import { motion } from 'framer-motion'

type CircularProgressProps = {
  progress: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
  children?: React.ReactNode
}

export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 8,
  className = '',
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-700/30"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-cyan-400"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}

type LinearProgressProps = {
  progress: number // 0-100
  height?: number
  className?: string
  showPercentage?: boolean
}

export function LinearProgress({
  progress,
  height = 8,
  className = '',
  showPercentage = false,
}: LinearProgressProps) {
  return (
    <div className={`w-full ${className}`}>
      <div
        className="w-full bg-slate-700/30 rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>
      {showPercentage && (
        <div className="text-center mt-2 text-sm text-slate-300">
          {Math.round(progress)}% Complete
        </div>
      )}
    </div>
  )
}