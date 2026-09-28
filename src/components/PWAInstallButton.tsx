import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // If already installed, don't show prompt or show installed badge in settings
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>App Installed — Phone par standalone chal rahi hai</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setShowInstructions(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowInstructions(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-[11px] sm:text-xs shadow-md transition whitespace-nowrap shrink-0"
          title="Phone par app download aur install karein"
        >
          <Download className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
          <span className="hidden sm:inline">App Download</span>
          <span className="sm:hidden font-extrabold">App Install</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className="mx-3 sm:mx-4 mt-3 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-2xl p-3 sm:p-3.5 shadow-md flex items-center justify-between gap-3 border border-emerald-700/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Digital Khata Ko Phone Par Install Karein</div>
              <div className="text-[10px] text-emerald-200/80 mt-0.5 truncate">
                Bina app store ke home screen par chalayein (100% Offline)
              </div>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 sm:py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shrink-0 shadow-sm transition active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
        </div>
      )}

      {variant === 'settings' && (
        <button
          onClick={handleInstallClick}
          className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-between transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-900">Phone Par App Download Karein</div>
              <div className="text-[11px] text-emerald-700">Add to Home Screen (PWA Installation)</div>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
            Install
          </span>
        </button>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-100 text-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">iPhone / iPad Par Install Karein</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Safari browser mein neeche <strong className="text-slate-800">Share icon (⬆)</strong> par tap karein.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll karein aur <strong className="text-slate-800">"Add to Home Screen"</strong> chunein.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Top right mein <strong className="text-emerald-700 font-bold">"Add"</strong> par tap karein. App phone par install ho jayegi!
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Samajh Gaya (Done)
            </button>
          </div>
        </div>
      )}

      {/* Chrome / Android Guide Modal if native prompt wasn't fired directly */}
      {showInstructions && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-100 text-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">App Kaise Download Karein</h3>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Browser ke top-right mein <strong className="text-slate-800">3 Dots (⋮)</strong> menu par tap karein.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  <strong className="text-slate-800">"Install app"</strong> ya <strong className="text-slate-800">"Add to Home Screen"</strong> chunein.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  App phone par save ho jayegi aur 100% offline chalegi.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Theek Hai
            </button>
          </div>
        </div>
      )}
    </>
  );
};
