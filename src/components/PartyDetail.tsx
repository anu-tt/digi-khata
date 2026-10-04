import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  FileText,
  Bell,
  MoreVertical,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Calendar,
  Share2,
  Trash2,
  Archive,
  Image as ImageIcon,
} from 'lucide-react';
import {
  KhataEntry,
  KhataParty,
  PartyBalanceSummary,
} from '../types/khata';

interface PartyDetailProps {
  party: KhataParty;
  summary: PartyBalanceSummary;
  entries: KhataEntry[];
  onBack: () => void;
  onOpenAddEntry: (partyId: string, defaultType: 'credit' | 'debit') => void;
  onSelectEntryDetail: (entry: KhataEntry) => void;
  onOpenPDF: (partyId: string) => void;
  onOpenReminderModal: (party: KhataParty) => void;
  onToggleArchiveParty: (party: KhataParty) => void;
  onDeleteParty: (partyId: string) => void;
}

export const PartyDetail: React.FC<PartyDetailProps> = ({
  party,
  summary,
  entries,
  onBack,
  onOpenAddEntry,
  onSelectEntryDetail,
  onOpenPDF,
  onOpenReminderModal,
  onToggleArchiveParty,
  onDeleteParty,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [showMenu, setShowMenu] = useState(false);

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    if (e.partyId !== party.id) return false;
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchDate = e.date.includes(q);
      const matchAmt = e.amount.toString().includes(q);
      if (!matchDesc && !matchDate && !matchAmt) return false;
    }
    return true;
  });

  const net = summary.netBalance;
  const isCustomer = party.type === 'customer';
  const debitLabel = isCustomer ? 'Udhaar Diya (Debit)' : 'Udhar Saman Liya (Debit)';
  const creditLabel = isCustomer ? 'Jama Mila (Credit)' : 'Jama Kiya (Credit)';

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-slate-50 text-slate-800 relative overflow-hidden">
      {/* Top Header */}
      <div className="bg-emerald-800 text-white px-4 pt-3 pb-4 shadow-sm z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-700/60 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">{party.name}</h1>
                <span className="text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded text-emerald-200 uppercase font-semibold">
                  {isCustomer ? 'Customer' : 'Supplier'}
                </span>
              </div>
              <div className="text-xs text-emerald-200">
                {party.phone ? party.phone : 'Mobile number nahi hai'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 relative">
            {party.phone && (
              <a
                href={`tel:${party.phone}`}
                className="p-2 text-emerald-100 hover:text-white hover:bg-emerald-700 rounded-xl transition"
                title="Call Karein"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={() => onOpenPDF(party.id)}
              className="p-2 text-emerald-100 hover:text-white hover:bg-emerald-700 rounded-xl transition"
              title="PDF Statement"
            >
              <FileText className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-emerald-100 hover:text-white hover:bg-emerald-700 rounded-xl transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-10 w-44 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-100 py-1 text-xs z-50">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenReminderModal(party);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <Bell className="w-3.5 h-3.5 text-slate-500" />
                  Reminder Set Karein
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onToggleArchiveParty(party);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-amber-700"
                >
                  <Archive className="w-3.5 h-3.5" />
                  {party.isArchived ? 'Unarchive Karein' : 'Archive Karein'}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (confirm(`Kya aap sach mein ${party.name} ko delete karna chahte hain?`)) {
                      onDeleteParty(party.id);
                    }
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 flex items-center gap-2 font-medium text-rose-600 border-t border-slate-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Khata Delete Karein
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Balance Card */}
        <div className="mt-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-200 font-semibold">Net Hisab</span>
            <span className="text-[11px] text-emerald-100">
              {entries.filter((e) => e.partyId === party.id).length} Entries
            </span>
          </div>

          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {summary.status === 'barabar' ? (
                <span>₹0</span>
              ) : (
                <span>₹{Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              )}
            </div>

            <div className="text-xs font-bold px-2 py-0.5 rounded-full">
              {summary.status === 'barabar' ? (
                <span className="text-emerald-200 bg-emerald-900/60 px-2.5 py-1 rounded-full">
                  Hisab Barabar
                </span>
              ) : summary.status === 'lena_hai' ? (
                <span className="text-emerald-900 bg-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ArrowDownLeft className="w-3 h-3" />
                  Aapko Lena Hai
                </span>
              ) : (
                <span className="text-rose-900 bg-rose-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  Aapko Dena Hai
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-[11px] text-emerald-100">
            <div>{isCustomer ? 'Total Jama Mila (+)' : 'Total Jama Kiya (-)'}: ₹{summary.totalCredit.toLocaleString('en-IN')}</div>
            <div>{isCustomer ? 'Total Udhaar Diya (-)' : 'Total Udhar Saman Liya (+)'}: ₹{summary.totalDebit.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Sub-toolbar: Search & Filters */}
      <div className="p-3 bg-white border-b border-slate-200 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Vivran ya amount khojein..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2 py-1 rounded-md transition ${typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('credit')}
            className={`px-2 py-1 rounded-md transition ${typeFilter === 'credit' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'}`}
          >
            {isCustomer ? 'Jama Mila' : 'Jama Kiya'}
          </button>
          <button
            onClick={() => setTypeFilter('debit')}
            className={`px-2 py-1 rounded-md transition ${typeFilter === 'debit' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'}`}
          >
            {isCustomer ? 'Udhaar Diya' : 'Udhar Saman Liya'}
          </button>
        </div>
      </div>

      {/* Ledger Entries List */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-3 sm:p-4 space-y-2.5">
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm mt-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Abhi koi entry nahi hai</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto">
              Neeche diye gaye buttons se {isCustomer ? 'Udhaar Diya ya Jama Mila' : 'Udhar Saman Liya ya Jama Kiya'} ki pehli entry karein.
            </p>
          </div>
        ) : (
          filteredEntries.map((e) => {
            const isJama = e.type === 'credit';
            return (
              <div
                key={e.id}
                onClick={() => onSelectEntryDetail(e)}
                className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition shadow-xs active:scale-[0.99]"
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
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{e.description || (isCustomer ? (isJama ? 'Jama Mila' : 'Udhaar Diya') : (isJama ? 'Jama Kiya' : 'Udhar Saman Liya'))}</span>
                      {e.attachments && e.attachments.length > 0 && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                          <ImageIcon className="w-2.5 h-2.5" />
                          {e.attachments.length}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {e.date}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-base font-extrabold ${
                      isJama ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {isCustomer ? (isJama ? '+' : '-') : (isJama ? '-' : '+')} ₹{e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400">
                    {isCustomer ? (isJama ? 'Jama (Credit)' : 'Udhaar (Debit)') : (isJama ? 'Jama Kiya (Credit)' : 'Udhar Saman (Debit)')}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Docked Bottom Action Buttons for Entry */}
      <div className="p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center gap-2.5 shrink-0 z-30 shadow-lg">
        {/* Debit entry */}
        <button
          onClick={() => onOpenAddEntry(party.id, 'debit')}
          className="flex-1 py-3 px-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>{isCustomer ? '-' : '+'} {debitLabel}</span>
        </button>

        {/* Credit entry */}
        <button
          onClick={() => onOpenAddEntry(party.id, 'credit')}
          className="flex-1 py-3 px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>{isCustomer ? '+' : '-'} {creditLabel}</span>
        </button>
      </div>
    </div>
  );
};
