import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { interventionExecutionService } from '../../../Services/helpdesk/interventionExecutionService';

interface Props {
  interventionId: number;
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
}

export function InterventionReportModal({ interventionId, isOpen, onClose, onDone }: Props) {
  const [report, setReport] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const submit = async () => {
    if (!report.trim()) {
      setError('Le rapport est requis.');
      return;
    }
    setSubmitting(true);
    try {
      await interventionExecutionService.report(interventionId, report.trim());
      onDone();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Envoi impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900">Rapport d'intervention</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          {error && <p className="text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest">Compte-rendu</label>
          <textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            className="w-full p-3 border-2 border-orange-100 focus:border-emerald-500 rounded-xl min-h-[160px] text-sm font-medium resize-none outline-none"
            placeholder="Décrivez ce qui a été fait, les recommandations…"
          />
          <button
            disabled={!report.trim() || submitting}
            onClick={submit}
            className={`w-full py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 ${
              !report.trim() || submitting ? 'bg-slate-200 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            <Send className="h-4 w-4" /> {submitting ? 'Envoi…' : 'Clôturer avec rapport'}
          </button>
        </div>
      </div>
    </div>
  );
}
