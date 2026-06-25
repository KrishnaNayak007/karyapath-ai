import os
from dotenv import load_dotenv
load_dotenv()
print("Key loaded:", bool(os.environ.get("GEMINI_API_KEY")))

from core.gemini_client import breakdown_goal
result = breakdown_goal("Complete React project", "2026-06-29T18:00:00")
print(result)