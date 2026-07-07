import bcrypt from 'bcrypt';
import { loadConfig } from '../../../config/index.js';
import type { PasswordHasher } from '../../../shared/auth/password-hasher.interface.js';

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, loadConfig().BCRYPT_ROUNDS);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
