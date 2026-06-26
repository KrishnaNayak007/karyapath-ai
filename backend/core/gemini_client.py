"""
gemini_client.py

Two AI calls only. Don't add more than this for the MVP:
1. breakdown_goal()   -> turns a goal into subtasks with time estimates
2. explain_replan()   -> generates the human-readable reasoning trace when the
                         autonomous trigger fires (this is your Innovation +
                         Agentic Depth evidence — keep this prompt tight and tested)
"""
import os
import json
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
MODEL_NAME = "gemini-3.5-flash"  


def _call_gemini(prompt: str, json_mode: bool = False) -> str:
    model = genai.GenerativeModel(MODEL_NAME)
    # Enable native JSON mode when requested to bypass markdown parsing issues
    generation_config = {"response_mime_type": "application/json"} if json_mode else None
    response = model.generate_content(prompt, generation_config=generation_config)
    return response.text.strip()


def breakdown_goal(title: str, deadline_str: str) -> list[dict]:
    """Returns [{title, estimated_minutes}, ...]. Always validate/parse defensively —
    Gemini will occasionally wrap JSON in markdown fences or add commentary."""
    from datetime import datetime, timedelta
    from django.utils import timezone as django_timezone

    # Defensive Date Parsing: Fallback seamlessly if standard ISO format fails
    try:
        deadline_dt = datetime.fromisoformat(deadline_str)
    except ValueError:
        try:
            # Fallback for DD-MM-YYYY format (e.g. "28-06-2026")
            deadline_dt = datetime.strptime(deadline_str, "%d-%m-%Y")
        except ValueError:
            try:
                # Fallback for YYYY-MM-DD
                deadline_dt = datetime.strptime(deadline_str, "%Y-%m-%d")
            except ValueError:
                # Ultimate fallback to avoid crashing during your live demo
                deadline_dt = django_timezone.now() + timedelta(days=3)

    if deadline_dt.tzinfo is None:
        deadline_dt = django_timezone.make_aware(deadline_dt)
        
    now = django_timezone.now()
    days_available = max((deadline_dt - now).days, 0)
    
    # Assume ~4 realistic focused hours/day a student/professional can actually give this,
    # on top of normal life/work/sleep. This is the budget Gemini must fit inside.
    available_hours = max(days_available * 4, 2)

    prompt = f"""You are a productivity planning assistant. Break the following goal into
3-7 concrete, sequential subtasks with realistic time estimates in minutes.

Goal: "{title}"
Deadline: {deadline_str}
Days until deadline: {days_available}
Total realistic hours available to spend on this before the deadline: {available_hours} hours

CRITICAL CONSTRAINT: the SUM of all estimated_minutes across every subtask must not exceed
{available_hours * 60} minutes. If the goal genuinely cannot fit, compress scope to the most
essential subtasks only rather than listing everything that would ideally be done. Do not
output a plan that exceeds the deadline.

Respond with ONLY a JSON array, no markdown fences, no commentary. Format:
[{{"title": "...", "estimated_minutes": 90}}, ...]
"""
    # Call Gemini in JSON mode so it is guaranteed to return parsed JSON
    raw = _call_gemini(prompt, json_mode=True)
    
    # Simple strip helper just in case
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        data = json.loads(raw)
        parsed = [
            {"title": item["title"], "estimated_minutes": int(item["estimated_minutes"])}
            for item in data
        ]
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        # Fail loudly during dev — don't silently demo a broken parse on stage.
        raise ValueError(f"Gemini breakdown parse failed: {e}\nRaw response: {raw}")

    # Defensive backstop: even with the prompt constraint, Gemini can still overshoot.
    # Scale estimates down proportionally rather than trusting it blindly.
    total_minutes = sum(item["estimated_minutes"] for item in parsed)
    budget_minutes = available_hours * 60
    if total_minutes > budget_minutes:
        scale = budget_minutes / total_minutes
        for item in parsed:
            item["estimated_minutes"] = max(int(item["estimated_minutes"] * scale), 15)

    return parsed


def explain_replan(goal_title: str, missed_subtask_title: str,
                    days_left: int, hours_remaining: float) -> str:
    """Returns a 1-2 sentence plain-language explanation. This text is shown directly
    in the UI as the reasoning trace. Keep prompt narrow so it stays consistent."""
    prompt = f"""A user missed a scheduled task block. Explain the replanning decision in
1-2 short sentences, plain language, no jargon. State what was missed and what you're
doing about it given the time pressure. Do not invent a numeric risk score.

Goal: "{goal_title}"
Missed task: "{missed_subtask_title}"
Days left until deadline: {days_left}
Estimated work remaining: {hours_remaining} hours

Respond with ONLY the explanation text, no preamble.
"""
    return _call_gemini(prompt)