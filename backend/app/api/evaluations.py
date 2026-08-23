import asyncio
import json
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import ConflictError, NotFoundError
from app.db import get_db
from app.models.agent import Agent
from app.models.evaluation import EvalCase, EvalRun, Evaluation
from app.models.user import User
from app.schemas.evaluation import EvaluationCreate, EvaluationRead, EvalRunRead
from app.services.llm import LLMService
from app.services.llm_config import resolve_config

router = APIRouter(prefix="/api/evaluations", tags=["evaluations"])


@router.get("", response_model=list[EvaluationRead])
async def list_evaluations(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[Evaluation]:
    result = await db.execute(select(Evaluation).where(Evaluation.user_id == user.id).order_by(Evaluation.created_at.desc()))
    return list(result.scalars().all())


@router.post("", response_model=EvaluationRead, status_code=201)
async def create_evaluation(body: EvaluationCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Evaluation:
    eval_obj = Evaluation(user_id=user.id, name=body.name, description=body.description, agent_id=body.agent_id, model=body.model)
    db.add(eval_obj)
    await db.flush()
    for case in body.cases[:100]:
        db.add(EvalCase(evaluation_id=eval_obj.id, input=str(case.get("input", "")), expected=str(case.get("expected", ""))))
    await db.commit()
    await db.refresh(eval_obj)
    return eval_obj


@router.delete("/{evaluation_id}", status_code=204)
async def delete_evaluation(evaluation_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    eval_obj = await db.get(Evaluation, evaluation_id)
    if not eval_obj or eval_obj.user_id != user.id:
        raise NotFoundError("Evaluation not found.")
    await db.delete(eval_obj)
    await db.commit()


@router.get("/{evaluation_id}/runs", response_model=list[EvalRunRead])
async def list_eval_runs(evaluation_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[EvalRun]:
    result = await db.execute(select(EvalRun).where(EvalRun.evaluation_id == evaluation_id).order_by(EvalRun.created_at.desc()).limit(20))
    return list(result.scalars().all())


@router.post("/{evaluation_id}/run", response_model=EvalRunRead)
async def run_evaluation(evaluation_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> EvalRun:
    eval_obj = await db.get(Evaluation, evaluation_id)
    if not eval_obj or eval_obj.user_id != user.id:
        raise NotFoundError("Evaluation not found.")

    cases = list((await db.execute(select(EvalCase).where(EvalCase.evaluation_id == evaluation_id))).scalars().all())
    if not cases:
        raise ConflictError("This evaluation has no test cases.")

    agent = None
    if eval_obj.agent_id:
        agent = await db.get(Agent, eval_obj.agent_id)

    eval_run = EvalRun(evaluation_id=evaluation_id, status="running", total=len(cases))
    db.add(eval_run)
    await db.commit()
    await db.refresh(eval_run)

    llm = LLMService()
    config = resolve_config(user, eval_obj.model)
    system_prompt = agent.system_prompt if agent and agent.system_prompt else "You are a helpful assistant. Answer concisely and accurately."

    results = []
    passed = 0

    async def evaluate_one(case: EvalCase) -> dict:
        answer = ""
        if config.available:
            answer = await llm.complete(
                [{"role": "system", "content": system_prompt}, {"role": "user", "content": case.input}],
                config=config,
                temperature=0,
                max_tokens=512,
            )
        else:
            answer = f"[mock answer for] {case.input[:80]}"

        # Keyword-overlap based grader (works without an LLM judge).
        expected_tokens = set(case.expected.lower().split())
        answer_tokens = set(answer.lower().split())
        overlap = len(expected_tokens & answer_tokens) / max(len(expected_tokens), 1)
        ok = overlap >= 0.4 or not expected_tokens
        return {"input": case.input, "expected": case.expected, "actual": answer[:400], "passed": ok, "overlap": round(overlap, 3)}

    batch = await asyncio.gather(*[evaluate_one(c) for c in cases])
    for res in batch:
        if res["passed"]:
            passed += 1
        results.append(res)

    eval_run.status = "completed"
    eval_run.passed = passed
    eval_run.failed = len(cases) - passed
    eval_run.results = json.dumps(results)
    await db.commit()
    await db.refresh(eval_run)
    return eval_run