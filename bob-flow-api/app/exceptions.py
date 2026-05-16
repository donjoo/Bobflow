class GitServiceError(Exception):
    def __init__(self, message: str, error_code: str):
        super().__init__(message)
        self.message = message
        self.error_code = error_code


class DirtyWorkingTreeError(GitServiceError):
    def __init__(self, message: str = "Working directory has uncommitted changes"):
        super().__init__(message, "dirty_working_tree")


class BranchExistsError(GitServiceError):
    def __init__(self, branch_name: str):
        super().__init__(f"Branch '{branch_name}' already exists", "branch_exists")


class BranchNotFoundError(GitServiceError):
    def __init__(self, branch_name: str):
        super().__init__(f"Branch '{branch_name}' not found", "branch_not_found")


class NothingToCommitError(GitServiceError):
    def __init__(self, message: str = "Nothing to commit"):
        super().__init__(message, "nothing_to_commit")


class MergeConflictError(GitServiceError):
    def __init__(
        self,
        source_branch: str,
        target_branch: str,
        conflicted_files: list[str],
    ):
        super().__init__("Merge conflict", "merge_conflict")
        self.source_branch = source_branch
        self.target_branch = target_branch
        self.conflicted_files = conflicted_files
