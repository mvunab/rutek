import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  Handle,
  Position,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Banknote,
  CircleDot,
  Flag,
  GitBranch,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import {
  CHARGE_UNIT_LABELS,
  CONDITION_FIELD_LABELS,
  type BillingChargeUnit,
  type BillingConditionField,
  type BillingFlowGraph,
  type BillingFlowNode,
} from '../../types/billingFlow';
import { formatCLP } from '../../lib/pricingProfile';

type FlowNodeData = {
  kind: BillingFlowNode['type'];
  label?: string;
  unit?: BillingChargeUnit;
  amount?: number;
  field?: BillingConditionField;
  value?: number;
};

const handleCls =
  '!size-2.5 !bg-white !border-2 !border-stone-400 dark:!border-stone-500';

function StartNode({ selected }: NodeProps) {
  return (
    <div
      className={clsx(
        'relative flex flex-col items-center',
        selected && 'ring-2 ring-emerald-400 ring-offset-2 rounded-full',
      )}
    >
      <div className="size-14 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center border-4 border-emerald-100 dark:border-emerald-900">
        <CircleDot size={22} aria-hidden />
      </div>
      <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        Inicio
      </p>
      <Handle type="source" position={Position.Bottom} className={handleCls} />
    </div>
  );
}

function EndNode({ selected }: NodeProps) {
  return (
    <div
      className={clsx(
        'relative flex flex-col items-center',
        selected && 'ring-2 ring-stone-400 ring-offset-2 rounded-full',
      )}
    >
      <Handle type="target" position={Position.Top} className={handleCls} />
      <div className="size-14 rounded-full bg-stone-700 text-white shadow-lg flex items-center justify-center border-4 border-stone-200 dark:border-stone-600">
        <Flag size={20} aria-hidden />
      </div>
      <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-600 dark:text-stone-300">
        Fin
      </p>
    </div>
  );
}

function ChargeNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData;
  return (
    <div
      className={clsx(
        'w-[220px] rounded-lg border bg-white dark:bg-stone-900 shadow-md overflow-hidden',
        selected
          ? 'border-sky-500 ring-2 ring-sky-300/60'
          : 'border-stone-200 dark:border-stone-700',
      )}
    >
      <Handle type="target" position={Position.Top} className={handleCls} />
      <div className="flex items-center gap-2 bg-sky-600 px-3 py-1.5 text-white">
        <Banknote size={14} aria-hidden />
        <span className="text-[11px] font-bold uppercase tracking-wide">Cargo</span>
      </div>
      <div className="px-3 py-2.5 space-y-1">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
          {d.label || 'Cargo'}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {CHARGE_UNIT_LABELS[d.unit ?? 'fixed']}
        </p>
        <p className="text-sm font-bold tabular-nums text-sky-700 dark:text-sky-300">
          {formatCLP(d.amount ?? 0)}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className={handleCls} />
    </div>
  );
}

/** Decisión estilo diamante (Salesforce Decision). */
function ConditionNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData;
  const subtitle =
    d.field === 'bultos_gt' || d.field === 'km_gt'
      ? `${CONDITION_FIELD_LABELS[d.field ?? 'always']} ${d.value ?? 0}`
      : CONDITION_FIELD_LABELS[d.field ?? 'always'];

  return (
    <div className="relative w-[200px] h-[140px] flex items-center justify-center">
      <Handle type="target" position={Position.Top} className={handleCls} style={{ zIndex: 2 }} />
      <div
        className={clsx(
          'absolute inset-x-6 inset-y-3 rotate-45 rounded-md border-2 bg-amber-50 dark:bg-amber-950/50 shadow-md',
          selected
            ? 'border-amber-500 ring-2 ring-amber-300/50'
            : 'border-amber-400 dark:border-amber-600',
        )}
      />
      <div className="relative z-[1] text-center px-4 max-w-[140px]">
        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
          Decisión
        </p>
        <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 leading-snug mt-0.5">
          {subtitle}
        </p>
      </div>
      <Handle
        type="source"
        id="true"
        position={Position.Right}
        className={handleCls}
        style={{ zIndex: 2, top: '50%' }}
      />
      <Handle
        type="source"
        id="false"
        position={Position.Bottom}
        className={handleCls}
        style={{ zIndex: 2 }}
      />
      <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 text-[9px] font-bold text-emerald-600">
        Sí
      </span>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-[9px] font-bold text-red-500">
        No
      </span>
    </div>
  );
}

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  charge: ChargeNode,
  condition: ConditionNode,
};

