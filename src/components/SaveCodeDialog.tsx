import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { GameState } from '../game/state'
import { useBackLayer } from '../lib/backStack'
import { canSave, exportCode, importCode } from '../storage/save'
import { springs } from './tones'

/** Opens as a modal <dialog>: focus stays inside, the page behind is inert, Escape and back close it. */
export function useModal(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null)
  useBackLayer(true, onClose)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return ref
}

type SaveCodeDialogProps = {
  /** The household to copy out. Left out on the first screen, where there's nothing to copy yet. */
  state?: GameState
  onLoad: (state: GameState) => void
  onClose: () => void
}

/**
 * Saves live in one browser at one web address. A save code moves the pets to a new link or another device:
 * copy it here, paste it there.
 */
export function SaveCodeDialog({ state, onLoad, onClose }: SaveCodeDialogProps) {
  const ref = useModal(onClose)
  // The code is taken when the dialog opens; pets keep living, but a code from a moment ago loads fine.
  const code = useMemo(() => (state ? exportCode(state) : ''), [])
  const codeRef = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState(false)
  const [pasted, setPasted] = useState('')
  const [error, setError] = useState<string | null>(null)
  const saving = useMemo(canSave, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // No clipboard access (older browsers, plain http): select the code and use the old copy command.
      codeRef.current?.select()
      document.execCommand('copy')
    }
    setCopied(true)
  }

  const load = () => {
    const next = importCode(pasted)
    if (!next) {
      setError('That isn’t a save code. Copy the whole code, starting with COZYPAWS-, and paste it again.')
      return
    }
    onLoad(next)
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="save-code-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-[min(92vw,24rem)] overflow-visible bg-transparent p-0 text-cocoa backdrop:bg-cocoa/30"
    >
      <motion.div
        className="sticker stitch flex flex-col gap-4 p-5 shadow-[var(--shadow-float)]"
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springs.pop}
      >
        <h2 id="save-code-title" className="text-center text-xl">
          {state ? 'Move your pets' : 'Bring your pets back'}
        </h2>
        <p className="text-sm leading-[1.7] text-cocoa-soft">
          {state
            ? 'Your pets are saved in this browser, at this web address. To play on a new link or another device, copy your save code and paste it into the game there.'
            : 'Played on another link or device? Copy your save code there (Settings, then Move your pets) and paste it here.'}
        </p>

        {!saving && (
          <p role="status" className="rounded-[var(--radius-chip)] bg-blush-soft px-3 py-2 text-sm leading-[1.7] text-berry-deep">
            This browser isn’t keeping your progress. Private windows and browsers inside chat apps forget everything
            when closed. Open the game in your usual browser, or copy your save code before you leave.
          </p>
        )}

        {state && (
          <div className="flex flex-col gap-2">
            <label htmlFor="save-code-out" className="font-bold">
              Your save code
            </label>
            <textarea
              id="save-code-out"
              ref={codeRef}
              readOnly
              value={code}
              rows={3}
              onFocus={(e) => e.currentTarget.select()}
              className="resize-none break-all rounded-[var(--radius-chip)] border-2 border-cocoa/15 bg-cream px-3 py-2 text-xs leading-5 text-cocoa-soft outline-none focus-visible:border-berry"
            />
            <motion.button
              type="button"
              onClick={copy}
              whileTap={{ scale: 0.95 }}
              transition={springs.pop}
              className="min-h-12 rounded-full bg-berry px-5 font-bold text-milk shadow-[0_2px_0_var(--color-berry-deep)] hover:bg-berry-deep"
            >
              {copied ? 'Copied' : 'Copy save code'}
            </motion.button>
          </div>
        )}

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            load()
          }}
          className={`flex flex-col gap-2 ${state ? 'border-t-2 border-dashed border-cocoa/10 pt-4' : ''}`}
        >
          <label htmlFor="save-code-in" className="font-bold">
            Paste a save code
          </label>
          <textarea
            id="save-code-in"
            value={pasted}
            rows={3}
            autoFocus={!state}
            spellCheck={false}
            autoComplete="off"
            placeholder="COZYPAWS-…"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'save-code-error' : state ? 'save-code-note' : undefined}
            onChange={(e) => {
              setPasted(e.target.value)
              setError(null)
            }}
            className="resize-none break-all rounded-[var(--radius-chip)] border-2 border-cocoa/15 bg-cream px-3 py-2 text-xs leading-5 text-cocoa outline-none placeholder:text-cocoa-soft/60 focus-visible:border-berry aria-[invalid=true]:border-berry"
          />
          {error ? (
            <p id="save-code-error" role="alert" className="text-sm font-bold text-berry">
              {error}
            </p>
          ) : (
            state && (
              <p id="save-code-note" className="text-sm text-cocoa-soft">
                Loading replaces the pets you have here.
              </p>
            )
          )}
          <motion.button
            type="submit"
            disabled={!pasted.trim()}
            whileTap={{ scale: 0.95 }}
            transition={springs.pop}
            className="min-h-12 rounded-full bg-cream px-5 font-bold shadow-[var(--shadow-base)] hover:bg-blush-soft disabled:opacity-50 disabled:hover:bg-cream"
          >
            Load pets
          </motion.button>
        </form>

        <motion.button
          type="button"
          autoFocus={!!state}
          onClick={onClose}
          whileTap={{ scale: 0.95 }}
          transition={springs.pop}
          className="min-h-11 rounded-full px-5 font-bold text-cocoa-soft hover:bg-cream hover:text-cocoa"
        >
          {state ? 'Done' : 'Cancel'}
        </motion.button>
      </motion.div>
    </dialog>
  )
}
