import React from 'react';
import { SyncState, UserProfile } from '../types/khata';
import { FintechHeader } from './FintechHeader';
import { CurrencyWatermark } from './CurrencyWatermark';

interface AppLayoutProps {
  profile: UserProfile | null;
  isOnline: boolean;
  onToggleOnline: () => void;
  syncState: SyncState;
  onTriggerSync: () => void;
  onOpenSettings: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  profile,
  isOnline,
  onToggleOnline,
  syncState,
  onTriggerSync,
  onOpenSettings,
  children,
}) => {
  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-slate-950 text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-hidden relative">
      {/* Background Banknote & Money Currency Watermark */}
      <CurrencyWatermark opacity={0.04} />

      {/* Handcrafted Fintech Header */}
      <FintechHeader
        profile={profile}
        isOnline={isOnline}
        onToggleOnline={onToggleOnline}
        syncState={syncState}
        onTriggerSync={onTriggerSync}
        onOpenSettings={onOpenSettings}
      />

      {/* Main Responsive Viewport */}
      <div className="flex-1 min-h-0 w-full relative z-10 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};
