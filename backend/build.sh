#!/usr/bin/env bash
# exit on error
set -o errexit

# Install requirements directly into the active virtual environment created by Render (located one directory up)
/opt/render/project/src/.venv/bin/pip install -r requirements.txt

# Run Django commands using the virtual environment's python interpreter
/opt/render/project/src/.venv/bin/python manage.py collectstatic --no-input
/opt/render/project/src/.venv/bin/python manage.py migrate