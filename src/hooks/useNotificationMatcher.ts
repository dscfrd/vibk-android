import { useRef, type MutableRefObject } from 'react'
import { DEFAULT_PATTERNS } from '../shared/notification-types'
import type { NotificationPattern, AppNotification } from '../shared/notification-types'

const compiledPatterns: { pattern: NotificationPattern; re: RegExp }[] = DEFAULT_PATTERNS.map(
  (p) => ({ pattern: p, re: new RegExp(p.regex) })
)

const PATTERN_COOLDOWN = 3000
const lastMatchTime: Record<string, number> = {}
let notifCounter = 0

export function useNotificationMatcher(
  tabId: string,
  onNotification: MutableRefObject<(notif: AppNotification) => void>
) {
  const lineBufferRef = useRef('')
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const matchLine = (line: string): void => {
    const trimmed = line.trim().replace(/[─━═_]{5,}/g, '').trim()
    if (trimmed.length < 3) return
    if (/tool_use_error|tool_error/i.test(trimmed)) return
    if (/exit code 255/i.test(trimmed)) return
    const now = Date.now()
    for (const { pattern, re } of compiledPatterns) {
      if (re.test(trimmed)) {
        if (now - (lastMatchTime[pattern.id] || 0) < PATTERN_COOLDOWN) break
        lastMatchTime[pattern.id] = now
        const cleanText = trimmed.replace(/[─━═_]{3,}/g, '').trim()
        const notif: AppNotification = {
          id: String(++notifCounter),
          tabId,
          pattern,
          text: cleanText || trimmed,
          timestamp: now
        }
        onNotification.current(notif)
        break
      }
    }
  }

  const processNotifications = (stripped: string): void => {
    lineBufferRef.current += stripped
    const parts = lineBufferRef.current.split(/[\r\n]+/)
    lineBufferRef.current = parts.pop() || ''
    for (const line of parts) {
      matchLine(line)
    }
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current)
    if (lineBufferRef.current.length > 0) {
      flushTimerRef.current = setTimeout(() => {
        if (lineBufferRef.current.length > 0) {
          matchLine(lineBufferRef.current)
          lineBufferRef.current = ''
        }
      }, 500)
    }
  }

  const processNotificationsRef = useRef(processNotifications)
  processNotificationsRef.current = processNotifications

  const cleanup = (): void => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current)
  }

  return { processNotificationsRef, cleanup }
}
