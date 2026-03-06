import type { VibkProject } from '../shared/project-types'
import type { SshServer, McpServer, ServerCombo } from '../shared/server-types'
import { decrypt } from './vault'
import { GoogleDrive } from './google-drive'
import { storage } from './storage'

export interface CloudSyncResult {
  projects: VibkProject[]
  sshServers: SshServer[]
  mcpServers: McpServer[]
  serverCombos: ServerCombo[]
}

export class CloudSync {
  private drive: GoogleDrive

  constructor(getToken: () => Promise<string>) {
    this.drive = new GoogleDrive(getToken)
  }

  async sync(password: string): Promise<CloudSyncResult> {
    // Try cached file ID first
    let fileId = storage.getVaultFileId()
    if (!fileId) {
      fileId = await this.drive.findVaultFile()
    }

    if (!fileId) {
      return { projects: [], sshServers: [], mcpServers: [], serverCombos: [] }
    }

    const encryptedData = await this.drive.downloadVault(fileId)
    const decrypted = decrypt(encryptedData, password)
    const data = JSON.parse(decrypted)

    const result: CloudSyncResult = {
      projects: data.projects || [],
      sshServers: data.sshServers || [],
      mcpServers: data.mcpServers || [],
      serverCombos: data.serverCombos || []
    }

    // Persist to local storage for offline access
    storage.setProjects(result.projects)
    storage.setSshServers(result.sshServers)
    storage.setMcpServers(result.mcpServers)
    storage.setServerCombos(result.serverCombos)
    storage.setVaultFileId(fileId)
    storage.setLastSyncAt(Date.now())

    return result
  }
}
