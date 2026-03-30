import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const HASH_SEPARATOR = ':';
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_SALT_BYTES = 16;
const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_BYTES).toString('hex');
  const hash = (await scryptAsync(
    password,
    salt,
    SCRYPT_KEY_LENGTH,
  )) as Buffer;

  return `${salt}${HASH_SEPARATOR}${hash.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  storedPassword: string,
): Promise<boolean> {
  const [salt, storedHash] = storedPassword.split(HASH_SEPARATOR);

  if (!salt || !storedHash) {
    return false;
  }

  const derivedHash = (await scryptAsync(
    password,
    salt,
    SCRYPT_KEY_LENGTH,
  )) as Buffer;
  const storedHashBuffer = Buffer.from(storedHash, 'hex');

  if (storedHashBuffer.length !== derivedHash.length) {
    return false;
  }

  return timingSafeEqual(storedHashBuffer, derivedHash);
}
