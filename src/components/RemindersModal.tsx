import React, { useState } from 'react';
import { X, Bell, Plus, CheckCircle2, Circle, Trash2, Calendar, User } from 'lucide-react';
import { KhataParty, KhataReminder } from '../types/khata';

interface RemindersModalProps {
  isOpen: boolean;
  parties: KhataParty[];
  reminders: KhataReminder[];
  initialParty?: KhataParty | null;
  onClose: () => void;
  onAddReminder: (reminder: Omit<KhataReminder, 'id' | 'userId' | 'createdAt' | 'completed'>) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDeleteReminder: (id: string) => void;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({
  isOpen,
  parties,
  reminders,
  initialParty,
  onClose,
  onAddReminder,
  onToggleComplete,
  onDeleteReminder,
}) => {
  const [title, setTitle] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState(initialParty?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);

  React.useEffect(() => {
    if (initialParty) {
      setSelectedPartyId(initialParty.id);
      setTitle(`${initialParty.name} ko call karna hai`);
      setIsAdding(true);
    }
  }, [initialParty]);

  if (!isOpen) return null;

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
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-800 w-full max-w-sm my-auto max-h-[92vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center">
              <Bell className="w-4 h-4 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-base font-bold">Reminders (Yaad-Dihani)</h2>
              <div className="text-[11px] text-emerald-200">Apne khate ke zaroori kaam</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Add Reminder Toggle */}
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              Naya Reminder Banayein
            </button>
          ) : (
            <form onSubmit={handleSave} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-slate-700">Naya Reminder</div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Kaam / Reminder Ka Vivran
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Customer ko call karna hai, Khata check karna hai..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Party (Optional)
                </label>
                <select
                  value={selectedPartyId}
                  onChange={(e) => setSelectedPartyId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="">Koi party nahi (General)</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type === 'customer' ? 'Customer' : 'Supplier'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Taareekh (Date)
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="w-1/3 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="w-2/3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          )}

          {/* List of Reminders */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Aapke Reminders ({reminders.length})
            </div>

            {reminders.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200/60">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-700">Abhi koi reminder nahi hai</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Zaroori hisab ya call ke liye reminder set karein.
                </div>
              </div>
            ) : (
              reminders.map((r) => (
                <div
                  key={r.id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    r.completed
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200/90 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleComplete(r.id, !r.completed)}
                      className="text-emerald-700 hover:scale-105 transition shrink-0"
                    >
                      {r.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-emerald-500" />
                      )}
                    </button>
                    <div className="truncate">
                      <div
                        className={`text-xs font-bold text-slate-900 truncate ${
                          r.completed ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {r.title}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{r.date}</span>
                        {r.partyName && (
                          <span className="bg-slate-100 text-slate-600 px-1 rounded font-medium">
                            {r.partyName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteReminder(r.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
