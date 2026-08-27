import { useId, useRef, useState } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  ExternalLink,
  FileText,
  Loader2,
  Trash2,
  Upload,
  Wrench,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { VehicleDocument } from '../../types';
import {
  complianceStatusLabel,
  type ComplianceStatus,
  type VehicleComplianceDetailItem,
} from '../../lib/vehicleCompliance';
import { formatVehicleDate } from '../../lib/vehicleLabels';
import { Button } from '../ui/Button';
import { ApiError } from '../../lib/api';

function complianceCardStyles(status: ComplianceStatus): string {
  switch (status) {
    case 'expired':
      return 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30';
    case 'warning':
      return 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30';
    case 'ok':
      return 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30';
    default:
      return 'border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/50';
  }
}

function complianceBadgeStyles(status: ComplianceStatus): string {
  switch (status) {
    case 'expired':
      return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
    case 'warning':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200';
    case 'ok':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200';
    default:
      return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400';
  }
}

function complianceIcon(kind: VehicleComplianceDetailItem['kind']) {
  switch (kind) {
    case 'maintenance':
      return Wrench;
    case 'circulationPermit':
      return FileText;
    case 'technicalReview':
      return ClipboardList;
  }
}

function getApiMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    try {
      const j = JSON.parse(err.body) as { message?: string | string[] };
      if (Array.isArray(j.message)) return j.message.join(' ');
      if (typeof j.message === 'string') return j.message;
    } catch {
      if (err.body) return err.body.slice(0, 200);
    }
  }
  return fallback;
}

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

interface VehicleComplianceDocumentCardProps {
  item: VehicleComplianceDetailItem;
  document?: VehicleDocument;
  allowUpload?: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function VehicleComplianceDocumentCard({
  item,
  document,
  allowUpload = false,
  onUpload,
  onDelete,
}: VehicleComplianceDocumentCardProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const Icon = complianceIcon(item.kind);
  const isImage = document?.mimeType.startsWith('image/');
  const isPdf = document?.mimeType === 'application/pdf';

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setError(getApiMessage(err, 'No se pudo subir el archivo.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar el documento adjunto?')) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(getApiMessage(err, 'No se pudo eliminar el documento.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={clsx(
        'rounded-xl border p-4 flex flex-col gap-3',
        complianceCardStyles(item.status),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="size-8 shrink-0 rounded-lg bg-white/70 dark:bg-stone-900/50 flex items-center justify-center"
            aria-hidden
          >
            <Icon size={16} className="text-stone-600 dark:text-stone-300" />
          </span>
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{item.label}</p>
        </div>
        <span
          className={clsx(
            'shrink-0 inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium',
            complianceBadgeStyles(item.status),
          )}
        >
          {complianceStatusLabel(item.status)}
        </span>
      </div>

      <div>
        <p className="text-xs text-stone-500 dark:text-stone-400">Vencimiento</p>
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
          {formatVehicleDate(item.dueDate)}
        </p>
        {item.daysLeft != null && item.status !== 'none' && item.status !== 'ok' && (
          <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 flex items-center gap-1">
            <AlertTriangle size={12} className="shrink-0" aria-hidden />
            {item.status === 'expired'
              ? `Vencido hace ${Math.abs(item.daysLeft)} ${Math.abs(item.daysLeft) === 1 ? 'día' : 'días'}`
              : `Vence en ${item.daysLeft} ${item.daysLeft === 1 ? 'día' : 'días'}`}
          </p>
        )}
      </div>

      {allowUpload && (
        <div className="border-t border-stone-200/80 dark:border-stone-700/80 pt-3 space-y-3">
          <p className="text-xs font-medium text-stone-600 dark:text-stone-300">Documento adjunto</p>

          {document ? (
            <div className="space-y-2">
              {isImage ? (
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <img
                    src={document.fileUrl}
                    alt={`Documento: ${item.label}`}
                    width={400}
                    height={240}
                    className="w-full h-36 object-cover object-top"
                    loading="lazy"
                  />
                </a>
              ) : isPdf ? (
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-700 dark:text-primary-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                >
                  <FileText size={16} aria-hidden />
                  Ver PDF
                  <ExternalLink size={14} aria-hidden />
                </a>
              ) : (
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-700 dark:text-primary-400 hover:underline"
                >
                  Abrir archivo
                </a>
              )}
              {document.fileName && (
                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate" title={document.fileName}>
                  {document.fileName}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  disabled={uploading || deleting}
                  onClick={() => inputRef.current?.click()}
                  icon={uploading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Upload size={14} aria-hidden />}
                >
                  {uploading ? 'Subiendo…' : 'Reemplazar'}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="xs"
                  disabled={uploading || deleting}
                  onClick={() => void handleDelete()}
                  icon={deleting ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Trash2 size={14} aria-hidden />}
                >
                  Quitar
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-stone-300 dark:border-stone-600 bg-white/50 dark:bg-stone-900/40 p-4 text-center">
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                Sube una foto o PDF del documento (máx. 12&nbsp;MB).
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                icon={uploading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Upload size={14} aria-hidden />}
              >
                {uploading ? 'Subiendo…' : 'Subir documento'}
              </Button>
            </div>
          )}

          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            aria-label={`Subir documento ${item.label}`}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
