import { MMKV } from 'react-native-mmkv'
import type { VibkProject } from '../shared/project-types'
import type { SshServer, McpServer, ServerCombo } from '../shared/server-types'

export type Theme = 'dark' | 'light'

class Storage {
  private mmkv: MMKV

  constructor() {
    this.mmkv = new MMKV({ id: 'vibk-storage' })
  }

  // --- Projects ---
  getProjects(): VibkProject[] {
    const val = this.mmkv.getString('projects')
    return val ? JSON.parse(val) : []
  }
  setProjects(projects: VibkProject[]): void {
    this.mmkv.set('projects', JSON.stringify(projects))
  }

  // --- SSH Servers ---
  getSshServers(): SshServer[] {
    const val = this.mmkv.getString('sshServers')
    return val ? JSON.parse(val) : []
  }
  setSshServers(servers: SshServer[]): void {
    this.mmkv.set('sshServers', JSON.stringify(servers))
  }

  // --- MCP Servers ---
  getMcpServers(): McpServer[] {
    const val = this.mmkv.getString('mcpServers')
    return val ? JSON.parse(val) : []
  }
  setMcpServers(servers: McpServer[]): void {
    this.mmkv.set('mcpServers', JSON.stringify(servers))
  }

  // --- Server Combos ---
  getServerCombos(): ServerCombo[] {
    const val = this.mmkv.getString('serverCombos')
    return val ? JSON.parse(val) : []
  }
  setServerCombos(combos: ServerCombo[]): void {
    this.mmkv.set('serverCombos', JSON.stringify(combos))
  }

  // --- Vault ---
  getVaultFileId(): string | null {
    return this.mmkv.getString('vaultFileId') || null
  }
  setVaultFileId(id: string | null): void {
    if (id) this.mmkv.set('vaultFileId', id)
    else this.mmkv.delete('vaultFileId')
  }

  getVaultPassword(): string | null {
    return this.mmkv.getString('vaultPassword') || null
  }
  setVaultPassword(password: string | null): void {
    if (password) this.mmkv.set('vaultPassword', password)
    else this.mmkv.delete('vaultPassword')
  }

  // --- Sync ---
  getLastSyncAt(): number | null {
    const val = this.mmkv.getNumber('lastSyncAt')
    return val ?? null
  }
  setLastSyncAt(timestamp: number): void {
    this.mmkv.set('lastSyncAt', timestamp)
  }

  // --- Settings ---
  getTheme(): Theme {
    return (this.mmkv.getString('theme') as Theme) || 'dark'
  }
  setTheme(theme: Theme): void {
    this.mmkv.set('theme', theme)
  }

  getNotificationSound(): boolean {
    return this.mmkv.getBoolean('notificationSound') ?? true
  }
  setNotificationSound(enabled: boolean): void {
    this.mmkv.set('notificationSound', enabled)
  }

  getKeepAwake(): boolean {
    return this.mmkv.getBoolean('keepAwake') ?? false
  }
  setKeepAwake(enabled: boolean): void {
    this.mmkv.set('keepAwake', enabled)
  }
}

export const storage = new Storage()
