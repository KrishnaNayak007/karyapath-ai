"""
calendar_client.py

THIS IS YOUR DAY 1 PRIORITY. Get create_calendar_event() working against a real
Google Calendar before you build anything else. If OAuth/consent screen setup is
going to eat a day, you need to know that today, not on day 5.

Setup checklist (do this now, in order):
1. Google Cloud Console -> new project -> enable Google Calendar API.
2. Create OAuth 2.0 Client ID (Web application type).
3. Add http://localhost:8000/auth/callback (or your actual redirect) as authorized redirect URI.
4. Download client secret JSON, store as backend/credentials.json (DO NOT commit this — add to .gitignore).
5. Run the OAuth consent flow once manually to get a refresh token, store it in env vars.

For the hackathon demo: a single authenticated user (you, demoing) is enough.
Do NOT build multi-user OAuth token storage/refresh this week — out of scope, not graded.
"""
import os
import datetime
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


def _get_calendar_service():
    creds = Credentials(
        token=None,
        refresh_token=os.environ.get("GOOGLE_REFRESH_TOKEN"),
        client_id=os.environ.get("GOOGLE_CLIENT_ID"),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
        token_uri="https://oauth2.googleapis.com/token",
        scopes=SCOPES,
    )
    return build("calendar", "v3", credentials=creds)


def create_calendar_event(block) -> str:
    """Creates a Google Calendar event for a ScheduledBlock. Returns the event ID,
    which you should save to block.google_calendar_event_id."""
    service = _get_calendar_service()
    event = {
        "summary": block.subtask.title,
        "description": f"KaryaPath AI — part of goal: {block.subtask.goal.title}",
        "start": {"dateTime": block.start_time.isoformat(), "timeZone": "Asia/Kolkata"},
        "end": {"dateTime": block.end_time.isoformat(), "timeZone": "Asia/Kolkata"},
    }
    created = service.events().insert(calendarId="primary", body=event).execute()
    return created["id"]


def reschedule_calendar_event(block) -> None:
    """Called by trigger.py when the autonomous replan moves a block. Updates the
    existing event if one exists, otherwise creates a new one."""
    service = _get_calendar_service()
    if block.google_calendar_event_id:
        event = {
            "summary": block.subtask.title,
            "description": f"KaryaPath AI — rescheduled: {block.reschedule_reason}",
            "start": {"dateTime": block.start_time.isoformat(), "timeZone": "Asia/Kolkata"},
            "end": {"dateTime": block.end_time.isoformat(), "timeZone": "Asia/Kolkata"},
        }
        service.events().update(
            calendarId="primary",
            eventId=block.google_calendar_event_id,
            body=event,
        ).execute()
    else:
        block.google_calendar_event_id = create_calendar_event(block)
        block.save()
