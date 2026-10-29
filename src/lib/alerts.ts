/** Gentle end-of-phase alerts: a synthesized chime and an optional browser notification. */

let ctx: AudioContext | null = null

/** A soft two-note bell. Uses Web Audio, so no sound files are needed. */
export function playChime() {
  try {
    ctx ??= new AudioContext()
    const now = ctx.currentTime
    for (const [i, freq] of [659.25, 987.77].entries()) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = now + i * 0.22
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.4)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 1.5)
    }
  } catch {
    // Audio isn't available (or is blocked); the on-screen change is enough.
  }
}

/** Ask once, from a user action such as pressing Start. Saying no is fine. */
export function requestNotifications() {
  if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission()
  // Create the audio context during the click so browsers allow the chime later.
  try {
    ctx ??= new AudioContext()
    void ctx.resume()
  } catch {
    // ignore
  }
}

/** Shows a notification only when the page is in the background and permission was granted. */
export function notify(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return
  try {
    new Notification(title, { body, icon: '/paw.svg', tag: 'cozypaws-study' })
  } catch {
    // Some browsers only allow notifications from a service worker; skip quietly.
  }
}
