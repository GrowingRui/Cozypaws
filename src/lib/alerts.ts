import { playSfx, unlockAudio } from './sound'

/** Gentle end-of-phase alerts: a synthesized chime and an optional browser notification. */

/** A soft two-note bell. Follows the sound setting. */
export function playChime() {
  playSfx('chime')
}

/** Ask once, from a user action such as pressing Start. Saying no is fine. */
export function requestNotifications() {
  if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission()
  // Start audio during the click so browsers allow the chime later.
  unlockAudio()
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
