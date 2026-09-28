import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  User,
  Building,
  CheckCircle2,
  RefreshCw,
  Bell,
  Sparkles,
} from 'lucide-react';
import {
  signInWithGoogleFirebase,
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
} from '../lib/firebase';
import {
  sendGmailCodeApi,
  verifyGmailCodeApi,
  googleSignInApi,
  checkRealtimeDeliveryApi,
} from '../lib/api';
import { UserProfile, AuthDevice } from '../types/khata';

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
  const [mode, setMode] = useState<'welcome' | 'code' | 'profile' | 'offline_info'>('welcome');
  const [email, setEmail] = useState('tytandoor@gmail.com');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [incomingNotice, setIncomingNotice] = useState<string | null>(null);

  // Temporary verified token holder
  const [verifiedUserId, setVerifiedUserId] = useState<string>('');
  const [verifiedAvatar, setVerifiedAvatar] = useState<string | undefined>(undefined);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Real-time verification notice listener (for sandbox environment)
  useEffect(() => {
    if (mode !== 'code' || !email) return;
    const pollTimer = setInterval(async () => {
      const res = await checkRealtimeDeliveryApi(email);
      if (res.delivered && res.verificationCode) {
        setIncomingNotice(`Gmail Verification: Aapka code ${res.verificationCode} hai.`);
        if (!code) {
          setCode(res.verificationCode);
        }
      }
    }, 2000);
    return () => clearInterval(pollTimer);
  }, [mode, email, code]);

  if (!isOpen) return null;

  // 1. One-Click Google Sign-In with Firebase Auth
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
        console.warn('Firebase popup signin fallback:', fbErr);
      }

      let profile: UserProfile;

      if (fbUser) {
        // Authenticated with Firebase Auth
        const userId = fbUser.uid;
        const userEmail = fbUser.email || email.trim().toLowerCase();
        const userName = fbUser.displayName || name.trim() || userEmail.split('@')[0];
        const userAvatar = fbUser.photoURL || undefined;

        // Check if existing profile in Firestore
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

        // Save to Firestore
        try {
          await saveUserProfileToFirestore(profile);
        } catch (saveErr) {
          console.warn('Firestore profile save warning:', saveErr);
        }
      } else {
        // Fallback to Google Sign-In API
        const res = await googleSignInApi({
          email: email.trim().toLowerCase() || 'tytandoor@gmail.com',
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

  // 2. Request Realtime Gmail Verification Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Kripya apna sahi Gmail ID enter karein.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      await sendGmailCodeApi(email.trim().toLowerCase());
      setMode('code');
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Code bhejte samay samasya aayi.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setErrorMsg('Kripya 6-digit verification code enter karein.');
      return;
    }

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

      const verifyRes = await verifyGmailCodeApi({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        name: name.trim() || undefined,
        businessName: businessName.trim() || undefined,
        deviceName,
        platform,
      });

      setVerifiedUserId(verifyRes.user.id);
      setVerifiedAvatar(verifyRes.user.avatar);

      // If user already has a saved name, log in immediately and save to Firestore
      if (verifyRes.user.name && verifyRes.user.name !== 'Vyapari') {
        const profile: UserProfile = {
          id: verifyRes.user.id,
          email: verifyRes.user.email,
          name: verifyRes.user.name,
          businessName: verifyRes.user.businessName,
          avatar: verifyRes.user.avatar,
          isBiometricEnabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await saveUserProfileToFirestore(profile);
        } catch {}

        const device: AuthDevice = {
          id: verifyRes.deviceId,
          name: deviceName,
          platform: platform as any,
          lastActive: new Date().toISOString(),
          isCurrent: true,
          createdAt: new Date().toISOString(),
        };

        onSuccess(profile, device);
      } else {
        setMode('profile');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification asafal rahi. Code check karein.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Complete Profile & Save to Firestore
  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Kripya apna naam enter karein.');
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

    const profile: UserProfile = {
      id: verifiedUserId || 'usr_' + Math.random().toString(36).substring(2, 9),
      email: email.trim().toLowerCase(),
      name: name.trim(),
      businessName: businessName.trim() || undefined,
      address: address.trim() || undefined,
      avatar: verifiedAvatar,
      isBiometricEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveUserProfileToFirestore(profile);
    } catch (err) {
      console.warn('Firestore profile save warning:', err);
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white text-slate-800 w-full sm:max-w-md h-full sm:h-auto sm:max-h-[92vh] sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-scale-in">
        {/* Fintech Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white p-6 text-center relative border-b border-emerald-900/60">
          <div className="w-12 h-12 rounded-2xl rupee-coin-3d animate-coin-3d flex items-center justify-center mx-auto mb-3 shadow-md border border-emerald-400/40">
            <span className="text-white font-black text-xl font-sans">₹</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Digital Khata</h2>
          <p className="text-emerald-200/90 text-xs mt-1">Firebase Powered Cloud Database</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="text-[10px] bg-emerald-900/90 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-700/60 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Firebase Auth & Firestore Verified
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

          {/* 1. Welcome & Google / Gmail Sign In Screen */}
          {mode === 'welcome' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">Sign In / Account Banayein</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Google ya Gmail se 1-click mein Firebase par apna khata kholein.
                </p>
              </div>

              {/* Official Google Sign-In with Firebase Button */}
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
                  Ya Gmail Verification Se
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              {/* Real-Time Gmail Verification Flow */}
              <form onSubmit={handleSendCode} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gmail Address <span className="text-rose-500">*</span>
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
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Code Bheja Ja Raha Hai...</span>
                    </>
                  ) : (
                    <>
                      <span>Verification Code Bhejein</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setMode('offline_info')}
                  className="text-xs text-emerald-800 font-semibold hover:underline"
                >
                  Bina Login Ke Shuru Karein (Local Offline Khata)
                </button>
              </div>
            </div>
          )}

          {/* 2. Real-Time Verification Code Input */}
          {mode === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">Verification Code Dalein</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Gmail <strong className="text-slate-800">{email}</strong> par 6-digit code bheja gaya hai.
                </p>
              </div>

              {incomingNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex items-center gap-2 shadow-xs">
                  <Bell className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-semibold">{incomingNotice}</span>
                </div>
              )}

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-widest text-2xl font-black py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Code nahi mila?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleSendCode}
                  className="font-bold text-emerald-700 hover:underline disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('welcome')}
                  className="w-1/3 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-2/3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {loading ? 'Verify Ho Raha Hai...' : 'Verify & Continue'}
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
                <h3 className="text-base font-bold text-slate-900">Gmail Verify Ho Gaya!</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Apne khate ke liye apna naam aur dukaan ka naam dalein.
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
                  Bina kisi email login ke aapka pura data sirf aapke phone/computer par safe rahega.
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
  );
};
