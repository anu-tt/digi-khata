import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Truck,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Receipt,
  Search,
} from 'lucide-react';
import {
  KhataEntry,
  KhataParty,
  UserProfile,
  DashboardStats,
  PartyBalanceSummary,
} from '../types/khata';
import { PWAInstallButton } from './PWAInstallButton';

interface DashboardProps {
  profile: UserProfile;
  stats: DashboardStats;
  parties: KhataParty[];
  entries: KhataEntry[];
  partySummaries: Map<string, PartyBalanceSummary>;
  onSelectParty: (partyId: string) => void;
  onOpenAddParty: (type: 'customer' | 'supplier') => void;
  onOpenAddEntry: (partyId?: string, defaultType?: 'credit' | 'debit') => void;
  onOpenPDF: (partyId?: string) => void;
  onSelectEntryDetail: (entry: KhataEntry) => void;
  onGoToKhataTab: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  stats,
  parties,
  entries,
  partySummaries,
  onSelectParty,
  onOpenAddParty,
  onOpenAddEntry,
  onSelectEntryDetail,
  onGoToKhataTab,
}) => {
  const [entryFilter, setEntryFilter] = useState<'all' | 'credit' | 'debit'>('all');

  // Filtered recent transactions
  const recentEntries = entries
    .filter((e) => {
      if (entryFilter === 'all') return true;
      return e.type === entryFilter;
    })
    .slice(0, 10);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-y-contain bg-slate-50 text-slate-800 pb-28">
      {/* Top Banner / Business Header */}
      <div className="bg-emerald-800 text-white px-5 pt-4 pb-6 rounded-b-[28px] shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-200 tracking-wider uppercase">
              {profile.businessName ? profile.businessName : 'Digital Khata'}
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
              Namaste, {profile.name}
            </h1>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-700/80 border border-emerald-600 flex items-center justify-center font-bold text-sm text-emerald-100 shadow-inner">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Primary Khata Cards: Lena Hai & Dena Hai */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Total Lena Hai (Receivable) */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 shadow-sm">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
              <span>Total Lena Hai</span>
              <div className="w-5 h-5 rounded-full bg-emerald-700/60 flex items-center justify-center">
                <ArrowDownLeft className="w-3 h-3 text-emerald-300" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white mt-1 tracking-tight">
              ₹{stats.totalLenaHai.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-emerald-200/80 mt-1">
              Grahak se aana baaki hai
            </div>
          </div>

          {/* Total Dena Hai (Payable) */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 shadow-sm">
            <div className="flex items-center justify-between text-rose-200 text-xs font-semibold">
              <span>Total Dena Hai</span>
              <div className="w-5 h-5 rounded-full bg-rose-900/60 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-rose-300" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white mt-1 tracking-tight">
              ₹{stats.totalDenaHai.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-rose-200/80 mt-1">
              Vyapari ko dena baaki hai
            </div>
          </div>
        </div>

        {/* Counts summary banner */}
        <div className="mt-3 flex items-center justify-between px-1 text-xs text-emerald-100/90 font-medium">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span>Customers: <strong className="text-white font-bold">{stats.customerCount}</strong></span>
          </div>
          <div className="w-1 h-1 rounded-full bg-emerald-400/50" />
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Suppliers: <strong className="text-white font-bold">{stats.supplierCount}</strong></span>
          </div>
          <div className="w-1 h-1 rounded-full bg-emerald-400/50" />
          <div className="text-[11px]">
            {stats.netBalance === 0 ? (
              <span className="text-emerald-300 font-semibold">Hisab Barabar</span>
            ) : stats.netBalance > 0 ? (
              <span>Net: <strong className="text-emerald-200 font-bold">+₹{stats.netBalance.toLocaleString('en-IN')}</strong></span>
            ) : (
              <span>Net: <strong className="text-rose-200 font-bold">-₹{Math.abs(stats.netBalance).toLocaleString('en-IN')}</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="px-4 -mt-3">
        <div className="bg-white rounded-2xl p-2.5 shadow-md border border-slate-100 flex items-center justify-around gap-2">
          <button
            onClick={() => onOpenAddParty('customer')}
            className="flex-1 py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 flex flex-col items-center gap-1 transition"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold">+ Naya Customer</span>
          </button>

          <button
            onClick={() => onOpenAddParty('supplier')}
            className="flex-1 py-2 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 flex flex-col items-center gap-1 transition"
          >
            <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-sm">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold">+ Naya Supplier</span>
          </button>

          <button
            onClick={() => {
              if (parties.length === 0) {
                onOpenAddParty('customer');
              } else {
                onOpenAddEntry();
              }
            }}
            className="flex-1 py-2 px-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex flex-col items-center gap-1 transition shadow-sm"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold">Nayi Entry</span>
          </button>
        </div>
      </div>

      {/* In-App PWA Install Banner */}
      <PWAInstallButton variant="banner" />

      {/* Main Content Area */}
      <div className="px-4 mt-5 space-y-5">
        {/* Parties Quick Carousel or List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Khaata / Parties
            </h2>
            <button
              onClick={onGoToKhataTab}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
            >
              Sabhi Dekhein ({parties.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {parties.length === 0 ? (
            /* Empty State for Customers/Suppliers */
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Abhi koi customer nahi hai</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                Apne pehle customer ya dukandaar ko add karke hisab shuru karein.
              </p>
              <button
                onClick={() => onOpenAddParty('customer')}
                className="mt-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Naya Customer Add Karein
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {parties.slice(0, 4).map((p) => {
                const summary = partySummaries.get(p.id);
                const net = summary ? summary.netBalance : 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectParty(p.id)}
                    className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition shadow-xs active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          {p.name}
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-500">
                            {p.type === 'customer' ? 'Customer' : 'Supplier'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.phone ? p.phone : 'Mobile nahi hai'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {net === 0 ? (
                        <div className="text-xs font-bold text-slate-500">
                          Hisab Barabar
                        </div>
                      ) : p.type === 'customer' ? (
                        net > 0 ? (
                          <div>
                            <div className="text-[10px] text-emerald-700 font-semibold">Lena Hai</div>
                            <div className="text-sm font-extrabold text-emerald-700">
                              ₹{net.toLocaleString('en-IN')}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-[10px] text-rose-700 font-semibold">Dena Hai</div>
                            <div className="text-sm font-extrabold text-rose-700">
                              ₹{Math.abs(net).toLocaleString('en-IN')}
                            </div>
                          </div>
                        )
                      ) : (
                        // Supplier
                        net > 0 ? (
                          <div>
                            <div className="text-[10px] text-rose-700 font-semibold">Dena Hai</div>
                            <div className="text-sm font-extrabold text-rose-700">
                              ₹{net.toLocaleString('en-IN')}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-[10px] text-emerald-700 font-semibold">Lena Hai</div>
                            <div className="text-sm font-extrabold text-emerald-700">
                              ₹{Math.abs(net).toLocaleString('en-IN')}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recent Entries (Haal Ki Entries)
            </h2>
            {entries.length > 0 && (
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  onClick={() => setEntryFilter('all')}
                  className={`px-2 py-0.5 rounded-md transition ${entryFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
                >
                  Sabhi
                </button>
                <button
                  onClick={() => setEntryFilter('credit')}
                  className={`px-2 py-0.5 rounded-md transition ${entryFilter === 'credit' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'}`}
                >
                  Jama
                </button>
                <button
                  onClick={() => setEntryFilter('debit')}
                  className={`px-2 py-0.5 rounded-md transition ${entryFilter === 'debit' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'}`}
                >
                  Udhaar
                </button>
              </div>
            )}
          </div>

          {entries.length === 0 ? (
            /* Genuine Empty State for Entries */
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Abhi koi entry nahi hai</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                Credit (Jama) ya Debit (Udhaar) ki pehli entry yahan add karein.
              </p>
              <button
                onClick={() => {
                  if (parties.length === 0) {
                    onOpenAddParty('customer');
                  } else {
                    onOpenAddEntry();
                  }
                }}
                className="mt-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                First Entry Add Karein
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((e) => {
                const party = parties.find((p) => p.id === e.partyId);
                const isJama = e.type === 'credit';
                const isSupplier = party?.type === 'supplier';
                return (
                  <div
                    key={e.id}
                    onClick={() => onSelectEntryDetail(e)}
                    className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          isJama ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isJama ? (
                          <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-rose-700" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          {party ? party.name : 'Unknown Party'}
                          {e.attachments && e.attachments.length > 0 && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                              📎 {e.attachments.length}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {e.date} • {e.description || (isSupplier ? (isJama ? 'Payment Diya' : 'Maal Kharida') : (isJama ? 'Jama Mila' : 'Udhaar Diya'))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm font-extrabold ${
                          isJama ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {party?.type === 'supplier' ? (isJama ? '-' : '+') : (isJama ? '+' : '-')} ₹{e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400">
                        {isSupplier ? (isJama ? 'Payment (Credit)' : 'Purchase (Debit)') : (isJama ? 'Jama (Credit)' : 'Udhaar (Debit)')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
