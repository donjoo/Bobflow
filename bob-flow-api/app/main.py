import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

import git
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from git.exc import GitCommandError

from app import git_service
from app.config import settings
from app.exceptions import GitServiceError, MergeConflictError
from app.schemas import (
    CommitNodeRequest,
    CommitNodeResponse,
    CreateNodeRequest,
    CreateNodeResponse,
    ErrorResponse,
    HealthResponse,
    MergeConflictResponse,
    MergeNodesRequest,
    MergeNodesResponse,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    repo_path = settings.resolved_repo_path
    if not repo_path.is_dir():
        raise RuntimeError(f"GIT_REPO_PATH is not a directory: {repo_path}")

    try:
        git_service.init_repo(repo_path)
    except git.exc.InvalidGitRepositoryError as exc:
        raise RuntimeError(f"GIT_REPO_PATH is not a valid git repository: {repo_path}") from exc

    logger.info("Managing git repository at %s", repo_path)
    yield


app = FastAPI(title="BobFlow Git API", lifespan=lifespan)

_cors_origins = os.environ.get(
    "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in _cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(GitServiceError)
async def git_service_error_handler(_request: Request, exc: GitServiceError):
    status_code = 400
    if exc.error_code == "dirty_working_tree":
        status_code = 409
    elif exc.error_code == "branch_exists":
        status_code = 409
    elif exc.error_code == "branch_not_found":
        status_code = 404
    elif exc.error_code == "merge_conflict" and isinstance(exc, MergeConflictError):
        return JSONResponse(
            status_code=409,
            content=MergeConflictResponse(
                source_branch=exc.source_branch,
                target_branch=exc.target_branch,
                conflicted_files=exc.conflicted_files,
            ).model_dump(),
        )

    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(detail=exc.message, error_code=exc.error_code).model_dump(),
    )


@app.exception_handler(GitCommandError)
async def git_command_error_handler(_request: Request, exc: GitCommandError):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            detail="An unexpected git error occurred",
            error_code="git_error",
        ).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            detail=str(exc.errors()),
            error_code="validation_error",
        ).model_dump(),
    )


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", repo_path=str(settings.resolved_repo_path))


@app.post("/create-node", response_model=CreateNodeResponse)
def create_node(body: CreateNodeRequest):
    result = git_service.create_node(body.parent_branch, body.new_branch_name)
    return CreateNodeResponse(**result)


@app.post("/commit-node", response_model=CommitNodeResponse)
def commit_node(body: CommitNodeRequest):
    result = git_service.commit_node(body.message)
    return CommitNodeResponse(**result)


@app.post("/merge-nodes", response_model=MergeNodesResponse)
def merge_nodes(body: MergeNodesRequest):
    result = git_service.merge_nodes(body.source_branch, body.target_branch)
    return MergeNodesResponse(**result)
