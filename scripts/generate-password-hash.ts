/**
 * Quick script to generate password hash
 */
import { PasswordUtils } from '../packages/core/src/utils/password-utils.js';

const password = process.argv[2] || 'Wanyama2026$';
const hash = PasswordUtils.hashPassword(password);
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);
console.log(`\nVerification: ${PasswordUtils.verifyPassword(password, hash)}`);
