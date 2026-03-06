export type HealthStatus = 'unknown' | 'healthy' | 'unhealthy' | 'checking'

export interface McpServerStdio {
  type: 'stdio'
  command: string
  args: string[]
  env?: Record<string, string>
}

export interface McpServerHttp {
  type: 'http'
  url: string
  headers?: Record<string, string>
}

export type McpServerTransport = McpServerStdio | McpServerHttp

export interface McpServer {
  id: string
  name: string
  transport: McpServerTransport
  autoAttach: boolean
  health: HealthStatus
  createdAt: number
  updatedAt: number
}

export interface SshServer {
  id: string
  name: string
  host: string
  port: number
  username: string
  authMethod: 'key' | 'password' | 'agent'
  privateKeyPath?: string
  password?: string
  passphrase?: string
  health: HealthStatus
  archived?: boolean
  createdAt: number
  updatedAt: number
}

export interface ServerCombo {
  id: string
  name: string
  mcpServerIds: string[]
  sshServerId: string | null
  createdAt: number
}

export type SshSpawnOptions = {
  sshServerId: string
  cols: number
  rows: number
}
