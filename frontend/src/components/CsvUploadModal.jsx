import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2, Sparkles, Download } from 'lucide-react';
import { BG_COLORS, SAMPLE_CSV_CONTENT, parseCsvInventoryText } from '../constants/blood';

export default function CsvUploadModal({ open, onClose, onImportRows }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!open) return null;

  const processText = (text, name = 'manual-import.csv') => {
    setError('');
    setRawText(text);
    setFileName(name);
    const rows = parseCsvInventoryText(text);
    if (rows.length === 0) {
      setError('No valid rows found. Expected columns: hospital,blood_group,units,expiring_48h');
      setParsedRows([]);
      return;
    }
    setParsedRows(rows);
  };

  const handleFile = file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      processText(String(evt.target?.result || ''), file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = e => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleLoadSample = () => {
    processText(SAMPLE_CSV_CONTENT, 'ranchi_rebalance_sample.csv');
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hemosync_sample_inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApply = async () => {
    if (parsedRows.length === 0) return;
    setSubmitting(true);
    try {
      await onImportRows(parsedRows);
      onClose();
    } catch (err) {
      setError(err.message || 'CSV import failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/85" onClick={onClose} />

      <div className="relative z-10 w-[95vw] sm:w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl fade-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Upload Hospital CSV Inventory</h2>
              <p className="text-xs text-slate-400">
                Drag &amp; drop a blood-bank CSV or load sample data to update live regional stock
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Close CSV modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-sky-400 bg-sky-500/10'
                : 'border-slate-700 bg-slate-950/60 hover:border-slate-500'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0])}
            />
            <Upload size={24} className="mx-auto text-sky-400 mb-2" />
            <p className="text-xs font-bold text-white">
              {fileName ? `Loaded: ${fileName}` : 'Drop hospital CSV file here, or click to browse'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Format: hospital,blood_group,units,expiring_48h
            </p>
          </div>

          {/* Sample Actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 cursor-pointer"
            >
              <Sparkles size={13} />
              Load Sample Emergency CSV
            </button>

            <button
              type="button"
              onClick={handleDownloadSample}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            >
              <Download size={13} />
              Download Sample Template
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="rounded-xl bg-slate-950/75 border border-slate-800 overflow-hidden">
              <div className="px-3.5 py-2.5 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  {parsedRows.length} validated inventory updates ready
                </span>
                <span className="font-mono text-slate-400">Live Sync Preview</span>
              </div>
              <div className="max-h-52 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                      <th className="py-2 px-3 text-left">Hospital</th>
                      <th className="py-2 px-3 text-center">Group</th>
                      <th className="py-2 px-3 text-right">New Units</th>
                      <th className="py-2 px-3 text-right">&lt;48h Expiring</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-white">{row.hospital}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className="font-mono font-bold px-2 py-0.5 rounded"
                            style={{
                              background: `${BG_COLORS[row.blood_group]}22`,
                              color: BG_COLORS[row.blood_group],
                            }}
                          >
                            {row.blood_group}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-sky-300">
                          {row.units} u
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-400">
                          {row.expiring_48h ?? 'Auto'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {rawText && parsedRows.length === 0 && (
            <pre className="p-3 rounded-xl bg-slate-950 text-[11px] font-mono text-slate-400 overflow-x-auto">
              {rawText}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 flex items-center justify-end gap-2.5 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={parsedRows.length === 0 || submitting}
            className="btn-primary flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Syncing Inventory...
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                Apply Inventory Update ({parsedRows.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
