export type NotificationPriority = 'low' | 'medium' | 'high'

export interface NotificationPattern {
  id: string
  label: string
  regex: string
  priority: NotificationPriority
  color?: 'red' | 'green' | 'yellow'
}

export interface AppNotification {
  id: string
  tabId: string
  pattern: NotificationPattern
  text: string
  timestamp: number
}

export const DEFAULT_PATTERNS: NotificationPattern[] = [
  { id: 'error', label: 'Error', regex: '(?:^|\\s)(?:Error|ERROR|error:|ERR!)(?:\\s|:|$)', priority: 'high', color: 'red' },
  { id: 'failed', label: 'Failed', regex: '(?:^|\\s)(?:FAILED|failed|Failed)(?:\\s|:|$)', priority: 'high', color: 'red' },
  { id: 'fail', label: 'FAIL', regex: '(?:^|\\s)FAIL(?:\\s|$)', priority: 'high', color: 'red' },
  { id: 'warning', label: 'Warning', regex: '(?:^|\\s)(?:Warning|WARNING|warn:|WARN)(?:\\s|:|$)', priority: 'medium', color: 'yellow' },
  { id: 'built', label: 'Built', regex: '(?:^|\\s)(?:built|compiled|Built|Compiled)\\s+(?:successfully|in)\\b', priority: 'low', color: 'green' },
  { id: 'pass', label: 'PASS', regex: '(?:^|\\s)PASS(?:\\s|$)', priority: 'low', color: 'green' },
  { id: 'deployed', label: 'Deployed', regex: '(?:^|\\s)(?:deployed|Deployed|DEPLOYED)(?:\\s|:|$)', priority: 'medium', color: 'green' },
  { id: 'waiting', label: 'Waiting for input', regex: 'Do you want|Allow\\s+\\w+|\\(y\\/n\\)|\\(Y\\)es|Esc to cancel|approve|permission|\\b1[^a-zA-Z]{0,5}Yes\\b', priority: 'medium', color: 'yellow' }
]
