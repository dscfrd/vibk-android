import { useCallback, useRef, useState, type MutableRefObject } from 'react'

const AUTO_YES_DELAY = 5000

export function useAutoYes(
  sendToConnectionRef: MutableRefObject<(data: string) => void>,
  onBeep?: () => void
) {
  const autoYesBufRef = useRef('')
  const [autoYes, setAutoYes] = useState(false)
  const autoYesRef = useRef(false)
  const [autoYesCountdown, setAutoYesCountdown] = useState(0)
  const autoYesPendingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoYesTickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const processAutoYes = useCallback((stripped: string) => {
    autoYesBufRef.current = (autoYesBufRef.current + stripped).slice(-2000)

    if (!autoYesRef.current || autoYesPendingRef.current) return

    const buf = autoYesBufRef.current

    const hasDo = /Do you want/i.test(buf)
    const hasNumberedYes = /1[^a-zA-Z]{0,5}Yes/i.test(buf)
    const hasAllow = /Allow\s+\w+/i.test(buf)
    const hasYN = /\(y\/n\)/i.test(buf) || /\(Y\)es/i.test(buf)
    const hasProceed = /proceed\?/i.test(buf)

    if (!(hasDo || hasNumberedYes || hasAllow || hasYN || hasProceed)) return

    onBeep?.()

    const response = hasYN ? 'y\r' : '\r'
    autoYesBufRef.current = ''

    setAutoYesCountdown(Math.ceil(AUTO_YES_DELAY / 1000))
    if (autoYesTickRef.current) clearInterval(autoYesTickRef.current)

    const startTime = Date.now()
    autoYesTickRef.current = setInterval(() => {
      const left = Math.ceil((AUTO_YES_DELAY - (Date.now() - startTime)) / 1000)
      setAutoYesCountdown(Math.max(0, left))
    }, 200)

    autoYesPendingRef.current = setTimeout(() => {
      if (autoYesTickRef.current) {
        clearInterval(autoYesTickRef.current)
        autoYesTickRef.current = null
      }
      setAutoYesCountdown(0)
      autoYesPendingRef.current = null
      autoYesBufRef.current = ''
      if (!autoYesRef.current) return
      sendToConnectionRef.current(response)
    }, AUTO_YES_DELAY)
  }, [sendToConnectionRef, onBeep])

  const toggleAutoYes = useCallback(() => {
    const next = !autoYesRef.current
    autoYesRef.current = next
    setAutoYes(next)
    if (!next) {
      if (autoYesPendingRef.current) {
        clearTimeout(autoYesPendingRef.current)
        autoYesPendingRef.current = null
      }
      if (autoYesTickRef.current) {
        clearInterval(autoYesTickRef.current)
        autoYesTickRef.current = null
      }
      setAutoYesCountdown(0)
    }
  }, [])

  const processAutoYesRef = useRef(processAutoYes)
  processAutoYesRef.current = processAutoYes

  return {
    autoYes,
    autoYesCountdown,
    autoYesDelay: AUTO_YES_DELAY,
    processAutoYesRef,
    toggleAutoYes
  }
}
