from urllib import request
from .gemini_client import parse_brain_dump
from .gemini_client import verify_subtask_screenshot
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import login
from rest_framework.authtoken.models import Token
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from rest_framework.permissions import AllowAny
# from rest_framework.permissions import AllowAny

from .models import Goal, Subtask, ScheduledBlock
from .serializers import GoalSerializer
from .gemini_client import breakdown_goal
from .trigger import check_and_replan_for_user
from .calendar_client import create_calendar_event

# Working hours for the naive MVP scheduler. Don't over-engineer this further —
# a real conflict-aware solver is out of scope for the hackathon window.
WORK_DAY_START_HOUR = 9
WORK_DAY_END_HOUR = 22


def _next_working_slot(cursor, duration_minutes):
    """Returns a (start, end) pair that fits inside working hours [9am, 10pm) and
    never crosses midnight, even for short tasks starting late in the evening."""
    if cursor.hour < WORK_DAY_START_HOUR:
        cursor = cursor.replace(hour=WORK_DAY_START_HOUR, minute=0, second=0, microsecond=0)
    elif cursor.hour >= WORK_DAY_END_HOUR:
        cursor = (cursor + timedelta(days=1)).replace(
            hour=WORK_DAY_START_HOUR, minute=0, second=0, microsecond=0
        )

    end = cursor + timedelta(minutes=duration_minutes)
    # Catch BOTH cases: block runs past the 10pm cutoff, OR it crosses into the
    # next calendar date at all (e.g. starts 7pm, runs 5hrs, lands at midnight).
    if end.hour >= WORK_DAY_END_HOUR or end.date() != cursor.date():
        cursor = (cursor + timedelta(days=1)).replace(
            hour=WORK_DAY_START_HOUR, minute=0, second=0, microsecond=0
        )
        end = cursor + timedelta(minutes=duration_minutes)

    return cursor, end


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_goal(request):
    """Create a goal, get AI breakdown, generate schedule, push to Calendar.
    This single endpoint covers steps 1-3 of your demo flow."""
    print("USER =", request.user)
    print("AUTH =", request.user.is_authenticated)
    title = request.data["title"]
    deadline = request.data["deadline"]  # ISO string
    priority = request.data.get("priority", "medium")

    goal = Goal.objects.create(
        user=request.user, title=title, deadline=deadline, priority=priority
    )

    subtask_data = breakdown_goal(title, deadline)

    cursor = timezone.localtime(timezone.now() + timedelta(hours=2))  # local IST time, not UTC
    for order, item in enumerate(subtask_data):
        subtask = Subtask.objects.create(
            goal=goal,
            title=item["title"],
            estimated_minutes=item["estimated_minutes"],
            order=order,
        )
        start, end = _next_working_slot(cursor, item["estimated_minutes"])
        block = ScheduledBlock.objects.create(
            subtask=subtask, start_time=start, end_time=end
        )
        try:
            event_id = create_calendar_event(block)
            block.google_calendar_event_id = event_id
            block.save()
        except Exception as e:
            # Don't let a Calendar failure block the whole goal creation during dev/demo.
            # Surface it so you notice — but don't crash the request.
            print(f"Calendar push failed for block {block.id}: {e}")
        cursor = end + timedelta(minutes=30)  # simple gap between blocks

    # --- Flatten the response payload specifically to match React's onGoalCreated state callback ---
    goal_data = GoalSerializer(goal).data
    flat_subtasks = []
    flat_blocks = []
    
    for subtask in goal_data.get("subtasks", []):
        flat_subtasks.append({
            "id": subtask["id"],
            "goal": subtask["goal"],
            "title": subtask["title"],
            "estimated_minutes": subtask["estimated_minutes"],
            "order": subtask["order"],
            "status": subtask["status"]
        })
        for block in subtask.get("blocks", []):
            flat_blocks.append({
                "id": block["id"],
                "subtask_id": subtask["id"],  # Maps the related subtask ID for Calendar lookups
                "start_time": block["start_time"],
                "end_time": block["end_time"],
                "google_calendar_event_id": block["google_calendar_event_id"],
                "was_auto_rescheduled": block["was_auto_rescheduled"],
                "reschedule_reason": block["reschedule_reason"]
            })

    return Response({
        "goal": goal_data,
        "subtasks": flat_subtasks,
        "scheduled_blocks": flat_blocks
    }, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """Dashboard load = where the autonomous trigger fires. This is the endpoint
    your frontend calls on page load / refresh — it checks for misses BEFORE
    returning data, so what the user sees already reflects any auto-replan."""
    new_replans = check_and_replan_for_user(request.user)
    goals = Goal.objects.filter(user=request.user).order_by("deadline")
    
    # 1. Serialize nested goals
    goals_data = GoalSerializer(goals, many=True).data
    
    # 2. Flatten subtasks and scheduled blocks for your React Calendar state
    flat_subtasks = []
    flat_blocks = []
    
    for goal in goals_data:
        for subtask in goal.get("subtasks", []):
            flat_subtasks.append({
                "id": subtask["id"],
                "goal": subtask["goal"],
                "title": subtask["title"],
                "estimated_minutes": subtask["estimated_minutes"],
                "order": subtask["order"],
                "status": subtask["status"]
            })
            for block in subtask.get("blocks", []):
                flat_blocks.append({
                    "id": block["id"],
                    "subtask_id": subtask["id"],  # Maps the related subtask ID to match React calendar block lookups
                    "start_time": block["start_time"],
                    "end_time": block["end_time"],
                    "google_calendar_event_id": block["google_calendar_event_id"],
                    "was_auto_rescheduled": block["was_auto_rescheduled"],
                    "reschedule_reason": block["reschedule_reason"]
                })

    return Response({
        "goals": goals_data,
        "subtasks": flat_subtasks,
        "scheduled_blocks": flat_blocks,
        "new_replans": [
            {"goal": r.goal.title, "reason": r.trigger_reason, "ai_reasoning": r.ai_reasoning}
            for r in new_replans
        ],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_subtask(request, subtask_id):
    """User marks a task done. This is your Problem Solving / completion-loop proof —
    the system should react here, not just flip a status flag silently."""
    subtask = Subtask.objects.get(id=subtask_id, goal__user=request.user)
    subtask.status = "done"
    subtask.save()
    # Re-run the check immediately so the dashboard reflects updated risk/progress
    # right after completion, in the same demo beat.
    check_and_replan_for_user(request.user)
    return Response({"status": "done", "subtask_id": subtask_id})


@api_view(["POST"])
@permission_classes([AllowAny])
def google_verify(request):
    # 1. Retrieve the token sent by the React frontend
    # Checks standard keys commonly used (like 'token' or 'credential')
    token_str = request.data.get("token") or request.data.get("credential") or ""
    
    if not token_str:
        return Response({"success": False, "error": "No token provided"}, status=400)

    email = ""
    first_name = "User"

    # 2. Handle Sandbox/Mock Token Flow
    if isinstance(token_str, str) and token_str.startswith("mock-"):
        # Strip the "mock-" prefix to get the user's typed email
        email = token_str.replace("mock-", "")
        # Derive a clean name from the email (e.g., "krish" from "krish@gmail.com")
        first_name = email.split("@")[0].capitalize() if "@" in email else "Sandbox User"
        
    # 3. Handle Real Google OAuth Token Flow
    else:
        try:
            # Verify the real Google OAuth ID Token
            idinfo = id_token.verify_oauth2_token(token_str, google_requests.Request())
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', idinfo.get('name', 'Google User'))
        except Exception as e:
            return Response({
                "success": False, 
                "error": f"Google Token verification failed: {str(e)}"
            }, status=400)

    if not email:
        return Response({"success": False, "error": "Could not resolve an email from the token"}, status=400)

    # 4. Create or get the Django user dynamically based on the resolved email
    user, created = User.objects.get_or_create(
        username=email,
        defaults={
            "email": email,
            "first_name": first_name
        }
    )

    # Log the user in to set session cookies
    login(request._request, user)  
    
    # Generate or retrieve REST token
    token, _ = Token.objects.get_or_create(user=user)

    # Return the dynamically resolved user info back to the React frontend
    return Response({
        "success": True,
        "token": token.key,
        "user": {
            "email": email,
            "name": first_name,
            "avatarUrl": ""
        }
    })

# Append these endpoints to the bottom of backend/core/views.py:

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_draft(request, subtask_id):
    """Generates an action starter draft for a subtask using Gemini."""
    try:
        subtask = Subtask.objects.get(id=subtask_id, goal__user=request.user)
    except Subtask.DoesNotExist:
        return Response({"error": "Subtask not found"}, status=404)

    if not subtask.action_draft:
        from .gemini_client import generate_subtask_draft
        draft = generate_subtask_draft(subtask.goal.title, subtask.title)
        subtask.action_draft = draft
        subtask.save()

    return Response({
        "subtask_id": subtask.id,
        "action_draft": subtask.action_draft
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_crisis(request, subtask_id):
    """Toggles crisis focus mode for a subtask."""
    try:
        subtask = Subtask.objects.get(id=subtask_id, goal__user=request.user)
    except Subtask.DoesNotExist:
        return Response({"error": "Subtask not found"}, status=404)

    subtask.is_crisis_active = not subtask.is_crisis_active
    subtask.save()

    return Response({
        "subtask_id": subtask.id,
        "is_crisis_active": subtask.is_crisis_active
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_goal_from_brain_dump(request):
    """
    API view that takes a raw "brain dump" string, parses it into structured
    data, and runs your standard Goal creation + scheduling logic.
    """
    raw_text = request.data.get("brain_dump", "")
    if not raw_text:
        return Response({"error": "No brain dump text provided"}, status=400)

    # 1. Parse chaotic text into structured goal parameters via Gemini
    parsed = parse_brain_dump(raw_text)
    title = parsed["title"]
    deadline = parsed["deadline"]
    priority = parsed.get("priority", "medium")

    # 2. Programmatically create the Goal
    goal = Goal.objects.create(
        user=request.user, title=title, deadline=deadline, priority=priority
    )

    # 3. Reuse your existing breakdown logic
    subtask_data = breakdown_goal(title, deadline)

    # 4. Reuse your existing Local IST scheduler logic
    cursor = timezone.localtime(timezone.now() + timedelta(hours=2))
    flat_subtasks = []
    flat_blocks = []

    for order, item in enumerate(subtask_data):
        subtask = Subtask.objects.create(
            goal=goal,
            title=item["title"],
            estimated_minutes=item["estimated_minutes"],
            order=order,
        )
        start, end = _next_working_slot(cursor, item["estimated_minutes"])
        block = ScheduledBlock.objects.create(
            subtask=subtask, start_time=start, end_time=end
        )
        try:
            event_id = create_calendar_event(block)
            block.google_calendar_event_id = event_id
            block.save()
        except Exception as e:
            print(f"Calendar push failed for block {block.id}: {e}")
            
        cursor = end + timedelta(minutes=30)

        # Build response payload mapping your React state callbacks
        flat_subtasks.append({
            "id": subtask.id,
            "goal": goal.id,
            "title": subtask.title,
            "estimated_minutes": subtask.estimated_minutes,
            "order": subtask.order,
            "status": subtask.status
        })
        flat_blocks.append({
            "id": block.id,
            "subtask_id": subtask.id,
            "start_time": block.start_time,
            "end_time": block.end_time,
            "google_calendar_event_id": block.google_calendar_event_id,
            "was_auto_rescheduled": block.was_auto_rescheduled,
            "reschedule_reason": block.reschedule_reason
        })

    return Response({
        "goal": GoalSerializer(goal).data,
        "subtasks": flat_subtasks,
        "scheduled_blocks": flat_blocks
    }, status=201)

# Append to backend/core/views.py:

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_subtask_proof(request, subtask_id):
    """
    API endpoint that accepts a multipart image upload, validates it
    via Gemini Vision, and marks the subtask as completed.
    """
    try:
        subtask = Subtask.objects.get(id=subtask_id, goal__user=request.user)
    except Subtask.DoesNotExist:
        return Response({"error": "Subtask not found"}, status=404)

    image_file = request.FILES.get("proof")
    if not image_file:
        return Response({"error": "No image proof file provided"}, status=400)

    # Read binary bytes and detect content type
    image_bytes = image_file.read()
    mime_type = image_file.content_type

    # Verify via Gemini Vision
    is_valid = verify_subtask_screenshot(subtask.title, image_bytes, mime_type)

    if is_valid:
        subtask.status = "completed"  # aligns with your 'completed' status string
        subtask.save()
        # Immediately run your autonomous trigger checklist check
        check_and_replan_for_user(request.user)
        
        return Response({
            "success": True,
            "message": "AI successfully verified your work! Task marked completed.",
            "subtask_id": subtask.id
        })
    else:
        return Response({
            "success": False,
            "message": "AI verification failed. The screenshot does not appear to show proof of completion for this task."
        }, status=400)