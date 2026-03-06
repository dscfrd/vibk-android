export interface PlanItem {
  id: string
  text: string
  checked: boolean
  indent: number
}

export interface PlanSection {
  id: string
  title: string
  level: number
  items: PlanItem[]
}

export interface ParsedPlan {
  sections: PlanSection[]
  raw: string
}

export type TicketStatus = 'todo' | 'in_progress' | 'done'
export type TicketPriority = 'high' | 'medium' | 'low'

export interface TicketAttachment {
  id: string
  filename: string
  path: string
  mimeType: string
  size: number
}

export interface Ticket {
  id: string
  title: string
  description?: string
  status: TicketStatus
  priority: TicketPriority
  assignee?: string
  notes?: string
  attachments?: TicketAttachment[]
  createdAt: number
  completedAt?: number
}
