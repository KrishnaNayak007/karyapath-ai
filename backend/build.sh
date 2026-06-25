#!/usr/bin/env bash
# exit on error
set -o errexit

# Force pip to install everything inside the Poetry virtualenv
poetry run pip install -r requirements.txt

# Run Django commands inside the Poetry virtualenv
poetry run python manage.py collectstatic --no-input
poetry run python manage.py migrate