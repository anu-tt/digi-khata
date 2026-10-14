import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  KeyRound,
} from 'lucide-react';
import { hashPIN, generateSalt } from '../lib/crypto';
import { UserProfile, SECURITY_QUESTIONS } from '../types/khata';

interface LockScreenProps {
  profile: UserProfile;
  onUnlock: () => void;
  onResetPINWithSecurityAnswer?: (newPinHash: string, newSalt: string) => Promise<void> | void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  profile,
  onUnlock,
  onResetPINWithSecurityAnswer,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Recovery Mode States
  const [mode, setMode] = useState<'pin' | 'recovery_question' | 'set_new_pin'>('pin');
  const [answerInput, setAnswerInput] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [isAnswerVerified, setIsAnswerVerified] = useState(false);

  // New PIN setup after recovery
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleDigit = async (d: string) => {
    if (isVerifying || pin.length >= 6) return;
    const nextPin = pin + d;
    setPin(nextPin);
    setErrorMsg('');

    if (nextPin.length === 6) {
      setIsVerifying(true);
      if (!profile.pinHash || !profile.pinSalt) {
        setIsVerifying(false);
        setErrorMsg('Passcode / PIN set nahi hai. Kripya app dobara open karein.');
        setPin('');
        return;
      }

      try {
        const hashed = await hashPIN(nextPin, profile.pinSalt);
        if (hashed === profile.pinHash) {
          setErrorMsg('');
          setTimeout(() => {
            onUnlock();
          }, 150);
        } else {
          setErrorMsg('Galat 6-digit PIN. Kripya sahi PIN dalein.');
          setPin('');
        }
      } catch {
        setErrorMsg('Verification mein samasya aayi.');
        setPin('');
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setPin((prev) => prev.slice(0, -1));
  };

  // Verify Security Answer
  const handleVerifyAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    if (!answerInput.trim()) {
      setRecoveryError('Kripya apna security answer dalein.');
      return;
    }

    if (!profile.securityAnswerHash || !profile.pinSalt) {
      setRecoveryError('Security question configure nahi hai. Kripya apne Google account se login karein.');
      return;
    }

    try {
      const hashedEntered = await hashPIN(answerInput.trim().toLowerCase(), profile.pinSalt);
      if (hashedEntered === profile.securityAnswerHash) {
        setIsAnswerVerified(true);
        setMode('set_new_pin');
      } else {
        setRecoveryError('Galat Uttar! Kripya sahi security answer enter karein.');
      }
    } catch {
      setRecoveryError('Verification asafal rahi.');
    }
  };

  // Save new PIN after verified recovery
  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6 || confirmNewPin.length !== 6) {
      setRecoveryError('PIN 6-digit ka hona chahiye.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setRecoveryError('Dono PIN match nahi kar rahe.');
      return;
    }

    try {
      const newSalt = generateSalt();
      const newHash = await hashPIN(newPin, newSalt);

      if (onResetPINWithSecurityAnswer) {
        await onResetPINWithSecurityAnswer(newHash, newSalt);
      }

      setResetSuccess(true);
      setTimeout(() => {
        onUnlock();
      }, 700);
    } catch {
      setRecoveryError('Naya PIN save karne mein samasya aayi.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white z-[70] flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto select-none">
      {/* Top Header */}
      <div className="text-center pt-12 sm:pt-14 shrink-0">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl rupee-coin-3d animate-coin-3d border border-emerald-400/40 flex items-center justify-center mx-auto mb-3 shadow-xl">
          <span className="text-white font-black text-xl font-sans">₹</span>
        </div>
        <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">Digital Khata</h1>
        <p className="text-xs text-emerald-300/90 mt-0.5">Aapka Khata Surakshit Hai</p>
      </div>

      {/* 1. Main 6-Digit PIN Screen */}
      {mode === 'pin' && (
        <div className="w-full max-w-xs flex flex-col items-center my-auto">
          <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>6-Digit Security PIN Dalein</span>
          </div>

          {/* Dots Indicator */}
          <div className="flex gap-3 mb-5">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  pin.length > idx
                    ? 'bg-emerald-400 scale-125 shadow-md shadow-emerald-400/60'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            ))}
          </div>

          {errorMsg && (
            <div className="text-xs font-bold text-rose-400 mb-3 text-center bg-rose-950/80 border border-rose-800/80 px-3 py-1.5 rounded-xl animate-shake">
              {errorMsg}
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(digit)}
                disabled={isVerifying}
                className="h-13 sm:h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-emerald-900 text-xl font-bold text-slate-100 flex items-center justify-center border border-slate-800 shadow-sm transition active:scale-95 disabled:opacity-60"
              >
                {digit}
              </button>
            ))}

