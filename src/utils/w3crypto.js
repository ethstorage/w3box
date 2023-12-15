import crypto from 'crypto';
import hkdf from 'futoin-hkdf';

const authTagLength = 16;
const keyByteLength = 32;
const keyHash = 'SHA-256';
const algo = 'aes-256-gcm'; // crypto library does not accept this in uppercase. So gotta keep using aes-256-gcm

function urlEncodeHashKey(keyBuffer) {
    return keyBuffer.toString('base64').replace('=', '');
}

// Derive a key from the user's id
export const deriveDriveKey = async (signature, dataEncryptionKey) => {
    const info = dataEncryptionKey;
    const driveKey = hkdf(Buffer.from(signature), keyByteLength, {info, hash: keyHash});
    return urlEncodeHashKey(driveKey);
}

// New Drive decryption function, using KDF and AES-256-GCM
export const driveEncrypt = async (driveKey, data) => {
    const keyData = Buffer.from(driveKey, 'base64');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(algo, keyData, iv, {authTagLength});
    const encryptedBuffer = Buffer.concat([cipher.update(data), cipher.final(), cipher.getAuthTag()]);
    return {
        cipher: 'AES256-GCM',
        cipherIV: iv.toString('base64'),
        data: encryptedBuffer
    };
}


// New Drive decryption function, using KDF and AES-256-GCM; cipherIV: string, fileKey: string, data: Buffer
export async function driveDecrypt(driveKey, cipherIV, data) {
    const authTag = data.slice(data.byteLength - authTagLength, data.byteLength);
    const encryptedDataSlice = data.slice(0, data.byteLength - authTagLength);
    const iv = Buffer.from(cipherIV, 'base64');
    const keyData = Buffer.from(driveKey, 'base64');
    const decipher = crypto.createDecipheriv(algo, keyData, iv, { authTagLength });
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encryptedDataSlice), decipher.final()]);
}
