export interface GoogleUser {
  email: string
  name: string
  picture: string
}

export interface CloudState {
  user: GoogleUser | null
  syncing: boolean
  lastSyncAt: number | null
  vaultConfigured: boolean
}

export interface ShareResult {
  link: string
  fileId: string
}
