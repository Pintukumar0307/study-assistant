import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.requests import StudyPlanRequest
from app.schemas.responses import StudyPlanResponse, DailyPlanItem, WeeklyPlanItem
from app.services.gemini_service import gemini_service
from app.core.security import verify_service_key
from app.core.logging import logger

router = APIRouter(prefix="/api/v1/study-plan", tags=["study-plan"])

STUDY_PLAN_SYSTEM = """You are an expert academic study planner using spaced repetition principles.
Create a realistic, structured study plan.
Respond ONLY with valid JSON. No markdown, no backticks.

JSON structure:
{
  "daily_plan": [
    {
      "date": "YYYY-MM-DD",
      "tasks": ["task1", "task2"],
      "completed": false
    }
  ],
  "weekly_plan": [
    {
      "week": 1,
      "goals": ["goal1", "goal2"],
      "topics": ["topic1", "topic2"]
    }
  ]
}"""


@router.post("", response_model=StudyPlanResponse, dependencies=[Depends(verify_service_key)])
async def generate_study_plan(request: StudyPlanRequest):
    try:
        today = datetime.now().date()
        try:
            exam_date = datetime.fromisoformat(request.exam_date).date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid exam_date format. Use ISO 8601.")

        days_until_exam = (exam_date - today).days
        if days_until_exam <= 0:
            raise HTTPException(status_code=400, detail="Exam date must be in the future")

        weeks = max(1, days_until_exam // 7)
        subjects_str = ", ".join(request.subjects)

        prompt = f"""Create a study plan with these details:
- Exam date: {request.exam_date}
- Days until exam: {days_until_exam}
- Subjects to cover: {subjects_str}
- Today's date: {today.isoformat()}

Generate:
1. A daily_plan array with one entry per day from today to exam date (max 30 days shown)
2. A weekly_plan array with {weeks} week(s) of goals

Use spaced repetition: introduce topics early, review them multiple times with increasing intervals.
Each day should have 2-4 specific, actionable tasks.
Each week should have 2-3 clear goals and list the topics covered."""

        raw = gemini_service.generate_json(prompt, STUDY_PLAN_SYSTEM)
        raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(raw)

        daily_plan = [
            DailyPlanItem(
                date=item["date"],
                tasks=item.get("tasks", []),
                completed=item.get("completed", False),
            )
            for item in data.get("daily_plan", [])
        ]

        weekly_plan = [
            WeeklyPlanItem(
                week=item["week"],
                goals=item.get("goals", []),
                topics=item.get("topics", []),
            )
            for item in data.get("weekly_plan", [])
        ]

        return StudyPlanResponse(
            success=True,
            daily_plan=daily_plan,
            weekly_plan=weekly_plan,
            total_days=days_until_exam,
        )
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error in study plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Study plan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
