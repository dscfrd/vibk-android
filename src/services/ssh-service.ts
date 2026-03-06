import SSHClient from '@dylankenneally/react-native-ssh-sftp'
import type { SshServer } from '../shared/server-types'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected'

interface SshCallbacks {
  onData?: (data: string) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (err: string) => void
}

class SshService {
  private client: SSHClient | null = null
  private state: ConnectionState = 'disconnected'
  private callbacks: SshCallbacks = {}
  private currentServer: SshServer | null = null
  private currentCols = 80
  private currentRows = 24
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private isManuallyDisconnected = false

  getState(): ConnectionState {
    return this.state
  }

  setCallbacks(cbs: SshCallbacks): void {
    this.callbacks = cbs
  }

  private setState(newState: ConnectionState): void {
    this.state = newState
  }

  private handleConnect(): void {
    this.reconnectAttempts = 0
    this.setState('connected')
    this.callbacks.onConnect?.()
  }

  private handleDisconnect(): void {
    this.setState('disconnected')
    this.callbacks.onDisconnect?.()

    if (!this.isManuallyDisconnected && this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000
      this.reconnectAttempts++
      setTimeout(() => {
        if (this.currentServer && !this.isManuallyDisconnected && this.state === 'disconnected') {
          this.connect(this.currentServer, this.currentCols, this.currentRows)
        }
      }, delay)
    }
  }

  async connect(server: SshServer, cols: number, rows: number): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') return

    this.isManuallyDisconnected = false
    this.currentServer = server
    this.currentCols = cols
    this.currentRows = rows
    this.setState('connecting')

    try {
      if (server.authMethod === 'password') {
        this.client = await SSHClient.connectWithPassword(
          server.host, server.port, server.username, server.password || ''
        )
      } else if (server.authMethod === 'key') {
        this.client = await SSHClient.connectWithKey(
          server.host, server.port, server.username, server.privateKeyPath || '', server.passphrase
        )
      } else {
        throw new Error('Unsupported auth method: ' + server.authMethod)
      }

      await this.client.startShell('xterm-256color', cols, rows)

      this.client.on('Shell', (event: string) => {
        this.callbacks.onData?.(event)
      })

      this.handleConnect()
    } catch (err) {
      this.callbacks.onError?.(err instanceof Error ? err.message : 'Connection failed')
      this.handleDisconnect()
    }
  }

  write(data: string): void {
    if (this.client && this.state === 'connected') {
      this.client.writeToShell(data)
    }
  }

  resize(cols: number, rows: number): void {
    this.currentCols = cols
    this.currentRows = rows
    // react-native-ssh-sftp doesn't have a direct resize — would need to restart shell
    // For now, store dimensions for reconnect
  }

  async exec(server: SshServer, command: string): Promise<string> {
    let client: SSHClient
    if (server.authMethod === 'password') {
      client = await SSHClient.connectWithPassword(
        server.host, server.port, server.username, server.password || ''
      )
    } else if (server.authMethod === 'key') {
      client = await SSHClient.connectWithKey(
        server.host, server.port, server.username, server.privateKeyPath || '', server.passphrase
      )
    } else {
      throw new Error('Unsupported auth method: ' + server.authMethod)
    }
    try {
      const result = await client.execute(command)
      return result
    } finally {
      client.disconnect()
    }
  }

  disconnect(): void {
    this.isManuallyDisconnected = true
    this.reconnectAttempts = this.maxReconnectAttempts
    if (this.client) {
      try {
        this.client.closeShell()
        this.client.disconnect()
      } catch { /* already disconnected */ }
      this.client = null
    }
    this.setState('disconnected')
    this.callbacks.onDisconnect?.()
  }
}

export default new SshService()
