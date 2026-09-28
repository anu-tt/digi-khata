import React, { useState } from 'react';
import {
  Users,
  Truck,
  Search,
  PlusCircle,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  Archive,
} from 'lucide-react';
import { KhataParty, PartyBalanceSummary, PartyType } from '../types/khata';

interface KhataListProps {
  parties: KhataParty[];
  summaries: Map<string, PartyBalanceSummary>;
  activeType: PartyType;
  onChangeType: (type: PartyType) => void;
  onSelectParty: (id: string) => void;
  onOpenAddParty: (type: PartyType) => void;
}

export const KhataList: React.FC<KhataListProps> = ({
  parties,
  summaries,
  activeType,
  onChangeType,
  onSelectParty,
  onOpenAddParty,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'lena_hai' | 'dena_hai' | 'barabar' | 'archived'>('all');

  // Filter parties based on type, search, and balance status
  const currentParties = parties.filter((p) => {
    // Check type
    if (p.type !== activeType) return false;

    // Check archived
    if (balanceFilter === 'archived') {
      if (!p.isArchived) return false;
    } else {
      if (p.isArchived) return false;
    }

    // Check search query (offline search)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchPhone = p.phone ? p.phone.toLowerCase().includes(q) : false;
      const matchNotes = p.notes ? p.notes.toLowerCase().includes(q) : false;
      if (!matchName && !matchPhone && !matchNotes) return false;
    }

    // Check balance filter
    if (balanceFilter !== 'all' && balanceFilter !== 'archived') {
      const summary = summaries.get(p.id);
      if (!summary) return false;
      if (summary.status !== balanceFilter) return false;
    }

    return true;
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-y-contain bg-slate-50 text-slate-800 pb-28">
      {/* Header Tabs */}
      <div className="bg-emerald-800 text-white px-3 sm:px-4 pt-3 pb-3.5 rounded-b-2xl shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h1 className="text-base sm:text-lg font-bold tracking-tight">Aapka Khata</h1>
          <button
            onClick={() => onOpenAddParty(activeType)}
            className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition shrink-0 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ {activeType === 'customer' ? 'Customer' : 'Supplier'}</span>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-emerald-950/60 p-1 rounded-xl">
          <button
            onClick={() => {
              onChangeType('customer');
              setBalanceFilter('all');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeType === 'customer'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-200 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Grahak (Customers)
          </button>
          <button
            onClick={() => {
              onChangeType('supplier');
              setBalanceFilter('all');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeType === 'supplier'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-200 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Vyapari (Suppliers)
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 space-y-3">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${activeType === 'customer' ? 'Customer' : 'Supplier'} ka naam ya phone khojein...`}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold no-scrollbar">
          <button
            onClick={() => setBalanceFilter('all')}
            className={`px-3 py-1.5 rounded-full transition whitespace-nowrap ${
              balanceFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Sabhi
          </button>
          <button
            onClick={() => setBalanceFilter('lena_hai')}
            className={`px-3 py-1.5 rounded-full transition whitespace-nowrap flex items-center gap-1 ${
              balanceFilter === 'lena_hai'
                ? 'bg-emerald-700 text-white'
                : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <ArrowDownLeft className="w-3 h-3" />
            Lena Hai
          </button>
          <button
            onClick={() => setBalanceFilter('dena_hai')}
            className={`px-3 py-1.5 rounded-full transition whitespace-nowrap flex items-center gap-1 ${
              balanceFilter === 'dena_hai'
                ? 'bg-rose-700 text-white'
                : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
            }`}
          >
            <ArrowUpRight className="w-3 h-3" />
            Dena Hai
          </button>
          <button
            onClick={() => setBalanceFilter('barabar')}
            className={`px-3 py-1.5 rounded-full transition whitespace-nowrap ${
              balanceFilter === 'barabar'
                ? 'bg-slate-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Hisab Barabar
          </button>
          <button
            onClick={() => setBalanceFilter('archived')}
            className={`px-3 py-1.5 rounded-full transition whitespace-nowrap flex items-center gap-1 ${
              balanceFilter === 'archived'
                ? 'bg-amber-700 text-white'
                : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Archive className="w-3 h-3" />
            Archived
          </button>
        </div>
      </div>

      {/* Parties List */}
      <div className="px-4 space-y-2">
        {currentParties.length === 0 ? (
          /* Empty States */
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm mt-2">
            {searchQuery.trim() || balanceFilter !== 'all' ? (
              <div>
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Kuch nahi mila</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Aapke search ya filter ke anusar koi record nahi hai.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setBalanceFilter('all');
                  }}
                  className="mt-3 text-xs font-bold text-emerald-700 hover:underline"
                >
                  Sabhi Filters Reset Karein
                </button>
              </div>
            ) : activeType === 'customer' ? (
              <div>
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Abhi koi customer nahi hai.</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Apna pehla customer add karein.
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
              <div>
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-2">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Abhi koi supplier nahi hai.</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Apna pehla supplier add karein.
                </p>
                <button
                  onClick={() => onOpenAddParty('supplier')}
                  className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Naya Supplier Add Karein
                </button>
              </div>
            )}
          </div>
        ) : (
          currentParties.map((party) => {
            const summary = summaries.get(party.id);
            const net = summary ? summary.netBalance : 0;
            const status = summary ? summary.status : 'barabar';

            return (
              <div
                key={party.id}
                onClick={() => onSelectParty(party.id)}
                className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shadow-xs">
                    {party.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      {party.name}
                      {party.isArchived && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                          Archived
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      {party.phone && (
                        <span className="flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          {party.phone}
                        </span>
                      )}
                      <span>• {summary?.entriesCount || 0} entries</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {status === 'barabar' ? (
                    <div className="text-xs font-bold text-slate-500">
                      Hisab Barabar
                    </div>
                  ) : status === 'lena_hai' ? (
                    <div>
                      <div className="text-[10px] text-emerald-700 font-semibold">Lena Hai</div>
                      <div className="text-sm font-extrabold text-emerald-700">
                        ₹{Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[10px] text-rose-700 font-semibold">Dena Hai</div>
                      <div className="text-sm font-extrabold text-rose-700">
                        ₹{Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                  )}
                  {summary?.lastEntryDate && (
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {summary.lastEntryDate}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
