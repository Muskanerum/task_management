# Production image (used by Hugging Face Spaces / Render).
# Stage 1 builds the React app, stage 2 runs Django and serves
# both the API and the built frontend from one URL.

# ---------- Stage 1: build React ----------
FROM node:22 AS frontend

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./

RUN npm ci

COPY frontend/ .

# Same server, so the API is just /api/tasks/
ENV VITE_API_URL=/api/tasks/

RUN npm run build


# ---------- Stage 2: Django ----------
FROM python:3.14

ENV PYTHONUNBUFFERED=1

# Hugging Face runs the container as user ID 1000
RUN useradd -m -u 1000 user

WORKDIR /app

COPY backend/requirements.txt .

RUN pip install -r requirements.txt

COPY --chown=user backend/ .

COPY --chown=user --from=frontend /frontend/dist ./frontend_dist

RUN python manage.py collectstatic --noinput

USER user

ENV HOME=/home/user

# Hugging Face uses port 7860, Render provides $PORT
EXPOSE 7860

CMD ["sh", "-c", "python manage.py migrate && python manage.py seed_tasks && gunicorn config.wsgi --bind 0.0.0.0:${PORT:-7860}"]
