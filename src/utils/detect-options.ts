export interface DetectedOption {
  num: string
  label: string
}

export interface DetectedOptions {
  text: string
  options: DetectedOption[]
}

export function detectOptions(content: string): DetectedOptions | null {
  const lines = content.replace(/\r/g, '').trimEnd().split('\n')
  const opts: DetectedOption[] = []
  let i = lines.length - 1

  while (i >= 0) {
    const cleaned = lines[i].replace(/^[\s❯>•*\-→]+/, '')
    const m = cleaned.match(/^(\d+)[.):\]]\s+(.+)/)
    if (m) {
      opts.unshift({ num: m[1], label: m[2].trim() })
      i--
    } else if (lines[i].trim() === '' && opts.length > 0) {
      i--
    } else {
      break
    }
  }

  if (opts.length >= 2) {
    const text = lines.slice(0, i + 1).join('\n').trim()
    return { text, options: opts }
  }

  const lastNonEmpty = lines.filter((l) => l.trim()).pop() || ''
  if (/\(y(?:es)?\/n(?:o)?\)\s*$/i.test(lastNonEmpty) || /\?\s*(?:\[Y\/n\]|\[y\/N\])\s*$/i.test(lastNonEmpty)) {
    return {
      text: lastNonEmpty,
      options: [
        { num: 'yes', label: 'Yes' },
        { num: 'no', label: 'No' }
      ]
    }
  }

  return null
}
