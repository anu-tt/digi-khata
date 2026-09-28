import React from 'react';
import {
  ShieldCheck,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { SyncState, UserProfile } from '../types/khata';

interface FintechHeaderProps {
  profile: UserProfile | null;
  isOnline: boolean;
  onToggleOnline: () => void;
  syncState: SyncState;
  onTriggerSync: () => void;
  onOpenSettings: () => void;
}

export const FintechHeader: React.FC<FintechHeaderProps> = ({
  profile,
  isOnline,
  onToggleOnline,
  syncState,
  onTriggerSync,
  onOpenSettings,
}) => {
  const getSyncBadge = () => {
    switch (syncState) {
      case 'syncing':
        return {
          text: 'Syncing...',
          color: 'bg-amber-400/20 text-amber-200 border-amber-500/40',
          icon: <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />,
        };
      case 'success':
        return {
          text: 'Synced',
          color: 'bg-emerald-400/20 text-emerald-200 border-emerald-500/40',
          icon: <span className="w-2 h-2 rounded-full bg-emerald-400" />,
        };
      case 'pending':
        return {
          text: 'Offline',
          color: 'bg-blue-400/20 text-blue-200 border-blue-500/40',
          icon: <span className="w-2 h-2 rounded-full bg-blue-400" />,
        };
      case 'error':
        return {
          text: 'Retry',
          color: 'bg-rose-400/20 text-rose-200 border-rose-500/40',
          icon: <span className="w-2 h-2 rounded-full bg-rose-400" />,
        };
      default:
        return {
          text: 'Cloud Active',
          color: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
        };
    }
  };

  const syncBadge = getSyncBadge();

  return (
    <header className="pt-5 pb-3 sm:pt-5 sm:pb-3.5 shrink-0 bg-slate-950/95 backdrop-blur-md text-white border-b border-emerald-900/60 shadow-md z-30 select-none">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left Branding */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Handcrafted 3D Rupee Coin Medallion */}
          <button
            type="button"
            className="relative cursor-pointer shrink-0 active:scale-95 transition"
            onClick={onOpenSettings}
            title="Digital Khata Settings"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl rupee-coin-3d animate-coin-3d flex items-center justify-center border border-emerald-400/50 shadow-lg">
              <span className="text-white font-black text-base sm:text-lg drop-shadow select-none font-sans">
                ₹
              </span>
            </div>
          </button>

          {/* Clean Typography with active cloud dot */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate">
                Digital Khata
              </span>
              <span className="hidden xs:inline-flex text-[9px] font-bold text-emerald-300 bg-emerald-900/90 px-1.5 py-0.5 rounded-full border border-emerald-600/50 shrink-0">
                Cloud
              </span>
            </div>
            <div className="text-[10px] sm:text-xs text-emerald-300/80 truncate mt-0.5 font-medium">
              {profile?.businessName ? profile.businessName : 'Hisab-Kitab Surakshit'}
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Network Status Button */}
          <button
            onClick={onToggleOnline}
            title={isOnline ? 'Online mode (Click to simulate offline)' : 'Offline mode (Click to go online)'}
            aria-label={isOnline ? 'Network status online' : 'Network status offline'}
            className={`w-8 h-8 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 ${
              isOnline
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900'
                : 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900 animate-pulse'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </button>

          {/* Cloud Sync Button */}
          <button
            onClick={onTriggerSync}
            disabled={!isOnline || syncState === 'syncing'}
            className={`h-8 px-2 sm:px-2.5 sm:h-auto sm:py-1.5 rounded-xl border text-xs font-semibold ${syncBadge.color} transition shrink-0 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5`}
            title="Secure Cloud Sync Now"
          >
            {syncBadge.icon}
            <span className="hidden sm:inline text-xs">{syncBadge.text}</span>
          </button>

          {/* User Profile Avatar */}
          {profile && (
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-800 to-teal-900 border border-emerald-500/40 text-emerald-100 font-bold text-xs flex items-center justify-center hover:border-emerald-300 shadow-sm transition active:scale-95 shrink-0"
              title="Settings & Profile"
            >
              {profile.name.charAt(0).toUpperCase()}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
