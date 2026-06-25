import requests
response = requests.get(
    "http://localhost:8000/api/dashboard/",
    auth=("admin", "krishn@y@k070327"),
)
print(response.status_code)
print(response.text)