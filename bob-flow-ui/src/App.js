import BranchCanvas from './components/BranchCanvas';
import MergeDialog from './components/MergeDialog';
import NodeSidebar from './components/NodeSidebar';
import { useBranchGraph } from './hooks/useBranchGraph';

function Toast({ toast }) {
  if (!toast) return null;

  const bg =
    toast.type === 'info'
      ? 'border-blue-500 bg-blue-950 text-blue-100'
      : 'border-red-500 bg-red-950 text-red-100';

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${bg}`}
    >
      {toast.message}
    </div>
  );
}

function App() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    selectedNode,
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
  } = useBranchGraph();

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <header className="flex shrink-0 items-center border-b border-slate-700 bg-slate-900 px-6 py-3">
        <h1 className="text-lg font-bold tracking-tight">BobFlow</h1>
        <span className="ml-3 text-sm text-slate-400">Git branch graph</span>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1">
          <BranchCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onConnect={handleConnect}
          />
        </main>

        {selectedNode && (
          <NodeSidebar
            node={selectedNode}
            runBobUrl={runBobUrl}
            onClose={() => setSelectedNodeId(null)}
            onTaskChange={updateTaskDescription}
            onRunBob={runBob}
            onCreateChild={createChildBranch}
          />
        )}
      </div>

      <MergeDialog
        mergePending={mergePending}
        conflictFiles={mergeConflictFiles}
        onConfirm={confirmMerge}
        onCancel={closeMergeDialog}
      />

      <Toast toast={toast} />
    </div>
  );
}

export default App;
