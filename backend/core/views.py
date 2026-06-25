from urllib import request

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
    email = "og.krishnayak906564@gmail.com"

    user, created = User.objects.get_or_create(
        username=email,
        defaults={
            "email": email,
            "first_name": "Krishna"
        }
    )

    login(request._request, user)  # Passes the underlying Django HttpRequest # <--- 
    
    # Generate or retrieve token for the user
    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        "success": True,
        "token": token.key,  # <--- RETURN THE TOKEN TO THE CLIENT
        "user": {
            "email": email,
            "name": "Krishna",
            "avatarUrl": ""
        }
    })