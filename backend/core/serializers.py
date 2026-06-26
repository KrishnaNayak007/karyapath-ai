from rest_framework import serializers
from .models import Goal, Subtask, ScheduledBlock, ReplanLog


class ScheduledBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledBlock
        fields = [
            "id", "subtask", "start_time", "end_time",
            "google_calendar_event_id", "was_auto_rescheduled", "reschedule_reason",
        ]


class SubtaskSerializer(serializers.ModelSerializer):
    blocks = ScheduledBlockSerializer(many=True, read_only=True)

    class Meta:
        model = Subtask
        fields = ["id", "goal", "title", "estimated_minutes", "order", "status", "blocks","action_draft", "is_crisis_active"]


class ReplanLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReplanLog
        fields = ["id", "goal", "triggered_at", "trigger_reason", "ai_reasoning", "was_automatic"]


class GoalSerializer(serializers.ModelSerializer):
    subtasks = SubtaskSerializer(many=True, read_only=True)
    replan_logs = ReplanLogSerializer(many=True, read_only=True)

    class Meta:
        model = Goal
        fields = [
            "id", "title", "deadline", "priority",
            "is_recurring", "recurrence_rule", "created_at",
            "subtasks", "replan_logs",
        ]
