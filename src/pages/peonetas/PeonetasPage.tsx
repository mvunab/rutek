import { useEffect, useId, useMemo, useState } from 'react';
import {
  Pencil, X, Plus, Search, ChevronUp, ChevronDown,
  ChevronsUpDown, UserCheck, UserX, Users2
} from 'lucide-react';
import { usePeonetaStore } from '../../store/usePeonetaStore';
import type { Peoneta } from '../../types';
import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────
type SortKey = keyof Pick<Peoneta, 'rut' | 'nombres' | 'apellidoPaterno' | 'apellidoMaterno' | 'estado' | 'username'>;
type SortDir = 'asc' | 'desc' | 'none';

// ─── Sort Icon ────────────────────────────────────────────────────────────────
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active || dir === 'none') return <ChevronsUpDown size={12} className="text-stone-300 dark:text-stone-600 ml-1" />;
  return dir === 'asc'
    ? <ChevronUp size={12} className="text-primary-600 ml-1" />
    : <ChevronDown size={12} className="text-primary-600 ml-1" />;
}

// ─── Sortable Column Header ───────────────────────────────────────────────────
interface ColProps {
  colKey: SortKey;
  label: string;
  className?: string;
  sortCol: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}

function Col({ colKey, label, className, sortCol, sortDir, onSort }: ColProps) {
  return (
    <th
      scope="col"
      className={clsx(
        'p-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(colKey)}
        className="inline-flex items-center cursor-pointer select-none hover:text-stone-700 transition-colors"
      >
        {label}
        <SortIcon active={sortCol === colKey} dir={sortDir} />
      </button>
    </th>
  );
}

// ─── Form Modal ───────────────────────────────────────────────────────────────
interface PeonetaFormData {
  rut: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  estado: 'Activo' | 'Inactivo';
  username: string;
  phone: string;
  email: string;
}

const emptyForm: PeonetaFormData = {
  rut: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '',
  estado: 'Activo', username: '', phone: '', email: '',
};

function PeonetaModal({
  peoneta,
  onSave,
  onClose,
}: {
  peoneta: Peoneta | null;
  onSave: (data: PeonetaFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<PeonetaFormData>(
    peoneta
      ? { rut: peoneta.rut, nombres: peoneta.nombres, apellidoPaterno: peoneta.apellidoPaterno,
          apellidoMaterno: peoneta.apellidoMaterno, estado: peoneta.estado,
          username: peoneta.username, phone: peoneta.phone ?? '', email: peoneta.email ?? '' }
      : emptyForm
  );

  const formId = useId();
  const fieldId = (k: keyof PeonetaFormData) => `${formId}-${k}`;

  const set = (k: keyof PeonetaFormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl w-full max-w-lg border border-stone-200 dark:border-stone-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">
            {peoneta ? 'Editar Peoneta' : 'Nuevo Peoneta'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-500 dark:text-stone-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* RUT */}
            <div className="col-span-2">
              <label htmlFor={fieldId('rut')} className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">RUT *</label>
              <input id={fieldId('rut')} name="rut" required autoComplete="off" spellCheck={false} value={form.rut} onChange={e => set('rut', e.target.value)}
                placeholder="12345678-9"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" />
            </div>

            {/* Nombres */}
            <div className="col-span-2">
              <label htmlFor={fieldId('nombres')} className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">Nombres *</label>
              <input id={fieldId('nombres')} name="nombres" autoComplete="given-name" required value={form.nombres} onChange={e => set('nombres', e.target.value)}
                placeholder="Juan Carlos"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" />
            </div>

            {/* A.Paterno */}
            <div>
              <label htmlFor={fieldId('apellidoPaterno')} className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">Apellido Paterno</label>
              <input id={fieldId('apellidoPaterno')} name="apellidoPaterno" autoComplete="family-name" value={form.apellidoPaterno} onChange={e => set('apellidoPaterno', e.target.value)}
                placeholder="González"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" />
            </div>

            {/* A.Materno */}
            <div>
              <label htmlFor={fieldId('apellidoMaterno')} className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">Apellido Materno</label>
              <input id={fieldId('apellidoMaterno')} name="apellidoMaterno" autoComplete="off" value={form.apellidoMaterno} onChange={e => set('apellidoMaterno', e.target.value)}
                placeholder="Muñoz"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" />
            </div>

            {/* Username */}
            <div>
              <label htmlFor={fieldId('username')} className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">Usuario sistema</label>
              <input id={fieldId('username')} name="username" autoComplete="username" spellCheck={false} value={form.username} onChange={e => set('username', e.target.value)}
                placeholder="Ju.Gonzalez"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" />
            </div>

            {/* Estado */}
            <div>
              <label htmlFor={fieldId('estado')} className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">Estado</label>
              <select id={fieldId('estado')} name="estado" value={form.estado} onChange={e => set('estado', e.target.value as 'Activo' | 'Inactivo')}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor={fieldId('phone')} className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">Teléfono</label>
              <input id={fieldId('phone')} name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+56912345678"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" />
            </div>

            {/* Email */}
            <div>
              <label htmlFor={fieldId('email')} className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">Email</label>
              <input id={fieldId('email')} name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="nombre@empresa.cl"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm">
              {peoneta ? 'Guardar cambios' : 'Crear peoneta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ peoneta, onConfirm, onClose }: { peoneta: Peoneta; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl w-full max-w-sm border border-stone-200 dark:border-stone-700 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-100 rounded-full"><UserX size={20} className="text-red-600" /></div>
          <div>
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Eliminar peoneta</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Esta acción no se puede deshacer</p>
          </div>
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          ¿Eliminar a <strong>{peoneta.nombres} {peoneta.apellidoPaterno}</strong> ({peoneta.rut})?
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export function PeonetasPage() {
  const { peonetas, fetchPeonetas, createPeoneta, updatePeoneta, deletePeoneta } = usePeonetaStore();
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<SortKey>('rut');
  const [sortDir, setSortDir] = useState<SortDir>('none');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Peoneta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Peoneta | null>(null);

  useEffect(() => {
    void fetchPeonetas();
  }, [fetchPeonetas]);

  // Sort toggle
  const handleSort = (col: SortKey) => {
    if (sortCol !== col) { setSortCol(col); setSortDir('asc'); return; }
    setSortDir(d => d === 'asc' ? 'desc' : d === 'desc' ? 'none' : 'asc');
  };

  const filtered = useMemo(() => {
    let rows = peonetas.filter(p => {
      if (!search) return true;
      const t = search.toLowerCase();
      return (
        p.rut.toLowerCase().includes(t) ||
        p.nombres.toLowerCase().includes(t) ||
        p.apellidoPaterno.toLowerCase().includes(t) ||
        p.apellidoMaterno.toLowerCase().includes(t) ||
        p.username.toLowerCase().includes(t)
      );
    });
    if (sortDir !== 'none') {
      rows = rows.toSorted((a, b) => {
        const av = (a[sortCol] ?? '').toString().toLowerCase();
        const bv = (b[sortCol] ?? '').toString().toLowerCase();
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }, [peonetas, search, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const activos   = peonetas.filter(p => p.estado === 'Activo').length;
  const inactivos = peonetas.filter(p => p.estado === 'Inactivo').length;

  // CRUD handlers
  const handleSave = async (data: PeonetaFormData) => {
    if (modal === 'edit' && editTarget) {
      await updatePeoneta(editTarget.id, data);
    } else {
      await createPeoneta(data);
    }
    setModal(null); setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deletePeoneta(deleteTarget.id);
    setDeleteTarget(null);
  };

  const openEdit = (p: Peoneta) => { setEditTarget(p); setModal('edit'); };

  return (
    <div className="space-y-4">
      {/* Stats chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-sm text-xs text-stone-600 dark:text-stone-300">
          <Users2 size={14} className="text-stone-400 dark:text-stone-500" />
          <span>Total: <strong className="text-stone-800 dark:text-stone-100">{peonetas.length}</strong></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-lg text-xs text-emerald-700 dark:text-emerald-400">
          <UserCheck size={14} /> Activos: <strong>{activos}</strong>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-500 dark:text-stone-300">
          <UserX size={14} /> Inactivos: <strong>{inactivos}</strong>
        </div>
        <div className="flex-1" />
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
          <input
            type="text"
            placeholder="Buscar por RUT, nombre, usuario..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm w-64"
          />
        </div>
        {/* New */}
        <button
          onClick={() => { setEditTarget(null); setModal('create'); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} /> Nuevo peoneta
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/90">
                {/* Actions col — no sort */}
                <th className="px-3 py-3 w-16 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide" />
                <Col colKey="rut"              label="RUT"        className="w-32" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <Col colKey="nombres"          label="Nombres"                  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <Col colKey="apellidoPaterno"  label="A.Paterno"                sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <Col colKey="apellidoMaterno"  label="A.Materno"                sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <Col colKey="estado"           label="Estado"     className="w-24" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <Col colKey="username"         label="User"       className="w-32" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-stone-400 dark:text-stone-500">
                    No se encontraron peonetas
                  </td>
                </tr>
              ) : paginated.map((p, i) => (
                <tr
                  key={p.id}
                  className={clsx(
                    'border-b border-stone-100 dark:border-stone-800 hover:bg-primary-50/30 dark:hover:bg-primary-950/25 transition-colors',
                    i % 2 === 0 ? 'bg-white dark:bg-stone-900' : 'bg-stone-50/40 dark:bg-stone-900/70'
                  )}
                >
                  {/* Actions */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(p)}
                        className="size-6 flex items-center justify-center rounded text-stone-400 dark:text-stone-500 hover:text-primary-600 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="size-6 flex items-center justify-center rounded bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </td>

                  {/* RUT */}
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs text-stone-600 dark:text-stone-300 font-medium">{p.rut}</span>
                  </td>

                  {/* Nombres */}
                  <td className="px-3 py-2.5">
                    <span className="text-sm text-stone-800 dark:text-stone-100">{p.nombres}</span>
                  </td>

                  {/* A. Paterno */}
                  <td className="px-3 py-2.5">
                    <span className="text-sm text-stone-700 dark:text-stone-200">{p.apellidoPaterno || '—'}</span>
                  </td>

                  {/* A. Materno */}
                  <td className="px-3 py-2.5">
                    <span className="text-sm text-stone-500 dark:text-stone-400">{p.apellidoMaterno || '—'}</span>
                  </td>

                  {/* Estado */}
                  <td className="px-3 py-2.5">
                    <span className={clsx(
                      'inline-flex items-center gap-1.5 text-xs font-medium',
                      p.estado === 'Activo' ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'
                    )}>
                      <span className={clsx(
                        'w-1.5 h-1.5 rounded-full',
                        p.estado === 'Activo' ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'
                      )} />
                      {p.estado}
                    </span>
                  </td>

                  {/* User */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">{p.username || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80">
          <span className="text-xs text-stone-500 dark:text-stone-400">
            Página {page} de {totalPages}
            {filtered.length !== peonetas.length && (
              <span className="ml-1.5 text-stone-400 dark:text-stone-500">({filtered.length} resultados)</span>
            )}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Ant
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={clsx(
                  'w-7 h-7 text-xs font-semibold rounded-lg transition-colors',
                  n === page
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                )}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sig
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <PeonetaModal
          peoneta={editTarget}
          onSave={handleSave}
          onClose={() => { setModal(null); setEditTarget(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          peoneta={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
