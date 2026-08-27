import { MarkerType, type Edge, type Node } from '@xyflow/react';
import { Banknote, GitBranch } from 'lucide-react';
import type {
  BillingFlowGraph,
  BillingFlowNode,
} from '../../types/billingFlow';
import type { FlowNodeData } from './BillingFlowNodes';

export const TOOLBOX: Array<{
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

export function graphToFlow(graph: BillingFlowGraph): { nodes: Node[]; edges: Edge[] } {
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

export function flowToGraph(nodes: Node[], edges: Edge[]): BillingFlowGraph {
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
