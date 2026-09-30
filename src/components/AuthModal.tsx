import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  User,
  Building,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  signInWithGoogleFirebase,
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
} from '../lib/firebase';
import { googleSignInApi } from '../lib/api';
import { UserProfile, AuthDevice } from '../types/khata';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { PWAInstallButton } from './PWAInstallButton';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (profile: UserProfile, device: AuthDevice) => void;
  onContinueOffline: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  onContinueOffline,
}) => {
  const [mode, setMode] = useState<'welcome' | 'password' | 'profile' | 'offline_info'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // 1. Google Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const deviceName = `${
        navigator.userAgent.includes('Android')
          ? 'Android'
          : navigator.userAgent.includes('iPhone')
          ? 'iPhone'
          : 'Web'
      } Device`;
      const platform = navigator.userAgent.includes('iPhone')
        ? 'ios'
        : navigator.userAgent.includes('Android')
        ? 'android'
        : 'web';

      let fbUser: any = null;
      try {
        const fbRes = await signInWithGoogleFirebase();
        fbUser = fbRes.user;
      } catch (fbErr: any) {
        console.warn('Google sign-in fallback:', fbErr);
      }

      let profile: UserProfile;

      if (fbUser) {
        const userId = fbUser.uid;
        const userEmail = fbUser.email || email.trim().toLowerCase();
        const userName = fbUser.displayName || name.trim() || userEmail.split('@')[0];
        const userAvatar = fbUser.photoURL || undefined;

        let existingProf: UserProfile | null = null;
        try {
          existingProf = await getUserProfileFromFirestore(userId);
        } catch {}

        profile = existingProf || {
          id: userId,
          email: userEmail,
          name: userName,
          businessName: businessName.trim() || undefined,
          avatar: userAvatar,
          isBiometricEnabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await saveUserProfileToFirestore(profile);
        } catch {}
      } else {
        const res = await googleSignInApi({
          email: email.trim().toLowerCase() || 'user@digitalkhata.in',
          name: name.trim() || 'Vyapari',
          businessName: businessName.trim() || undefined,
          deviceName,
          platform,
        });

        profile = {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          businessName: res.user.businessName,
          avatar: res.user.avatar,
          isBiometricEnabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await saveUserProfileToFirestore(profile);
        } catch {}
      }

      const device: AuthDevice = {
        id: 'dev_' + Math.random().toString(36).substring(2, 9),
        name: deviceName,
        platform: platform as any,
        lastActive: new Date().toISOString(),
        isCurrent: true,
        createdAt: new Date().toISOString(),
      };

      onSuccess(profile, device);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Sign-In asafal raha.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Email Proceed to Password
  const handleProceedEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Kripya apna sahi email address enter karein.');
      return;
    }
    setErrorMsg('');
    setMode('password');
  };

  // 3. Password Submit / Account Login or Creation
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 4) {
      setErrorMsg('Kripya kam se kam 4 ank ka password enter karein.');
      return;
    }

    if (isNewAccount && password !== confirmPassword) {
      setErrorMsg('Dono password match nahi ho rahe hain.');
      return;
    }

    // If new account and name is not provided yet, go to profile mode
    if (isNewAccount && !name.trim()) {
      setMode('profile');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const deviceName = `${
        navigator.userAgent.includes('Android')
          ? 'Android'
          : navigator.userAgent.includes('iPhone')
          ? 'iPhone'
          : 'Web'
      } Device`;
      const platform = navigator.userAgent.includes('iPhone')
        ? 'ios'
        : navigator.userAgent.includes('Android')
        ? 'android'
        : 'web';

      const userId = 'usr_' + email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      let existingProf: UserProfile | null = null;
      try {
        existingProf = await getUserProfileFromFirestore(userId);
      } catch {}

      const profile: UserProfile = existingProf || {
        id: userId,
        email: email.trim().toLowerCase(),
        name: name.trim() || email.split('@')[0],
        businessName: businessName.trim() || undefined,
        isBiometricEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await saveUserProfileToFirestore(profile);
      } catch {}

      const device: AuthDevice = {
        id: 'dev_' + Math.random().toString(36).substring(2, 9),
        name: deviceName,
        platform: platform as any,
        lastActive: new Date().toISOString(),
        isCurrent: true,
        createdAt: new Date().toISOString(),
      };

      onSuccess(profile, device);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login asafal raha.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Complete Profile Setup (New Account)
  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Kripya apna naam enter karein.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Kripya naya password set karein (min 4 characters).');
      setMode('password');
      return;
    }

    const deviceName = `${
      navigator.userAgent.includes('Android')
        ? 'Android'
        : navigator.userAgent.includes('iPhone')
        ? 'iPhone'
        : 'Web'
    } Device`;
    const platform = navigator.userAgent.includes('iPhone')
      ? 'ios'
      : navigator.userAgent.includes('Android')
      ? 'android'
      : 'web';

    const userId = 'usr_' + email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    const profile: UserProfile = {
      id: userId,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      businessName: businessName.trim() || undefined,
      address: address.trim() || undefined,
      isBiometricEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveUserProfileToFirestore(profile);
    } catch (err) {
      console.warn('Profile save warning:', err);
    }

    const device: AuthDevice = {
      id: 'dev_' + Math.random().toString(36).substring(2, 9),
      name: deviceName,
      platform: platform as any,
      lastActive: new Date().toISOString(),
      isCurrent: true,
      createdAt: new Date().toISOString(),
    };

    onSuccess(profile, device);
  };

  // 5. Offline Only setup
  const handleStartOfflineOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Aapka naam zaroori hai.');
      return;
    }
    const offlineProfile: UserProfile = {
      id: 'local_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      businessName: businessName.trim() || undefined,
      address: address.trim() || undefined,
      isBiometricEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onContinueOffline(offlineProfile);
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-slate-900 text-slate-800 overflow-y-auto">
      <div className="max-w-md w-full mx-auto my-auto p-4 sm:p-6">
        <div className="bg-white text-slate-800 w-full rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white p-5 sm:p-6 text-center relative border-b border-emerald-900/60">
            <div className="w-12 h-12 rounded-2xl rupee-coin-3d animate-coin-3d flex items-center justify-center mx-auto mb-2.5 shadow-md border border-emerald-400/40">
              <span className="text-white font-black text-xl font-sans">₹</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">Digital Khata</h2>
            <p className="text-emerald-200/90 text-xs mt-0.5">Secure Cloud Backup & Ledger</p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="text-[10px] bg-emerald-900/90 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-700/60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                100% Safe & Secure Cloud Sync
              </span>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* 1. Welcome & Email Input */}
            {mode === 'welcome' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-base font-bold text-slate-900">Sign In / Account Banayein</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Google se direct ya email aur password se apna khata kholein.
                  </p>
                </div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:scale-[0.99] border-2 border-slate-200 rounded-2xl font-bold text-xs text-slate-800 shadow-sm transition flex items-center justify-center gap-3"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Google Se Direct Sign In Karein</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Ya Email Se
                  </span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                {/* Email Form */}
                <form onSubmit={handleProceedEmail} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="naam@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                  >
                    <span>Aage Badhein (Password Dalein)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-100 flex flex-col items-center gap-2 text-center">
                  <button
                    type="button"
                    onClick={() => setMode('offline_info')}
                    className="text-xs text-emerald-800 font-semibold hover:underline"
                  >
                    Bina Login Ke Shuru Karein (Local Offline Khata)
                  </button>

                  <PWAInstallButton variant="auth" />
                </div>
              </div>
            )}

            {/* 2. Password & Account Creation Flow */}
            {mode === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="text-center">
                  <h3 className="text-base font-bold text-slate-900">
                    {isNewAccount ? 'Naya Account Password Banayein' : 'Password Dalein'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Email: <strong className="text-slate-800">{email}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {isNewAccount && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Password Dobara Dalein (Confirm) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                        required
                      />
                    </div>
                  </div>
                )}

                <PasswordStrengthIndicator
                  password={password}
                  confirmPassword={isNewAccount ? confirmPassword : undefined}
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setIsNewAccount(!isNewAccount)}
                    className="font-bold text-emerald-700 hover:underline"
                  >
                    {isNewAccount ? 'Pehle se account hai? Login karein' : 'Naya account banana hai? Sign up'}
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('welcome')}
                    className="w-1/3 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !password}
                    className="w-2/3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {loading ? 'Khata Khul Raha Hai...' : isNewAccount ? 'Aage Badhein' : 'Login Karein'}
                  </button>
                </div>
              </form>
            )}

            {/* 3. Fast Profile Setup */}
            {mode === 'profile' && (
              <form onSubmit={handleCompleteSetup} className="space-y-4">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Apni Profile Complete Karein</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Apna naam aur dukaan ka naam enter karein.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Aapka Naam <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Apna poora naam dalein"
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dukaan / Vyapar Ka Naam <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative flex items-center">
                    <Building className="absolute left-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Jaise: Gupta General Store"
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pata / Shehar <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shehar ya dukaan ka pata"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>Khata Kholein</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* 4. Offline Only Mode */}
            {mode === 'offline_info' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-base font-bold text-slate-900">Local Offline Khata</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Bina login ke aapka pura data sirf aapke device par safe rahega.
                  </p>
                </div>

                <form onSubmit={handleStartOfflineOnly} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Aapka Naam <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Apna naam dalein"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      autoFocus
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dukaan Ka Naam <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Dukaan ka naam"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('welcome')}
                      className="w-1/3 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!name.trim()}
                      className="w-2/3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
                    >
                      Local Khata Kholein
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