const TOOLBOX: Array<{
  group: string;
  items: Array<{
    type: 'charge' | 'condition';
    title: string;
    description: string;
    icon: typeof Banknote;
    accent: string;
  }>;
}> = [
  {
    group: 'Lógica',
    items: [
      {
        type: 'condition',
        title: 'Decisión',
        description: 'Bifurca el flujo (Sí / No)',
        icon: GitBranch,
        accent: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
      },
    ],
  },
  {
    group: 'Cobro',
    items: [
      {
        type: 'charge',
        title: 'Cargo',
        description: 'Suma un monto (ruta, pedido, bulto…)',
        icon: Banknote,
        accent: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40',
      },
    ],
  },
];

function graphToFlow(graph: BillingFlowGraph): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = graph.nodes.map((n, i) => ({
    id: n.id,
    type: n.type,
    position: n.position ?? {
      x: 280,
      y: 40 + i * 140,
    },
    data: {
      kind: n.type,
      label: n.type === 'start' ? 'Inicio' : n.type === 'end' ? 'Fin' : n.label,
      unit: n.unit,
      amount: n.amount,
      field: n.field,
      value: n.value,
    } satisfies FlowNodeData,
  }));
  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    sourceHandle:
      e.when === true ? 'true' : e.when === false ? 'false' : undefined,
    label: e.when === true ? 'Sí' : e.when === false ? 'No' : undefined,
    labelStyle: { fontSize: 11, fontWeight: 700, fill: '#57534e' },
    labelBgStyle: { fill: '#fafaf9' },
    labelBgPadding: [4, 6] as [number, number],
    style: { stroke: '#a8a29e', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#a8a29e' },
  }));
  return { nodes, edges };
}

function flowToGraph(nodes: Node[], edges: Edge[]): BillingFlowGraph {
  return {
    nodes: nodes.map((n) => {
      const d = n.data as FlowNodeData;
      const base: BillingFlowNode = {
        id: n.id,
        type: (n.type as BillingFlowNode['type']) || d.kind,
        position: n.position,
      };
      if (base.type === 'charge') {
        return {
          ...base,
          type: 'charge',
          unit: d.unit ?? 'fixed',
          amount: Number(d.amount) || 0,
          label: d.label || 'Cargo',
        };
      }
      if (base.type === 'condition') {
        return {
          ...base,
          type: 'condition',
          field: d.field ?? 'always',
          op: 'gt',
          value: Number(d.value) || 0,
        };
      }
      return base;
    }),
    edges: edges.map((e) => ({
      id: e.id,
      from: e.source,
      to: e.target,
      when:
        e.sourceHandle === 'true'
          ? true
          : e.sourceHandle === 'false'
            ? false
            : null,
    })),
  };
}

