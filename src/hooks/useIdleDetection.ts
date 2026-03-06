import { useRef, useState, type MutableRefObject } from 'react'
import { detectOptions } from '../utils/detect-options'

const PROMPT_RE = /[$%>❯›»]\s*$|^\s*\?\s|Input:|Enter\s|Type\s.*:/m

export function useIdleDetection(
  tabId: string,
  assistantAccumRef: MutableRefObject<string>,
  setOutputActiveRef: MutableRefObject<(tabId: string, active: boolean) => void>,
  setDetectedOptionsRef: MutableRefObject<(tabId: string, opts: ReturnType<typeof detectOptions> extends { options: infer O } ? O : null) => void>,
  setSelectedOptionIndex: (tabId: string, idx: number) => void,
  inputQueueRef: MutableRefObject<string[]>,
  pushUserMessageRef: MutableRefObject<(tabId: string, msg: string) => void>,
  sendTextRef: MutableRefObject<(text: string) => void>
) {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushRetryRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [queueSize, setQueueSize] = useState(0)

  const flushOneQueued = (): void => {
    if (inputQueueRef.current.length > 0) {
      const msg = inputQueueRef.current.shift()!
      setQueueSize(inputQueueRef.current.length)
      pushUserMessageRef.current(tabId, msg)
      sendTextRef.current(msg)
      assistantAccumRef.current = ''
      setDetectedOptionsRef.current(tabId, null)
      setSelectedOptionIndex(tabId, -1)
    }
    if (inputQueueRef.current.length === 0 && flushRetryRef.current) {
      clearInterval(flushRetryRef.current)
      flushRetryRef.current = null
    }
  }

  const looksLikePrompt = (): boolean => {
    const tail = assistantAccumRef.current.slice(-500)
    if (!tail.trim()) return true
    const lastLines = tail.split(/[\r\n]+/).filter(Boolean).slice(-3).join('\n')
    return PROMPT_RE.test(lastLines)
  }

  const tryFlush = (): void => {
    if (inputQueueRef.current.length === 0) return
    if (looksLikePrompt()) {
      flushOneQueued()
    } else {
      if (!flushRetryRef.current) {
        flushRetryRef.current = setInterval(() => {
          if (inputQueueRef.current.length === 0) {
            if (flushRetryRef.current) { clearInterval(flushRetryRef.current); flushRetryRef.current = null }
            return
          }
          if (looksLikePrompt()) flushOneQueued()
        }, 1000)
      }
    }
  }

  const restartIdleTimer = (): void => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    setOutputActiveRef.current(tabId, true)
    idleTimerRef.current = setTimeout(() => {
      setOutputActiveRef.current(tabId, false)
      const opts = detectOptions(assistantAccumRef.current)
      const detected = opts ? opts.options : null
      setDetectedOptionsRef.current(tabId, detected)
      tryFlush()
    }, 500)
  }

  const restartIdleTimerRef = useRef(restartIdleTimer)
  restartIdleTimerRef.current = restartIdleTimer

  const enqueueMessage = (text: string): void => {
    const MAX_QUEUE = 5
    if (inputQueueRef.current.length >= MAX_QUEUE) return
    inputQueueRef.current.push(text)
    setQueueSize(inputQueueRef.current.length)
  }

  const cleanup = (): void => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (flushRetryRef.current) clearInterval(flushRetryRef.current)
  }

  return { restartIdleTimerRef, enqueueMessage, queueSize, setQueueSize, cleanup }
}
