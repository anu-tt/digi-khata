import React, { useState } from 'react';
import { Bell, Plus, CheckCircle2, Circle, Trash2, Calendar, User, ArrowLeft } from 'lucide-react';
import { KhataParty, KhataReminder } from '../types/khata';

interface RemindersViewProps {
  parties: KhataParty[];
  reminders: KhataReminder[];
  onBackToHome?: () => void;
  onAddReminder: (reminder: Omit<KhataReminder, 'id' | 'userId' | 'createdAt' | 'completed'>) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDeleteReminder: (id: string) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  parties,
  reminders,
  onBackToHome,
  onAddReminder,
  onToggleComplete,
  onDeleteReminder,
}) => {
  const [title, setTitle] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const party = parties.find((p) => p.id === selectedPartyId);

    onAddReminder({
      partyId: selectedPartyId || undefined,
      partyName: party ? party.name : undefined,
      title: title.trim(),
      date,
    });

    setTitle('');
    setSelectedPartyId('');
    setIsAdding(false);
  };

  const pendingReminders = reminders.filter((r) => !r.completed);
  const completedReminders = reminders.filter((r) => r.completed);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-y-contain bg-slate-50 text-slate-800 pb-28">
      {/* Top Mobile App Bar */}
      <div className="bg-emerald-800 text-white px-4 pt-3 pb-4 shadow-sm shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="p-1.5 -ml-1.5 text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-700/50"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-9 h-9 rounded-2xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center">
              <Bell className="w-4 h-4 text-emerald-100" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">Reminders (Yaad-Dihani)</h1>
              <div className="text-[11px] text-emerald-200">
                {pendingReminders.length} pending reminder{pendingReminders.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Add Reminder Form */}
        {isAdding && (
          <form onSubmit={handleSave} className="p-4 bg-white border border-emerald-200 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950">Naya Reminder Banayein</span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Kaam / Reminder Ka Vivran <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Jaise: Payment reminder bhejna hai, Mal bhejna hai..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Party Chunein (Optional)
              </label>
              <select
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">-- Kisi Party Se Link Nahi --</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type === 'customer' ? 'Customer' : 'Supplier'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tarikh</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="w-1/3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="w-2/3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                Reminder Save Karein
              </button>
            </div>
          </form>
        )}

        {/* Reminders List */}
        {reminders.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-500 shadow-sm">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-800">Abhi Koi Reminder Nahi Hai</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Upar "+ Add" button se payment ya order ka reminder jod sakte hain.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending Section */}
            {pendingReminders.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  Pending ({pendingReminders.length})
                </div>
                {pendingReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-3.5 bg-white border border-slate-200/80 rounded-2xl flex items-start justify-between gap-3 shadow-sm hover:border-emerald-300 transition"
                  >
                    <button
                      onClick={() => onToggleComplete(rem.id, true)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition"
                      title="Mark complete"
                    >
                      <Circle className="w-5 h-5" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 leading-snug">{rem.title}</div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                        {rem.partyName && (
                          <span className="flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                            <User className="w-3 h-3" />
                            {rem.partyName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {rem.date}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteReminder(rem.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Section */}
            {completedReminders.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  Poore Ho Gaye ({completedReminders.length})
                </div>
                {completedReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-3 bg-slate-100/80 border border-slate-200 rounded-2xl flex items-start justify-between gap-3 opacity-75"
                  >
                    <button
                      onClick={() => onToggleComplete(rem.id, false)}
                      className="mt-0.5 text-emerald-600"
                      title="Mark pending"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-500 line-through leading-snug">
                        {rem.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        {rem.partyName && <span>{rem.partyName}</span>}
                        <span>{rem.date}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteReminder(rem.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
