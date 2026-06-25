import os
from dotenv import load_dotenv
load_dotenv()

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]

def main():
    client_config = {
        "installed": {
            "client_id": os.environ["GOOGLE_CLIENT_ID"],
            "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }
    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    creds = flow.run_local_server(port=0)

    print("\n--- COPY THIS INTO YOUR .env FILE ---\n")
    print(f"GOOGLE_REFRESH_TOKEN={creds.refresh_token}")
    print("\n---------------------------------------\n")

    if not creds.refresh_token:
        print("WARNING: no refresh_token returned. Go to")
        print("https://myaccount.google.com/permissions, remove access for")
        print("'karyapath', then run this script again.")

if __name__ == "__main__":
    main()