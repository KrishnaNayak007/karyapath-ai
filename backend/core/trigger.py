"""
trigger.py

This is the engine. Call check_and_replan_for_user(user) from:
  - a polling endpoint hit when the dashboard loads (cheapest for a hackathon demo), AND/OR
  - a cron/celery beat task every N minutes (more "real" but optional for MVP)

For the demo, dashboard-load polling is enough. Be honest about this when asked —
"it checks on load and on a refresh interval, not a constant background daemon" is a
true, defensible answer. Don't claim more than this implementation does.

The core idea: this function does NOT wait for the user to say "I missed this."
It independently compares now() against ScheduledBlock end_time + Subtask status.
That is what makes it agentic rather than a planner with a button.
"""
from django.utils import timezone
from django.db.models import Sum, Q
from datetime import timedelta

from .models import Goal, Subtask, ScheduledBlock, ReplanLog
from .gemini_client import explain_replan
from .calendar_client import reschedule_calendar_event


def find_missed_blocks(user):
    """A block is 'missed' if its end_time has passed and its subtask is not done."""
    now = timezone.now()
    return ScheduledBlock.objects.filter(
        subtask__goal__user=user,
        end_time__lt=now,
    ).exclude(
        subtask__status="done"
    ).exclude(
        subtask__status="missed"  # already processed, don't re-trigger every poll
    )


def check_and_replan_for_user(user):
    """Main entry point. Returns a list of ReplanLog objects created this call (empty if none).
    Call this on dashboard load. It is idempotent — already-processed misses won't re-fire
    because we mark the subtask 'missed' immediately after handling it."""
    missed_blocks = find_missed_blocks(user)
    new_logs = []

    for block in missed_blocks:
        subtask = block.subtask
        goal = subtask.goal

        subtask.status = "missed"
        subtask.save()

        days_left = max((goal.deadline - timezone.now()).days, 0)
        hours_remaining = _estimate_remaining_hours(goal)

        reasoning = explain_replan(
            goal_title=goal.title,
            missed_subtask_title=subtask.title,
            days_left=days_left,
            hours_remaining=hours_remaining,
        )

        new_start = _find_next_available_slot(goal)
        new_end = new_start + timedelta(minutes=subtask.estimated_minutes)

        block.start_time = new_start
        block.end_time = new_end
        block.was_auto_rescheduled = True
        block.reschedule_reason = reasoning
        block.save()

        subtask.status = "pending"  # back in play, just rescheduled
        subtask.save()

        # Push the change to Google Calendar — see calendar_client.py
        reschedule_calendar_event(block)

        log = ReplanLog.objects.create(
            goal=goal,
            trigger_reason=f"Missed block: {subtask.title} (was due {block.start_time})",
            ai_reasoning=reasoning,
            was_automatic=True,
        )
        new_logs.append(log)

    return new_logs


def _estimate_remaining_hours(goal: Goal) -> float:
    total_minutes = goal.subtasks.exclude(status="done").aggregate(
        total=Sum("estimated_minutes")
    )["total"] or 0
    return round(total_minutes / 60, 1)


def _find_next_available_slot(goal: Goal):
    """MVP version: next slot is simply 'tomorrow same time' or 'in 2 hours', whichever
    is sooner relative to deadline pressure. This is intentionally simple — do not
    over-engineer a real calendar-conflict solver this week. Be ready to say plainly
    that this is a simplified heuristic, not a full scheduling optimizer, if asked."""
    now = timezone.localtime(timezone.now())  # IST, not UTC — same fix as views.py
    days_left = (goal.deadline - now).days
    if days_left <= 1:
        return now + timedelta(hours=2)
    return (now + timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0)