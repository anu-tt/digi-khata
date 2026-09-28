import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Truck,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  FileText,
  Search,
  Bell,
  Calendar,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Download,
  Filter,
} from 'lucide-react';
import {
  KhataEntry,
  KhataParty,
  UserProfile,
  DashboardStats,
  PartyBalanceSummary,
  PartyType,
  KhataReminder,
} from '../types/khata';
import { PartyDetail } from './PartyDetail';

interface DesktopKhataViewProps {
  activeTab: 'home' | 'customers' | 'suppliers' | 'reminders';
  profile: UserProfile;
  stats: DashboardStats;
  parties: KhataParty[];
  entries: KhataEntry[];
  reminders: KhataReminder[];
  partySummaries: Map<string, PartyBalanceSummary>;
  activePartyId: string | null;
  onSelectParty: (partyId: string | null) => void;
  onOpenAddParty: (type: PartyType) => void;
  onOpenAddEntry: (partyId?: string, defaultType?: 'credit' | 'debit') => void;
  onOpenPDF: (partyId?: string) => void;
  onSelectEntryDetail: (entry: KhataEntry) => void;
  onOpenReminderModal: (party?: KhataParty) => void;
  onToggleReminderComplete: (id: string, completed: boolean) => void;
  onDeleteReminder: (id: string) => void;
  onToggleArchiveParty: (party: KhataParty) => void;
  onDeleteParty: (partyId: string) => void;
}

