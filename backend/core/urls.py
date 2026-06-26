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
    path("subtasks/<int:subtask_id>/generate-draft/", views.generate_draft, name="generate_draft"),
    path("subtasks/<int:subtask_id>/toggle-crisis/", views.toggle_crisis, name="toggle_crisis"),
    path("goals/brain-dump/", views.create_goal_from_brain_dump, name="create_goal_from_brain_dump"),
    path("subtasks/<int:subtask_id>/verify-proof/", views.verify_subtask_proof,             name="verify_subtask_proof"),
]
