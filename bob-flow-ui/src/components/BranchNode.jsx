import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { NODE_STATUS } from '../constants';

const STATUS_STYLES = {
  [NODE_STATUS.IDLE]: 'bg-slate-500 text-slate-100',
  [NODE_STATUS.PROCESSING]: 'bg-blue-500 text-white',
  [NODE_STATUS.SUCCESS]: 'bg-emerald-500 text-white',
  [NODE_STATUS.CONFLICT]: 'bg-red-500 text-white',
};

const ACCENT_STYLES = {
  [NODE_STATUS.IDLE]: 'border-l-slate-500',
  [NODE_STATUS.PROCESSING]: 'border-l-blue-500',
  [NODE_STATUS.SUCCESS]: 'border-l-emerald-500',
  [NODE_STATUS.CONFLICT]: 'border-l-red-500',
};

function BranchNode({ data, selected }) {
  const status = data.status || NODE_STATUS.IDLE;
  const statusClass = STATUS_STYLES[status] || STATUS_STYLES[NODE_STATUS.IDLE];
  const accentClass = ACCENT_STYLES[status] || ACCENT_STYLES[NODE_STATUS.IDLE];

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-2 !border-slate-400 !bg-slate-700"
      />
      <div
        className={`min-w-[180px] rounded-lg border border-slate-600 border-l-4 bg-slate-800 px-4 py-3 shadow-lg ${accentClass} ${
          selected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950' : ''
        }`}
      >
        <div
          className="truncate text-sm font-semibold text-slate-100"
          title={data.branchName}
        >
          {data.branchName}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">Status</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
            {status}
          </span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-2 !border-slate-400 !bg-slate-700"
      />
    </>
  );
}

export default memo(BranchNode);
