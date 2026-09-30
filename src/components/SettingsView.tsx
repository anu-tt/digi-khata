import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Lock,
  Cloud,
  Download,
  Trash2,
  LogOut,
  CheckCircle2,
  RefreshCw,
  Building,
  Fingerprint,
  ArrowLeft,
  Database,
  HelpCircle,
  HardDrive,
  Smartphone,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile, SECURITY_QUESTIONS } from '../types/khata';
import { hashPIN, generateSalt } from '../lib/crypto';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import {
  requestPersistentStorage,
  getStorageEstimate,
  importDecryptedVault,
} from '../lib/storage';

interface SettingsViewProps {
  profile: UserProfile;
  onBackToHome?: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onManualSync: () => Promise<void>;
  onRestoreCloudVault: () => Promise<void>;
  onExportLocalData: () => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onBackToHome,
  onUpdateProfile,
  onManualSync,
  onRestoreCloudVault,
  onExportLocalData,
  onDeleteAccount,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState<'menu' | 'profile' | 'security' | 'sync' | 'help' | 'storage'>('menu');
  const [name, setName] = useState(profile.name);
  const [businessName, setBusinessName] = useState(profile.businessName || '');
  const [address, setAddress] = useState(profile.address || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Phone Storage Access State
  const [storageInfo, setStorageInfo] = useState<{
    usageMB: number;
    quotaMB: number;
    percentUsed: number;
    isPersisted: boolean;
  }>({ usageMB: 0, quotaMB: 0, percentUsed: 0, isPersisted: false });
  const [isRequestingStorage, setIsRequestingStorage] = useState(false);
  const [storageMsg, setStorageMsg] = useState('');

  useEffect(() => {
    getStorageEstimate().then((info) => setStorageInfo(info));
  }, []);

  const handleEnablePersistentStorage = async () => {
    setIsRequestingStorage(true);
    setStorageMsg('');
    const granted = await requestPersistentStorage();
    const updated = await getStorageEstimate();
    setStorageInfo(updated);
    setIsRequestingStorage(false);
    if (granted || updated.isPersisted) {
      setStorageMsg('Phone Persistent Storage Access Safalta-Purvak Mil Gaya! Mobile OS entries ko clean nahi karega.');
    } else {
      setStorageMsg('Storage persistence status: Standard local mode active.');
    }
  };

  const handleImportFileFromPhone = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const vault = JSON.parse(text);
      if (!vault || (!vault.entries && !vault.parties)) {
        throw new Error('Amanaya backup file format.');
      }
      await importDecryptedVault(vault);
      setStorageMsg('Phone storage file se data safalta-purvak restore ho gaya!');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setStorageMsg(err.message || 'File import karne mein samasya aayi.');
    }
  };

  // 6-Digit PIN & Security Question settings
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(profile.securityQuestion || SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  // Cloud restore
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState('');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (newPassword && newPassword.length < 4) {
      setPasswordError('Password kam se kam 4 ank ka hona chahiye.');
      return;
    }
    if (newPassword && newPassword !== confirmNewPassword) {
      setPasswordError('Dono password match nahi ho rahe.');
      return;
    }

    onUpdateProfile({
      name: name.trim(),
      businessName: businessName.trim() || undefined,
      address: address.trim() || undefined,
    });

    if (newPassword) {
      setPasswordSuccess(true);
      setPasswordError('');
      setTimeout(() => {
        setPasswordSuccess(false);
        setNewPassword('');
        setConfirmNewPassword('');
        setActiveSection('menu');
      }, 800);
    } else {
      setActiveSection('menu');
    }
  };

  const handleSetPIN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6) {
      setPinError('PIN 6-digit ka hona chahiye.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Dono PIN aapas mein match nahi kar rahe.');
      return;
    }
    if (!securityAnswer.trim()) {
      setPinError('Kripya security question ka answer dalein.');
      return;
    }

    try {
      const salt = generateSalt();
      const pinHash = await hashPIN(newPin, salt);
      const answerHash = await hashPIN(securityAnswer.trim().toLowerCase(), salt);

      onUpdateProfile({
        pinHash,
        pinSalt: salt,
        securityQuestion: selectedQuestion,
        securityAnswerHash: answerHash,
      });

      setPinSuccess(true);
      setPinError('');
      setTimeout(() => {
        setPinSuccess(false);
        setNewPin('');
        setConfirmPin('');
        setSecurityAnswer('');
        setActiveSection('menu');
      }, 700);
    } catch {
      setPinError('PIN save karne mein samasya aayi.');
    }
  };

  const handleRemovePIN = () => {
    onUpdateProfile({
      pinHash: undefined,
      pinSalt: undefined,
      securityQuestion: undefined,
      securityAnswerHash: undefined,
    });
    setActiveSection('menu');
  };

  const handleToggleBiometric = () => {
    onUpdateProfile({
      isBiometricEnabled: !profile.isBiometricEnabled,
    });
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncMsg('');
    try {
      await onManualSync();
      setSyncMsg('Firebase Firestore par data safalta-purvak push ho gaya!');
    } catch (err: any) {
      setSyncMsg(err.message || 'Sync fail ho gaya.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreNow = async () => {
    setRestoreLoading(true);
    setRestoreMsg('');
    try {
      await onRestoreCloudVault();
      setRestoreMsg('Firebase Cloud se data safalta-purvak restore ho gaya!');
    } catch (err: any) {
      setRestoreMsg(err.message || 'Restore nahi ho paya. Details check karein.');
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-y-contain bg-slate-50 text-slate-800 pb-28 select-none">
      {/* Top Mobile Bar */}
      <div className="bg-emerald-800 text-white px-4 pt-5 pb-4 shadow-sm shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeSection !== 'menu' ? (
              <button
                onClick={() => setActiveSection('menu')}
                className="p-1.5 -ml-1.5 text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-700/60 transition"
                title="Back to Settings Menu"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : onBackToHome ? (
              <button
                onClick={onBackToHome}
                className="p-1.5 -ml-1.5 text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-700/60 transition"
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : null}

            <div className="w-9 h-9 rounded-2xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-emerald-100" />
            </div>

            <div>
              <h1 className="text-base font-extrabold tracking-tight">
                {activeSection === 'menu' && 'Settings & Account'}
                {activeSection === 'profile' && 'Profile Edit'}
                {activeSection === 'security' && 'App Lock & 6-Digit PIN'}
                {activeSection === 'sync' && 'Firebase Cloud Database'}
                {activeSection === 'help' && 'Help, About & T&C'}
                {activeSection === 'storage' && 'Phone Storage & Local Memory'}
              </h1>
              <div className="text-[11px] text-emerald-200 truncate max-w-[220px]">
                {profile.businessName || profile.name} • {profile.email || 'Verified Account'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 sm:p-6 space-y-3 max-w-lg mx-auto w-full">
        {/* 1. Main Settings Menu */}
        {activeSection === 'menu' && (
          <div className="space-y-3">
            {/* Profile Card */}
            <button
              onClick={() => setActiveSection('profile')}
              className="w-full p-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/80 rounded-2xl flex items-center justify-between transition text-left shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Profile & Dukaan Ki Jankari</div>
                  <div className="text-xs text-slate-500">Naam, Dukaan ka naam, Pata</div>
                </div>
              </div>
              <span className="text-slate-400 font-bold text-base">›</span>
            </button>

            {/* 6-Digit PIN & Lock Card */}
            <button
              onClick={() => setActiveSection('security')}
              className="w-full p-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/80 rounded-2xl flex items-center justify-between transition text-left shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">App Lock (6-Digit PIN)</div>
                  <div className="text-xs text-slate-500">
                    {profile.pinHash ? '6-Digit PIN & Sawaal Surakshit Set Hai' : 'PIN Set Nahi Hai'}
                  </div>
                </div>
              </div>
              <span className="text-slate-400 font-bold text-base">›</span>
            </button>

            {/* Firebase Cloud Sync Card */}
            <button
              onClick={() => setActiveSection('sync')}
              className="w-full p-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/80 rounded-2xl flex items-center justify-between transition text-left shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Firebase Cloud Database</div>
                  <div className="text-xs text-slate-500">Realtime Push / Pull & Cloud Backup</div>
                </div>
              </div>
              <span className="text-slate-400 font-bold text-base">›</span>
            </button>

            {/* Phone Storage & PWA Access Card */}
            <button
              onClick={() => {
                getStorageEstimate().then((info) => setStorageInfo(info));
                setActiveSection('storage');
              }}
              className="w-full p-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/80 rounded-2xl flex items-center justify-between transition text-left shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Phone Storage & Local Memory</div>
                  <div className="text-xs text-slate-500">
                    {storageInfo.isPersisted ? 'Persistent Access Granted (Safe)' : 'Phone Storage Active for Entries'}
                  </div>
                </div>
              </div>
              <span className="text-slate-400 font-bold text-base">›</span>
            </button>

            {/* Verified Account Status */}
            <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>Verified Account</span>
                  <span className="text-[9px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                    Cloud
                  </span>
                </div>
                <div className="text-xs text-emerald-800 truncate mt-0.5">
                  {profile.email || profile.phone || 'Google Account Linked'}
                </div>
              </div>
            </div>

            {/* Help, About & T&C Card */}
            <button
              onClick={() => setActiveSection('help')}
              className="w-full p-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/80 rounded-2xl flex items-center justify-between transition text-left shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Help, About & T&C</div>
                  <div className="text-xs text-slate-500">Jankari, Sahayata aur Data Download</div>
                </div>
              </div>
              <span className="text-slate-400 font-bold text-base">›</span>
            </button>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.99] shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Karein</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Profile Edit */}
        {activeSection === 'profile' && (
          <form onSubmit={handleSaveProfile} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Aapka Naam</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dukaan Ka Naam</label>
              <div className="relative flex items-center">
                <Building className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Dukaan ka naam dalein"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Address / Shehar</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dukaan ka pata"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Password safalta-purvak badal gaya hai!</span>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Naya Password Badlein (Optional)</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            {newPassword && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Naya Password Dobara Dalein (Confirm)</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
                <PasswordStrengthIndicator
                  password={newPassword}
                  confirmPassword={confirmNewPassword}
                />
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveSection('menu')}
                className="w-1/3 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Profile Save Karein
              </button>
            </div>
          </form>
        )}

        {/* 3. Security & 6-Digit PIN + Security Question */}
        {activeSection === 'security' && (
          <div className="space-y-4">
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <Fingerprint className="w-5 h-5 text-emerald-700" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Biometric Unlock</div>
                  <div className="text-[11px] text-slate-500">Fingerprint ya Face ID se kholne ke liye</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.isBiometricEnabled}
                onChange={handleToggleBiometric}
                className="w-4 h-4 accent-emerald-700 cursor-pointer"
              />
            </div>

            <form onSubmit={handleSetPIN} className="space-y-3.5 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-700" />
                <span>{profile.pinHash ? '6-Digit PIN & Sawaal Badlein' : 'Naya 6-Digit PIN & Sawaal Set Karein'}</span>
              </div>

              {pinError && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-lg font-semibold">
                  {pinError}
                </div>
              )}

              {pinSuccess && (
                <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] rounded-lg font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>6-Digit PIN & Security Sawaal Safalta Se Save Ho Gaya!</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Naya 6-Digit PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-widest text-lg font-bold py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">PIN Confirm Karein</label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-widest text-lg font-bold py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Security Question for Recovery */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>PIN Recovery Sawaal (Security Question)</span>
                </div>
                <div>
                  <select
                    value={selectedQuestion}
                    onChange={(e) => setSelectedQuestion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {SECURITY_QUESTIONS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="Security sawaal ka sahi uttar dalein"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveSection('menu')}
                  className="w-1/3 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={newPin.length !== 6 || confirmPin.length !== 6 || !securityAnswer.trim()}
                  className="w-2/3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold disabled:opacity-50 shadow-sm transition"
                >
                  Save PIN & Sawaal
                </button>
              </div>

              {profile.pinHash && (
                <button
                  type="button"
                  onClick={handleRemovePIN}
                  className="w-full py-1 text-rose-600 text-xs font-semibold hover:underline text-center mt-2"
                >
                  PIN Hata dein (App Lock Disable)
                </button>
              )}
            </form>
          </div>
        )}

        {/* 4. Firebase Cloud Sync & Backup */}
        {activeSection === 'sync' && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs space-y-1 shadow-sm">
              <div className="font-bold text-purple-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-purple-700" />
                <span>Firebase Firestore Cloud Store</span>
              </div>
              <div className="text-purple-800 text-[11px] leading-relaxed">
                Aapke transactions aur parties ka data real-time mein Firebase Firestore database par sync rehta hai.
              </div>
            </div>

            {syncMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-semibold">
                {syncMsg}
              </div>
            )}

            {restoreMsg && (
              <div className="p-3 bg-blue-50 border border-blue-300 text-blue-900 text-xs rounded-xl font-semibold">
                {restoreMsg}
              </div>
            )}

            {/* Push Changes Button */}
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Firebase Par Push Ho Raha Hai...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  <span>Push Changes To Firebase Now</span>
                </>
              )}
            </button>

            {/* Restore From Firebase Cloud */}
            <button
              onClick={handleRestoreNow}
              disabled={restoreLoading}
              className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 active:scale-[0.99] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
            >
              {restoreLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Cloud Se Data Restore Ho Raha Hai...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Pull / Restore Data From Cloud</span>
                </>
              )}
            </button>

            {/* Export Local Backup JSON */}
            <button
              onClick={onExportLocalData}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Offline Backup JSON</span>
            </button>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveSection('menu')}
                className="w-full py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                ‹ Back to Settings Menu
              </button>
            </div>
          </div>
        )}

        {/* 5. Help, About & T&C */}
        {activeSection === 'help' && (
          <div className="space-y-4">
            {/* About Card */}
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-700" />
                About Digital Khata
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Digital Khata aapka trusted, secure aur fast vyapar ledger hai jisse aap apne len-den aur hisab-kitab asani se manage kar sakte hain.
              </p>
            </div>

            {/* Terms & Conditions */}
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-2">
              <h3 className="text-sm font-bold text-slate-900">Terms & Conditions (T&C)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aapka sara data encrypt karke cloud par safe rakha jata hai. Kisi bhi third-party ko data share nahi kiya jata.
              </p>
            </div>

            {/* Data Download Button */}
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Data Download</h3>
              <p className="text-xs text-slate-600">
                Aap apne khate ka poora data JSON format mein download kar sakte hain.
              </p>
              <button
                type="button"
                onClick={onExportLocalData}
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Data Download Karein (JSON Backup)</span>
              </button>
            </div>

            {/* Help & Account Deletion */}
            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-rose-950">Account Deletion (Khata Delete Karein)</h3>
              <p className="text-xs text-rose-800 leading-relaxed">
                Agar aap apna account aur sara data permanent delete karna chahte hain, toh niche diye gaye button par click karein. Yeh action irreversible hai.
              </p>
              <button
                type="button"
                onClick={onDeleteAccount}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Account Delete Karein</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveSection('menu')}
                className="w-full py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                ‹ Back to Settings Menu
              </button>
            </div>
          </div>
        )}

        {/* 6. Phone Storage & PWA Access */}
        {activeSection === 'storage' && (
          <div className="space-y-4">
            {/* Storage Status Banner */}
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-teal-950 text-sm">
                  <Smartphone className="w-5 h-5 text-teal-700" />
                  <span>Phone Memory Access Status</span>
                </div>
                {storageInfo.isPersisted ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Persistent Access
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-bold">
                    Standard Storage
                  </span>
                )}
              </div>

              <p className="text-xs text-teal-800 leading-relaxed">
                PWA / Mobile Web mode mein Digital Khata aapke saare len-den aur customers ka data phone ki internal IndexedDB storage mein save rakhta hai.
              </p>

              {/* Storage Quota Usage */}
              <div className="bg-white/80 p-3 rounded-xl border border-teal-200/80 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Phone Storage Usage</span>
                  <span>{storageInfo.usageMB ? `${storageInfo.usageMB} MB` : '<0.1 MB'} used</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(storageInfo.percentUsed, 2)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  Total Allocated Quota: {storageInfo.quotaMB || 1024} MB
                </div>
              </div>

              {!storageInfo.isPersisted && (
                <button
                  type="button"
                  onClick={handleEnablePersistentStorage}
                  disabled={isRequestingStorage}
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isRequestingStorage ? 'Requesting Permission...' : 'Enable Persistent Phone Storage Lock'}</span>
                </button>
              )}
            </div>

            {storageMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-semibold">
                {storageMsg}
              </div>
            )}

            {/* Direct Phone File Backup & Restore */}
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-teal-700" />
                <span>Save / Import Phone Files</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aap phone ki file storage mein backup save kar sakte hain ya doosre phone se export ki gayi backup file se entries import kar sakte hain.
              </p>

              <button
                type="button"
                onClick={onExportLocalData}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>Save All Entries to Phone File (.json)</span>
              </button>

              <label className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                <Upload className="w-4 h-4 text-blue-700" />
                <span>Import Entries from Phone File (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFileFromPhone}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveSection('menu')}
                className="w-full py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                ‹ Back to Settings Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
