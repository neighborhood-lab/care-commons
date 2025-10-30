export declare class CryptoUtils {
    static generateHash(data: string | object): string;
    static generateIntegrityHash(data: object, secret?: string): string;
    static generateChecksum(data: string | object): string;
    static verifyIntegrityHash(data: object, expectedHash: string, secret?: string): boolean;
    static generateSecureId(): string;
    static hashSensitiveData(data: string): string;
    static signData(data: object, secret: string): string;
    static verifySignature(data: object, signature: string, secret: string): boolean;
}
//# sourceMappingURL=crypto-utils.d.ts.map