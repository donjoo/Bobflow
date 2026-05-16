from pydantic import BaseModel, Field


class CreateNodeRequest(BaseModel):
    parent_branch: str = Field(..., min_length=1)
    new_branch_name: str = Field(..., min_length=1)


class CreateNodeResponse(BaseModel):
    parent_branch: str
    new_branch_name: str
    current_branch: str


class CommitNodeRequest(BaseModel):
    message: str = Field(..., min_length=1)


class CommitNodeResponse(BaseModel):
    branch: str
    commit_sha: str
    message: str


class MergeNodesRequest(BaseModel):
    source_branch: str = Field(..., min_length=1)
    target_branch: str = Field(..., min_length=1)


class MergeNodesResponse(BaseModel):
    status: str
    source_branch: str
    target_branch: str


class MergeConflictResponse(BaseModel):
    status: str = "conflict"
    source_branch: str
    target_branch: str
    conflicted_files: list[str]


class ErrorResponse(BaseModel):
    detail: str
    error_code: str


class HealthResponse(BaseModel):
    status: str
    repo_path: str
