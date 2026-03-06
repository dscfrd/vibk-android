const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'

export class GoogleDrive {
  constructor(private getToken: () => Promise<string>) {}

  async uploadVault(data: string, existingFileId?: string): Promise<string> {
    const token = await this.getToken()

    if (existingFileId) {
      const res = await fetch(`${UPLOAD_API}/files/${existingFileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: data
      })
      if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`)
      const json = await res.json()
      return json.id
    }

    const metadata = { name: 'vibk-vault.enc', parents: ['appDataFolder'] }
    const boundary = '---vibk-boundary---'
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n${data}\r\n--${boundary}--`

    const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    })
    if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`)
    const json = await res.json()
    return json.id
  }

  async findVaultFile(): Promise<string | null> {
    const token = await this.getToken()
    const res = await fetch(
      `${DRIVE_API}/files?spaces=appDataFolder&q=name='vibk-vault.enc'&fields=files(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return null
    const json = await res.json()
    return json.files?.[0]?.id || null
  }

  async downloadVault(fileId: string): Promise<string> {
    const token = await this.getToken()
    const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error(`Drive download failed: ${res.status}`)
    return res.text()
  }
}
