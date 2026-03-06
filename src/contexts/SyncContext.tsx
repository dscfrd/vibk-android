import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { VibkProject } from '../shared/project-types'
import type { SshServer, McpServer, ServerCombo } from '../shared/server-types'
import { CloudSync } from '../services/cloud-sync'
import { storage } from '../services/storage'
import { useAuth } from './AuthContext'

interface SyncContextValue {
  projects: VibkProject[]
  sshServers: SshServer[]
  mcpServers: McpServer[]
  serverCombos: ServerCombo[]
  syncing: boolean
  lastSyncAt: number | null
  syncNow: () => Promise<void>
  error: string | null
}

const SyncContext = createContext<SyncContextValue>({
  projects: [],
  sshServers: [],
  mcpServers: [],
  serverCombos: [],
  syncing: false,
  lastSyncAt: null,
  syncNow: async () => {},
  error: null
})

export function useSync(): SyncContextValue {
  return useContext(SyncContext)
}

export function SyncProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { user, vaultPassword, getAccessToken } = useAuth()
  const [projects, setProjects] = useState<VibkProject[]>(storage.getProjects())
  const [sshServers, setSshServers] = useState<SshServer[]>(storage.getSshServers())
  const [mcpServers, setMcpServers] = useState<McpServer[]>(storage.getMcpServers())
  const [serverCombos, setServerCombos] = useState<ServerCombo[]>(storage.getServerCombos())
  const [syncing, setSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(storage.getLastSyncAt())
  const [error, setError] = useState<string | null>(null)

  const syncNow = useCallback(async () => {
    if (!user || !vaultPassword || syncing) return
    setSyncing(true)
    setError(null)
    try {
      const cloudSync = new CloudSync(getAccessToken)
      const result = await cloudSync.sync(vaultPassword)
      setProjects(result.projects)
      setSshServers(result.sshServers)
      setMcpServers(result.mcpServers)
      setServerCombos(result.serverCombos)
      setLastSyncAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }, [user, vaultPassword, syncing, getAccessToken])

  // Auto-sync when user and vault password are available
  useEffect(() => {
    if (user && vaultPassword) {
      syncNow()
    }
  }, [user, vaultPassword]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SyncContext.Provider value={{ projects, sshServers, mcpServers, serverCombos, syncing, lastSyncAt, syncNow, error }}>
      {children}
    </SyncContext.Provider>
  )
}
