from django.urls import path
from . import views

urlpatterns = [
    path("goals/", views.create_goal, name="create_goal"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("subtasks/<int:subtask_id>/complete/", views.complete_subtask, name="complete_subtask"),
    path(
        "auth/google-verify/",
        views.google_verify,
        name="google_verify"
    ),
]
