import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'react-native-quick-crypto'
import { Buffer } from 'buffer'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 32
const TAG_LENGTH = 16
const ITERATIONS = 100_000

export function encrypt(data: string, password: string): string {
  const salt = randomBytes(SALT_LENGTH)
  const key = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512') as Buffer
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64')
}

export function decrypt(encoded: string, password: string): string {
  const buf = Buffer.from(encoded, 'base64')
  const salt = buf.subarray(0, SALT_LENGTH)
  const iv = buf.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const tag = buf.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
  const encrypted = buf.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
  const key = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512') as Buffer
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
