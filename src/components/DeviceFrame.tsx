import React from 'react';
import { Smartphone, Monitor, ShieldCheck, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { SyncState } from '../types/khata';

export type DeviceMode = 'android' | 'ios' | 'desktop' | 'admin';

interface DeviceFrameProps {
  mode: DeviceMode;
  onModeChange: (mode: DeviceMode) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  syncState: SyncState;
  onTriggerSync: () => void;
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  mode,
  onModeChange,
  isOnline,
  onToggleOnline,
  syncState,
  onTriggerSync,
  children,
}) => {
  // Real-time clock for device status bar
  const [timeStr, setTimeStr] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const getSyncBadge = () => {
    switch (syncState) {
      case 'syncing':
        return {
          text: 'Sync Ho Raha Hai...',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <RefreshCw className="w-3 h-3 animate-spin" />,
        };
      case 'success':
        return {
          text: 'Data Sync Ho Gaya',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <span className="w-2 h-2 rounded-full bg-emerald-500" />,
        };
      case 'pending':
        return {
          text: 'Sync Pending (Offline Data)',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <span className="w-2 h-2 rounded-full bg-blue-500" />,
        };
      case 'error':
        return {
          text: 'Sync Fail Ho Gaya — Dobara Try Karein',
          color: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: <span className="w-2 h-2 rounded-full bg-rose-500" />,
        };
      default:
        return {
          text: 'Khaata Surakshit Hai',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <span className="w-2 h-2 rounded-full bg-emerald-500" />,
        };
    }
  };

  const syncBadge = getSyncBadge();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Universal Platform Bar */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center font-bold text-white shadow-sm">
              DK
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Digital Khata
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                  E2EE
                </span>
              </div>
              <div className="text-[10px] text-slate-400">Aapka Khata, Aapke Control Mein</div>
            </div>
          </div>
        </div>

        {/* Device Mode Switcher */}
        <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button
            onClick={() => onModeChange('android')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              mode === 'android'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>
          <button
            onClick={() => onModeChange('ios')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              mode === 'ios'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iPhone</span>
          </button>
          <button
            onClick={() => onModeChange('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              mode === 'desktop'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => onModeChange('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              mode === 'admin'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Web Admin</span>
          </button>
        </div>

        {/* Offline & Sync Controls */}
        <div className="flex items-center gap-2">
          {/* Online/Offline Toggle */}
          <button
            onClick={onToggleOnline}
            title={isOnline ? 'Online (Click to simulate Offline)' : 'Offline (Click to simulate Online)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border font-medium transition-all ${
              isOnline
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                : 'bg-rose-950/80 text-rose-300 border-rose-800 hover:bg-rose-900'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
            <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
          </button>

          {/* Sync status button */}
          <button
            onClick={onTriggerSync}
            disabled={!isOnline || syncState === 'syncing'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold ${syncBadge.color} transition-all`}
          >
            {syncBadge.icon}
            <span>{syncBadge.text}</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-x-hidden overflow-y-auto">
        {mode === 'admin' || mode === 'desktop' ? (
          <div className="w-full max-w-6xl min-h-[85vh] bg-slate-50 text-slate-800 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {children}
          </div>
        ) : (
          /* Mobile Device Chassis Frame */
          <div
            className={`relative mx-auto transition-all duration-300 shadow-2xl border-[10px] ${
              mode === 'ios'
                ? 'w-[393px] h-[830px] rounded-[52px] border-slate-800 bg-black'
                : 'w-[412px] h-[850px] rounded-[44px] border-slate-800 bg-slate-950'
            } flex flex-col overflow-hidden ring-1 ring-slate-700/50`}
          >
            {/* Status Bar */}
            <div className="h-10 bg-emerald-800 text-white px-6 flex items-center justify-between text-xs font-semibold select-none z-30">
              <span>{timeStr}</span>

              {mode === 'ios' ? (
                /* Dynamic Island */
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 mr-2" />
                </div>
              ) : (
                /* Android Punch Hole Camera */
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full ring-1 ring-slate-900" />
              )}

              <div className="flex items-center gap-1.5 text-[11px]">
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 text-rose-300" />}
                <span>{mode === 'ios' ? '5G' : '4G'}</span>
                <span className="font-bold">100%</span>
              </div>
            </div>

            {/* Screen Viewport */}
            <div className="flex-1 bg-white text-slate-800 flex flex-col overflow-hidden relative">
              {children}
            </div>

            {/* Bottom Hardware Navigation / Home Indicator */}
            {mode === 'ios' ? (
              <div className="h-5 bg-white flex items-center justify-center">
                <div className="w-32 h-1 bg-slate-900/60 rounded-full" />
              </div>
            ) : (
              <div className="h-6 bg-slate-900 flex items-center justify-center gap-12 text-slate-500">
                <div className="w-3 h-3 border-2 border-slate-500 rounded-sm" />
                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-500" />
                <div className="w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] border-r-slate-500" />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
