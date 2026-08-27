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
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { BillingFlowGraph } from '../../types/billingFlow';
import { billingFlowNodeTypes } from './billingFlowNodeTypes';
import type { FlowNodeData } from './BillingFlowNodes';
import { graphToFlow, flowToGraph } from './billingFlowGraph';
import { BillingFlowToolbox } from './BillingFlowToolbox';
import { BillingFlowPropertiesPanel } from './BillingFlowPropertiesPanel';

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

  return (
    <div className="flex flex-col lg:flex-row rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-950 min-h-[560px] h-[min(70vh,720px)]">
      {!readOnly ? (
        <BillingFlowToolbox
          toolboxQuery={toolboxQuery}
          onToolboxQueryChange={setToolboxQuery}
          onAddNode={addNode}
        />
      ) : null}

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
          nodeTypes={billingFlowNodeTypes}
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

      <BillingFlowPropertiesPanel
        selected={selected}
        readOnly={readOnly}
        onClose={() => setSelectedId(null)}
        onUpdateSelected={updateSelected}
        onRemoveSelected={removeSelected}
      />
    </div>
  );
}
