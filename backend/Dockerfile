FROM python:3.12-slim

WORKDIR /srv/app

COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY backend /srv/app/backend
COPY data /srv/app/data

ENV PYTHONPATH=/srv/app

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]

