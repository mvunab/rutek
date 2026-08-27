import { Search } from 'lucide-react';
import { clsx } from 'clsx';
import { TOOLBOX } from './billingFlowGraph';

export function BillingFlowToolbox({
  toolboxQuery,
  onToolboxQueryChange,
  onAddNode,
}: {
  toolboxQuery: string;
  onToolboxQueryChange: (query: string) => void;
  onAddNode: (type: 'charge' | 'condition') => void;
}) {
  const query = toolboxQuery.trim().toLowerCase();
  const filteredToolbox = [];
  for (const g of TOOLBOX) {
    const items = g.items.filter(
      (it) =>
        !query ||
        `${it.title} ${it.description}`.toLowerCase().includes(query),
    );
    if (items.length > 0) filteredToolbox.push({ ...g, items });
  }

  return (
    <aside className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex flex-col">
      <div className="px-3 py-2.5 border-b border-stone-200 dark:border-stone-800">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
          Toolbox
        </p>
        <div className="mt-2">
          <label
            htmlFor="billing-toolbox-search"
            className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1"
          >
            Buscar
          </label>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
              aria-hidden
            />
            <input
              id="billing-toolbox-search"
              type="search"
              value={toolboxQuery}
              onChange={(e) => onToolboxQueryChange(e.target.value)}
              placeholder="Buscar elementos…"
              className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 pl-8 pr-2 py-1.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {filteredToolbox.map((group) => (
          <div key={group.group}>
            <p className="px-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {group.group}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.type}>
                    <button
                      type="button"
                      onClick={() => onAddNode(item.type)}
                      className="w-full text-left rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-2.5 py-2 hover:border-primary-300 hover:shadow-sm transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={clsx(
                            'size-7 rounded-md flex items-center justify-center shrink-0',
                            item.accent,
                          )}
                        >
                          <Icon size={14} aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-stone-800 dark:text-stone-100">
                            {item.title}
                          </span>
                          <span className="block text-[10px] text-stone-500 leading-snug mt-0.5">
                            {item.description}
                          </span>
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {filteredToolbox.length === 0 ? (
          <p className="text-[11px] text-stone-400 px-1">Sin resultados.</p>
        ) : null}
      </div>
      <p className="px-3 py-2 text-[10px] text-stone-400 border-t border-stone-200 dark:border-stone-800">
        Arrastra o haz clic para agregar. Conecta salidas Sí/No en decisiones.
      </p>
    </aside>
  );
}
