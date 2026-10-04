import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  BookOpen,
  PlusCircle,
  Bell,
  Settings as SettingsIcon,
  RefreshCw,
} from 'lucide-react';
import { AppLayout } from './components/AppLayout';
import { DesktopSidebar } from './components/DesktopSidebar';
import { DesktopKhataView } from './components/DesktopKhataView';
import { Dashboard } from './components/Dashboard';
import { KhataList } from './components/KhataList';
import { PartyDetail } from './components/PartyDetail';
import { RemindersView } from './components/RemindersView';
import { SettingsView } from './components/SettingsView';
import { AddEntryModal } from './components/AddEntryModal';
import { AddPartyModal } from './components/AddPartyModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { PDFModal } from './components/PDFModal';
import { RemindersModal } from './components/RemindersModal';
import { LockScreen } from './components/LockScreen';
import { AuthModal } from './components/AuthModal';
import { CreatePinModal } from './components/CreatePinModal';
import { DeleteAccountModal } from './components/DeleteAccountModal';
import { WebAdminPortal } from './components/WebAdminPortal';
import { ActionToast, ToastMessage } from './components/ActionToast';
import { TytanDoorLogo } from './components/TytanDoorLogo';

import {
  UserProfile,
  KhataParty,
  KhataEntry,
  KhataReminder,
  AuthDevice,
  SyncState,
  PartyType,
  EntryType,
  DashboardStats,
  PartyBalanceSummary,
  UserDecryptedVault,
} from './types/khata';

import {
  getStoredProfile,
  saveStoredProfile,
  clearStoredProfile,
  getAllParties,
  saveParty,
  deleteParty,
  getAllEntries,
  saveEntry,
  deleteEntry,
  getAllReminders,
  saveReminder,
  deleteReminder,
  getAllDevices,
  saveDevice,
  calculatePartyBalance,
  upgradeLocalSupplierLedger,
  upgradeSupplierEntryTypes,
  calculateDashboardStats,
  exportLocalVault,
  importDecryptedVault,
  wipeLocalDatabase,
  requestPersistentStorage,
  getLocalRecoveryPhrase,
  saveLocalRecoveryPhrase,
  migrateLocalAccountData,
} from './lib/storage';

import {
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  fetchUserFirestoreData,
  findLegacyUserIdsByEmail,
  saveEncryptedVaultToFirestore,
  getEncryptedVaultFromFirestore,
  deleteLegacyFirestoreAccount,
  auth,
  onAuthStateChanged,
  deleteAllUserFirestoreData,
  logOutFirebase,
} from './lib/firebase';

import { clearAuthToken } from './lib/api';
import { decryptData, encryptData, generateRecoveryPhrase } from './lib/crypto';

// Route check for secret admin URL: only accessible via /ad-min, #ad-min or ?route=ad-min
function checkIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return path.includes('/ad-min') || hash.includes('#ad-min') || search.includes('route=ad-min');
}

