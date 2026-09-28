/**
 * Genuine End-to-End Encryption (E2EE) Module
 * Uses Web Crypto API:
 * - AES-256-GCM for authenticated symmetric encryption
 * - PBKDF2 with SHA-256 (100,000 iterations) for key derivation
 * - Cryptographically random 96-bit IV per encryption operation
 * - Zero plaintext exposed to the server or Web Admin
 */

// Helper to convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a random 12-word cryptographic recovery phrase or hex key
const WORD_LIST = [
  'amber', 'breeze', 'cedar', 'delta', 'echo', 'frost', 'glacier', 'harbor',
  'island', 'jungle', 'kestrel', 'lagoon', 'meadow', 'nebula', 'oasis', 'pine',
  'quartz', 'river', 'summit', 'timber', 'upland', 'valley', 'willow', 'zenith',
  'aurora', 'beacon', 'canyon', 'dune', 'ember', 'falcon', 'grove', 'haven'
];

export function generateRecoveryPhrase(): string {
  const randomBytes = new Uint8Array(12);
  window.crypto.getRandomValues(randomBytes);
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    const index = randomBytes[i] % WORD_LIST.length;
    words.push(WORD_LIST[index]);
  }
  return words.join(' ');
}

// Generate a random cryptographic salt (16 bytes)
export function generateSalt(): string {
  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);
  return bufferToBase64(salt.buffer);
}

// Derive a CryptoKey from a user passphrase or recovery phrase using PBKDF2
export async function deriveKeyFromSecret(secret: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const saltBuffer = base64ToBuffer(saltBase64);

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(saltBuffer),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64 (12 bytes)
  salt: string;       // Base64 (16 bytes)
  version: number;
}

// Encrypt any JSON-serializable object into an AES-256-GCM ciphertext
export async function encryptData<T>(data: T, secret: string): Promise<EncryptedPayload> {
  const salt = generateSalt();
  const key = await deriveKeyFromSecret(secret, salt);

  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const enc = new TextEncoder();
  const encodedData = enc.encode(JSON.stringify(data));

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer),
    salt: salt,
    version: 1,
  };
}

// Decrypt an AES-256-GCM payload using the secret
export async function decryptData<T>(payload: EncryptedPayload, secret: string): Promise<T> {
  const key = await deriveKeyFromSecret(secret, payload.salt);
  const ivBuffer = base64ToBuffer(payload.iv);
  const cipherBuffer = base64ToBuffer(payload.ciphertext);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    key,
    cipherBuffer
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted)) as T;
}

// Hash password/PIN locally using SHA-256 for local authentication
export async function hashPIN(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${pin}:digital-khata`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hashBuffer);
}
