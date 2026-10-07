---
title: TaskFlow
emoji: ✅
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# TaskFlow – Task Management App

A learning project: a full-stack task manager built with **Django REST Framework**, **PostgreSQL** and **React + TypeScript**, running entirely in **Docker**.

## Tech stack

| Part | Technology | Port |
|---|---|---|
| Frontend | React 19 + TypeScript (Vite) | 5173 |
| Backend API | Django 6 + Django REST Framework | 8000 |
| Database | PostgreSQL 17 | 5432 |

## Run the project

Requirement: [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

Then open:

- App: http://localhost:5173
- API: http://127.0.0.1:8000/api/tasks/
- Django admin: http://127.0.0.1:8000/admin/

On first start the backend runs migrations and loads 7 sample tasks automatically.

To create an admin user:

```bash
docker compose exec backend python manage.py createsuperuser
```

To stop: `docker compose down` (add `-v` to also delete the database data).

## API endpoints

| Method | URL | Action |
|---|---|---|
| GET | `/api/tasks/` | List all tasks |
| POST | `/api/tasks/` | Create a task |
| GET | `/api/tasks/<id>/` | Get one task |
| PUT / PATCH | `/api/tasks/<id>/` | Update a task |
| DELETE | `/api/tasks/<id>/` | Delete a task |

A task has: `title`, `description`, `status` (`todo` / `in_progress` / `completed`), `priority` (`low` / `medium` / `high`), `project`, `due_date`, `created_at`, `updated_at`.

## Features

- Dashboard with progress and statistics
- Create, view, edit, delete tasks and mark them complete
- Search across tasks
- Projects view (tasks grouped by project)
- Calendar view by due date
- Reports (status and priority breakdown, overdue tasks)

## Project structure

```
task_management/
├── docker-compose.yml      # db + backend + frontend services
├── backend/                # Django project
│   ├── config/             # settings, urls
│   └── tasks/              # Task model, serializer, viewset, sample data
└── frontend/               # React + Vite app (src/App.tsx)
```
