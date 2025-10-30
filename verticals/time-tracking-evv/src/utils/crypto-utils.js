"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoUtils = void 0;
const crypto_1 = require("crypto");
class CryptoUtils {
    static generateHash(data) {
        const input = typeof data === 'string' ? data : JSON.stringify(data);
        return (0, crypto_1.createHash)('sha256').update(input).digest('hex');
    }
    static generateIntegrityHash(data, secret) {
        const input = JSON.stringify(data);
        if (secret) {
            return (0, crypto_1.createHmac)('sha256', secret).update(input).digest('hex');
        }
        return this.generateHash(input);
    }
    static generateChecksum(data) {
        const input = typeof data === 'string' ? data : JSON.stringify(data);
        return (0, crypto_1.createHash)('sha256').update(input).digest('hex');
    }
    static verifyIntegrityHash(data, expectedHash, secret) {
        const computedHash = this.generateIntegrityHash(data, secret);
        return computedHash === expectedHash;
    }
    static generateSecureId() {
        return (0, crypto_1.randomBytes)(16).toString('hex');
    }
    static hashSensitiveData(data) {
        return (0, crypto_1.createHash)('sha256').update(data).digest('hex');
    }
    static signData(data, secret) {
        const input = JSON.stringify(data);
        return (0, crypto_1.createHmac)('sha256', secret).update(input).digest('base64');
    }
    static verifySignature(data, signature, secret) {
        const expectedSignature = this.signData(data, secret);
        return signature === expectedSignature;
    }
}
exports.CryptoUtils = CryptoUtils;
//# sourceMappingURL=crypto-utils.js.map