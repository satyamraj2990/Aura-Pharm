export const normalizeSiteInput = (value: string): string | null => {
  const candidate = value.trim()
  if (!candidate) {
    return null
  }

  const withScheme = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`

  try {
    const parsed = new URL(withScheme)
    if (!parsed.hostname) {
      return null
    }

    parsed.hash = ''
    return parsed.toString()
  } catch {
    return null
  }
}

export const dedupeSites = (sites: string[]): string[] => {
  const seen = new Set<string>()
  const next: string[] = []

  for (const site of sites) {
    const normalized = normalizeSiteInput(site)
    if (!normalized) {
      continue
    }

    const key = normalized.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    next.push(normalized)
  }

  return next
}

export const isAllowedUrl = (url: string, allowedSites: string[]): boolean => {
  if (!url || allowedSites.length === 0) {
    return false
  }

  let target: URL
  try {
    target = new URL(url)
  } catch {
    return false
  }

  return allowedSites.some((site) => {
    const normalized = normalizeSiteInput(site)
    if (!normalized) {
      return false
    }

    try {
      const allowed = new URL(normalized)
      return target.href.includes(allowed.hostname) || target.hostname === allowed.hostname || target.hostname.endsWith(`.${allowed.hostname}`)
    } catch {
      return false
    }
  })
}

export const formatRemaining = (remainingMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
