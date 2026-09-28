import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Image as ImageIcon,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Check,
} from 'lucide-react';
import { KhataEntry, KhataParty, KhataAttachment, EntryType } from '../types/khata';

interface AddEntryModalProps {
  isOpen: boolean;
  parties: KhataParty[];
  defaultPartyId?: string;
  defaultType?: EntryType;
  onClose: () => void;
  onSave: (entryData: Omit<KhataEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => void;
}

export const AddEntryModal: React.FC<AddEntryModalProps> = ({
  isOpen,
  parties,
  defaultPartyId,
  defaultType = 'credit',
  onClose,
  onSave,
}) => {
  const [selectedPartyId, setSelectedPartyId] = useState(defaultPartyId || (parties[0]?.id || ''));
  const [entryType, setEntryType] = useState<EntryType>(defaultType);
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attachments, setAttachments] = useState<KhataAttachment[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (defaultPartyId) setSelectedPartyId(defaultPartyId);
    if (defaultType) setEntryType(defaultType);
  }, [defaultPartyId, defaultType]);

  if (!isOpen) return null;

  // Handle Bill/Image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Kripya sirf photo ya image file chunein.');
        return;
      }

      // Max 5MB per image
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Photo ka size 5MB se chhota hona chahiye.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newAttachment: KhataAttachment = {
          id: 'att_' + Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: file.type,
          dataUrl,
          size: file.size,
          createdAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amountStr);

    if (isNaN(num) || num <= 0) {
      setErrorMsg('Kripya sahi amount enter karein (0 se zyada).');
      return;
    }

    if (!selectedPartyId) {
      setErrorMsg('Kripya party (Customer ya Supplier) chunein.');
      return;
    }

    setErrorMsg('');

    onSave({
      partyId: selectedPartyId,
      type: entryType,
      amount: Math.round(num * 100) / 100,
      description: description.trim(),
      date,
      attachments,
    });

    // Reset form
    setAmountStr('');
    setDescription('');
    setAttachments([]);
    onClose();
  };

  const selectedParty = parties.find((p) => p.id === selectedPartyId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-800 w-full max-w-md my-auto max-h-[92vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div
          className={`p-4 text-white flex items-center justify-between transition-colors ${
            entryType === 'credit' ? 'bg-emerald-800' : 'bg-rose-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              {entryType === 'credit' ? (
                <ArrowDownLeft className="w-4 h-4 text-emerald-200" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-rose-200" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {entryType === 'credit' ? '+ Jama Mila (Credit)' : '- Udhaar Diya (Debit)'}
              </h2>
              <div className="text-[11px] text-white/80">
                {selectedParty ? `${selectedParty.name} ke khate mein` : 'Nayi entry karein'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Party Selector if multiple */}
          {!defaultPartyId && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Party Chunein (Customer / Supplier) <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type === 'customer' ? 'Customer' : 'Supplier'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Entry Type Toggle (Jama / Udhaar) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setEntryType('debit')}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                entryType === 'debit'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Udhaar Diya (Debit)
            </button>
            <button
              type="button"
              onClick={() => setEntryType('credit')}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                entryType === 'credit'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Jama Mila (Credit)
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rupaye / Amount <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-2xl font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Vivran / Note <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Kirana saman, Bill no 40, Cash payment..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
            />
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Entry Ki Taareekh (Date)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
            />
          </div>

          {/* Bill / Document Attachment */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                Bill / Parchi Ki Photo <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-slate-400">{attachments.length} attached</span>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                Photo Attach Karein
              </button>

              {/* Thumbnails */}
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-xs"
                >
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3 text-white rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                entryType === 'credit'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Check className="w-4 h-4" />
              Save Karein (₹{amountStr ? parseFloat(amountStr).toLocaleString('en-IN') : '0.00'})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
