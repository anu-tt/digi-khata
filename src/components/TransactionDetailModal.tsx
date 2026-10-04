import React, { useState } from 'react';
import {
  X,
  Trash2,
  Calendar,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Image as ImageIcon,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';
import { KhataEntry, KhataParty } from '../types/khata';

interface TransactionDetailModalProps {
  entry: KhataEntry | null;
  parties: KhataParty[];
  onClose: () => void;
  onDeleteEntry: (id: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  entry,
  parties,
  onClose,
  onDeleteEntry,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  if (!entry) return null;

  const party = parties.find((p) => p.id === entry.partyId);
  const isJama = entry.type === 'credit';
  const isSupplier = party?.type === 'supplier';
  const entryLabel = isSupplier
    ? (isJama ? 'Payment Diya (Credit)' : 'Maal Kharida (Debit)')
    : (isJama ? 'Jama Mila (Credit)' : 'Udhaar Diya (Debit)');

  const handleDelete = () => {
    if (confirm('Kya aap sach mein yeh entry delete karna chahte hain?')) {
      onDeleteEntry(entry.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-800 w-full max-w-sm my-auto max-h-[92vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div
          className={`p-4 text-white flex items-center justify-between ${
            isJama ? 'bg-emerald-800' : 'bg-rose-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              {isJama ? (
                <ArrowDownLeft className="w-4 h-4 text-emerald-200" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-rose-200" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {entryLabel}
              </h2>
              <div className="text-[11px] text-white/80">
                {party ? party.name : 'Unknown Party'}
              </div>
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
          {/* Amount Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isSupplier ? (isJama ? 'Supplier ko payment diya' : 'Supplier se maal kharida') : (isJama ? 'Aapko Mila (Jama)' : 'Aapne Diya (Udhaar)')}
            </div>
            <div
              className={`text-3xl font-extrabold mt-1 tracking-tight ${
                isJama ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {isSupplier ? (isJama ? '-' : '+') : (isJama ? '+' : '-')} ₹{entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Party Ka Naam
              </span>
              <span className="font-bold text-slate-900">{party?.name || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Taareekh (Date)
              </span>
              <span className="font-semibold text-slate-900">{entry.date}</span>
            </div>

            <div className="py-1.5 border-b border-slate-100">
              <span className="font-semibold text-slate-500 block mb-1">Vivran / Note</span>
              <div className="text-slate-900 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                {entry.description || 'Koi vivran nahi likha gaya.'}
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Created At
              </span>
              <span className="text-[11px] text-slate-500">
                {new Date(entry.createdAt).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Sync Status
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Safe & Encrypted
              </span>
            </div>
          </div>

          {/* Attached Images */}
          {entry.attachments && entry.attachments.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                Attached Bill / Parchi ({entry.attachments.length})
              </div>
              <div className="grid grid-cols-2 gap-2">
                {entry.attachments.map((att, idx) => (
                  <div
                    key={att.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 cursor-pointer shadow-xs"
                  >
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      View
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delete Button */}
          <div className="pt-2">
            <button
              onClick={handleDelete}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Yeh Entry Delete Karein
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Image Viewer Modal */}
      {activeImageIndex !== null && entry.attachments[activeImageIndex] && (
        <div
          className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center p-4"
          onClick={() => setActiveImageIndex(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setActiveImageIndex(null)}
              className="p-2 text-white/80 hover:text-white bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <img
            src={entry.attachments[activeImageIndex].dataUrl}
            alt="Bill Document"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="mt-3 text-white/80 text-xs font-medium">
            {entry.attachments[activeImageIndex].name} • Tap outside to close
          </div>
        </div>
      )}
    </div>
  );
};
