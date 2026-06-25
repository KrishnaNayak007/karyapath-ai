from dotenv import load_dotenv
load_dotenv()
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'karyapath_backend.settings')
django.setup()
from django.utils import timezone
from datetime import timedelta
from core.calendar_client import _get_calendar_service

service = _get_calendar_service()
event = {
    'summary': 'KaryaPath test event',
    'start': {'dateTime': (timezone.now() + timedelta(hours=1)).isoformat(), 'timeZone': 'Asia/Kolkata'},
    'end': {'dateTime': (timezone.now() + timedelta(hours=2)).isoformat(), 'timeZone': 'Asia/Kolkata'},
}
created = service.events().insert(calendarId='primary', body=event).execute()
print('Created event:', created.get('htmlLink'))