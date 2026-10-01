import React from 'react';
import {
  Home,
  Users,
  Truck,
  Bell,
  Settings,
  PlusCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, SyncState } from '../types/khata';
import { TytanDoorLogo } from './TytanDoorLogo';

interface DesktopSidebarProps {
  activeTab: 'home' | 'customers' | 'suppliers' | 'reminders' | 'settings';
  onSelectTab: (tab: 'home' | 'customers' | 'suppliers' | 'reminders' | 'settings') => void;
  onOpenAddEntry: () => void;
  onOpenAddParty: (type: 'customer' | 'supplier') => void;
  onOpenSettings: () => void;
  profile: UserProfile | null;
  syncState: SyncState;
  onTriggerSync: () => void;
  pendingRemindersCount: number;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddEntry,
  onOpenAddParty,
  profile,
  syncState,
  onTriggerSync,
  pendingRemindersCount,
}) => {
  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white border-r border-slate-200/90 text-slate-800 p-4 shrink-0 select-none z-20">
      {/* Brand & Logo */}
      <div className="flex items-center px-1 py-2 border-b border-slate-100 mb-4 pb-3">
        <TytanDoorLogo variant="full" size="md" lightBackground={true} />
      </div>

      {/* Primary Action Button: Nayi Entry */}
      <div className="mb-4">
        <button
          onClick={onOpenAddEntry}
          className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:scale-[0.98] text-white rounded-2xl font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <PlusCircle className="w-5 h-5 text-white/90" />
          <span>+ Nayi Entry Karein</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        <button
          onClick={() => onSelectTab('home')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'home'
              ? 'bg-red-50 text-red-700 border border-red-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-red-600' : 'text-slate-500'}`} />
            <span>Dashboard</span>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('customers')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-red-50 text-red-700 border border-red-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Users className={`w-4 h-4 ${activeTab === 'customers' ? 'text-red-600' : 'text-slate-500'}`} />
            <span>Grahak (Customers)</span>
          </div>
          <span
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddParty('customer');
            }}
            className="text-[10px] bg-white hover:bg-red-50 text-red-600 px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs transition"
            title="Naya Customer Add Karein"
          >
            + Add
          </span>
        </button>

        <button
          onClick={() => onSelectTab('suppliers')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'suppliers'
              ? 'bg-red-50 text-red-700 border border-red-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Truck className={`w-4 h-4 ${activeTab === 'suppliers' ? 'text-red-600' : 'text-slate-500'}`} />
            <span>Vyapari (Suppliers)</span>
          </div>
          <span
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddParty('supplier');
            }}
            className="text-[10px] bg-white hover:bg-red-50 text-red-600 px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs transition"
            title="Naya Supplier Add Karein"
          >
            + Add
          </span>
        </button>

        <button
          onClick={() => onSelectTab('reminders')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'reminders'
              ? 'bg-red-50 text-red-700 border border-red-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Bell className={`w-4 h-4 ${activeTab === 'reminders' ? 'text-amber-600' : 'text-slate-500'}`} />
            <span>Reminders</span>
          </div>
          {pendingRemindersCount > 0 && (
            <span className="text-[10px] bg-amber-500 text-white font-extrabold px-2 py-0.2 rounded-full">
              {pendingRemindersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-red-50 text-red-700 border border-red-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-red-600' : 'text-slate-500'}`} />
            <span>Settings & Security</span>
          </div>
        </button>
      </nav>

      {/* Security & Sync Status Box */}
      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5 mt-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-700 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Cloud Database
          </span>
          <button
            onClick={onTriggerSync}
            disabled={syncState === 'syncing'}
            className="text-[10px] text-red-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
        <div className="text-[10px] text-slate-500 leading-tight">
          Encrypted & Synced automatically.
        </div>
      </div>

      {/* User Badge */}
      {profile && (
        <div
          onClick={() => onSelectTab('settings')}
          className="mt-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center gap-3 border border-slate-200/80 cursor-pointer transition"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 truncate">
            <div className="text-xs font-bold text-slate-900 truncate">{profile.name}</div>
            <div className="text-[10px] text-slate-500 truncate">
              {profile.businessName || profile.email || 'Verified Account'}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
