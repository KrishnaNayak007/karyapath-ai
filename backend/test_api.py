import requests

response = requests.post(
    "http://localhost:8000/api/goals/",
    json={"title": "DSA exam prep", "deadline": "2026-06-27T18:00:00"},
    auth=("admin", "krishn@y@k070327"),
)
print(response.status_code)
print(response.text)