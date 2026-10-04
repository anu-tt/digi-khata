import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Share2,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { generateKhataStatementPDF } from '../lib/pdf';
import { KhataEntry, KhataParty, UserProfile } from '../types/khata';

interface PDFModalProps {
  isOpen: boolean;
  parties: KhataParty[];
  entries: KhataEntry[];
  profile: UserProfile;
  initialPartyId?: string;
  onClose: () => void;
}

export const PDFModal: React.FC<PDFModalProps> = ({
  isOpen,
  parties,
  entries,
  profile,
  initialPartyId,
  onClose,
}) => {
  const [selectedPartyId, setSelectedPartyId] = useState(initialPartyId || (parties[0]?.id || ''));
  const [dateRangeMode, setDateRangeMode] = useState<'all' | 'this_month' | 'last_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  React.useEffect(() => {
    if (initialPartyId) setSelectedPartyId(initialPartyId);
  }, [initialPartyId]);

  if (!isOpen) return null;

  const party = parties.find((p) => p.id === selectedPartyId);

  // Compute effective date bounds
  const getDates = () => {
    const now = new Date();
    if (dateRangeMode === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = now.toISOString().split('T')[0];
      return { start, end };
    }
    if (dateRangeMode === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      return { start, end };
    }
    if (dateRangeMode === 'custom') {
      return { start: startDate, end: endDate };
    }
    return { start: undefined, end: undefined };
  };

  const handleDownloadPDF = () => {
    if (!party) return;
    setIsGenerating(true);
    setStatusMessage('');

    try {
      const { start, end } = getDates();
      const doc = generateKhataStatementPDF({
        profile,
        party,
        entries,
        startDate: start,
        endDate: end,
        filterType,
      });

      const fileName = `Khata_Statement_${party.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      setStatusMessage('PDF download ho gayi hai!');
    } catch (err: any) {
      setStatusMessage('PDF nahi ban paayi. Dobara try karein.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSharePDF = async () => {
    if (!party) return;
    setIsGenerating(true);
    setStatusMessage('');

    try {
      const { start, end } = getDates();
      const doc = generateKhataStatementPDF({
        profile,
        party,
        entries,
        startDate: start,
        endDate: end,
        filterType,
      });

      const blob = doc.output('blob');
      const fileName = `Khata_${party.name.replace(/\s+/g, '_')}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Khata Statement - ${party.name}`,
          text: `${party.name} ke khate ka statement (Digital Khata dwara)`,
        });
        setStatusMessage('Share sheet khul gayi.');
      } else if (navigator.share) {
        await navigator.share({
          title: `Khata Statement - ${party.name}`,
          text: `Namaste ${party.name}, aapka khata hisab statement Digital Khata dwara taiyar kiya gaya hai.`,
        });
      } else {
        // Fallback to download
        doc.save(fileName);
        setStatusMessage('Device par direct share support nahi hai. PDF download kar di gayi hai.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setStatusMessage('Share nahi ho paya. Direct download try karein.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-800 w-full max-w-sm my-auto max-h-[92vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-base font-bold">Khata Statement PDF</h2>
              <div className="text-[11px] text-emerald-200">PDF download ya share karein</div>
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
          {statusMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Party Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Party Chunein (Customer / Supplier)
            </label>
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type === 'customer' ? 'Customer' : 'Supplier'})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Statement Period (Samay Ka Chayan)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDateRangeMode('all')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                  dateRangeMode === 'all'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Poora Khata (All)
              </button>
              <button
                type="button"
                onClick={() => setDateRangeMode('this_month')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                  dateRangeMode === 'this_month'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Yeh Mahina
              </button>
              <button
                type="button"
                onClick={() => setDateRangeMode('last_month')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                  dateRangeMode === 'last_month'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Pichla Mahina
              </button>
              <button
                type="button"
                onClick={() => setDateRangeMode('custom')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                  dateRangeMode === 'custom'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Custom Date
              </button>
            </div>

            {dateRangeMode === 'custom' && (
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold">Start Date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold">End Date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Filter Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Entries Filter
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Sabhi
              </button>
              <button
                type="button"
                onClick={() => setFilterType('credit')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  filterType === 'credit' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                {party?.type === 'supplier' ? 'Sirf Jama Kiya' : 'Sirf Jama'}
              </button>
              <button
                type="button"
                onClick={() => setFilterType('debit')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  filterType === 'debit' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                {party?.type === 'supplier' ? 'Sirf Udhar Saman' : 'Sirf Udhaar'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating || !party}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              PDF Download Karein
            </button>

            <button
              onClick={handleSharePDF}
              disabled={isGenerating || !party}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              Share Statement (WhatsApp / OS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
