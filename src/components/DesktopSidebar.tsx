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
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-slate-900 border-r border-slate-800 text-slate-200 p-4 shrink-0 select-none z-20">
      {/* Brand & 3D Medallion */}
      <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800/80 mb-4">
        <div className="w-10 h-10 rounded-2xl rupee-coin-3d animate-coin-3d flex items-center justify-center border border-emerald-400/40 shrink-0">
          <span className="text-white font-black text-xl font-sans">₹</span>
        </div>
        <div>
          <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
            Digital Khata
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">Aapka Khata, Aapke Control Mein</div>
        </div>
      </div>

      {/* Primary Action Button: Nayi Entry */}
      <div className="mb-4">
        <button
          onClick={onOpenAddEntry}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition"
        >
          <PlusCircle className="w-5 h-5 text-emerald-200" />
          <span>+ Nayi Entry Karein</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        <button
          onClick={() => onSelectTab('home')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
            activeTab === 'home'
              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <Home className="w-4 h-4 text-emerald-400" />
            <span>Dashboard (Overview)</span>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('customers')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
            activeTab === 'customers'
              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Grahak (Customers)</span>
          </div>
          <span
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddParty('customer');
            }}
            className="text-[10px] bg-slate-800 hover:bg-emerald-800 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700 transition"
            title="Naya Customer Add Karein"
          >
            + Add
          </span>
        </button>

        <button
          onClick={() => onSelectTab('suppliers')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
            activeTab === 'suppliers'
              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <Truck className="w-4 h-4 text-teal-400" />
            <span>Vyapari (Suppliers)</span>
          </div>
          <span
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddParty('supplier');
            }}
            className="text-[10px] bg-slate-800 hover:bg-teal-800 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700 transition"
            title="Naya Supplier Add Karein"
          >
            + Add
          </span>
        </button>

        <button
          onClick={() => onSelectTab('reminders')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
            activeTab === 'reminders'
              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Reminders</span>
          </div>
          {pendingRemindersCount > 0 && (
            <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-2 py-0.2 rounded-full">
              {pendingRemindersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
            activeTab === 'settings'
              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings & Security</span>
          </div>
        </button>
      </nav>

      {/* Security & Sync Status Box */}
      <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 space-y-2 mt-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Firebase Store
          </span>
          <button
            onClick={onTriggerSync}
            disabled={syncState === 'syncing'}
            className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-bold"
          >
            <RefreshCw className={`w-3 h-3 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
        <div className="text-[10px] text-slate-500 leading-tight">
          Firebase Firestore cloud store ke sath synced.
        </div>
      </div>

      {/* User Badge */}
      {profile && (
        <div
          onClick={() => onSelectTab('settings')}
          className="mt-3 p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-2xl flex items-center gap-3 border border-slate-700/60 cursor-pointer transition"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 truncate">
            <div className="text-xs font-bold text-white truncate">{profile.name}</div>
            <div className="text-[10px] text-slate-400 truncate">
              {profile.businessName || profile.email || 'Verified Account'}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
