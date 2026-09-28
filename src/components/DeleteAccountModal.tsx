import React, { useState } from 'react';
import {
  AlertTriangle,
  Download,
  Trash2,
  X,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { UserProfile } from '../types/khata';
import { exportLocalVault } from '../lib/storage';

interface DeleteAccountModalProps {
  isOpen: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  profile,
  onClose,
  onConfirmDelete,
}) => {
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState(false);
  const [isConfirmedCheckbox, setIsConfirmedCheckbox] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Immediate Download Backup JSON
  const handleDownloadBackup = async () => {
    try {
      const data = await exportLocalVault();
      if (!data) return;

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `DigitalKhata_Backup_${profile?.name || 'Vyapari'}_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setHasDownloadedBackup(true);
      setErrorMsg('');
    } catch {
      setErrorMsg('Backup download karne mein samasya aayi.');
    }
  };

  const handleDelete = async () => {
    if (!isConfirmedCheckbox) {
      setErrorMsg('Kripya confirmation checkbox check karein.');
      return;
    }

    setIsDeleting(true);
    setErrorMsg('');
    try {
      await onConfirmDelete();
      // On success, app will refresh / switch state
    } catch (err: any) {
      setErrorMsg(err.message || 'Account delete karne mein error aaya. Dobara try karein.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md my-auto max-h-[92vh] rounded-3xl shadow-2xl border border-rose-200 overflow-hidden text-slate-800 flex flex-col animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 to-rose-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Account Delete Confirmation</h3>
              <p className="text-xs text-rose-200/80">Permanent Removal & Database Refresh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-rose-300 hover:text-white rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Warning Message */}
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1.5 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 text-rose-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Aapka poora hisab-kitab hamesha ke liye delete ho jayega!</span>
            </div>
            <p className="text-rose-800">
              Account delete karne par aapke sabhi Customers, Suppliers, aur Transactions ka data
              Firebase cloud aur is device se poori tarah erase kar diya jayega. Yeh action wapas nahi ho sakti.
            </p>
          </div>

          {/* Backup Download Recommendation */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Pehle Data Download Karein (Recommended)</span>
              </div>
              {hasDownloadedBackup && (
                <span className="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  Downloaded
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-800">
              Suraksha ke liye delete karne se pehle apna poora record JSON file mein apne phone/computer par save kar lein.
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{hasDownloadedBackup ? 'Dobara Backup Download Karein' : 'Pehle Data Backup Download Karein'}</span>
            </button>
          </div>

          {/* Checkbox confirmation */}
          <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isConfirmedCheckbox}
              onChange={(e) => setIsConfirmedCheckbox(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <span className="text-xs font-semibold text-slate-700 leading-tight">
              Haan, main samajhta/samajhti hoon ki mera saara hisab-kitab delete ho jayega aur main apna account delete karna chahta/chahti hoon.
            </span>
          </label>

          {errorMsg && (
            <div className="text-xs font-bold text-rose-600 p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-center">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmedCheckbox || isDeleting}
              className="w-2/3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Account Delete Ho Raha Hai...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Poora Account Delete Karein</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
