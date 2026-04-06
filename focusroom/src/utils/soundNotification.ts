// Sound notification utility for focus room timer
export class SoundNotification {
  private static audioContext: AudioContext | null = null

  private static initAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  // Play a gentle bell sound for session completion
  static async playSessionComplete() {
    try {
      this.initAudioContext()
      if (!this.audioContext) return

      // Create oscillator for bell-like sound
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Bell-like frequency sweep
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.5)

      // Gentle volume envelope
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.5)
    } catch (error) {
      console.warn('Could not play session complete sound:', error)
      // Fallback to system notification if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Session Complete!', {
          body: 'Great work! Your focus session has ended.',
          icon: '/favicon.ico',
        })
      }
    }
  }

  // Play a subtle tick sound for timer updates (optional)
  static async playTick() {
    try {
      this.initAudioContext()
      if (!this.audioContext) return

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.1)
    } catch {
      // Silently fail for tick sounds
    }
  }

  // Request notification permission
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false

    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
}