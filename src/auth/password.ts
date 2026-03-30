import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const HASH_SEPARATOR = ':';
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_SALT_BYTES = 16;
const scryptAsync = promisify(scrypt);

/**
 * Вычисляет scrypt-хеш для пары "пароль + соль".
 *
 * Выделяем это в helper, чтобы логика хеширования и проверки пользовалась
 * одним и тем же низкоуровневым кодом.
 */
async function derivePasswordHash(
  password: string,
  salt: string,
): Promise<Buffer> {
  return (await scryptAsync(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
}

/**
 * На запись в базу сохраняем соль и хеш в одной строке через разделитель.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_BYTES).toString('hex');
  const hash = await derivePasswordHash(password, salt);

  return `${salt}${HASH_SEPARATOR}${hash.toString('hex')}`;
}

/**
 * При проверке пароля заново получаем хеш с той же солью и сравниваем
 * значения через `timingSafeEqual`, чтобы не допускать утечек по времени.
 */
export async function verifyPassword(
  password: string,
  storedPassword: string,
): Promise<boolean> {
  const [salt, storedHash] = storedPassword.split(HASH_SEPARATOR);

  if (!salt || !storedHash) {
    return false;
  }

  const derivedHash = await derivePasswordHash(password, salt);
  const storedHashBuffer = Buffer.from(storedHash, 'hex');

  if (storedHashBuffer.length !== derivedHash.length) {
    return false;
  }

  return timingSafeEqual(storedHashBuffer, derivedHash);
}
