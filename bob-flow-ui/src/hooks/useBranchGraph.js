import { useCallback, useMemo, useRef, useState } from 'react';
import { useEdgesState, useNodesState } from 'reactflow';
import * as gitApi from '../api/gitApi';
import { NODE_STATUS, ROOT_BRANCH } from '../constants';
import {
  buildBranchNode,
  buildTreeEdge,
  layoutTree,
} from '../utils/layoutTree';

function slugify(branchName) {
  return branchName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function createInitialNodes() {
  const nodes = [
    buildBranchNode(ROOT_BRANCH, {
      branchName: ROOT_BRANCH,
      status: NODE_STATUS.IDLE,
      taskDescription: '',
    }),
  ];
  return layoutTree(nodes, []);
}

export function useBranchGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(createInitialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [mergePending, setMergePending] = useState(null);
  const [mergeConflictFiles, setMergeConflictFiles] = useState([]);
  const [toast, setToast] = useState(null);
  const childCountersRef = useRef({});

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const runBobUrl = process.env.REACT_APP_RUN_BOB_URL || '';

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const updateNodeData = useCallback(
    (nodeId, patch) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
        )
      );
    },
    [setNodes]
  );

  const applyLayout = useCallback(
    (nextNodes, nextEdges) => {
      setNodes(layoutTree(nextNodes, nextEdges));
    },
    [setNodes]
  );

  const generateChildBranchName = useCallback((parentBranch) => {
    const slug = slugify(parentBranch) || 'branch';
    const counter = (childCountersRef.current[parentBranch] ?? 0) + 1;
    childCountersRef.current[parentBranch] = counter;
    return `node/${slug}-${counter}`;
  }, []);

  const handleNodeClick = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleConnect = useCallback((connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) return;
    setMergeConflictFiles([]);
    setMergePending({
      source: connection.source,
      target: connection.target,
    });
  }, []);

  const closeMergeDialog = useCallback(() => {
    setMergePending(null);
    setMergeConflictFiles([]);
  }, []);

  const confirmMerge = useCallback(async () => {
    if (!mergePending) return;

    const { source, target } = mergePending;
    updateNodeData(source, { status: NODE_STATUS.PROCESSING });
    updateNodeData(target, { status: NODE_STATUS.PROCESSING });

    try {
      await gitApi.mergeNodes(source, target);

      const edgeExists = edges.some(
        (e) => e.source === source && e.target === target
      );
      const nextEdges = edgeExists
        ? edges
        : [...edges, buildTreeEdge(source, target)];

      const updatedNodes = nodes.map((n) => {
        if (n.id === source || n.id === target) {
          return {
            ...n,
            data: { ...n.data, status: NODE_STATUS.SUCCESS },
          };
        }
        return n;
      });

      setEdges(nextEdges);
      applyLayout(updatedNodes, nextEdges);
      closeMergeDialog();
    } catch (err) {
      if (
        err.data?.status === 'conflict' ||
        err.data?.error_code === 'merge_conflict' ||
        (err.status === 409 && err.data?.conflicted_files)
      ) {
        const files = err.data?.conflicted_files ?? [];
        setMergeConflictFiles(files);
        updateNodeData(source, { status: NODE_STATUS.CONFLICT });
        updateNodeData(target, { status: NODE_STATUS.CONFLICT });
      } else {
        updateNodeData(source, { status: NODE_STATUS.IDLE });
        updateNodeData(target, { status: NODE_STATUS.IDLE });
        closeMergeDialog();
        showToast(err.message || 'Merge failed');
      }
    }
  }, [
    mergePending,
    edges,
    nodes,
    updateNodeData,
    setEdges,
    applyLayout,
    closeMergeDialog,
    showToast,
  ]);

  const updateTaskDescription = useCallback(
    (value) => {
      if (!selectedNodeId) return;
      updateNodeData(selectedNodeId, { taskDescription: value });
    },
    [selectedNodeId, updateNodeData]
  );

  const runBob = useCallback(async () => {
    if (!selectedNodeId) return;
    if (!runBobUrl) {
      showToast('Configure REACT_APP_RUN_BOB_URL to enable Run Bob', 'info');
      return;
    }

    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return;

    updateNodeData(selectedNodeId, { status: NODE_STATUS.PROCESSING });

    try {
      await gitApi.runBob(runBobUrl, {
        branch: node.data.branchName,
        task: node.data.taskDescription || '',
      });
      updateNodeData(selectedNodeId, { status: NODE_STATUS.SUCCESS });
    } catch (err) {
      updateNodeData(selectedNodeId, { status: NODE_STATUS.CONFLICT });
      showToast(err.message || 'Run Bob failed');
    }
  }, [selectedNodeId, runBobUrl, nodes, updateNodeData, showToast]);

  const createChildBranch = useCallback(async () => {
    if (!selectedNodeId) return;

    const parentBranch = selectedNodeId;
    let branchName = generateChildBranchName(parentBranch);
    const maxAttempts = 5;

    updateNodeData(parentBranch, { status: NODE_STATUS.PROCESSING });

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        await gitApi.createNode(parentBranch, branchName);

        const newNode = buildBranchNode(branchName, {
          branchName,
          status: NODE_STATUS.SUCCESS,
          taskDescription: '',
          parentBranch,
        });

        const nextEdges = [...edges, buildTreeEdge(parentBranch, branchName)];
        const nextNodes = [
          ...nodes.map((n) =>
            n.id === parentBranch
              ? { ...n, data: { ...n.data, status: NODE_STATUS.SUCCESS } }
              : n
          ),
          newNode,
        ];

        setEdges(nextEdges);
        applyLayout(nextNodes, nextEdges);
        setSelectedNodeId(branchName);
        return;
      } catch (err) {
        if (err.data?.error_code === 'branch_exists' && attempt < maxAttempts - 1) {
          branchName = generateChildBranchName(parentBranch);
          continue;
        }

        updateNodeData(parentBranch, { status: NODE_STATUS.IDLE });

        if (err.data?.error_code === 'dirty_working_tree') {
          showToast('Repository has uncommitted changes. Commit or stash before creating a branch.');
        } else if (err.data?.error_code === 'branch_not_found') {
          showToast(`Parent branch '${parentBranch}' was not found in git.`);
        } else {
          showToast(err.message || 'Failed to create branch');
        }
        return;
      }
    }
  }, [
    selectedNodeId,
    generateChildBranchName,
    updateNodeData,
    nodes,
    edges,
    setEdges,
    applyLayout,
    showToast,
  ]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    selectedNode,
    selectedNodeId,
    setSelectedNodeId,
    mergePending,
    mergeConflictFiles,
    toast,
    runBobUrl,
    handleNodeClick,
    handlePaneClick,
    handleConnect,
    closeMergeDialog,
    confirmMerge,
    updateTaskDescription,
    runBob,
    createChildBranch,
  };
}
