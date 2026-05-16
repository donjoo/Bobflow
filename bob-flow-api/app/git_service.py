from pathlib import Path

import git
from git.exc import GitCommandError

from app.exceptions import (
    BranchExistsError,
    BranchNotFoundError,
    DirtyWorkingTreeError,
    MergeConflictError,
    NothingToCommitError,
)

_repo: git.Repo | None = None


def init_repo(repo_path: Path) -> git.Repo:
    global _repo
    _repo = git.Repo(repo_path)
    return _repo


def get_repo() -> git.Repo:
    if _repo is None:
        raise RuntimeError("Git repository has not been initialized")
    return _repo


def _assert_clean(repo: git.Repo) -> None:
    if repo.is_dirty(untracked_files=True):
        raise DirtyWorkingTreeError()


def _branch_exists(repo: git.Repo, name: str) -> bool:
    return name in repo.heads


def _conflicted_files(repo: git.Repo) -> list[str]:
    output = repo.git.diff("--name-only", "--diff-filter=U")
    if not output:
        return []
    return sorted(output.splitlines())


def _checkout_branch(repo: git.Repo, branch_name: str) -> None:
    try:
        repo.git.checkout(branch_name)
    except GitCommandError as exc:
        raise BranchNotFoundError(branch_name) from exc


def create_node(parent_branch: str, new_branch_name: str) -> dict[str, str]:
    repo = get_repo()
    _assert_clean(repo)

    if _branch_exists(repo, new_branch_name):
        raise BranchExistsError(new_branch_name)

    _checkout_branch(repo, parent_branch)
    repo.git.checkout("-b", new_branch_name)

    return {
        "parent_branch": parent_branch,
        "new_branch_name": new_branch_name,
        "current_branch": repo.active_branch.name,
    }


def commit_node(message: str) -> dict[str, str]:
    repo = get_repo()
    repo.git.add(A=True)

    if not repo.index.diff("HEAD"):
        raise NothingToCommitError()

    commit = repo.index.commit(message)
    return {
        "branch": repo.active_branch.name,
        "commit_sha": commit.hexsha,
        "message": message,
    }


def merge_nodes(source_branch: str, target_branch: str) -> dict[str, str]:
    repo = get_repo()
    _assert_clean(repo)

    if not _branch_exists(repo, source_branch):
        raise BranchNotFoundError(source_branch)
    if not _branch_exists(repo, target_branch):
        raise BranchNotFoundError(target_branch)

    repo.heads[target_branch].checkout()

    try:
        repo.git.merge(source_branch)
    except GitCommandError:
        conflicted_files = _conflicted_files(repo)
        if conflicted_files:
            raise MergeConflictError(source_branch, target_branch, conflicted_files)
        raise

    return {
        "status": "merged",
        "source_branch": source_branch,
        "target_branch": target_branch,
    }
