import dagre from 'dagre';
import { MarkerType } from 'reactflow';
import { NODE_TYPE } from '../constants';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 72;

export function layoutTree(nodes, edges) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    const position = graph.node(node.id);
    return {
      ...node,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
    };
  });
}

export function buildBranchNode(id, data, position = { x: 0, y: 0 }) {
  return {
    id,
    type: NODE_TYPE,
    position,
    data,
  };
}

export function buildTreeEdge(source, target) {
  return {
    id: `edge-${source}-${target}`,
    source,
    target,
    type: 'smoothstep',
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
    style: { stroke: '#64748b', strokeWidth: 2 },
  };
}