export function App() {
  // Admin route state (ONLY accessible via /ad-min)
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminRoute);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncState, setSyncState] = useState<SyncState>('idle');

  // Navigation: First-class in-page tabs
  const [activeTab, setActiveTab] = useState<'home' | 'customers' | 'suppliers' | 'reminders' | 'settings'>('home');
  const [activePartyId, setActivePartyId] = useState<string | null>(null);
  const [activeKhataType, setActiveKhataType] = useState<PartyType>('customer');

  // Core Data Stores (Zero Dummy Data)
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [parties, setParties] = useState<KhataParty[]>([]);
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [reminders, setReminders] = useState<KhataReminder[]>([]);
  const [devices, setDevices] = useState<AuthDevice[]>([]);

  // Derived Real Statistics
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalLenaHai: 0,
    totalDenaHai: 0,
    customerCount: 0,
    supplierCount: 0,
    netBalance: 0,
  });
  const [partySummaries, setPartySummaries] = useState<Map<string, PartyBalanceSummary>>(new Map());

  // Security & App Lock State (6-Digit PIN)
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCreatePinOpen, setIsCreatePinOpen] = useState<boolean>(false);

  // Modals
  const [isAddPartyOpen, setIsAddPartyOpen] = useState<boolean>(false);
  const [addPartyType, setAddPartyType] = useState<PartyType>('customer');

  const [isAddEntryOpen, setIsAddEntryOpen] = useState<boolean>(false);
  const [addEntryPartyId, setAddEntryPartyId] = useState<string | undefined>(undefined);
  const [addEntryDefaultType, setAddEntryDefaultType] = useState<EntryType>('credit');

  const [selectedEntryDetail, setSelectedEntryDetail] = useState<KhataEntry | null>(null);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState<boolean>(false);
  const [pdfPartyId, setPdfPartyId] = useState<string | undefined>(undefined);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState<boolean>(false);
  const [reminderInitialParty, setReminderInitialParty] = useState<KhataParty | null>(null);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (msg: Omit<ToastMessage, 'id'>) => {
    setToast({
      id: Math.random().toString(36).substring(2, 9),
      ...msg,
    });
  };

  // Listen to browser navigation for /ad-min URL
  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminRoute(checkIsAdminRoute());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleExitAdmin = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  // 1. Initial Load from Local Database & Firestore Sync
  const reloadData = useCallback(async () => {
    try {
      let storedProf = await getStoredProfile();

      // If not in local IndexedDB, check if an authenticated Firebase session exists
      if (!storedProf && auth.currentUser && !isAuthModalOpen) {
        try {
          const cloudProf = await getUserProfileFromFirestore(auth.currentUser.uid);
          if (cloudProf) {
            await saveStoredProfile(cloudProf);
            storedProf = cloudProf;
          }
        } catch (fetchErr) {
          console.warn('Could not fetch cloud profile during boot:', fetchErr);
        }
      }

      if (!storedProf) {
        setIsAuthModalOpen(true);
        setIsInitializing(false);
        return;
      }

      let localSecret = storedProf.recoveryPhrase || await getLocalRecoveryPhrase(storedProf.id) || '';
      let existingEncryptedVault = null;
      if (!localSecret && isOnline) {
        try {
          existingEncryptedVault = await getEncryptedVaultFromFirestore(storedProf.id);
        } catch {}
      }
      if (!localSecret && !existingEncryptedVault) localSecret = generateRecoveryPhrase();
      storedProf.recoveryPhrase = localSecret;
      if (localSecret) await saveLocalRecoveryPhrase(storedProf.id, localSecret);
      await saveStoredProfile(storedProf);

      setProfile(storedProf);
      setIsAuthModalOpen(false);

      // Check 6-digit PIN on app opening: if PIN set, lock screen activates immediately!
      if (storedProf.pinHash) {
        setIsLocked(true);
      } else {
        setIsCreatePinOpen(true);
      }

      await upgradeLocalSupplierLedger(storedProf.id);
      let pList = await getAllParties(storedProf.id);
      let eList = await getAllEntries(storedProf.id);
      const rList = await getAllReminders(storedProf.id);
      const dList = await getAllDevices(storedProf.id);

      // Restore an encrypted cloud snapshot when this device has the recovery phrase.
      if (pList.length === 0 && eList.length === 0 && storedProf.id && isOnline) {
        try {
          const encrypted = existingEncryptedVault || await getEncryptedVaultFromFirestore(storedProf.id);
          if (encrypted) {
            if (!localSecret) throw new Error('Enter your recovery key in Settings to restore this cloud backup.');
            const vault = await decryptData<UserDecryptedVault>(encrypted, localSecret);
            if (vault.profile.id !== storedProf.id) throw new Error('Backup account mismatch.');
            await importDecryptedVault(vault);
            pList = vault.parties;
            eList = vault.entries;
          } else {
            const legacy = await fetchUserFirestoreData(storedProf.id);
            if (legacy.parties.length || legacy.entries.length) {
              for (const party of legacy.parties) await saveParty(party);
              for (const entry of upgradeSupplierEntryTypes(legacy.parties, legacy.entries)) await saveEntry(entry);
              const vault = await exportLocalVault();
              if (vault) await saveEncryptedVaultToFirestore(storedProf.id, await encryptData(vault, localSecret));
              pList = legacy.parties;
              eList = legacy.entries;
            }
          }
        } catch (cloudErr) {
          console.warn('Could not pull initial Firestore data:', cloudErr);
        }
      }

      setParties(pList);
      setEntries(eList);
      setReminders(rList);
      setDevices(dList);

      const summaries = new Map<string, PartyBalanceSummary>();
      for (const p of pList) {
        summaries.set(p.id, calculatePartyBalance(p, eList));
      }
      setPartySummaries(summaries);
      setDashboardStats(calculateDashboardStats(pList, eList));
    } catch (err) {
      console.error('Error loading local khata database:', err);
      setIsAuthModalOpen(true);
    } finally {
      setIsInitializing(false);
    }
  }, [isOnline]);

  useEffect(() => {
    let isSubscribed = true;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!isSubscribed) return;
      if (fbUser && fbUser.emailVerified && !isAuthModalOpen) {
        const stored = await getStoredProfile();
        if (!stored || stored.id !== fbUser.uid) {
          try {
            const cloudProf = await getUserProfileFromFirestore(fbUser.uid);
            if (cloudProf) {
              await saveStoredProfile(cloudProf);
              await reloadData();
            }
          } catch (e) {
            console.warn('Auth state sync notice:', e);
          }
        }
      }
    });

    reloadData();
    requestPersistentStorage().catch(() => {});

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [reloadData]);

  useEffect(() => {
    const summaries = new Map<string, PartyBalanceSummary>();
    for (const p of parties) {
      summaries.set(p.id, calculatePartyBalance(p, entries));
    }
    setPartySummaries(summaries);
    setDashboardStats(calculateDashboardStats(parties, entries));
  }, [parties, entries]);

  // 2. Synchronization Logic (Firestore Cloud & Vault API)
  const triggerSync = async (): Promise<boolean> => {
    if (!profile || !isOnline || auth.currentUser?.uid !== profile.id) {
      setSyncState('pending');
      return false;
    }

    setSyncState('syncing');

    try {
      const activeProfile = await getStoredProfile();
      if (!activeProfile || activeProfile.id !== profile.id || !activeProfile.recoveryPhrase) {
        throw new Error('Cloud recovery key missing.');
      }
      const localParties = await getAllParties(profile.id);
      const localEntries = await getAllEntries(profile.id);
      const localReminders = await getAllReminders(profile.id);
      const currentCloud = await getEncryptedVaultFromFirestore(profile.id);
      let legacyAccountsToDelete: string[] = [];
      if (currentCloud) {
        // Never overwrite a cloud backup unless this recovery key can decrypt it.
        const cloudVault = await decryptData<UserDecryptedVault>(currentCloud, activeProfile.recoveryPhrase);
        if (cloudVault.profile.id !== profile.id) throw new Error('Backup account mismatch.');
        if (localParties.length === 0 && localEntries.length === 0 && localReminders.length === 0 &&
            (cloudVault.parties.length > 0 || cloudVault.entries.length > 0 || cloudVault.reminders.length > 0)) {
          await importDecryptedVault(cloudVault);
          setParties(cloudVault.parties);
          setEntries(cloudVault.entries);
          setReminders(cloudVault.reminders);
          setSyncState('success');
          return true;
        }
      } else {
        // Preserve cloud records from the previous plaintext format before migrating them.
        const legacy = await fetchUserFirestoreData(profile.id);
        const legacyIds = activeProfile.email ? await findLegacyUserIdsByEmail(activeProfile.email, profile.id) : [];
        const legacyParties = [...legacy.parties];
        const legacyEntries = [...legacy.entries];
        for (const legacyId of legacyIds) {
          const oldAccount = await fetchUserFirestoreData(legacyId);
          legacyParties.push(...oldAccount.parties);
          legacyEntries.push(...oldAccount.entries);
        }
        legacyAccountsToDelete = legacyIds;
        for (const party of legacyParties) await saveParty({ ...party, userId: profile.id });
        for (const entry of upgradeSupplierEntryTypes(legacyParties, legacyEntries)) await saveEntry({ ...entry, userId: profile.id });
      }
      const vault = await exportLocalVault();
      if (!vault) throw new Error('Local backup unavailable.');
      const encrypted = await encryptData(vault, activeProfile.recoveryPhrase);
      await saveEncryptedVaultToFirestore(profile.id, encrypted);
      for (const legacyId of legacyAccountsToDelete) await deleteLegacyFirestoreAccount(legacyId);

      setSyncState('success');
      setTimeout(() => setSyncState('idle'), 4000);
      return true;
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncState('error');
      return false;
    }
  };

  // 3. Cloud Restore
  const handleRestoreCloudVault = async () => {
    if (!profile || auth.currentUser?.uid !== profile.id) throw new Error('Cloud account mein sign in karein.');
    if (!isOnline) throw new Error('Internet nahi hai.');

    const encrypted = await getEncryptedVaultFromFirestore(profile.id);
    if (encrypted) {
      const vault = await decryptData<UserDecryptedVault>(encrypted, profile.recoveryPhrase || '');
      if (vault.profile.id !== profile.id) throw new Error('Backup account mismatch.');
      await importDecryptedVault(vault);
      await reloadData();
      return;
    }

    // Import legacy plaintext Firestore data once, then replace it with ciphertext.
    const legacy = await fetchUserFirestoreData(profile.id);
    if (!legacy.parties.length && !legacy.entries.length) throw new Error('Cloud par koi backup nahi mila.');
    for (const party of legacy.parties) await saveParty(party);
    for (const entry of upgradeSupplierEntryTypes(legacy.parties, legacy.entries)) await saveEntry(entry);
    const migratedVault = await exportLocalVault();
    if (!migratedVault || !profile.recoveryPhrase) throw new Error('Cloud recovery key missing.');
    await saveEncryptedVaultToFirestore(profile.id, await encryptData(migratedVault, profile.recoveryPhrase));
    await reloadData();
  };

  // 4. Offline Decrypted JSON Export
  const handleExportLocalData = async () => {
    const vault = await exportLocalVault();
    if (!vault) return;
    const blob = new Blob([JSON.stringify(vault, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DigitalKhata_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 5. Auth Success handler
  const handleAuthSuccess = async (newProfile: UserProfile, device: AuthDevice) => {
    const previousProfile = await getStoredProfile();
    if (previousProfile?.email && newProfile.email && previousProfile.id !== newProfile.id &&
        previousProfile.email.trim().toLowerCase() === newProfile.email.trim().toLowerCase()) {
      await migrateLocalAccountData(previousProfile.id, newProfile.id);
      newProfile = {
        ...previousProfile,
        ...newProfile,
        pinHash: previousProfile.pinHash,
        pinSalt: previousProfile.pinSalt,
        securityQuestion: previousProfile.securityQuestion,
        securityAnswerHash: previousProfile.securityAnswerHash,
        isBiometricEnabled: previousProfile.isBiometricEnabled,
      };
    }
    let encryptedSnapshot = null;
    if (isOnline) {
      try {
        encryptedSnapshot = await getEncryptedVaultFromFirestore(newProfile.id);
      } catch {}
    }
    newProfile.recoveryPhrase = newProfile.recoveryPhrase || await getLocalRecoveryPhrase(newProfile.id) || (encryptedSnapshot ? '' : generateRecoveryPhrase());
    if (newProfile.recoveryPhrase) await saveLocalRecoveryPhrase(newProfile.id, newProfile.recoveryPhrase);
    device.userId = newProfile.id;
    await saveStoredProfile(newProfile);
    try {
      await saveUserProfileToFirestore(newProfile);
    } catch (profileErr) {
      console.warn('Cloud profile save note:', profileErr);
    }
    await saveDevice(device);
    setProfile(newProfile);
    setDevices([device]);
    setIsAuthModalOpen(false);

    // If profile has no 6-digit PIN yet, trigger creation
    if (!newProfile.pinHash) {
      setIsCreatePinOpen(true);
    }

    // Restore the encrypted snapshot if this device has the matching recovery phrase.
    let restoredOrMigrated = false;
    try {
      if (newProfile.id && isOnline) {
        const encrypted = encryptedSnapshot || await getEncryptedVaultFromFirestore(newProfile.id);
        if (encrypted) {
          if (!newProfile.recoveryPhrase) throw new Error('Enter your recovery key in Settings to restore this cloud backup.');
          const vault = await decryptData<UserDecryptedVault>(encrypted, newProfile.recoveryPhrase);
          if (vault.profile.id !== newProfile.id) throw new Error('Backup account mismatch.');
          await importDecryptedVault(vault);
          setParties(vault.parties);
          setEntries(vault.entries);
          setReminders(vault.reminders);
          restoredOrMigrated = true;
        } else {
          const legacy = await fetchUserFirestoreData(newProfile.id);
          const legacyUserIds = newProfile.email
            ? await findLegacyUserIdsByEmail(newProfile.email, newProfile.id)
            : [];
          const legacyParties = [...legacy.parties];
          const legacyEntries = [...legacy.entries];
          for (const legacyId of legacyUserIds) {
            const oldAccount = await fetchUserFirestoreData(legacyId);
            legacyParties.push(...oldAccount.parties);
            legacyEntries.push(...oldAccount.entries);
          }
          if (legacyParties.length || legacyEntries.length) {
            for (const party of legacyParties) await saveParty({ ...party, userId: newProfile.id });
            for (const entry of upgradeSupplierEntryTypes(legacyParties, legacyEntries)) await saveEntry({ ...entry, userId: newProfile.id });
            const vault = await exportLocalVault();
            if (vault) await saveEncryptedVaultToFirestore(newProfile.id, await encryptData(vault, newProfile.recoveryPhrase));
            for (const legacyId of legacyUserIds) await deleteLegacyFirestoreAccount(legacyId);
            setParties(legacyParties.map((party) => ({ ...party, userId: newProfile.id })));
            setEntries(legacyEntries.map((entry) => ({ ...entry, userId: newProfile.id })));
            restoredOrMigrated = true;
          } else {
            const vault = await exportLocalVault();
            if (vault) await saveEncryptedVaultToFirestore(newProfile.id, await encryptData(vault, newProfile.recoveryPhrase));
            restoredOrMigrated = true;
          }
        }
      }
    } catch (e) {
      console.warn('Initial pull note:', e);
    }

    setSyncState(!isOnline ? 'pending' : restoredOrMigrated ? 'success' : 'error');
  };

  // 6. Continue Offline handler
  const handleContinueOffline = async (offlineProfile: UserProfile) => {
    await saveStoredProfile(offlineProfile);
    const dev: AuthDevice = {
      id: 'local_dev_1',
      name: 'Local Device',
      platform: 'android',
      lastActive: new Date().toISOString(),
      isCurrent: true,
      createdAt: new Date().toISOString(),
    };
    await saveDevice(dev);
    setProfile(offlineProfile);
    setDevices([dev]);
    setIsAuthModalOpen(false);

    if (!offlineProfile.pinHash) {
      setIsCreatePinOpen(true);
    }
  };

  // Complete Logout / Sign Off Handler
  const handleLogout = async () => {
    try {
      await logOutFirebase();
    } catch (fbErr) {
      console.warn('Firebase logout error:', fbErr);
    }
    clearAuthToken();
    try {
      await clearStoredProfile();
      localStorage.removeItem('digital_khata_profile');
      sessionStorage.clear();
    } catch {}

    setProfile(null);
    setParties([]);
    setEntries([]);
    setReminders([]);
    setDevices([]);
    setIsLocked(false);
    setIsCreatePinOpen(false);
    setActiveTab('home');
    setActivePartyId(null);

    setIsAuthModalOpen(true);
    showToast({
      type: 'success',
      text: 'Aapka account poori tarah logout ho gaya hai.',
    });
  };

  // 7. PIN Creation completion handler
  const handlePinCreated = async (updatedProfile: UserProfile) => {
    await saveStoredProfile(updatedProfile);
    setProfile(updatedProfile);
    setIsCreatePinOpen(false);
    setIsLocked(false);

    // Save to Firestore if connected
    if (isOnline && updatedProfile.id) {
      try {
        await saveUserProfileToFirestore(updatedProfile);
      } catch {}
    }
    triggerSync();
  };

  // 8. Reset PIN with Security Answer in LockScreen
  const handleResetPINWithSecurityAnswer = async (newPinHash: string, newSalt: string) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      pinHash: newPinHash,
      pinSalt: newSalt,
      updatedAt: new Date().toISOString(),
    };
    await saveStoredProfile(updated);
    setProfile(updated);
    setIsLocked(false);

    if (isOnline && updated.id) {
      try {
        await saveUserProfileToFirestore(updated);
      } catch {}
    }
    triggerSync();
  };

  // 9. Add Party handler
  const handleSaveParty = async (partyData: Omit<KhataParty, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived'>) => {
    const newParty: KhataParty = {
      id: 'pty_' + Math.random().toString(36).substring(2, 9),
      userId: profile?.id || 'local',
      ...partyData,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveParty(newParty);
    setParties((prev) => [newParty, ...prev]);

    showToast({
      type: 'success',
      text: `${newParty.name} (${newParty.type === 'customer' ? 'Customer' : 'Supplier'}) add ho gaye!`,
    });

    triggerSync();
  };

  // 10. Add Entry handler
  const handleSaveEntry = async (entryData: Omit<KhataEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
    const newEntry: KhataEntry = {
      id: 'ent_' + Math.random().toString(36).substring(2, 9),
      userId: profile?.id || 'local',
      ...entryData,
      syncStatus: isOnline ? 'synced' : 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveEntry(newEntry);
    setEntries((prev) => [newEntry, ...prev]);

    showToast({
      type: 'success',
      text: `₹${newEntry.amount.toLocaleString('en-IN')} ki nayi entry save ho gayi!`,
    });

    triggerSync();
  };

  // 11. Delete Entry
  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));

    showToast({
      type: 'delete',
      text: 'Entry delete ho gayi.',
    });

    triggerSync();
  };

  // 12. Delete Party
  const handleDeleteParty = async (id: string) => {
    const p = parties.find((party) => party.id === id);
    await deleteParty(id);
    setParties((prev) => prev.filter((party) => party.id !== id));
    setEntries((prev) => prev.filter((e) => e.partyId !== id));
    if (activePartyId === id) setActivePartyId(null);

    showToast({
      type: 'delete',
      text: `${p?.name || 'Party'} khata delete ho gaya.`,
    });

    triggerSync();
  };

  // 13. Toggle Archive Party
  const handleToggleArchiveParty = async (party: KhataParty) => {
    const updated: KhataParty = {
      ...party,
      isArchived: !party.isArchived,
      updatedAt: new Date().toISOString(),
    };
    await saveParty(updated);
    setParties((prev) => prev.map((p) => (p.id === party.id ? updated : p)));

    showToast({
      type: 'info',
      text: `${party.name} ${updated.isArchived ? 'archived ho gaye' : 'unarchived ho gaye'}.`,
    });

    triggerSync();
  };

  // 14. Reminders Handlers
  const handleAddReminder = async (remData: Omit<KhataReminder, 'id' | 'userId' | 'createdAt' | 'completed'>) => {
    const newRem: KhataReminder = {
      id: 'rem_' + Math.random().toString(36).substring(2, 9),
      userId: profile?.id || 'local',
      completed: false,
      createdAt: new Date().toISOString(),
      ...remData,
    };
    await saveReminder(newRem);
    setReminders((prev) => [newRem, ...prev]);

    showToast({
      type: 'success',
      text: 'Naya reminder add ho gaya!',
    });

    triggerSync();
  };

  const handleToggleReminderComplete = async (id: string, completed: boolean) => {
    const target = reminders.find((r) => r.id === id);
    if (!target) return;
    const updated = { ...target, completed };
    await saveReminder(updated);
    setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));

    showToast({
      type: completed ? 'success' : 'info',
      text: completed ? 'Reminder poora mark ho gaya!' : 'Reminder pending mark hua.',
    });

    triggerSync();
  };

  const handleDeleteReminder = async (id: string) => {
    await deleteReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));

    showToast({
      type: 'delete',
      text: 'Reminder delete ho gaya.',
    });

    triggerSync();
  };

  // 15. Delete Account & Wipe All Cloud and Local Data
  const handleExecuteDeleteAccount = async () => {
    try {
      // 1. Delete all user data from Firestore Cloud
      if (profile?.id && isOnline) {
        try {
          await deleteAllUserFirestoreData(profile.id);
        } catch (cloudErr) {
          console.warn('Firestore cloud cleanup error:', cloudErr);
        }
      }

      // 2. Wipe entire local IndexedDB database
      await wipeLocalDatabase();

      // 3. Clear local session tokens & storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}

      // 4. Log out of Firebase Auth
      try {
        await logOutFirebase();
      } catch {}

      // 5. Reset all active memory states to refresh database completely
      setProfile(null);
      setParties([]);
      setEntries([]);
      setReminders([]);
      setDevices([]);
      setIsLocked(false);
      setIsCreatePinOpen(false);
      setIsDeleteAccountOpen(false);

      // 6. Open AuthModal for fresh account setup
      setIsAuthModalOpen(true);
    } catch (err: any) {
      throw new Error(err.message || 'Account delete karne mein samasya aayi.');
    }
  };

  // Active party object for mobile party detail view
  const activeParty = activePartyId ? parties.find((p) => p.id === activePartyId) : null;
  const activeSummary = activeParty
    ? partySummaries.get(activeParty.id) || calculatePartyBalance(activeParty, entries)
    : null;

  const pendingRemindersCount = reminders.filter((r) => !r.completed).length;

  // Fallback safe profile for components that require UserProfile
  const currentProfile: UserProfile = profile || {
    id: 'guest',
    name: 'Vyapari',
    isBiometricEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <>
      <AppLayout
      profile={profile}
      isOnline={isOnline}
      onToggleOnline={() => setIsOnline(!isOnline)}
      syncState={syncState}
      onTriggerSync={triggerSync}
      onOpenSettings={() => {
        setActiveTab('settings');
        setActivePartyId(null);
      }}
    >
      {/* 1. ADMIN ROUTE: Rendered ONLY if URL matches /ad-min */}
      {isAdminRoute ? (
        <WebAdminPortal onBackToApp={handleExitAdmin} />
      ) : isInitializing ? (
        /* Smooth Security Preloader - Prevents unauthenticated dashboard flash */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-slate-900 text-white min-h-[60vh]">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 shadow-xl border border-white/20 animate-pulse">
            <TytanDoorLogo variant="icon" size="lg" lightBackground={false} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Digital Khata</h2>
          <p className="text-xs text-emerald-400 font-medium mt-1">Simple & Secure Business Ledger</p>
          <div className="flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-slate-800/80 border border-emerald-500/20 text-xs text-emerald-100 shadow-sm">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Surakshit khata load ho raha hai...</span>
          </div>
        </div>
      ) : isAuthModalOpen ? (
        <AuthModal
          isOpen={isAuthModalOpen}
          onSuccess={handleAuthSuccess}
          onContinueOffline={handleContinueOffline}
        />
      ) : isLocked && profile ? (
        /* Lock Screen with 6-Digit PIN & Security Question Recovery */
        <LockScreen
          profile={profile}
          onUnlock={() => setIsLocked(false)}
          onResetPINWithSecurityAnswer={handleResetPINWithSecurityAnswer}
        />
      ) : (
        /* MAIN APPLICATION WORKSPACE */
        <div className="flex-1 flex w-full min-h-0 overflow-hidden">
          {/* ======================================================== */}
          {/* PC / DESKTOP LAYOUT (VISIBLE ON LARGE SCREENS >= lg)     */}
          {/* ======================================================== */}
          <div className="hidden lg:flex flex-1 w-full overflow-hidden">
            {/* Desktop Left Sidebar */}
            <DesktopSidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setActivePartyId(null);
              }}
              onOpenAddEntry={() => {
                setAddEntryPartyId(undefined);
                setIsAddEntryOpen(true);
              }}
              onOpenAddParty={(type) => {
                setAddPartyType(type);
                setIsAddPartyOpen(true);
              }}
              onOpenSettings={() => {
                setActiveTab('settings');
                setActivePartyId(null);
              }}
              profile={profile}
              pendingRemindersCount={pendingRemindersCount}
              syncState={syncState}
              onTriggerSync={triggerSync}
            />

            {/* Desktop Main 2-Pane Work Area */}
            <main className="flex-1 flex overflow-hidden bg-slate-100">
              {activeTab === 'settings' && profile ? (
                <div className="flex-1 overflow-y-auto">
                  <SettingsView
                    profile={profile}
                    onBackToHome={() => setActiveTab('home')}
                    onUpdateProfile={async (updated) => {
                      const newProf = { ...profile, ...updated, updatedAt: new Date().toISOString() };
                      if (updated.recoveryPhrase) {
                        newProf.recoveryPhrase = updated.recoveryPhrase.trim().replace(/\s+/g, ' ').toLowerCase();
                        await saveLocalRecoveryPhrase(newProf.id, newProf.recoveryPhrase);
                      }
                      await saveStoredProfile(newProf);
                      setProfile(newProf);
                      if (isOnline && newProf.id) {
                        try {
                          await saveUserProfileToFirestore(newProf);
                        } catch {}
                      }
                      triggerSync();
                    }}
                    onManualSync={async () => {
                      if (!(await triggerSync())) throw new Error('Sync failed. Check the recovery key and connection.');
                    }}
                    onRestoreCloudVault={handleRestoreCloudVault}
                    onExportLocalData={handleExportLocalData}
                    onDeleteAccount={() => {
                      setIsDeleteAccountOpen(true);
                    }}
                    onLogout={handleLogout}
                  />
                </div>
              ) : (
                <DesktopKhataView
                  activeTab={activeTab === 'settings' ? 'home' : activeTab}
                  profile={currentProfile}
                  stats={dashboardStats}
                  parties={parties}
                  entries={entries}
                  reminders={reminders}
                  partySummaries={partySummaries}
                  activePartyId={activePartyId}
                  onSelectParty={(id) => setActivePartyId(id)}
                  onOpenAddParty={(type) => {
                    setAddPartyType(type);
                    setIsAddPartyOpen(true);
                  }}
                  onOpenAddEntry={(partyId, defType) => {
                    setAddEntryPartyId(partyId);
                    setAddEntryDefaultType(defType || 'credit');
                    setIsAddEntryOpen(true);
                  }}
                  onOpenPDF={(partyId?: string) => {
                    setPdfPartyId(partyId);
                    setIsPDFModalOpen(true);
                  }}
                  onSelectEntryDetail={(entry) => setSelectedEntryDetail(entry)}
                  onOpenReminderModal={(party) => {
                    setReminderInitialParty(party || null);
                    setIsRemindersModalOpen(true);
                  }}
                  onToggleReminderComplete={handleToggleReminderComplete}
                  onDeleteReminder={handleDeleteReminder}
                  onToggleArchiveParty={handleToggleArchiveParty}
                  onDeleteParty={handleDeleteParty}
                />
              )}
            </main>
          </div>

          {/* ======================================================== */}
          {/* MOBILE & TABLET LAYOUT (VISIBLE ON SCREENS < lg)        */}
          {/* ======================================================== */}
          <div className="flex-1 min-h-0 flex flex-col lg:hidden w-full overflow-hidden relative bg-slate-50">
            {activeParty && activeSummary ? (
              <PartyDetail
                party={activeParty}
                summary={activeSummary}
                entries={entries.filter((e) => e.partyId === activeParty.id)}
                onBack={() => setActivePartyId(null)}
                onOpenAddEntry={(partyId, defType) => {
                  setAddEntryPartyId(partyId);
                  setAddEntryDefaultType(defType);
                  setIsAddEntryOpen(true);
                }}
                onSelectEntryDetail={(entry) => setSelectedEntryDetail(entry)}
                onOpenPDF={(partyId) => {
                  setPdfPartyId(partyId);
                  setIsPDFModalOpen(true);
                }}
                onOpenReminderModal={(party) => {
                  setReminderInitialParty(party);
                  setIsRemindersModalOpen(true);
                }}
                onToggleArchiveParty={handleToggleArchiveParty}
                onDeleteParty={handleDeleteParty}
              />
            ) : (
              <>
                {activeTab === 'home' && (
                  <Dashboard
                    profile={currentProfile}
                    stats={dashboardStats}
                    parties={parties}
                    entries={entries}
                    partySummaries={partySummaries}
                    onSelectParty={(partyId) => setActivePartyId(partyId)}
                    onOpenAddParty={(type) => {
                      setAddPartyType(type);
                      setIsAddPartyOpen(true);
                    }}
                    onOpenAddEntry={(partyId, defType) => {
                      setAddEntryPartyId(partyId);
                      setAddEntryDefaultType(defType || 'credit');
                      setIsAddEntryOpen(true);
                    }}
                    onOpenPDF={(partyId) => {
                      setPdfPartyId(partyId);
                      setIsPDFModalOpen(true);
                    }}
                    onSelectEntryDetail={(entry) => setSelectedEntryDetail(entry)}
                    onGoToKhataTab={() => setActiveTab('customers')}
                  />
                )}

                {(activeTab === 'customers' || activeTab === 'suppliers') && (
                  <KhataList
                    parties={parties}
                    summaries={partySummaries}
                    activeType={activeKhataType}
                    onChangeType={(type) => {
                      setActiveKhataType(type);
                      setActiveTab(type === 'customer' ? 'customers' : 'suppliers');
                    }}
                    onSelectParty={(partyId) => setActivePartyId(partyId)}
                    onOpenAddParty={(type) => {
                      setAddPartyType(type);
                      setIsAddPartyOpen(true);
                    }}
                  />
                )}

                {activeTab === 'reminders' && (
                  <RemindersView
                    parties={parties}
                    reminders={reminders}
                    onBackToHome={() => setActiveTab('home')}
                    onAddReminder={handleAddReminder}
                    onToggleComplete={handleToggleReminderComplete}
                    onDeleteReminder={handleDeleteReminder}
                  />
                )}

                {activeTab === 'settings' && profile && (
                  <SettingsView
                    profile={profile}
                    onBackToHome={() => setActiveTab('home')}
                    onUpdateProfile={async (updated) => {
                      const newProf = { ...profile, ...updated, updatedAt: new Date().toISOString() };
                      if (updated.recoveryPhrase) {
                        newProf.recoveryPhrase = updated.recoveryPhrase.trim().replace(/\s+/g, ' ').toLowerCase();
                        await saveLocalRecoveryPhrase(newProf.id, newProf.recoveryPhrase);
                      }
                      await saveStoredProfile(newProf);
                      setProfile(newProf);
                      if (isOnline && newProf.id) {
                        try {
                          await saveUserProfileToFirestore(newProf);
                        } catch {}
                      }
                      triggerSync();
                    }}
                    onManualSync={async () => {
                      if (!(await triggerSync())) throw new Error('Sync failed. Check the recovery key and connection.');
                    }}
                    onRestoreCloudVault={handleRestoreCloudVault}
                    onExportLocalData={handleExportLocalData}
                    onDeleteAccount={() => {
                      setIsDeleteAccountOpen(true);
                    }}
                    onLogout={handleLogout}
                  />
                )}

                {/* Mobile Bottom Navigation Bar (Always on top with z-50, highly visible and clickable) */}
                <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 h-16 px-4 flex items-center justify-around z-50 shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
                  <button
                    onClick={() => {
                      setActiveTab('home');
                      setActivePartyId(null);
                    }}
                    className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition ${
                      activeTab === 'home' && !activeParty
                        ? 'text-emerald-700 font-extrabold'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Home className="w-5 h-5" />
                    <span className="text-[10px]">Home</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('customers');
                      setActiveKhataType('customer');
                      setActivePartyId(null);
                    }}
                    className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition ${
                      (activeTab === 'customers' || activeTab === 'suppliers') && !activeParty
                        ? 'text-emerald-700 font-extrabold'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="text-[10px]">Khata</span>
                  </button>

                  {/* Floating Quick Action */}
                  <button
                    onClick={() => {
                      const fallbackParty = activeParty?.id || (activeTab === 'suppliers' || activeKhataType === 'supplier'
                        ? parties.find(p => p.type === 'supplier')?.id
                        : undefined);
                      setAddEntryPartyId(fallbackParty);
                      setIsAddEntryOpen(true);
                    }}
                    className="w-12 h-12 -mt-5 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white shadow-lg flex items-center justify-center transition active:scale-95 border-2 border-white"
                    title="Entry Add Karein"
                  >
                    <PlusCircle className="w-6 h-6" />
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('reminders');
                      setActivePartyId(null);
                    }}
                    className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl relative transition ${
                      activeTab === 'reminders' && !activeParty
                        ? 'text-emerald-700 font-extrabold'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    {pendingRemindersCount > 0 && (
                      <span className="absolute top-0.5 right-2.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {pendingRemindersCount}
                      </span>
                    )}
                    <span className="text-[10px]">Reminders</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setActivePartyId(null);
                    }}
                    className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition ${
                      activeTab === 'settings' && !activeParty
                        ? 'text-emerald-700 font-extrabold'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <SettingsIcon className="w-5 h-5" />
                    <span className="text-[10px]">Settings</span>
                  </button>
                </nav>
              </>
            )}
          </div>
        </div>
      )}
    </AppLayout>

    {/* ======================================================== */}
    {/* GLOBAL MODALS (Root level - rendered above all layouts) */}
    {/* ======================================================== */}

    {/* 2. On App Opening 6-Digit PIN Creation Modal */}
    {profile && (
      <CreatePinModal
        isOpen={isCreatePinOpen}
        profile={profile}
        onPinCreated={handlePinCreated}
        onSkip={() => setIsCreatePinOpen(false)}
      />
    )}

    <AddPartyModal
      isOpen={isAddPartyOpen}
      type={addPartyType}
      onClose={() => setIsAddPartyOpen(false)}
      onSave={handleSaveParty}
    />

    <AddEntryModal
      isOpen={isAddEntryOpen}
      parties={parties}
      defaultPartyId={addEntryPartyId}
      defaultType={addEntryDefaultType}
      defaultPartyType={activeParty?.type || (activeTab === 'suppliers' ? 'supplier' : activeKhataType)}
      onClose={() => setIsAddEntryOpen(false)}
      onSave={handleSaveEntry}
    />

    <TransactionDetailModal
      entry={selectedEntryDetail}
      parties={parties}
      onClose={() => setSelectedEntryDetail(null)}
      onDeleteEntry={handleDeleteEntry}
    />

    {profile && (
      <PDFModal
        isOpen={isPDFModalOpen}
        parties={parties}
        entries={entries}
        profile={profile}
        initialPartyId={pdfPartyId}
        onClose={() => setIsPDFModalOpen(false)}
      />
    )}

    {/* Popup Reminder modal when adding directly from party/desktop */}
    <RemindersModal
      isOpen={isRemindersModalOpen}
      parties={parties}
      reminders={reminders}
      initialParty={reminderInitialParty}
      onClose={() => setIsRemindersModalOpen(false)}
      onAddReminder={handleAddReminder}
      onToggleComplete={handleToggleReminderComplete}
      onDeleteReminder={handleDeleteReminder}
    />

    {/* 3. Delete Account & Refresh Database Confirmation Modal */}
    <DeleteAccountModal
      isOpen={isDeleteAccountOpen}
      profile={profile}
      onClose={() => setIsDeleteAccountOpen(false)}
      onConfirmDelete={handleExecuteDeleteAccount}
    />

    {/* Action Notification Toast */}
    <ActionToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

export default App;
