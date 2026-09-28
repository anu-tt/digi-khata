import React, { useState } from 'react';
import { X, User, Phone, FileText, Check } from 'lucide-react';
import { PartyType, KhataParty } from '../types/khata';

interface AddPartyModalProps {
  isOpen: boolean;
  type: PartyType;
  onClose: () => void;
  onSave: (partyData: Omit<KhataParty, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived'>) => void;
}

export const AddPartyModal: React.FC<AddPartyModalProps> = ({
  isOpen,
  type,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(`${type === 'customer' ? 'Customer' : 'Supplier'} ka naam zaroori hai.`);
      return;
    }

    setErrorMsg('');
    onSave({
      type,
      name: name.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setName('');
    setPhone('');
    setNotes('');
    onClose();
  };

  const isCustomer = type === 'customer';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white text-slate-800 w-full sm:max-w-sm h-full sm:h-auto sm:max-h-[92vh] sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">
              {isCustomer ? 'Naya Customer Add Karein' : 'Naya Supplier Add Karein'}
            </h2>
            <p className="text-[11px] text-emerald-200">
              {isCustomer ? 'Grahak ka khata banayein' : 'Maal supply karne wale ka khata'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isCustomer ? 'Customer Ka Naam' : 'Supplier Ka Naam'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isCustomer ? 'Grahak ka naam dalein' : 'Supplier ya dukaan ka naam'}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative flex items-center">
              <Phone className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Note / Pata <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative flex items-center">
              <FileText className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Koi zaroori baat ya pata..."
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-2/3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Karein
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
