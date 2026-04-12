'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface UploadResult {
  success: boolean;
  sessions_imported?: number;
  sets_imported?: number;
  total_sessions_in_file?: number;
  error?: string;
}

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith('.csv')) {
      setResult({ success: false, error: 'Kun CSV-filer støttes' });
      return;
    }
    setFile(f);
    setResult(null);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data: UploadResult = await res.json();
      setResult(data);
      if (data.success) setFile(null);
    } catch {
      setResult({ success: false, error: 'Nettverksfeil' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Last opp Hevy-data</h1>
        <p className="text-sm text-gray-400 mt-1">
          Eksporter CSV fra Hevy: Profil → Innstillinger → Export & Import Data → Export Workouts
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
          dragging ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500'
        )}
      >
        <Upload size={32} className="mx-auto text-gray-500 mb-3" />
        <p className="text-sm text-gray-300 mb-1">
          Dra og slipp CSV-fil her, eller
        </p>
        <label className="cursor-pointer">
          <span className="text-blue-400 hover:text-blue-300 text-sm font-medium">velg fil</span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
        <p className="text-xs text-gray-600 mt-2">Kun .csv-filer</p>
      </div>

      {/* Selected file */}
      {file && (
        <Card>
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-blue-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => setFile(null)}>
              <X size={16} className="text-gray-500 hover:text-white transition-colors" />
            </button>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            {uploading ? 'Importerer...' : 'Importer workouts'}
          </button>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className={cn(
          'border',
          result.success ? 'border-green-700/50 bg-green-900/20' : 'border-red-700/50 bg-red-900/20'
        )}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle size={20} className="text-green-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              {result.success ? (
                <>
                  <p className="text-sm font-semibold text-green-300">Import vellykket!</p>
                  <p className="text-sm text-green-200/80 mt-1">
                    {result.sessions_imported} nye økter importert
                    {result.total_sessions_in_file && result.total_sessions_in_file > (result.sessions_imported || 0) && (
                      <span className="text-gray-400"> ({result.total_sessions_in_file - (result.sessions_imported || 0)} eksisterte allerede)</span>
                    )}
                  </p>
                  <p className="text-sm text-green-200/80">
                    {result.sets_imported} sett totalt
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-red-300">Feil ved import</p>
                  <p className="text-sm text-red-200/80 mt-1">{result.error}</p>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardTitle>Slik eksporterer du fra Hevy</CardTitle>
        <ol className="space-y-2 text-sm text-gray-300">
          {[
            'Åpne Hevy-appen på mobil',
            'Gå til Profil (tab nederst til høyre)',
            'Trykk på Innstillinger (tannhjul øverst)',
            'Velg "Export & Import Data"',
            'Trykk "Export Workouts" → del/last ned CSV-filen',
            'Last opp filen her',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-700 text-xs flex items-center justify-center shrink-0 text-gray-400 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Card>

      {/* Phase 2 note */}
      <div className="text-xs text-gray-600 text-center">
        Hevy API-integrasjon kommer i fase 2 (krever Hevy Pro)
      </div>
    </div>
  );
}
