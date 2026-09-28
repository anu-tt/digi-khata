import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  BookOpen,
  PlusCircle,
  Bell,
  Settings as SettingsIcon,
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
} from './types/khata';

import {
  getStoredProfile,
  saveStoredProfile,
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
  calculateDashboardStats,
  exportLocalVault,
  importDecryptedVault,
  wipeLocalDatabase,
} from './lib/storage';

import {
  saveUserProfileToFirestore,
  savePartyToFirestore,
  deletePartyFromFirestore,
  saveTransactionToFirestore,
  deleteTransactionFromFirestore,
  fetchUserFirestoreData,
  syncAllToFirestore,
  deleteAllUserFirestoreData,
  logOutFirebase,
} from './lib/firebase';

import { encryptData, decryptData } from './lib/crypto';
import { pushEncryptedVaultApi, pullEncryptedVaultApi } from './lib/api';

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
      const storedProf = await getStoredProfile();
      if (!storedProf) {
        setIsAuthModalOpen(true);
        return;
      }

      setProfile(storedProf);

      // Check 6-digit PIN on app opening: if PIN set, lock screen activates immediately!
      if (storedProf.pinHash) {
        setIsLocked(true);
      } else {
        setIsCreatePinOpen(true);
      }

      let pList = await getAllParties();
      let eList = await getAllEntries();
      const rList = await getAllReminders();
      const dList = await getAllDevices();

      // If local database is empty but user is logged in, attempt to fetch from Firestore Cloud
      if (pList.length === 0 && eList.length === 0 && storedProf.id && isOnline) {
        try {
          const cloudData = await fetchUserFirestoreData(storedProf.id);
          if (cloudData && (cloudData.parties.length > 0 || cloudData.entries.length > 0)) {
            for (const p of cloudData.parties) {
              await saveParty(p);
            }
            for (const e of cloudData.entries) {
              await saveEntry(e);
            }
            pList = cloudData.parties;
            eList = cloudData.entries;
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
    }
  }, [isOnline]);

  useEffect(() => {
    reloadData();
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
  const triggerSync = async () => {
    if (!profile || !isOnline) {
      setSyncState('pending');
      return;
    }

    setSyncState('syncing');

    try {
      // Sync to Firebase Firestore
      try {
        await syncAllToFirestore(profile.id, parties, entries, profile);
      } catch (fbErr) {
        console.warn('Firestore sync note:', fbErr);
      }

      // Sync encrypted payload to server vault
      const vault = await exportLocalVault();
      if (vault) {
        const secretKey = profile.recoveryPhrase || profile.email || profile.id;
        const encryptedPayload = await encryptData(vault, secretKey);
        const currentDev = devices.find((d) => d.isCurrent) || devices[0];

        await pushEncryptedVaultApi({
          email: profile.email || profile.phone || profile.id,
          deviceId: currentDev?.id || 'dev_primary',
          encryptedPayload,
          approximateBytes: encryptedPayload.ciphertext.length,
          totalEntriesCount: entries.length,
        });
      }

      setSyncState('success');
      setTimeout(() => setSyncState('idle'), 4000);
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncState('error');
    }
  };

  // 3. Cloud Restore
  const handleRestoreCloudVault = async () => {
    if (!profile) throw new Error('Pehle login karein.');
    if (!isOnline) throw new Error('Internet nahi hai.');

    // Attempt restore from Firestore first
    try {
      const cloudData = await fetchUserFirestoreData(profile.id);
      if (cloudData && (cloudData.parties.length > 0 || cloudData.entries.length > 0)) {
        for (const p of cloudData.parties) {
          await saveParty(p);
        }
        for (const e of cloudData.entries) {
          await saveEntry(e);
        }
        await reloadData();
        return;
      }
    } catch {}

    const res = await pullEncryptedVaultApi(profile.email || profile.phone || profile.id);
    if (!res || !res.encryptedPayload) {
      throw new Error('Cloud par koi backup nahi mila.');
    }

    const secretKey = profile.recoveryPhrase || profile.email || profile.id;
    const decryptedVault = await decryptData<any>(res.encryptedPayload, secretKey);
    if (!decryptedVault || !decryptedVault.parties) {
      throw new Error('Decryption asafal rahi.');
    }

    await importDecryptedVault(decryptedVault);
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
    await saveStoredProfile(newProfile);
    await saveDevice(device);
    setProfile(newProfile);
    setDevices([device]);
    setIsAuthModalOpen(false);

    // If profile has no 6-digit PIN yet, trigger creation
    if (!newProfile.pinHash) {
      setIsCreatePinOpen(true);
    }

    // Pull any existing data for this user from Firestore
    try {
      if (newProfile.id && isOnline) {
        const cloudData = await fetchUserFirestoreData(newProfile.id);
        if (cloudData && (cloudData.parties.length > 0 || cloudData.entries.length > 0)) {
          for (const p of cloudData.parties) {
            await saveParty(p);
          }
          for (const e of cloudData.entries) {
            await saveEntry(e);
          }
          setParties(cloudData.parties);
          setEntries(cloudData.entries);
        }
      }
    } catch (e) {
      console.warn('Initial pull note:', e);
    }

    triggerSync();
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

    if (isOnline && profile?.id) {
      try {
        await savePartyToFirestore(profile.id, newParty);
      } catch (err) {
        console.warn('Firestore party save note:', err);
      }
    }

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

    if (isOnline && profile?.id) {
      try {
        await saveTransactionToFirestore(profile.id, newEntry);
      } catch (err) {
        console.warn('Firestore transaction save note:', err);
      }
    }

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

    if (isOnline && profile?.id) {
      try {
        await deleteTransactionFromFirestore(profile.id, id);
      } catch {}
    }

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

    if (isOnline && profile?.id) {
      try {
        await deletePartyFromFirestore(profile.id, id);
      } catch {}
    }

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

    if (isOnline && profile?.id) {
      try {
        await savePartyToFirestore(profile.id, updated);
      } catch {}
    }

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
                      await saveStoredProfile(newProf);
                      setProfile(newProf);
                      if (isOnline && newProf.id) {
                        try {
                          await saveUserProfileToFirestore(newProf);
                        } catch {}
                      }
                      triggerSync();
                    }}
                    onManualSync={triggerSync}
                    onRestoreCloudVault={handleRestoreCloudVault}
                    onExportLocalData={handleExportLocalData}
                    onDeleteAccount={() => {
                      setIsDeleteAccountOpen(true);
                    }}
                    onLogout={() => {
                      setIsAuthModalOpen(true);
                    }}
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
                      await saveStoredProfile(newProf);
                      setProfile(newProf);
                      if (isOnline && newProf.id) {
                        try {
                          await saveUserProfileToFirestore(newProf);
                        } catch {}
                      }
                      triggerSync();
                    }}
                    onManualSync={triggerSync}
                    onRestoreCloudVault={handleRestoreCloudVault}
                    onExportLocalData={handleExportLocalData}
                    onDeleteAccount={() => {
                      setIsDeleteAccountOpen(true);
                    }}
                    onLogout={() => {
                      setIsAuthModalOpen(true);
                    }}
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
                      setAddEntryPartyId(activeParty?.id);
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

          {/* ======================================================== */}
          {/* GLOBAL MODALS                                            */}
          {/* ======================================================== */}

          {/* 1. Onboarding & Firebase Auth Modal */}
          <AuthModal
            isOpen={isAuthModalOpen}
            onSuccess={handleAuthSuccess}
            onContinueOffline={handleContinueOffline}
          />

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
        </div>
      )}
    </AppLayout>
  );
}

export default App;
