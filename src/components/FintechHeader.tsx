import React from 'react';
import {
  ShieldCheck,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { SyncState, UserProfile } from '../types/khata';
import { TytanDoorLogo } from './TytanDoorLogo';

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
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />,
        };
      case 'success':
        return {
          text: 'Synced',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <span className="w-2 h-2 rounded-full bg-emerald-500" />,
        };
      case 'pending':
        return {
          text: 'Offline',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <span className="w-2 h-2 rounded-full bg-slate-400" />,
        };
      case 'error':
        return {
          text: 'Retry',
          color: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: <span className="w-2 h-2 rounded-full bg-rose-500" />,
        };
      default:
        return {
          text: 'Cloud Active',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
        };
    }
  };

  const syncBadge = getSyncBadge();

  return (
    <header className="pt-3.5 pb-3.5 shrink-0 bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200/80 shadow-xs z-30 select-none">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left Branding */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-3 min-w-0 text-left active:scale-[0.99] transition cursor-pointer"
          title="Tytan Khatabook Settings"
        >
          <TytanDoorLogo variant="full" size="md" lightBackground={true} />
        </button>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Network Status Button */}
          <button
            onClick={onToggleOnline}
            title={isOnline ? 'Online mode' : 'Offline mode'}
            aria-label={isOnline ? 'Network status online' : 'Network status offline'}
            className={`w-8 h-8 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 animate-pulse'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
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
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center hover:bg-slate-800 shadow-xs transition active:scale-95 shrink-0 cursor-pointer"
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
