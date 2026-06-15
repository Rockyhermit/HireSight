# 🌐 HireSight

**An AI-powered job application tracker that helps you manage your job search, analyze your resume, and stay ahead in the hiring process.**

---

## Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Getting Started](#getting-started)
* [Running the App](#running-the-app)
* [Chrome Extension](#chrome-extension)
* [API Reference](#api-reference)
* [Environment Variables](#environment-variables)
* [Docker Setup](#docker-setup)
* [Testing](#testing)

---

## Overview

HireSight is a full-stack web application built as a Software Development Engineering portfolio project. It combines job application tracking with AI-powered resume analysis — giving users actionable feedback on how well their resume matches a given job description, along with ATS tips, keyword gaps, and a rewritten summary.

The project also includes a **Chrome Extension** (HireSight Clipper) that lets users save job listings directly from LinkedIn, Indeed, and other job boards into their HireSight dashboard with a single click.

---

## Features

*   **User Authentication** — Secure registration and login using JWT tokens
*   **Job Application Tracking** — Add, view, and manage all your job applications in one place
*   **Resume Upload** — Upload your resume directly against any job listing
*   **AI Resume Analysis** — Powered by Llama 3.3 70B via Groq API. Provides a match score, identifies missing keywords and skill gaps, suggests improvements, offers ATS optimization tips, and generates a rewritten professional summary
*   **Visual Analytics** — Radar chart breakdown of your resume's match across multiple dimensions
*   **Chrome Extension** — Save job listings from LinkedIn, Indeed, and more without leaving the page
*   **Dockerized Deployment** — Full containerization with Docker Compose

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI (Python 3.11) |
| **Database** | PostgreSQL 17 |
| **ORM** | SQLAlchemy 2.0 |
| **AI Model** | Llama 3.3 70B Versatile (via Groq API) |
| **Authentication** | JWT — python-jose + passlib/bcrypt |
| **Frontend** | React (Create React App) |
| **Browser Extension** | Chrome Extension (Manifest V3) |
| **Containerization** | Docker + Docker Compose |

---

## Project Structure

```text
hiresight/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── jobs.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   ├── ai_engine.py
│   │   └── main.py
│   ├── tests/
│   │   └── test_ai.py
│   ├── venv/
│   ├── .env
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   └── JobDetail.js
│   │   ├── components/
│   │   │   └── Sidebar.js
│   │   └── services/
│   │       └── api.js
│   └── package.json
├── extension/
│   ├── manifest.json
│   ├── content.js
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

*   Python 3.11+
*   Node.js 18+
*   PostgreSQL 17
*   Google Chrome (for the extension)
*   A free [Groq API key](https://console.groq.com/)

### 1. Clone the repository

```bash
git clone https://github.com/Rockyhermit/hiresight.git
cd hiresight
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file inside the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1
DATABASE_URL=postgresql://hiresight_user:your_password@localhost:5432/jobtracker
SECRET_KEY=your_jwt_secret_key
```

See the [Environment Variables](#environment-variables) section for full details.

### 4. Set up the database

```sql
-- Run in psql as the postgres superuser
CREATE DATABASE jobtracker;
CREATE USER hiresight_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE jobtracker TO hiresight_user;
```

### 5. Set up the frontend

```bash
cd frontend
npm install
```

---

## Running the App

### Start the backend

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

> **Note:** The API will be available at `http://127.0.0.1:8000` and Swagger docs at `http://127.0.0.1:8000/docs`.

### Start the frontend

```bash
cd frontend
npm start
```

> **Note:** The app will open at `http://localhost:3000`.

---

## Chrome Extension

The **HireSight Clipper** extension lets you save jobs from LinkedIn, Indeed, and other job boards directly to your dashboard.

### Loading the extension (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project

### Usage

1. Browse to any job listing (LinkedIn, Indeed, etc.)
2. Click the HireSight Clipper icon in your Chrome toolbar
3. Log in with your HireSight credentials
4. Click **Save Job** — the listing is instantly added to your dashboard

---

## API Reference

The full interactive API documentation is available at `http://127.0.0.1:8000/docs` when the backend is running.

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| **POST** | `/auth/register` | Register a new user |
| **POST** | `/auth/login` | Login and receive a JWT token |
| **GET** | `/jobs/` | List all job applications |
| **POST** | `/jobs/` | Create a new job application |
| **GET** | `/jobs/{id}` | Get a specific job application |
| **POST** | `/jobs/{id}/upload-resume` | Upload a resume for a job |
| **GET** | `/jobs/{id}/analysis` | Get AI analysis results |

> **Important:** All protected endpoints require an `Authorization: Bearer <token>` header.

---

## Environment Variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Your Groq API key for AI analysis |
| `GROQ_BASE_URL` | Groq API base URL (`https://api.groq.com/openai/v1`) |
| `DATABASE_URL` | Full PostgreSQL connection string |
| `SECRET_KEY` | Secret key used for signing JWT tokens |

---

## Docker Setup

The entire application stack can be run with a single command using Docker Compose.

### Prerequisites

*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Start all services

```bash
docker-compose up --build
```

This will spin up:
*   The **FastAPI backend** on port `8000`
*   The **React frontend** on port `3000`
*   A **PostgreSQL** database on port `5432`

### Stop all services

```bash
docker-compose down
```

To also remove the database volume:

```bash
docker-compose down -v
```

---

## Testing

```bash
cd backend
venv\Scripts\activate
pytest tests/
```

The test suite covers AI engine behavior and key API endpoints.
