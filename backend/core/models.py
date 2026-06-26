from django.db import models
from django.contrib.auth.models import User


class Goal(models.Model):
    """A user's top-level objective, e.g. 'Complete React project' or 'DSA exam prep'."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="goals")
    title = models.CharField(max_length=255)
    deadline = models.DateTimeField()
    priority = models.CharField(
        max_length=20,
        choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")],
        default="medium",
    )
    is_recurring = models.BooleanField(default=False)  # e.g. "Gym 3x/week"
    recurrence_rule = models.CharField(max_length=100, blank=True, null=True)  # simple text rule for MVP
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Subtask(models.Model):
    """AI-generated breakdown of a Goal."""
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name="subtasks")
    title = models.CharField(max_length=255)
    estimated_minutes = models.IntegerField()
    action_draft = models.TextField(blank=True, null=True, help_text="AI-generated template/email/code outline to start this subtask.")
    is_crisis_active = models.BooleanField(default=False, help_text="Enables active focus mode for this subtask.")
    order = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=[("pending", "Pending"), ("in_progress", "In Progress"),
                  ("done", "Done"), ("missed", "Missed")],
        default="pending",
    )

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.title} ({self.status})"


class ScheduledBlock(models.Model):
    """A concrete time slot for a Subtask. This is what gets pushed to Google Calendar
    AND what the autonomous trigger checks against current time to detect a miss."""
    subtask = models.ForeignKey(Subtask, on_delete=models.CASCADE, related_name="blocks")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    google_calendar_event_id = models.CharField(max_length=255, blank=True, null=True)
    was_auto_rescheduled = models.BooleanField(default=False)
    reschedule_reason = models.TextField(blank=True, null=True)  # the human-readable reasoning trace

    def __str__(self):
        return f"{self.subtask.title}: {self.start_time} - {self.end_time}"


class ReplanLog(models.Model):
    """Every time the autonomous trigger fires and changes the plan, log it here.
    This is your Agentic Depth + Innovation evidence trail — show this list live in the demo
    to prove the system acted without being asked."""
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name="replan_logs")
    triggered_at = models.DateTimeField(auto_now_add=True)
    trigger_reason = models.CharField(max_length=255)  # e.g. "Missed block: UI Design 6PM"
    ai_reasoning = models.TextField()  # the Gemini-generated explanation shown to the user
    was_automatic = models.BooleanField(default=True)  # True = system-initiated, not user click

    def __str__(self):
        return f"Replan for {self.goal.title} at {self.triggered_at}"
