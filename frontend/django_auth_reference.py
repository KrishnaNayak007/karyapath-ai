"""
Django Authentication Reference Endpoint for KaryaPath AI
This reference file demonstrates how to implement the Google ID token verification
and user session initialization inside a Django REST Framework or standard Django view.

To use this, install Google Auth library:
    pip install google-auth requests
"""

import json
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.contrib.auth import login as auth_login

User = get_user_model()

@csrf_exempt
def google_verify_endpoint(request):
    """
    POST /api/auth/google-verify/
    Verifies the Google Identity Services ID token, creates/fetches the user,
    and starts a secure Django session.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
        credential = data.get('credential')
    except (ValueError, KeyError, AttributeError):
        return JsonResponse({'error': 'Invalid JSON request payload.'}, status=400)

    if not credential:
        return JsonResponse({'error': 'Google token credential is required.'}, status=400)

    # Method 1: Verify using requests against Google's tokeninfo API (hackathon & lightweight friendly)
    try:
        tokeninfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
        response = requests.get(tokeninfo_url, timeout=10)
        
        if not response.ok:
            return JsonResponse({
                'error': 'Failed to verify token with Google.',
                'details': response.text
            }, status=401)
            
        payload = response.json()
        
        # Validate audience & issuer if client_id is set
        # client_id = "YOUR_GOOGLE_CLIENT_ID"
        # if payload.get('aud') != client_id:
        #     return JsonResponse({'error': 'Audience mismatch.'}, status=403)

        email = payload.get('email')
        name = payload.get('name', email.split('@')[0])
        picture = payload.get('picture', '')
        google_id = payload.get('sub')

        if not email:
            return JsonResponse({'error': 'Email address not provided in token.'}, status=400)

        # Create or fetch user in Django DB
        # Assuming you have a custom user model or use the default one.
        # You can map standard fields or add custom fields for picture and google_id.
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,  # Or a generated username
                'first_name': name.split(' ')[0] if ' ' in name else name,
                'last_name': name.split(' ')[1] if ' ' in name else '',
            }
        )

        # Log user into Django Session
        auth_login(request, user)

        # Customize user info response
        return JsonResponse({
            'success': True,
            'user': {
                'email': user.email,
                'name': name,
                'avatarUrl': picture or 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80',
            }
        })

    except requests.RequestException as e:
        return JsonResponse({
            'error': 'Network connection issue during token verification.',
            'details': str(e)
        }, status=503)
    except Exception as e:
        return JsonResponse({
            'error': 'An unexpected authentication error occurred.',
            'details': str(e)
        }, status=500)
