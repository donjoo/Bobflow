export default function MergeDialog({
  mergePending,
  conflictFiles,
  onConfirm,
  onCancel,
}) {
  if (!mergePending) return null;

  const { source, target } = mergePending;
  const hasConflict = conflictFiles.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-600 bg-slate-800 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-100">
          {hasConflict ? 'Merge conflict' : 'Merge branches'}
        </h2>

        {hasConflict ? (
          <>
            <p className="mt-2 text-sm text-slate-300">
              Merge <span className="font-mono text-slate-100">{source}</span> into{' '}
              <span className="font-mono text-slate-100">{target}</span> failed. Conflicted
              files:
            </p>
            <ul className="mt-3 max-h-40 overflow-y-auto rounded border border-slate-600 bg-slate-900 p-3 text-sm font-mono text-red-300">
              {conflictFiles.map((file) => (
                <li key={file}>{file}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-300">
            Merge <span className="font-mono text-slate-100">{source}</span> into{' '}
            <span className="font-mono text-slate-100">{target}</span>?
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-500 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
          >
            {hasConflict ? 'Close' : 'Cancel'}
          </button>
          {!hasConflict && (
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Confirm merge
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
