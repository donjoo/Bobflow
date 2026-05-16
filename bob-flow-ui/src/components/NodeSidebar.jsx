import { NODE_STATUS } from '../constants';

export default function NodeSidebar({
  node,
  runBobUrl,
  onClose,
  onTaskChange,
  onRunBob,
  onCreateChild,
}) {
  if (!node) return null;

  const { branchName, status, taskDescription } = node.data;
  const runBobDisabled = !runBobUrl;

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-slate-700 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Branch
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200"
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="font-mono text-base font-semibold text-slate-100">{branchName}</p>
        <p className="mt-1 text-sm text-slate-400">
          Status: <span className="text-slate-200">{status}</span>
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-300">
          Task Description
          <textarea
            value={taskDescription || ''}
            onChange={(e) => onTaskChange(e.target.value)}
            placeholder="e.g. Convert to FastAPI"
            rows={4}
            className="mt-2 w-full resize-none rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        {runBobDisabled && (
          <p className="mt-2 text-xs text-amber-400">
            Configure REACT_APP_RUN_BOB_URL to enable Run Bob.
          </p>
        )}

        <button
          type="button"
          onClick={onRunBob}
          disabled={runBobDisabled || status === NODE_STATUS.PROCESSING}
          title={runBobDisabled ? 'API not configured' : 'Run Bob on this branch'}
          className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === NODE_STATUS.PROCESSING ? 'Running…' : 'Run Bob'}
        </button>

        <button
          type="button"
          onClick={onCreateChild}
          disabled={status === NODE_STATUS.PROCESSING}
          className="mt-3 w-full rounded-md border border-slate-500 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create child branch
        </button>
      </div>
    </aside>
  );
}
