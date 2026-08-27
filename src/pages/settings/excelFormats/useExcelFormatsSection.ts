import { useEffect, useRef, useState } from 'react';
import type { ExcelColumnMapping, ExcelFormatConfig } from '../../../types';
import {
  maxMappedColumnIndex,
  normalizeExcelFormat,
  normalizeExcelFormatsList,
} from '../../../lib/excelFormat';
import { api, ApiError } from '../../../lib/api';
import { colLetter, emptyFormat, type RawHeadersResult } from './constants';

export function useExcelFormatsSection() {
  const [formats, setFormats] = useState<ExcelFormatConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [editorForm, setEditorForm] = useState<Omit<ExcelFormatConfig, 'id'> & { id?: string }>(() => emptyFormat());
  const [rawHeaders, setRawHeaders] = useState<RawHeadersResult | null>(null);
  const [headersLoading, setHeadersLoading] = useState(false);
  const [headersError, setHeadersError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadFormats();
  }, []);

  const loadFormats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<unknown>('/tenant/excel-formats');
      setFormats(normalizeExcelFormatsList(data));
    } catch {
      setError('No se pudieron cargar los formatos.');
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditorForm(emptyFormat());
    setRawHeaders(null);
    setEditingId('new');
  };

  const openEdit = (fmt: ExcelFormatConfig) => {
    setEditorForm(normalizeExcelFormat(fmt as unknown as Record<string, unknown>));
    setRawHeaders(null);
    setEditingId(fmt.id);
  };

  const closeEditor = () => {
    setEditingId(null);
    setRawHeaders(null);
    setHeadersError('');
  };

  const handleFileUpload = async (file: File) => {
    setHeadersLoading(true);
    setHeadersError('');
    setRawHeaders(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const data = await api.postForm<RawHeadersResult>('/route-import/raw-headers', form);
      setRawHeaders(data);
      const headerRowIdx = data.rows.findIndex(
        (r) => r.filter(Boolean).length >= 3,
      );
      if (headerRowIdx >= 0) {
        setEditorForm((f) => ({
          ...f,
          headerRow: headerRowIdx,
          dataStartRow: headerRowIdx + 1,
        }));
      }
    } catch {
      setHeadersError('No se pudieron leer las cabeceras del archivo.');
    } finally {
      setHeadersLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editorForm.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        ...(editingId !== 'new' ? { id: editingId as string } : {}),
        name: editorForm.name.trim(),
        active: editorForm.active,
        headerRow: editorForm.headerRow,
        dataStartRow: editorForm.dataStartRow,
        detection: editorForm.detection ?? null,
        columns: editorForm.columns ?? {},
        metadata: editorForm.metadata ?? null,
      };
      const updated = await api.put<unknown>('/tenant/excel-formats', body);
      setFormats(normalizeExcelFormatsList(updated));
      closeEditor();
    } catch (err) {
      let msg = 'No se pudo guardar el formato.';
      if (err instanceof ApiError) {
        try {
          const p = JSON.parse(err.body) as { message?: string | string[] };
          if (typeof p.message === 'string') msg = p.message;
          else if (Array.isArray(p.message)) msg = p.message.join(' · ');
        } catch {
          if (err.body) msg = err.body;
        }
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updated = await api.del<unknown>(`/tenant/excel-formats/${id}`);
      setFormats(normalizeExcelFormatsList(updated));
    } catch {
      setError('No se pudo eliminar el formato.');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const updated = await api.post<unknown>(`/tenant/excel-formats/${id}/activate`, {});
      setFormats(normalizeExcelFormatsList(updated));
    } catch {
      setError('No se pudo activar el formato.');
    }
  };

  const headerColsFromFile = rawHeaders ? rawHeaders.rows[editorForm.headerRow] ?? [] : [];
  const headerColsFallbackLen = Math.max(
    headerColsFromFile.length - 1,
    maxMappedColumnIndex(editorForm.columns),
  );
  const headerCols =
    headerColsFromFile.length > 0
      ? headerColsFromFile
      : headerColsFallbackLen >= 0
        ? Array.from({ length: headerColsFallbackLen + 1 }, (_, ci) => `Columna ${colLetter(ci)}`)
        : [];

  const setCol = (field: keyof ExcelColumnMapping, colIdx: number | null) => {
    setEditorForm((f) => ({ ...f, columns: { ...f.columns, [field]: colIdx } }));
  };

  const setMeta = (field: 'routeNumber' | 'date' | 'driver', pos: { row: number; col: number } | null) => {
    setEditorForm((f) => ({
      ...f,
      metadata: { ...(f.metadata ?? {}), [field]: pos },
    }));
  };

  return {
    formats,
    loading,
    error,
    editingId,
    saving,
    editorForm,
    setEditorForm,
    rawHeaders,
    headersLoading,
    headersError,
    fileInputRef,
    headerCols,
    openNew,
    openEdit,
    closeEditor,
    handleFileUpload,
    handleSave,
    handleDelete,
    handleActivate,
    setCol,
    setMeta,
  };
}