            {/* Clear Button */}
            <button
              onClick={() => setPin('')}
              className="h-13 sm:h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-400 flex items-center justify-center border border-slate-800 transition active:scale-95"
              title="Clear"
            >
              C
            </button>

            <button
              onClick={() => handleDigit('0')}
              disabled={isVerifying}
              className="h-13 sm:h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-emerald-900 text-xl font-bold text-slate-100 flex items-center justify-center border border-slate-800 shadow-sm transition active:scale-95 disabled:opacity-60"
            >
              0
            </button>

            <button
              onClick={handleBackspace}
              className="h-13 sm:h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-400 flex items-center justify-center border border-slate-800 transition active:scale-95"
            >
              ⌫
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode('recovery_question');
              setErrorMsg('');
              setRecoveryError('');
            }}
            className="mt-5 text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>PIN Bhool Gaye? (Security Sawaal Se Kholein)</span>
          </button>
        </div>
      )}

      {/* 2. Security Question Recovery Mode */}
      {mode === 'recovery_question' && (
        <form onSubmit={handleVerifyAnswer} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 my-auto shadow-2xl">
          <div className="text-center">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center mx-auto mb-2 text-emerald-300">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-white">Security Sawaal Ka Jawab Dein</h2>
            <p className="text-xs text-slate-400 mt-1">
              Apna suraksha uttar enter karke naya PIN banayein.
            </p>
          </div>

          {recoveryError && (
            <div className="text-xs font-bold text-rose-400 bg-rose-950/80 border border-rose-800 px-3 py-2 rounded-xl text-center">
              {recoveryError}
            </div>
          )}

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
              Suraksha Sawaal:
            </div>
            <div className="text-xs font-semibold text-slate-200">
              {profile.securityQuestion || SECURITY_QUESTIONS[0]}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Aapka Uttar (Answer) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="Sahi uttar enter karein"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setMode('pin');
                setAnswerInput('');
                setRecoveryError('');
              }}
              className="w-1/3 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              Back
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-98 flex items-center justify-center gap-1.5"
            >
              <span>Verify Karein</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* 3. Set New PIN after verification */}
      {mode === 'set_new_pin' && (
        <form onSubmit={handleSaveNewPin} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 my-auto shadow-2xl">
          <div className="text-center">
            <div className="w-10 h-10 rounded-2xl bg-emerald-900/60 border border-emerald-600 flex items-center justify-center mx-auto mb-2 text-emerald-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-base font-extrabold text-white">Sawaal Verify Ho Gaya!</h2>
            <p className="text-xs text-emerald-300/90 mt-0.5">Ab apna naya 6-digit PIN set karein.</p>
          </div>

          {recoveryError && (
            <div className="text-xs font-bold text-rose-400 bg-rose-950/80 border border-rose-800 px-3 py-2 rounded-xl text-center">
              {recoveryError}
            </div>
          )}

          {resetSuccess && (
            <div className="text-xs font-bold text-emerald-300 bg-emerald-950 border border-emerald-600 px-3 py-2 rounded-xl text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Naya PIN Save Ho Gaya! App Khul Raha Hai...</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Naya 6-Digit PIN</label>
            <input
              type="password"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="• • • • • •"
              className="w-full text-center tracking-widest text-lg font-bold py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">PIN Confirm Karein</label>
            <input
              type="password"
              maxLength={6}
              value={confirmNewPin}
              onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="• • • • • •"
              className="w-full text-center tracking-widest text-lg font-bold py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={newPin.length !== 6 || confirmNewPin.length !== 6 || resetSuccess}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-98 flex items-center justify-center gap-1.5"
          >
            <span>Naya PIN Save & Unlock Karein</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Footer */}
      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pb-2 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Digital Khata Zero-Trust Protected</span>
      </div>
    </div>
  );
};
