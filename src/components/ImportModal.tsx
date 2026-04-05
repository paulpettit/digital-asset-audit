"use client";

import { useState, useCallback } from "react";
import { FileUp, X, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, string>[]) => void;
  title: string;
  expectedColumns: string[];
}

export default function ImportModal({
  isOpen,
  onClose,
  onImport,
  title,
  expectedColumns,
}: ImportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = useCallback(
    async (f: File) => {
      setError(null);
      setFile(f);

      try {
        if (f.name.endsWith(".csv") || f.name.endsWith(".tsv")) {
          const text = await f.text();
          const Papa = (await import("papaparse")).default;
          const result = Papa.parse<Record<string, string>>(text, {
            header: true,
            skipEmptyLines: true,
          });
          if (result.errors.length > 0) {
            setError(`Parse error: ${result.errors[0].message}`);
            return;
          }
          setPreview(result.data.slice(0, 5));
        } else if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls")) {
          const XLSX = await import("xlsx");
          const buffer = await f.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet);
          setPreview(data.slice(0, 5));
        } else {
          setError("Unsupported file type. Please use .csv, .tsv, .xlsx, or .xls");
        }
      } catch {
        setError("Failed to parse file. Please check the format.");
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      let data: Record<string, string>[] = [];
      if (file.name.endsWith(".csv") || file.name.endsWith(".tsv")) {
        const text = await file.text();
        const Papa = (await import("papaparse")).default;
        const result = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
        });
        data = result.data;
      } else {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet);
      }
      onImport(data);
      onClose();
    } catch {
      setError("Failed to import file.");
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-xl border border-card-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragActive
                ? "border-accent bg-accent/5"
                : "border-card-border hover:border-muted"
            }`}
          >
            <FileUp className="mb-3 h-10 w-10 text-muted" />
            <p className="mb-1 text-sm font-medium text-white">
              Drag & drop your file here
            </p>
            <p className="mb-4 text-xs text-muted">
              Supports .csv, .tsv, .xlsx, .xls
            </p>
            <label className="cursor-pointer rounded-lg bg-accent/20 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/30">
              Browse Files
              <input
                type="file"
                accept=".csv,.tsv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </div>

          {file && (
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
              <FileSpreadsheet className="h-5 w-5 text-accent" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-muted">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-400/10 px-4 py-3 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-muted">
                Preview (first {preview.length} rows)
              </p>
              <div className="overflow-x-auto rounded-lg border border-card-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border bg-white/5">
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-medium text-muted">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-card-border last:border-0">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="max-w-[150px] truncate px-3 py-2 text-slate-300">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted">Expected columns:</p>
            <div className="flex flex-wrap gap-1.5">
              {expectedColumns.map((col) => (
                <span
                  key={col}
                  className="rounded-md bg-white/5 px-2 py-1 font-mono text-[10px] text-slate-400"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-card-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-accent/90"
          >
            {importing ? "Importing..." : "Import Data"}
          </button>
        </div>
      </div>
    </div>
  );
}
