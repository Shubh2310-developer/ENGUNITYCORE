import asyncio
import json
import math
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import pandas as pd
from loguru import logger
from sqlalchemy.orm import Session

from app.models.analytics import AnalyticsDataset, DatasetStatus
from app.schemas.data_analysis_agent import (
    AnalysisType,
    ChartConfig,
    ChartType,
    DataAnalysisRequest,
    DataAnalysisResponse,
    DataInsight,
    QueryPlan,
)
from app.services.ai.router import ai_router
from app.services.analytics.data_processor import data_processor


@dataclass
class DataAnalysisError(Exception):
    code: str
    status_code: int
    safe_message: str


class DataAnalysisAgentService:
    ALLOWED_COLLECTIONS = {"analytics_datasets"}
    DANGEROUS_OPERATOR_DENYLIST = {
        "$where",
        "$function",
        "mapreduce",
        "eval(",
        "__proto__",
        "import ",
        "drop ",
        "delete ",
        "truncate ",
        ";--",
    }
    ALLOWED_OPERATIONS = {"group", "aggregate", "sort", "limit", "time_filter"}
    MAX_STAGES = 8
    MAX_RESULTS = 1000
    RAW_SAMPLE_LIMIT = 50
    CHART_POINT_LIMIT = 300
    TOTAL_TIMEOUT_SECONDS = 8.0

    async def analyze(self, request: DataAnalysisRequest, user_id: int, db: Session) -> DataAnalysisResponse:
        started = time.perf_counter()
        logger.info("analytics.ask.request user_id={} dataset_id={}", user_id, request.dataset_id)

        if request.dataset_id is None:
            raise DataAnalysisError("DATASET_REQUIRED", 400, "dataset_id is required")

        if request.data_source != "analytics":
            raise DataAnalysisError("DATA_SOURCE_NOT_ALLOWED", 400, "Unsupported data source")

        dataset = db.query(AnalyticsDataset).filter(
            AnalyticsDataset.id == request.dataset_id,
            AnalyticsDataset.user_id == user_id,
        ).first()

        if not dataset:
            raise DataAnalysisError("DATASET_NOT_FOUND", 404, "Dataset not found")
        if dataset.status != DatasetStatus.READY:
            raise DataAnalysisError("DATASET_NOT_READY", 400, "Dataset is not ready")
        if not dataset.storage_path:
            raise DataAnalysisError("DATASET_STORAGE_MISSING", 404, "Dataset file not found")

        try:
            return await asyncio.wait_for(
                self._run_analysis_pipeline(request=request, dataset=dataset, user_id=user_id, started=started),
                timeout=self.TOTAL_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError as exc:
            logger.warning("analytics.ask.timeout user_id={} dataset_id={}", user_id, dataset.id)
            raise DataAnalysisError("ANALYSIS_TIMEOUT", 504, "Analysis timed out. Please try a simpler question.") from exc

    async def _run_analysis_pipeline(
        self,
        request: DataAnalysisRequest,
        dataset: AnalyticsDataset,
        user_id: int,
        started: float,
    ) -> DataAnalysisResponse:
        with open(dataset.storage_path, "rb") as file_obj:
            content = file_obj.read()

        df = await data_processor.read_file(content, dataset.file_type)
        if df.empty:
            return self._empty_response(request.query, started)

        plan = await self._translate_query_to_plan(query=request.query, df=df)
        self._validate_query_plan(plan=plan, query=request.query, df=df)

        execution_started = time.perf_counter()
        rows = await asyncio.to_thread(self._execute_plan, df.copy(), plan)
        execution_latency_ms = (time.perf_counter() - execution_started) * 1000
        logger.info(
            "analytics.ask.execution user_id={} dataset_id={} rows={} latency_ms={:.2f}",
            user_id,
            dataset.id,
            len(rows),
            execution_latency_ms,
        )

        chart = self._build_chart_config(plan=plan, rows=rows)
        insights = self._build_insights(plan=plan, rows=rows)
        summary = await self._build_summary(request.query, plan, rows, insights)
        suggestions = self._suggest_follow_ups(request.query, plan, rows)

        processing_time = time.perf_counter() - started
        logger.info(
            "analytics.ask.success user_id={} dataset_id={} processing_ms={:.2f}",
            user_id,
            dataset.id,
            processing_time * 1000,
        )

        return DataAnalysisResponse(
            query=request.query,
            analysis_type=plan.analysis_type,
            summary=summary,
            insights=insights,
            chart=chart,
            raw_data=rows[: self.RAW_SAMPLE_LIMIT],
            suggested_queries=suggestions,
            processing_time=processing_time,
        )

    async def _translate_query_to_plan(self, query: str, df: pd.DataFrame) -> QueryPlan:
        columns = [str(col) for col in df.columns.tolist()[:40]]
        prompt = (
            "Translate user request into strict JSON query plan.\n"
            "Allowed operations: group, aggregate, sort, limit, time_filter.\n"
            "Return only JSON with keys: analysis_type, x_field, y_field, group_by, metric, sort, limit, operations.\n"
            "Do not include code.\n"
            f"Columns: {columns}\n"
            f"User query: {query}"
        )

        try:
            raw = await asyncio.wait_for(
                ai_router.route_request(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a safe planner. Return only valid JSON object.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    preference="performance",
                ),
                timeout=2.5,
            )
            parsed = self._extract_json_object(raw)
            if parsed:
                return QueryPlan.model_validate(parsed)
        except Exception:
            logger.warning("analytics.ask.plan_fallback due_to=malformed_or_timeout")

        return self._heuristic_plan(query=query, df=df)

    def _extract_json_object(self, raw: str) -> Optional[Dict[str, Any]]:
        start = raw.find("{")
        end = raw.rfind("}")
        if start < 0 or end <= start:
            return None
        try:
            return json.loads(raw[start : end + 1])
        except json.JSONDecodeError:
            return None

    def _heuristic_plan(self, query: str, df: pd.DataFrame) -> QueryPlan:
        lowered = query.lower()
        numeric_columns = [str(c) for c in df.select_dtypes(include=["number"]).columns.tolist()]
        categorical_columns = [str(c) for c in df.select_dtypes(exclude=["number"]).columns.tolist()]

        if any(word in lowered for word in ["anomaly", "outlier", "spike"]):
            analysis_type = AnalysisType.ANOMALY
        elif any(word in lowered for word in ["trend", "over time", "growth"]):
            analysis_type = AnalysisType.TREND
        elif any(word in lowered for word in ["distribution", "histogram", "spread"]):
            analysis_type = AnalysisType.DISTRIBUTION
        elif any(word in lowered for word in ["compare", "vs", "by "]):
            analysis_type = AnalysisType.COMPARISON
        elif "predict" in lowered:
            analysis_type = AnalysisType.PREDICTION
        else:
            analysis_type = AnalysisType.SUMMARY

        metric = "count"
        if any(word in lowered for word in ["average", "avg", "mean"]):
            metric = "avg"
        elif "sum" in lowered:
            metric = "sum"

        y_field = numeric_columns[0] if numeric_columns else None
        group_by = categorical_columns[0] if categorical_columns else None
        x_field = group_by or (categorical_columns[0] if categorical_columns else None)

        operations = ["limit"]
        if group_by:
            operations.extend(["group", "aggregate"])
        operations.append("sort")

        return QueryPlan(
            analysis_type=analysis_type,
            x_field=x_field,
            y_field=y_field,
            group_by=group_by,
            metric=metric,
            sort="desc",
            limit=20,
            operations=operations,
        )

    def _validate_query_plan(self, plan: QueryPlan, query: str, df: pd.DataFrame) -> None:
        payload = f"{query.lower()} {plan.model_dump_json().lower()}"
        for token in self.DANGEROUS_OPERATOR_DENYLIST:
            if token in payload:
                raise DataAnalysisError("UNSAFE_QUERY", 400, "Unsafe query content detected")

        if len(plan.operations) > self.MAX_STAGES:
            raise DataAnalysisError("TOO_MANY_STAGES", 400, "Query plan exceeds stage limit")
        if plan.limit > self.MAX_RESULTS:
            raise DataAnalysisError("RESULT_LIMIT_EXCEEDED", 400, "Requested result set is too large")

        for operation in plan.operations:
            if operation not in self.ALLOWED_OPERATIONS:
                raise DataAnalysisError("OPERATION_NOT_ALLOWED", 400, "Query operation is not allowed")

        columns = set(str(col) for col in df.columns.tolist())
        for field_name in [plan.x_field, plan.y_field, plan.group_by]:
            if field_name and field_name not in columns:
                raise DataAnalysisError("INVALID_FIELD", 422, f"Unknown field: {field_name}")

    def _execute_plan(self, df: pd.DataFrame, plan: QueryPlan) -> List[Dict[str, Any]]:
        if plan.group_by and plan.group_by in df.columns:
            if plan.metric == "avg" and plan.y_field and plan.y_field in df.columns:
                result = df.groupby(plan.group_by, dropna=False)[plan.y_field].mean().reset_index(name="value")
            elif plan.metric == "sum" and plan.y_field and plan.y_field in df.columns:
                result = df.groupby(plan.group_by, dropna=False)[plan.y_field].sum().reset_index(name="value")
            else:
                result = df.groupby(plan.group_by, dropna=False).size().reset_index(name="value")
            value_key = "value"
        else:
            selected_columns = [col for col in [plan.x_field, plan.y_field] if col and col in df.columns]
            if not selected_columns:
                selected_columns = [str(df.columns[0])]
            result = df[selected_columns].copy()
            if len(selected_columns) == 1:
                result = result.rename(columns={selected_columns[0]: "value"})
            value_key = "value" if "value" in result.columns else selected_columns[-1]

        if value_key in result.columns:
            result = result.sort_values(by=value_key, ascending=plan.sort == "asc")

        result = result.head(min(plan.limit, self.MAX_RESULTS))
        rows = self._to_json_rows(result)
        return rows

    def _to_json_rows(self, result_df: pd.DataFrame) -> List[Dict[str, Any]]:
        cleaned = result_df.where(pd.notna(result_df), None)
        records = cleaned.to_dict(orient="records")
        json_ready: List[Dict[str, Any]] = []
        for row in records:
            json_row: Dict[str, Any] = {}
            for key, value in row.items():
                if isinstance(value, (pd.Timestamp,)):
                    json_row[key] = value.isoformat()
                elif isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
                    json_row[key] = None
                else:
                    json_row[key] = value
            json_ready.append(json_row)
        return json_ready

    def _build_chart_config(self, plan: QueryPlan, rows: List[Dict[str, Any]]) -> Optional[ChartConfig]:
        if len(rows) < 2:
            return None

        if plan.analysis_type == AnalysisType.TREND:
            chart_type = ChartType.LINE
        elif plan.analysis_type == AnalysisType.DISTRIBUTION:
            chart_type = ChartType.HISTOGRAM
        elif plan.analysis_type == AnalysisType.ANOMALY:
            chart_type = ChartType.SCATTER
        elif plan.analysis_type == AnalysisType.COMPARISON:
            chart_type = ChartType.BAR
        elif plan.analysis_type == AnalysisType.PREDICTION:
            chart_type = ChartType.LINE
        else:
            chart_type = ChartType.BAR

        clipped = self._downsample_rows(rows, self.CHART_POINT_LIMIT)
        x_label = plan.group_by or plan.x_field or "category"
        y_label = plan.y_field or "value"

        return ChartConfig(
            chart_type=chart_type,
            title=f"{plan.analysis_type.value.title()} analysis",
            x_label=x_label,
            y_label=y_label,
            data=clipped,
        )

    def _downsample_rows(self, rows: List[Dict[str, Any]], max_points: int) -> List[Dict[str, Any]]:
        if len(rows) <= max_points:
            return rows
        step = max(1, len(rows) // max_points)
        return rows[::step][:max_points]

    def _build_insights(self, plan: QueryPlan, rows: List[Dict[str, Any]]) -> List[DataInsight]:
        if not rows:
            return [
                DataInsight(
                    insight_type="info",
                    title="No matching rows",
                    description="No data matched this request in the selected dataset.",
                    confidence=0.99,
                    data_points=[],
                )
            ]

        first_row = rows[0]
        primary_keys = list(first_row.keys())
        main_value = primary_keys[-1] if primary_keys else "value"

        insights = [
            DataInsight(
                insight_type=plan.analysis_type.value,
                title="Primary finding",
                description=f"Top result is based on `{main_value}` from {len(rows)} rows.",
                confidence=0.84,
                data_points=rows[:5],
            ),
            DataInsight(
                insight_type="quality",
                title="Result scope",
                description=f"Returned {len(rows)} rows after safety limits and user scoping.",
                confidence=0.96,
                data_points=None,
            ),
        ]
        return insights

    async def _build_summary(
        self,
        query: str,
        plan: QueryPlan,
        rows: List[Dict[str, Any]],
        insights: List[DataInsight],
    ) -> str:
        deterministic = (
            f"I analyzed your request as a {plan.analysis_type.value} query and returned {len(rows)} scoped rows. "
            f"{insights[0].description if insights else 'No notable insight was found.'}"
        )

        try:
            raw = await asyncio.wait_for(
                ai_router.route_request(
                    messages=[
                        {
                            "role": "system",
                            "content": "Summarize safely in 2 short sentences. Do not mention internals.",
                        },
                        {
                            "role": "user",
                            "content": (
                                f"Query: {query}\n"
                                f"Analysis type: {plan.analysis_type.value}\n"
                                f"Rows: {len(rows)}\n"
                                f"Top sample: {json.dumps(rows[:3], default=str)}"
                            ),
                        },
                    ],
                    preference="performance",
                ),
                timeout=1.5,
            )
            cleaned = raw.strip().replace("\n", " ")
            if cleaned:
                return cleaned[:2000]
        except Exception:
            logger.warning("analytics.ask.summary_fallback")

        return deterministic

    def _suggest_follow_ups(self, query: str, plan: QueryPlan, rows: List[Dict[str, Any]]) -> List[str]:
        base = query.strip().rstrip("?")
        dimension = plan.group_by or plan.x_field or "segment"
        metric = plan.y_field or "value"
        suggestions = [
            f"Break this down by {dimension}",
            f"Show top 10 by {metric}",
            f"Highlight anomalies in {metric}",
        ]
        if not rows:
            suggestions[0] = f"Try a broader question than: {base}"
        return suggestions[:5]

    def _empty_response(self, query: str, started: float) -> DataAnalysisResponse:
        return DataAnalysisResponse(
            query=query,
            analysis_type=AnalysisType.SUMMARY,
            summary="The selected dataset is empty, so there is no data to analyze yet.",
            insights=[
                DataInsight(
                    insight_type="info",
                    title="Empty dataset",
                    description="Upload data or choose another dataset to continue.",
                    confidence=1.0,
                    data_points=[],
                )
            ],
            chart=None,
            raw_data=[],
            suggested_queries=["Show dataset summary", "List available columns"],
            processing_time=time.perf_counter() - started,
        )


data_analysis_agent_service = DataAnalysisAgentService()
