import { useCallback, useRef } from 'react'

/**
 * Critical: text and '\r' must be sent as TWO SEPARATE writes with 300ms delay.
 * Claude Code TUI requires this pattern to correctly process input.
 */
export function useSendMessage(writeToSsh: (data: string) => void) {
  const writeRef = useRef(writeToSsh)
  writeRef.current = writeToSsh

  const sendText = useCallback((text: string) => {
    writeRef.current(text)
    setTimeout(() => writeRef.current('\r'), 300)
  }, [])

  const sendRaw = useCallback((data: string) => {
    writeRef.current(data)
  }, [])

  return { sendText, sendRaw }
}
