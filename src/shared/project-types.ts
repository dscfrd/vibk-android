export interface ProjectStack {
  languages: string[]
  frameworks: string[]
  databases: string[]
  infra: string[]
}

export interface ProjectMemory {
  architecture: string
  knownIssues: string[]
  conventions: string[]
}

export interface ProjectAiTeam {
  techLeadModel: string
  developerModel: string
  assistantModel: string
}

export interface VibkProject {
  id: string
  name: string
  description: string
  path: string
  serverId?: string
  stack: ProjectStack
  runCommands: Record<string, string>
  memory: ProjectMemory
  aiTeam: ProjectAiTeam
  mcpServerIds: string[]
  archived?: boolean
  createdAt: number
  updatedAt: number
  lastOpenedAt: number
}
