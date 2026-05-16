const base = process.env.REACT_APP_API_BASE_URL || '';

async function parseResponse(response) {
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    const error = new Error(data?.detail || response.statusText);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function createNode(parentBranch, newBranchName) {
  const response = await fetch(`${base}/create-node`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parent_branch: parentBranch,
      new_branch_name: newBranchName,
    }),
  });
  return parseResponse(response);
}

export async function mergeNodes(sourceBranch, targetBranch) {
  const response = await fetch(`${base}/merge-nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_branch: sourceBranch,
      target_branch: targetBranch,
    }),
  });
  return parseResponse(response);
}

export async function runBob(url, { branch, task }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branch, task }),
  });
  return parseResponse(response);
}
