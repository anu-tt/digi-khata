import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Lock, ArrowRight, RotateCcw, HelpCircle } from 'lucide-react';
import { generateSalt, hashPIN } from '../lib/crypto';
import { UserProfile, SECURITY_QUESTIONS } from '../types/khata';

interface CreatePinModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onPinCreated: (updatedProfile: UserProfile) => void;
  onSkip?: () => void;
}

export const CreatePinModal: React.FC<CreatePinModalProps> = ({
  isOpen,
  profile,
  onPinCreated,
  onSkip,
}) => {
  const [step, setStep] = useState<'enter' | 'confirm' | 'security_question'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPin = step === 'enter' ? firstPin : confirmPin;

  const handleDigit = (digit: string) => {
    setErrorMsg('');
    if (step === 'enter') {
      if (firstPin.length < 6) {
        const next = firstPin + digit;
        setFirstPin(next);
        if (next.length === 6) {
          setTimeout(() => {
            setStep('confirm');
          }, 200);
        }
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < 6) {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length === 6) {
          if (next === firstPin) {
            setTimeout(() => {
              setStep('security_question');
            }, 200);
          } else {
            setErrorMsg('PIN match nahi hua! Kripya dobara dalein.');
            setConfirmPin('');
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    if (step === 'enter') {
      setFirstPin((prev) => prev.slice(0, -1));
    } else if (step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleReset = () => {
    setStep('enter');
    setFirstPin('');
    setConfirmPin('');
    setErrorMsg('');
  };

  const handleFinalizeWithSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityAnswer.trim()) {
      setErrorMsg('Kripya security question ka answer dalein.');
      return;
    }

    try {
      setIsSuccess(true);
      const salt = generateSalt();
      const pinHash = await hashPIN(firstPin, salt);
      const answerHash = await hashPIN(securityAnswer.trim().toLowerCase(), salt);

      const updated: UserProfile = {
        ...profile,
        pinHash,
        pinSalt: salt,
        securityQuestion: selectedQuestion,
        securityAnswerHash: answerHash,
        updatedAt: new Date().toISOString(),
      };

      setTimeout(() => {
        onPinCreated(updated);
      }, 600);
    } catch {
      setErrorMsg('PIN aur Security Answer save karne mein samasya aayi.');
      setIsSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[80] flex items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-slate-900 border-0 sm:border border-emerald-900/60 w-full sm:max-w-md h-full sm:h-auto sm:max-h-[95vh] sm:rounded-3xl p-6 text-white shadow-2xl flex flex-col items-center justify-between sm:justify-center overflow-y-auto animate-scale-in">
        {/* Shield Medallion */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg border border-emerald-400/40 mb-3 shrink-0">
          <Lock className="w-7 h-7 text-white" />
        </div>

        {step !== 'security_question' ? (
          <>
            <h2 className="text-lg font-black tracking-tight text-center">
              {step === 'enter' ? '6-Digit Security PIN Banayein' : 'PIN Dobara Dalein (Confirm)'}
            </h2>
            <p className="text-xs text-emerald-300/80 text-center mt-1">
              {step === 'enter'
                ? 'App kholte waqt hisab-kitab surakshit rakhne ke liye 6-digit PIN chunein'
                : 'Pehle dale gaye PIN ki pushti karein'}
            </p>

            {/* 6 Dots Indicator */}
            <div className="flex gap-3 my-5">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const isFilled = currentPin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                      isFilled
                        ? 'bg-emerald-400 scale-125 shadow-md shadow-emerald-400/60'
                        : 'bg-slate-700 border border-slate-600'
                    }`}
                  />
                );
              })}
            </div>

            {errorMsg && (
              <div className="text-xs font-bold text-rose-400 mb-3 text-center bg-rose-950/80 border border-rose-800/80 px-3 py-1.5 rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDigit(d)}
                  className="h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:bg-emerald-900 border border-slate-700/80 text-lg font-bold text-white flex items-center justify-center transition active:scale-95 shadow-sm"
                >
                  {d}
                </button>
              ))}

              <button
                onClick={handleReset}
                className="h-12 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-xs font-semibold text-slate-400 flex items-center justify-center border border-slate-700/50 transition active:scale-95"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDigit('0')}
                className="h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:bg-emerald-900 border border-slate-700/80 text-lg font-bold text-white flex items-center justify-center transition active:scale-95 shadow-sm"
              >
                0
              </button>

              <button
                onClick={handleBackspace}
                className="h-12 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center border border-slate-700/50 transition active:scale-95"
                title="Backspace"
              >
                ⌫
              </button>
            </div>
          </>
        ) : (
          /* Step 3: Security Question & Answer for PIN Recovery */
          <form onSubmit={handleFinalizeWithSecurity} className="w-full space-y-4 my-auto">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-700/70 rounded-full text-emerald-300 text-xs font-bold mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>PIN Recovery Setup</span>
              </div>
              <h2 className="text-base font-extrabold tracking-tight">Security Question Chunein</h2>
              <p className="text-xs text-slate-400 mt-1">
                Agar aap PIN bhool jate hain, toh is sawaal ka jawab dekar naya PIN bana sakenge.
              </p>
            </div>

            {errorMsg && (
              <div className="text-xs font-bold text-rose-400 bg-rose-950/80 border border-rose-800/80 px-3 py-2 rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            {isSuccess && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>PIN aur Security Setup Safal Hua!</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Suraksha Sawaal (Security Question)
                </label>
                <select
                  value={selectedQuestion}
                  onChange={(e) => setSelectedQuestion(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {SECURITY_QUESTIONS.map((q) => (
                    <option key={q} value={q} className="bg-slate-900 text-white">
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Aapka Uttar (Security Answer) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Apna uttar dalein (jaise shahar ya dost ka naam)"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStep('enter')}
                className="w-1/3 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!securityAnswer.trim() || isSuccess}
                className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                <span>PIN & Sawaal Save Karein</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Footer Note */}
        <div className="mt-4 text-[10px] text-slate-500 flex items-center gap-1.5 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Security Questions se PIN turant recover ho jata hai</span>
        </div>
      </div>
    </div>
  );
};
