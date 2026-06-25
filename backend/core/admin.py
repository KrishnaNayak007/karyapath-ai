from django.contrib import admin
from .models import Goal, Subtask, ScheduledBlock, ReplanLog

admin.site.register(Goal)
admin.site.register(Subtask)
admin.site.register(ScheduledBlock)
admin.site.register(ReplanLog)