export const DesktopKhataView: React.FC<DesktopKhataViewProps> = ({
  activeTab,
  profile,
  stats,
  parties,
  entries,
  reminders,
  partySummaries,
  activePartyId,
  onSelectParty,
  onOpenAddParty,
  onOpenAddEntry,
  onOpenPDF,
  onSelectEntryDetail,
  onOpenReminderModal,
  onToggleReminderComplete,
  onDeleteReminder,
  onToggleArchiveParty,
  onDeleteParty,
}) => {
  const [entryFilter, setEntryFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [entrySearch, setEntrySearch] = useState('');
  const [partySearch, setPartySearch] = useState('');
  const [partyFilter, setPartyFilter] = useState<'all' | 'lena_hai' | 'dena_hai' | 'barabar'>('all');

  const selectedParty = activePartyId ? parties.find((p) => p.id === activePartyId) : null;
  const selectedSummary = selectedParty ? partySummaries.get(selectedParty.id) : null;

  // Filtered recent entries
  const filteredRecentEntries = entries.filter((e) => {
    if (entryFilter !== 'all' && e.type !== entryFilter) return false;
    if (entrySearch.trim()) {
      const q = entrySearch.toLowerCase();
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchAmt = e.amount.toString().includes(q);
      const party = parties.find((p) => p.id === e.partyId);
      const matchParty = party ? party.name.toLowerCase().includes(q) : false;
      if (!matchDesc && !matchAmt && !matchParty) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* 3D KPI Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Lena Hai (Receivable) */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-5 border border-emerald-700/50 shadow-xl card-depth-3d relative overflow-hidden">
          <div className="absolute top-2 right-2 w-20 h-20 text-emerald-800/30 font-black text-6xl select-none pointer-events-none">
            ₹
          </div>
          <div className="flex items-center justify-between text-emerald-200 text-xs font-bold uppercase tracking-wider">
            <span>Total Lena Hai</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-800/80 border border-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-3xl xl:text-4xl font-black text-white mt-2 tracking-tight">
            ₹{stats.totalLenaHai.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-emerald-200/80 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Grahakon se lena baaki hai</span>
          </div>
        </div>

        {/* Total Dena Hai (Payable) */}
        <div className="bg-gradient-to-br from-rose-950 to-slate-950 text-white rounded-3xl p-5 border border-rose-800/40 shadow-xl card-depth-3d relative overflow-hidden">
          <div className="absolute top-2 right-2 w-20 h-20 text-rose-900/30 font-black text-6xl select-none pointer-events-none">
            ₹
          </div>
          <div className="flex items-center justify-between text-rose-200 text-xs font-bold uppercase tracking-wider">
            <span>Total Dena Hai</span>
            <div className="w-8 h-8 rounded-xl bg-rose-900/80 border border-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-rose-300" />
            </div>
          </div>
          <div className="text-3xl xl:text-4xl font-black text-white mt-2 tracking-tight">
            ₹{stats.totalDenaHai.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-rose-200/80 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Vyapari / Supplier ko dena hai</span>
          </div>
        </div>

        {/* Net Hisab Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md card-depth-3d relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Net Balance Status</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
              ₹
            </div>
          </div>
          <div
            className={`text-3xl xl:text-4xl font-black mt-2 tracking-tight ${
              stats.netBalance > 0
                ? 'text-emerald-700'
                : stats.netBalance < 0
                ? 'text-rose-700'
                : 'text-slate-700'
            }`}
          >
            {stats.netBalance === 0
              ? 'Hisab Barabar'
              : `₹${Math.abs(stats.netBalance).toLocaleString('en-IN')}`}
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            {stats.netBalance > 0 ? (
              <span className="text-emerald-700 font-bold">Net Receivable (Aapko Lena Hai)</span>
            ) : stats.netBalance < 0 ? (
              <span className="text-rose-700 font-bold">Net Payable (Aapko Dena Hai)</span>
            ) : (
              'Koi baaki amount nahi hai'
            )}
          </div>
        </div>

        {/* Registered Parties Count */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md card-depth-3d flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Parties</span>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-emerald-700" />
              <Truck className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <div className="flex items-baseline gap-4 mt-2">
            <div>
              <span className="text-2xl font-black text-slate-900">{stats.customerCount}</span>
              <span className="text-xs text-slate-500 ml-1">Customers</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-2xl font-black text-slate-900">{stats.supplierCount}</span>
              <span className="text-xs text-slate-500 ml-1">Suppliers</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            <button
              onClick={() => onOpenAddParty('customer')}
              className="text-emerald-700 font-bold hover:underline"
            >
              + Customer Add
            </button>
            <button
              onClick={() => onOpenAddParty('supplier')}
              className="text-teal-700 font-bold hover:underline"
            >
              + Supplier Add
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD MODE: Multi-Column Overview */}
      {activeTab === 'home' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Detailed Ledger Transactions Table */}
          <div className="xl:col-span-8 bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Haal Ki Entries (Recent Transactions)
                </h2>
                <p className="text-xs text-slate-500">Aapke sabhi khate ki recent debit aur credit entries</p>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={entrySearch}
                    onChange={(e) => setEntrySearch(e.target.value)}
                    placeholder="Khojein..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setEntryFilter('all')}
                    className={`px-3 py-1 rounded-lg transition ${
                      entryFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Sabhi
                  </button>
                  <button
                    onClick={() => setEntryFilter('credit')}
                    className={`px-3 py-1 rounded-lg transition ${
                      entryFilter === 'credit' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Jama
                  </button>
                  <button
                    onClick={() => setEntryFilter('debit')}
                    className={`px-3 py-1 rounded-lg transition ${
                      entryFilter === 'debit' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Udhaar
                  </button>
                </div>
              </div>
            </div>

            {/* Entries Table */}
            {filteredRecentEntries.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 font-bold">
                  ₹
                </div>
                <div className="text-sm font-bold text-slate-800">Abhi koi entry nahi hai</div>
                <div className="text-xs">Upar diye gaye "+ Nayi Entry Karein" button se pehli entry add karein.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Taareekh</th>
                      <th className="px-4 py-3">Party Ka Naam</th>
                      <th className="px-4 py-3">Vivran / Note</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Parchi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecentEntries.map((e) => {
                      const party = parties.find((p) => p.id === e.partyId);
                      const isJama = e.type === 'credit';
                      return (
                        <tr
                          key={e.id}
                          onClick={() => onSelectEntryDetail(e)}
                          className="hover:bg-slate-50 cursor-pointer transition"
                        >
                          <td className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">{e.date}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {party ? party.name : 'Unknown Party'}
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                            {e.description || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isJama
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {isJama ? 'Jama (Credit)' : 'Udhaar (Debit)'}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-extrabold text-sm ${
                              isJama ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isJama ? '+' : '-'} ₹{e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {e.attachments && e.attachments.length > 0 ? (
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                                📎 {e.attachments.length}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column (4 cols): Quick Parties List & Reminders */}
          <div className="xl:col-span-4 space-y-6">
            {/* Parties Snapshot */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Parties & Khata
                </h3>
                <button
                  onClick={() => onOpenAddParty('customer')}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  + Naya Grahak
                </button>
              </div>

              {parties.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                  Abhi koi customer nahi hai.
                </div>
              ) : (
                <div className="space-y-2">
                  {parties.slice(0, 5).map((p) => {
                    const summary = partySummaries.get(p.id);
                    const net = summary ? summary.netBalance : 0;
                    return (
                      <div
                        key={p.id}
                        onClick={() => onSelectParty(p.id)}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 cursor-pointer flex items-center justify-between transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{p.name}</div>
                            <div className="text-[10px] text-slate-500">{p.phone || 'No Phone'}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`text-xs font-extrabold ${
                              summary?.status === 'lena_hai'
                                ? 'text-emerald-700'
                                : summary?.status === 'dena_hai'
                                ? 'text-rose-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {summary?.status === 'barabar'
                              ? 'Barabar'
                              : `₹${Math.abs(net).toLocaleString('en-IN')}`}
                          </div>
                          <div className="text-[9px] text-slate-400 font-semibold">
                            {summary?.status === 'lena_hai'
                              ? 'Lena Hai'
                              : summary?.status === 'dena_hai'
                              ? 'Dena Hai'
                              : '0.00'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming Reminders Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  Upcoming Reminders
                </h3>
                <button
                  onClick={() => onOpenReminderModal()}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  + Naya Reminder
                </button>
              </div>

              {reminders.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                  Abhi koi reminder nahi hai.
                </div>
              ) : (
                <div className="space-y-2">
                  {reminders.slice(0, 4).map((r) => (
                    <div
                      key={r.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                        r.completed ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-semibold text-slate-800 truncate">{r.title}</div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">{r.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMERS / SUPPLIERS MODE: Split-Pane Master-Detail on PC */}
      {(activeTab === 'customers' || activeTab === 'suppliers') && (
        <div className="flex-1 grid grid-cols-12 gap-6 min-h-[550px]">
          {/* Left Column (4 cols): Directory List */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-4 bg-white rounded-3xl p-4 border border-slate-200 shadow-md flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {activeTab === 'customers' ? 'Customers List' : 'Suppliers List'}
              </h2>
              <button
                onClick={() => onOpenAddParty(activeTab === 'customers' ? 'customer' : 'supplier')}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                + Add
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={partySearch}
                onChange={(e) => setPartySearch(e.target.value)}
                placeholder="Khojein (Naam / Phone)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-bold pb-1">
              <button
                onClick={() => setPartyFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  partyFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Sabhi
              </button>
              <button
                onClick={() => setPartyFilter('lena_hai')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  partyFilter === 'lena_hai' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-emerald-700'
                }`}
              >
                Lena Hai
              </button>
              <button
                onClick={() => setPartyFilter('dena_hai')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  partyFilter === 'dena_hai' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-rose-700'
                }`}
              >
                Dena Hai
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {parties
                .filter((p) => p.type === (activeTab === 'customers' ? 'customer' : 'supplier'))
                .filter((p) => {
                  if (partySearch.trim()) {
                    const q = partySearch.toLowerCase();
                    const matchName = p.name.toLowerCase().includes(q);
                    const matchPhone = p.phone ? p.phone.includes(q) : false;
                    if (!matchName && !matchPhone) return false;
                  }
                  if (partyFilter !== 'all') {
                    const summary = partySummaries.get(p.id);
                    if (summary?.status !== partyFilter) return false;
                  }
                  return true;
                })
                .map((party) => {
                  const summary = partySummaries.get(party.id);
                  const isSelected = activePartyId === party.id;
                  const net = summary ? summary.netBalance : 0;
                  return (
                    <div
                      key={party.id}
                      onClick={() => onSelectParty(party.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-600 shadow-sm ring-1 ring-emerald-600'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
                          {party.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{party.name}</div>
                          <div className="text-[10px] text-slate-500">{party.phone || 'No phone'}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-xs font-extrabold ${
                            summary?.status === 'lena_hai'
                              ? 'text-emerald-700'
                              : summary?.status === 'dena_hai'
                              ? 'text-rose-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {summary?.status === 'barabar'
                            ? 'Barabar'
                            : `₹${Math.abs(net).toLocaleString('en-IN')}`}
                        </div>
                        <div className="text-[9px] text-slate-400 font-semibold">
                          {summary?.status === 'lena_hai' ? 'Lena' : summary?.status === 'dena_hai' ? 'Dena' : '0.00'}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right Column (8 cols): Selected Party's Live Ledger Detail View */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
            {selectedParty && selectedSummary ? (
              <PartyDetail
                party={selectedParty}
                summary={selectedSummary}
                entries={entries}
                onBack={() => onSelectParty(null)}
                onOpenAddEntry={(partyId, defType) => onOpenAddEntry(partyId, defType)}
                onSelectEntryDetail={onSelectEntryDetail}
                onOpenPDF={onOpenPDF}
                onOpenReminderModal={onOpenReminderModal}
                onToggleArchiveParty={onToggleArchiveParty}
                onDeleteParty={onDeleteParty}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Kisi Bhi Party Ka Khata Chunein</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Left panel mein se customer ya supplier par click karein unka poora hisab-kitab yahan dekhne ke liye.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REMINDERS MODE ON PC */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                Reminders (Yaad-Dihani Dashboard)
              </h2>
              <p className="text-xs text-slate-500">Khata check karne ya customer ko call karne ke liye reminders</p>
            </div>
            <button
              onClick={() => onOpenReminderModal()}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              + Naya Reminder
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminders.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleReminderComplete(r.id, !r.completed)}
                    className="text-emerald-700 hover:scale-105 transition"
                  >
                    {r.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-slate-300 block" />
                    )}
                  </button>
                  <div>
                    <div
                      className={`text-xs font-bold text-slate-900 ${
                        r.completed ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {r.title}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{r.date}</span>
                      {r.partyName && (
                        <span className="bg-emerald-100 text-emerald-800 px-1.5 rounded font-semibold text-[10px]">
                          {r.partyName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteReminder(r.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
