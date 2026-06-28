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
MODEL_NAME = "gemini-2.5-flash-lite"  


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

# Append this to the end of backend/core/gemini_client.py:

def generate_subtask_draft(goal_title: str, subtask_title: str) -> str:
    """
    Uses Gemini to generate a micro action starter draft to eliminate procrastination friction.
    """
    prompt = f"""You are a productivity planning assistant. The user is experiencing a procrastination block on starting this task:
Parent Goal: "{goal_title}"
Subtask to execute: "{subtask_title}"

Produce an encouraging, highly actionable starter draft or step-by-step roadmap for this specific subtask:
1. If communication-based (email/draft), write a ready-to-copy-and-paste draft.
2. If document/writing or building-based, write a clean markdown outline/skeleton.
3. If study/learning-based, write a quick 3-item checklist/starting guide.

Respond with ONLY the actionable content. Tone must be encouraging but extremely brief (max 100 words). No preamble or chatty intro.
"""
    return _call_gemini(prompt)

# Append to backend/core/gemini_client.py

def parse_brain_dump(raw_text: str) -> dict:
    """
    Parses a messy, panic-induced block of text into structured goal metadata
    using Gemini.
    """
    from datetime import date, timedelta
    
    prompt = f"""You are an expert productivity planner. The user has typed this chaotic "brain dump" of what they need to do:
    
    Brain Dump: "{raw_text}"
    
    Extract:
    1. A single, clear, action-oriented Goal Title.
    2. A realistic deadline (in YYYY-MM-DD format). If they mention relative times (e.g., "next Friday" or "tomorrow"), calculate it relative to today's date: {date.today().isoformat()}.
    3. A priority ("low", "medium", or "high") based on their panic/stress level.
    
    Respond with ONLY a JSON object. Do not include markdown wrappers or commentary.
    Format:
    {{"title": "...", "deadline": "YYYY-MM-DD", "priority": "high"}}
    """
    
    raw = _call_gemini(prompt, json_mode=True)
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    
    try:
        return json.loads(raw)
    except Exception as e:
        # Graceful fallback to avoid app crashes during a demo
        print(f"Failed to parse brain dump: {e}")
        return {
            "title": raw_text[:50] + "..." if len(raw_text) > 50 else raw_text,
            "deadline": (date.today() + timedelta(days=3)).isoformat(),
            "priority": "medium"
        }
    
# Append to backend/core/gemini_client.py

def verify_subtask_screenshot(task_title: str, image_bytes: bytes, mime_type: str) -> bool:
    """
    Sends the uploaded screenshot directly to Gemini using in-memory byte data
    to verify if it matches proof of completion.
    """
    prompt = f"""
    You are a strict, automated proof-of-work validator. 
    The user claims they have completed this task: "{task_title}"
    
    Inspect the attached image:
    1. Does it look like a valid proof of completion (e.g. green checkmarks, an 'Accepted' screen, compiler green text, a successfully completed task dashboard)?
    2. Does it relate to or prove completion of: "{task_title}"?
    
    Respond with ONLY a JSON object. Do not include markdown formatting codeblocks.
    Format:
    {{"verified": true, "reason": "Explanation"}}
    """
    
    # Pack the raw byte data into the dictionary format Gemini expects for inline files
    image_part = {
        "mime_type": mime_type,
        "data": image_bytes
    }
    
    model = genai.GenerativeModel("gemini-2.5-flash") # Supports multimodal inputs
    try:
        response = model.generate_content([prompt, image_part], generation_config={"response_mime_type": "application/json"})
        result = json.loads(response.text.strip())
        return result.get("verified", False)
    except Exception as e:
        print(f"Image verification error: {e}")
        return False