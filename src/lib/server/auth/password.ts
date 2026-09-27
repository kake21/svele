import { createCipheriv, createDecipheriv, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { ServerError } from '@/services/error'

const scryptAsync = promisify(scrypt) as (
    password: string, salt: Buffer, keylen: number
) => Promise<Buffer>

/**
 * Ported from projectNext's src/auth/passwordHash.ts and the hashAndEncrypter it wraps.
 *
 * The structure is the same and it is the interesting part: hash the password, then symmetrically
 * encrypt the hash with a server-held key. The encryption is a pepper - if the database leaks but
 * the key does not, the hashes are useless on their own.
 *
 * One deliberate difference. projectNext hashes with bcrypt, a native module that needs node-gyp;
 * building that inside the Nix sandbox, which has no network and no compiler toolchain by default,
 * is a fight worth avoiding for an experiment. scrypt is in node:crypto, is a memory-hard KDF
 * designed for exactly this, and needs no dependency at all.
 *
 * Parameters come from the environment so they are never baked into an image.
 */
const KEY_LENGTH = 64
const SALT_LENGTH = 16
const IV_LENGTH = 12

function getEncryptionKey(): Buffer {
    const raw = process.env.PASSWORD_ENCRYPTION_KEY
    if (!raw) {
        throw new ServerError('SERVER ERROR', 'Serveren mangler config: PASSWORD_ENCRYPTION_KEY')
    }
    // Derive a fixed-length AES key from whatever length the configured secret is.
    return Buffer.from(raw.padEnd(32, '0').slice(0, 32), 'utf8')
}

function encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), enc.toString('hex')].join(':')
}

function decrypt(payload: string): string {
    const [ivHex, tagHex, dataHex] = payload.split(':')
    if (!ivHex || !tagHex || !dataHex) {
        throw new ServerError('SERVER ERROR', 'Ugyldig lagret passord')
    }
    const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    return Buffer.concat([
        decipher.update(Buffer.from(dataHex, 'hex')),
        decipher.final(),
    ]).toString('utf8')
}

/**
 * Returns the value to store in Credentials.passwordHash.
 */
export async function hashAndEncryptPassword(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH)
    const derived = await scryptAsync(password, salt, KEY_LENGTH)
    return encrypt(`${salt.toString('hex')}:${derived.toString('hex')}`)
}

/**
 * Compares a submitted password against a stored value. Returns false rather than throwing on a
 * malformed stored value, so a corrupt row cannot be told apart from a wrong password.
 */
export async function decryptAndComparePassword(
    password: string,
    stored: string
): Promise<boolean> {
    try {
        const [saltHex, hashHex] = decrypt(stored).split(':')
        if (!saltHex || !hashHex) return false
        const derived = await scryptAsync(password, Buffer.from(saltHex, 'hex'), KEY_LENGTH)
        const expected = Buffer.from(hashHex, 'hex')
        if (expected.length !== derived.length) return false
        return timingSafeEqual(derived, expected)
    } catch {
        return false
    }
}
