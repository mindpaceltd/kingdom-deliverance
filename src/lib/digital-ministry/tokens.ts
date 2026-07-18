import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const raw =
    process.env.DM_TOKEN_ENCRYPTION_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ''
  if (!raw) {
    throw new Error('DM_TOKEN_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY is required to encrypt tokens.')
  }
  return createHash('sha256').update(raw).digest()
}

/** Encrypt a secret for storage in dm_social_accounts.token_encrypted */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptSecret(payload: string): string {
  if (!payload.startsWith('v1:')) {
    throw new Error('Unsupported token payload format')
  }
  const [, ivB64, tagB64, dataB64] = payload.split(':')
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

export function tryDecryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null
  try {
    return decryptSecret(payload)
  } catch {
    return null
  }
}