export function BillingFlowEditor({
  initialGraph,
  onChange,
  readOnly = false,
}: {
  initialGraph: BillingFlowGraph;
  onChange?: (graph: BillingFlowGraph) => void;
  readOnly?: boolean;
}) {
  const initial = useMemo(() => graphToFlow(initialGraph), [initialGraph]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toolboxQuery, setToolboxQuery] = useState('');

  useEffect(() => {
    const next = graphToFlow(initialGraph);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [initialGraph, setNodes, setEdges]);

  const emit = useCallback(
    (n: Node[], e: Edge[]) => {
      onChange?.(flowToGraph(n, e));
    },
    [onChange],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) return;
      setEdges((eds) => {
        const next = addEdge(
          {
            ...connection,
            id: `e-${connection.source}-${connection.target}-${Date.now()}`,
            label:
              connection.sourceHandle === 'true'
                ? 'Sí'
                : connection.sourceHandle === 'false'
                  ? 'No'
                  : undefined,
            style: { stroke: '#a8a29e', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#a8a29e' },
          },
          eds,
        );
        emit(nodes, next);
        return next;
      });
    },
    [emit, nodes, readOnly, setEdges],
  );

  const selected = nodes.find((n) => n.id === selectedId) ?? null;

  const updateSelected = (patch: Partial<FlowNodeData>) => {
    if (!selected || readOnly) return;
    setNodes((nds) => {
      const next = nds.map((n) =>
        n.id === selected.id
          ? { ...n, data: { ...(n.data as FlowNodeData), ...patch } }
          : n,
      );
      emit(next, edges);
      return next;
    });
  };

  const addNode = (type: 'charge' | 'condition') => {
    if (readOnly) return;
    const id = `${type}-${Date.now()}`;
    const maxY = nodes.reduce((m, n) => Math.max(m, n.position.y), 0);
    const node: Node = {
      id,
      type,
      position: { x: 260, y: maxY + 150 },
      data:
        type === 'charge'
          ? {
              kind: 'charge',
              label: 'Nuevo cargo',
              unit: 'order_delivered',
              amount: 1000,
            }
          : {
              kind: 'condition',
              field: 'has_delivered',
              value: 0,
              label: 'Decisión',
            },
    };
    setNodes((nds) => {
      const next = [...nds, node];
      emit(next, edges);
      return next;
    });
    setSelectedId(id);
  };

  const removeSelected = () => {
    if (!selected || readOnly) return;
    if (selected.type === 'start' || selected.type === 'end') return;
    setNodes((nds) => {
      const next = nds.filter((n) => n.id !== selected.id);
      setEdges((eds) => {
        const nextEdges = eds.filter(
          (e) => e.source !== selected.id && e.target !== selected.id,
        );
        emit(next, nextEdges);
        return nextEdges;
      });
      return next;
    });
    setSelectedId(null);
  };

  const filteredToolbox = TOOLBOX.map((g) => ({
    ...g,
    items: g.items.filter(
      (it) =>
        !toolboxQuery.trim() ||
        `${it.title} ${it.description}`
          .toLowerCase()
          .includes(toolboxQuery.trim().toLowerCase()),
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col lg:flex-row rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-950 min-h-[560px] h-[min(70vh,720px)]">
      {/* Toolbox (Salesforce left panel) */}
      {!readOnly ? (
        <aside className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex flex-col">
          <div className="px-3 py-2.5 border-b border-stone-200 dark:border-stone-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Toolbox
            </p>
            <div className="mt-2 relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                aria-hidden
              />
              <input
                type="search"
                value={toolboxQuery}
                onChange={(e) => setToolboxQuery(e.target.value)}
                placeholder="Buscar elementos…"
                className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 pl-8 pr-2 py-1.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              />
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
                          onClick={() => addNode(item.type)}
                          className="w-full text-left rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-2.5 py-2 hover:border-primary-300 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
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
      ) : null}

      {/* Canvas */}
      <div className="flex-1 min-w-0 relative bg-[#f4f6f9] dark:bg-stone-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={() => emit(nodes, edges)}
          onConnect={onConnect}
          onNodeClick={(_, n) => setSelectedId(n.id)}
          onPaneClick={() => setSelectedId(null)}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={18}
            size={1.2}
            color="#c4c9d2"
          />
          <Controls showInteractive={!readOnly} />
          <MiniMap
            nodeStrokeWidth={2}
            className="!bg-white/90 dark:!bg-stone-900/90 !border-stone-200"
          />
          <Panel position="top-center" className="pointer-events-none">
            <div className="rounded-full bg-white/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-700 px-3 py-1 text-[11px] font-medium text-stone-500 shadow-sm">
              Flow Builder · Cobro al cliente
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Properties inspector (Salesforce right panel) */}
      <aside className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-stone-200 dark:border-stone-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Propiedades
          </p>
          {selected ? (
            <button
              type="button"
              className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
              aria-label="Cerrar propiedades"
              onClick={() => setSelectedId(null)}
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {!selected ? (
            <div className="rounded-lg border border-dashed border-stone-200 dark:border-stone-700 p-4 text-center">
              <GitBranch size={22} className="mx-auto text-stone-300 mb-2" aria-hidden />
              <p className="text-xs text-stone-500 leading-relaxed">
                Selecciona un elemento en el canvas para editarlo. Usa el toolbox para
                agregar Decisiones y Cargos.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    'size-8 rounded-md flex items-center justify-center',
                    selected.type === 'charge' && 'bg-sky-50 text-sky-600',
                    selected.type === 'condition' && 'bg-amber-50 text-amber-600',
                    selected.type === 'start' && 'bg-emerald-50 text-emerald-600',
                    selected.type === 'end' && 'bg-stone-100 text-stone-600',
                  )}
                >
                  {selected.type === 'charge' ? (
                    <Banknote size={16} />
                  ) : selected.type === 'condition' ? (
                    <GitBranch size={16} />
                  ) : selected.type === 'start' ? (
                    <CircleDot size={16} />
                  ) : (
                    <Flag size={16} />
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {selected.type === 'charge'
                      ? 'Cargo'
                      : selected.type === 'condition'
                        ? 'Decisión'
                        : selected.type === 'start'
                          ? 'Inicio'
                          : 'Fin'}
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono">{selected.id}</p>
                </div>
              </div>

              {selected.type === 'charge' ? (
                <>
                  <Input
                    label="Etiqueta"
                    value={(selected.data as FlowNodeData).label ?? ''}
                    onChange={(e) => updateSelected({ label: e.target.value })}
                    disabled={readOnly}
                  />
                  <Select
                    label="Unidad de cobro"
                    value={(selected.data as FlowNodeData).unit ?? 'fixed'}
                    onChange={(e) =>
                      updateSelected({ unit: e.target.value as BillingChargeUnit })
                    }
                    disabled={readOnly}
                    options={Object.entries(CHARGE_UNIT_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                  <Input
                    label="Monto (CLP)"
                    type="number"
                    value={String((selected.data as FlowNodeData).amount ?? 0)}
                    onChange={(e) =>
                      updateSelected({ amount: Number(e.target.value) || 0 })
                    }
                    disabled={readOnly}
                  />
                </>
              ) : null}

              {selected.type === 'condition' ? (
                <>
                  <Select
                    label="Condición"
                    value={(selected.data as FlowNodeData).field ?? 'always'}
                    onChange={(e) =>
                      updateSelected({
                        field: e.target.value as BillingConditionField,
                      })
                    }
                    disabled={readOnly}
                    options={Object.entries(CONDITION_FIELD_LABELS).map(
                      ([value, label]) => ({ value, label }),
                    )}
                  />
                  <Input
                    label="Valor umbral"
                    type="number"
                    value={String((selected.data as FlowNodeData).value ?? 0)}
                    onChange={(e) =>
                      updateSelected({ value: Number(e.target.value) || 0 })
                    }
                    disabled={readOnly}
                    hint="Usado en bultos_gt / km_gt"
                  />
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Conecta la salida <strong>Sí</strong> (derecha) y <strong>No</strong>{' '}
                    (abajo) a los siguientes elementos.
                  </p>
                </>
              ) : null}

              {(selected.type === 'start' || selected.type === 'end') && (
                <p className="text-xs text-stone-500">
                  Elemento fijo del flujo. No se puede eliminar.
                </p>
              )}

              {(selected.type === 'charge' || selected.type === 'condition') &&
              !readOnly ? (
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  icon={<Trash2 size={14} />}
                  onClick={removeSelected}
                  fullWidth
                >
                  Eliminar elemento
                </Button>
              ) : null}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
