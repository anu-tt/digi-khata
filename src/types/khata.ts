export type PartyType = 'customer' | 'supplier';
export type EntryType = 'credit' | 'debit'; // Credit = Jama, Debit = Udhaar

export interface KhataAttachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string; // Base64 image
  size: number;
  createdAt: string;
}

export interface KhataEntry {
  id: string;
  userId: string;
  partyId: string;
  type: EntryType; // 'credit' = Jama (Received), 'debit' = Udhaar (Given)
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  attachments: KhataAttachment[];
  syncStatus: 'synced' | 'pending' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface KhataParty {
  id: string;
  userId: string;
  type: PartyType;
  name: string;
  phone?: string;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KhataReminder {
  id: string;
  userId: string;
  partyId?: string;
  partyName?: string;
  title: string;
  date: string;
  completed: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  businessName?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  address?: string;
  recoveryPhrase?: string; // Local-only encryption key; never stored in the cloud profile
  pinHash?: string;
  pinSalt?: string;
  securityQuestion?: string;
  securityAnswerHash?: string;
  isBiometricEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export const SECURITY_QUESTIONS = [
  'Aapka pehla school ka naam kya hai?',
  'Aapka janam ka shahar / gaon kaun sa hai?',
  'Aapke bachpan ke sabse acche dost ka naam kya hai?',
  'Aapka pasandida khana ya mithai kya hai?',
  'Aapke pehle vahan (bike/car) ka naam ya number kya hai?',
];

export interface AuthDevice {
  id: string;
  userId?: string;
  name: string;
  platform: 'android' | 'ios' | 'web';
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}

export type SyncState = 'idle' | 'syncing' | 'success' | 'pending' | 'error';

export interface PartyBalanceSummary {
  party: KhataParty;
  totalCredit: number; // Jama
  totalDebit: number;  // Udhaar
  netBalance: number;  // Net: for customer, Debit - Credit (Aapko Lena Hai if > 0, Aapko Dena Hai if < 0)
  status: 'lena_hai' | 'dena_hai' | 'barabar';
  lastEntryDate?: string;
  entriesCount: number;
}

export interface DashboardStats {
  totalLenaHai: number;
  totalDenaHai: number;
  customerCount: number;
  supplierCount: number;
  netBalance: number;
}

// Encrypted cloud package exchanged during sync
export interface EncryptedSyncPackage {
  userId: string;
  deviceId: string;
  version: number;
  timestamp: string;
  encryptedData: {
    ciphertext: string;
    iv: string;
    salt: string;
    version: number;
  };
  totalEntriesCount: number;
  approximatePayloadBytes: number;
}

// Decrypted user vault
export interface UserDecryptedVault {
  profile: UserProfile;
  parties: KhataParty[];
  entries: KhataEntry[];
  reminders: KhataReminder[];
  devices: AuthDevice[];
  updatedAt: string;
  ledgerVersion?: number;
}

// Admin panel types (strictly ZERO access to plaintext ledger contents)
export interface AdminUserAccount {
  id: string;
  phoneMasked: string;
  businessNameProvided: boolean;
  deviceCount: number;
  devices: Array<{ id: string; name: string; platform: string; lastActive: string }>;
  encryptedPayloadBytes: number;
  lastSyncAt: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  userId: string;
  eventType: 'USER_REGISTER' | 'ENCRYPTED_VAULT_SYNC' | 'DEVICE_CONNECTED' | 'DEVICE_REVOKED' | 'PIN_UPDATED' | 'RESTORE_COMPLETED';
  platform: string;
  ip: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  timestamp: string;
}

export interface AdminMetrics {
  totalUsers: number;
  activeDevicesCount: number;
  totalEncryptedSyncBytes: number;
  e2eeIntegrityValid: boolean;
  serverStatus: 'HEALTHY' | 'DEGRADED';
  uptimeSeconds: number;
}
