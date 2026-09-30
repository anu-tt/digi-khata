import {
  UserProfile,
  KhataParty,
  KhataEntry,
  KhataReminder,
  AuthDevice,
  DashboardStats,
  PartyBalanceSummary,
  UserDecryptedVault,
} from '../types/khata';

const DB_NAME = 'DigitalKhata_LocalDB_v1';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('parties')) {
        const partyStore = db.createObjectStore('parties', { keyPath: 'id' });
        partyStore.createIndex('type', 'type', { unique: false });
        partyStore.createIndex('userId', 'userId', { unique: false });
      }
      if (!db.objectStoreNames.contains('entries')) {
        const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
        entryStore.createIndex('partyId', 'partyId', { unique: false });
        entryStore.createIndex('userId', 'userId', { unique: false });
        entryStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('reminders')) {
        db.createObjectStore('reminders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('devices')) {
        db.createObjectStore('devices', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Low-level IndexedDB helpers
async function performTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<T> | IDBRequest
): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    let result: any;
    try {
      const res = callback(store);
      if (res instanceof IDBRequest) {
        res.onsuccess = () => {
          result = res.result;
        };
      }
    } catch (err) {
      reject(err);
    }

    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// User Profile Operations
export async function getStoredProfile(): Promise<UserProfile | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('profile', 'readonly');
    const store = tx.objectStore('profile');
    const req = store.getAll();
    req.onsuccess = () => {
      const list = req.result as UserProfile[];
      resolve(list.length > 0 ? list[0] : null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveStoredProfile(profile: UserProfile): Promise<void> {
  await performTx('profile', 'readwrite', (store) => store.put(profile));
}

export async function clearStoredProfile(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('profile', 'readwrite');
  tx.objectStore('profile').clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Parties (Customers & Suppliers) Operations
export async function getAllParties(type?: 'customer' | 'supplier'): Promise<KhataParty[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('parties', 'readonly');
    const store = tx.objectStore('parties');
    const req = store.getAll();
    req.onsuccess = () => {
      let list = req.result as KhataParty[];
      if (type) {
        list = list.filter((p) => p.type === type);
      }
      // Sort newest updated first
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getPartyById(id: string): Promise<KhataParty | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('parties', 'readonly');
    const store = tx.objectStore('parties');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveParty(party: KhataParty): Promise<void> {
  await performTx('parties', 'readwrite', (store) => store.put(party));
}

export async function deleteParty(id: string): Promise<void> {
  const db = await getDB();
  // Delete party and associated entries
  const tx = db.transaction(['parties', 'entries'], 'readwrite');
  tx.objectStore('parties').delete(id);

  const entryStore = tx.objectStore('entries');
  const index = entryStore.index('partyId');
  const req = index.getAllKeys(id);

  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const keys = req.result;
      for (const k of keys) {
        entryStore.delete(k);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Entries (Ledger Transactions) Operations
export async function getAllEntries(partyId?: string): Promise<KhataEntry[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readonly');
    const store = tx.objectStore('entries');
    const req = store.getAll();
    req.onsuccess = () => {
      let list = req.result as KhataEntry[];
      if (partyId) {
        list = list.filter((e) => e.partyId === partyId);
      }
      // Sort by transaction date descending, then createdAt descending
      list.sort((a, b) => {
        const dDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dDiff !== 0) return dDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveEntry(entry: KhataEntry): Promise<void> {
  await performTx('entries', 'readwrite', (store) => store.put(entry));
  // Update party's updatedAt
  const party = await getPartyById(entry.partyId);
  if (party) {
    party.updatedAt = new Date().toISOString();
    await saveParty(party);
  }
}

export async function deleteEntry(id: string): Promise<void> {
  await performTx('entries', 'readwrite', (store) => store.delete(id));
}

// Reminders
export async function getAllReminders(): Promise<KhataReminder[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reminders', 'readonly');
    const store = tx.objectStore('reminders');
    const req = store.getAll();
    req.onsuccess = () => {
      const list = req.result as KhataReminder[];
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveReminder(reminder: KhataReminder): Promise<void> {
  await performTx('reminders', 'readwrite', (store) => store.put(reminder));
}

export async function deleteReminder(id: string): Promise<void> {
  await performTx('reminders', 'readwrite', (store) => store.delete(id));
}

// Devices
export async function getAllDevices(): Promise<AuthDevice[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('devices', 'readonly');
    const store = tx.objectStore('devices');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as AuthDevice[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDevice(device: AuthDevice): Promise<void> {
  await performTx('devices', 'readwrite', (store) => store.put(device));
}

export async function removeDevice(id: string): Promise<void> {
  await performTx('devices', 'readwrite', (store) => store.delete(id));
}

// Calculations: Purely derived from real data records
export function calculatePartyBalance(
  party: KhataParty,
  entries: KhataEntry[]
): PartyBalanceSummary {
  const partyEntries = entries.filter((e) => e.partyId === party.id);

  let totalCredit = 0; // Jama
  let totalDebit = 0;  // Udhaar

  for (const e of partyEntries) {
    if (e.type === 'credit') {
      totalCredit += e.amount;
    } else if (e.type === 'debit') {
      totalDebit += e.amount;
    }
  }

  // Round safely to 2 decimals to prevent floating point inaccuracies
  totalCredit = Math.round(totalCredit * 100) / 100;
  totalDebit = Math.round(totalDebit * 100) / 100;

  let netBalance = 0;
  let status: 'lena_hai' | 'dena_hai' | 'barabar' = 'barabar';

  if (party.type === 'customer') {
    // For Customer: Debit (Udhaar diya) is positive receivable, Credit (Jama mila) reduces receivable
    netBalance = Math.round((totalDebit - totalCredit) * 100) / 100;
    if (netBalance > 0) {
      status = 'lena_hai'; // Aapko Lena Hai
    } else if (netBalance < 0) {
      status = 'dena_hai'; // Aapko Dena Hai (advance received)
    } else {
      status = 'barabar'; // Hisab Barabar
    }
  } else {
    // For Supplier: Credit (Udhaar liya) is payable by you, Debit (Payment diya) reduces payable
    netBalance = Math.round((totalCredit - totalDebit) * 100) / 100;
    if (netBalance > 0) {
      status = 'dena_hai'; // Aapko Dena Hai
    } else if (netBalance < 0) {
      status = 'lena_hai'; // Aapko Lena Hai (advance paid)
    } else {
      status = 'barabar'; // Hisab Barabar
    }
  }

  const lastEntryDate = partyEntries.length > 0 ? partyEntries[0].date : undefined;

  return {
    party,
    totalCredit,
    totalDebit,
    netBalance,
    status,
    lastEntryDate,
    entriesCount: partyEntries.length,
  };
}

export function calculateDashboardStats(
  parties: KhataParty[],
  entries: KhataEntry[]
): DashboardStats {
  const unarchivedParties = parties.filter((p) => !p.isArchived);

  let totalLenaHai = 0;
  let totalDenaHai = 0;
  let customerCount = 0;
  let supplierCount = 0;

  for (const party of unarchivedParties) {
    if (party.type === 'customer') {
      customerCount++;
    } else {
      supplierCount++;
    }

    const summary = calculatePartyBalance(party, entries);

    if (party.type === 'customer') {
      if (summary.netBalance > 0) {
        totalLenaHai += summary.netBalance;
      } else if (summary.netBalance < 0) {
        totalDenaHai += Math.abs(summary.netBalance);
      }
    } else {
      // Supplier
      if (summary.netBalance > 0) {
        totalDenaHai += summary.netBalance;
      } else if (summary.netBalance < 0) {
        totalLenaHai += Math.abs(summary.netBalance);
      }
    }
  }

  totalLenaHai = Math.round(totalLenaHai * 100) / 100;
  totalDenaHai = Math.round(totalDenaHai * 100) / 100;
  const netBalance = Math.round((totalLenaHai - totalDenaHai) * 100) / 100;

  return {
    totalLenaHai,
    totalDenaHai,
    customerCount,
    supplierCount,
    netBalance,
  };
}

// Dump entire local vault for E2EE cloud sync & backup
export async function exportLocalVault(): Promise<UserDecryptedVault | null> {
  const profile = await getStoredProfile();
  if (!profile) return null;

  const parties = await getAllParties();
  const entries = await getAllEntries();
  const reminders = await getAllReminders();
  const devices = await getAllDevices();

  return {
    profile,
    parties,
    entries,
    reminders,
    devices,
    updatedAt: new Date().toISOString(),
  };
}

// Import decrypted vault into local database (e.g. after cloud restore or device switch)
export async function importDecryptedVault(vault: UserDecryptedVault): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['profile', 'parties', 'entries', 'reminders', 'devices'], 'readwrite');

  // Clear existing
  tx.objectStore('profile').clear();
  tx.objectStore('parties').clear();
  tx.objectStore('entries').clear();
  tx.objectStore('reminders').clear();
  tx.objectStore('devices').clear();

  // Populate from vault
  if (vault.profile) {
    tx.objectStore('profile').put(vault.profile);
  }
  for (const p of vault.parties || []) {
    tx.objectStore('parties').put(p);
  }
  for (const e of vault.entries || []) {
    tx.objectStore('entries').put(e);
  }
  for (const r of vault.reminders || []) {
    tx.objectStore('reminders').put(r);
  }
  for (const d of vault.devices || []) {
    tx.objectStore('devices').put(d);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Phone Storage & Persistence Operations
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`Persistent Phone Storage status: ${isPersisted ? 'Granted' : 'Denied'}`);
      return isPersisted;
    } catch (e) {
      console.warn('Persistent storage request failed:', e);
      return false;
    }
  }
  return false;
}

export async function checkStoragePersistence(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persisted) {
    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }
  return false;
}

export async function getStorageEstimate(): Promise<{
  usageMB: number;
  quotaMB: number;
  percentUsed: number;
  isPersisted: boolean;
}> {
  let usageMB = 0;
  let quotaMB = 0;
  let percentUsed = 0;
  let isPersisted = false;

  if (navigator.storage) {
    if (navigator.storage.persisted) {
      try {
        isPersisted = await navigator.storage.persisted();
      } catch {}
    }
    if (navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        usageMB = parseFloat(((estimate.usage || 0) / (1024 * 1024)).toFixed(2));
        quotaMB = parseFloat(((estimate.quota || 0) / (1024 * 1024)).toFixed(0));
        if (quotaMB > 0) {
          percentUsed = parseFloat(((usageMB / quotaMB) * 100).toFixed(2));
        }
      } catch {}
    }
  }

  return { usageMB, quotaMB, percentUsed, isPersisted };
}

// Completely wipe local database
export async function wipeLocalDatabase(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['profile', 'parties', 'entries', 'reminders', 'devices', 'metadata'], 'readwrite');
  tx.objectStore('profile').clear();
  tx.objectStore('parties').clear();
  tx.objectStore('entries').clear();
  tx.objectStore('reminders').clear();
  tx.objectStore('devices').clear();
  tx.objectStore('metadata').clear();

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
