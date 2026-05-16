import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import BranchNode from './BranchNode';
import { NODE_TYPE } from '../constants';

const nodeTypes = { [NODE_TYPE]: BranchNode };

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#64748b', strokeWidth: 2 },
};

function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onPaneClick,
  onConnect,
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timer = setTimeout(() => fitView({ padding: 0.2 }), 50);
    return () => clearTimeout(timer);
  }, [nodes, edges, fitView]);

  const handleInit = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      onInit={handleInit}
      proOptions={proOptions}
      fitView
      minZoom={0.2}
      maxZoom={1.5}
      className="bg-slate-950"
    >
      <Background color="#334155" gap={20} size={1} />
      <Controls className="!border-slate-600 !bg-slate-800 !shadow-lg [&>button]:!border-slate-600 [&>button]:!bg-slate-700 [&>button]:!fill-slate-200" />
      <MiniMap
        className="!border-slate-600 !bg-slate-800"
        nodeColor="#475569"
        maskColor="rgb(15 23 42 / 0.8)"
      />
    </ReactFlow>
  );
}

export default function BranchCanvas(props) {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <FlowCanvas {...props} />
      </ReactFlowProvider>
    </div>
  );
}
