/**
 * Node.js-specific crypto utilities
 * Direct import of node:crypto for server-side use
 */

import * as crypto from 'node:crypto';

export const randomBytes = crypto.randomBytes;
export const randomUUID = crypto.randomUUID;
export const pbkdf2Sync = crypto.pbkdf2Sync;
export const createHmac = crypto.createHmac;
export const createHash = crypto.createHash;

export default {
  randomBytes,
  randomUUID,
  pbkdf2Sync,
  createHmac,
  createHash,
};
