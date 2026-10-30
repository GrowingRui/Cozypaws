import { useEffect, useRef, useState } from 'react'

/**
 * Makes the browser's back button (and the Android back gesture) step back inside the game
 * instead of leaving it. Anything that sits "on top" (a tab other than Home, the adoption screen,
 * a dialog) opens a layer; each layer owns one history entry. Back closes the top layer.
 *
 * History entries carry no data: the layers live here, and the entries only keep count. When a
 * layer is closed from inside the game, its entry is removed with history.back(), and that
 * popstate is swallowed rather than treated as the player pressing back.
 */

type Layer = { onBack: () => void }

const layers: Layer[] = []
/** history.back() calls of our own that haven't landed yet. */
let ownBacks = 0
/** Entries to add once those have landed; pushing earlier would get them popped instead. */
let pendingPushes = 0

function push() {
  if (ownBacks > 0) pendingPushes++
  else history.pushState({ cozypaws: true }, '')
}

function onPopState() {
  if (ownBacks > 0) {
    ownBacks--
    if (ownBacks === 0) {
      for (; pendingPushes > 0; pendingPushes--) history.pushState({ cozypaws: true }, '')
    }
    return
  }
  // The player pressed back: close the top layer. Its entry is already gone.
  layers.pop()?.onBack()
}

if (typeof window !== 'undefined') window.addEventListener('popstate', onPopState)

function open(layer: Layer) {
  layers.push(layer)
  push()
}

function close(layer: Layer) {
  const i = layers.lastIndexOf(layer)
  // Already closed by the back button.
  if (i === -1) return
  layers.splice(i, 1)
  if (pendingPushes > 0) pendingPushes--
  else {
    ownBacks++
    history.back()
  }
}

/**
 * While `active` is true, pressing back calls `onBack` (once) instead of leaving the page.
 * `onBack` should make `active` false; if it doesn't, the layer opens again so back keeps working.
 */
export function useBackLayer(active: boolean, onBack: () => void) {
  const backRef = useRef(onBack)
  backRef.current = onBack
  // Bumped on every back press, in the same render as onBack's own changes: if `active` is still
  // true after that render, the effect below opens a fresh layer.
  const [reopen, setReopen] = useState(0)

  useEffect(() => {
    if (!active) return
    const layer: Layer = {
      onBack: () => {
        backRef.current()
        setReopen((n) => n + 1)
      },
    }
    open(layer)
    return () => close(layer)
  }, [active, reopen])
}
