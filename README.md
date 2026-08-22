# 🎙️ VocalLabs — AI Voice Meeting & Autonomous Commitment Verification Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF6F00.svg?style=flat&logo=langchain&logoColor=white)](https://github.com/langchain-ai/langgraph)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC-FF4088.svg?style=flat&logo=livekit&logoColor=white)](https://livekit.io)
[![Whisper](https://img.shields.io/badge/OpenAI-Whisper_STT-412991.svg?style=flat&logo=openai&logoColor=white)](https://github.com/openai/whisper)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

> **VocalLabs** is an end-to-end intelligent voice collaboration workspace. It pairs real-time WebRTC audio rooms and speech-to-text transcription with autonomous **LangGraph AI agents** that extract actionable commitments from meetings and automatically verify follow-through across developer workflows (e.g., GitHub pull requests and issues).

> [!TIP]
> 📄 **Company Evaluators & Judges**: Check out the comprehensive **[Project & Hackathon Submission Documentation](file:///c:/Users/asus/OneDrive/Desktop/vocab/PROJECT_DOCUMENTATION.md)** for deep-dive technical architecture, business impact, database schemas, and AI agent workflow design.

---

## 📑 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Key Features](#-key-features)
- [System Architecture Diagram](#-system-architecture-diagram)
- [Repository Structure](#-repository-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
  - [1. Backend Setup (FastAPI + LangGraph + Whisper)](#1-backend-setup-fastapi--langgraph--whisper)
  - [2. Frontend Setup (React 19 + TanStack + Tailwind)](#2-frontend-setup-react-19--tanstack--tailwind)
- [AI Multi-Agent Workflows](#-ai-multi-agent-workflows)
  - [Commitment Extraction Agent](#1-commitment-extraction-agent)
  - [Verification Agent (GitHub Search)](#2-verification-agent-github-search)
- [API Reference](#-api-reference)
- [Environment Variables Reference](#-environment-variables-reference)
- [Testing & Agent Verification](#-testing--agent-verification)
- [License & Authors](#-license--authors)

---

## 🌟 Overview & Architecture

Modern teams lose track of decisions and promises made during fast-paced voice standups and strategy meetings. **VocalLabs** solves this by:

1. **Hosting Real-Time Audio Rooms**: Seamless WebRTC audio powered by LiveKit with automatic speech detection.
2. **High-Accuracy Speech Transcription**: Instant speech-to-text powered by local or remote OpenAI Whisper with timestamped segments.
3. **Automated Commitment Extraction**: LangGraph state graph agent parses transcripts to extract action items, owners, context, and deadlines with confidence metrics.
4. **Autonomous Follow-Through Verification**: A ReAct-based LangGraph agent searches code repositories (GitHub PRs, issues, commits) to verify whether promised tasks have been completed.
5. **Interactive Operations Dashboard**: High-fidelity UI with metrics, interactive follow-through pipelines, team group workspaces, and live transcript visualizers.

---

## 🏗️ System Architecture Diagrams

### Component & Integration Topology

<div align="center">
  <img src="https://assets.aaryank.me/arh.drawio.png" alt="System Component & Integration Topology" width="800" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin: 16px 0;" />
</div>

### End-to-End Multi-Agent Execution Flowchart

<div align="center">
  <img src="https://assets.aaryank.me/729dfc41-a9c7-47a3-80fb-f52de73c384b.jpeg" alt="End-to-End Multi-Agent Execution Flowchart" width="480" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin: 16px 0;" />
</div>

---

## ✨ Key Features

- **🔴 Live WebRTC Voice Rooms**: Low-latency audio rooms with automatic token negotiation via LiveKit.
- **📁 Audio File Processing**: Support for uploading pre-recorded `.mp3`, `.wav`, `.mp4`, `.mkv`, and `.webm` files.
- **🎯 Precise Timestamped Transcripts**: Full transcript generation partitioned into sequence-indexed time segments.
- **🧠 LangGraph State Graph Agent**: Multi-node pipeline (`preprocess` → `extract` → `format`) capable of structured JSON commitment extraction with heuristic fallback.
- **🔍 Automated GitHub Verification**: Query GitHub for linked PRs, merged code, and closed issues to score commitment completion.
- **👥 Team Workspaces & Groups**: Group creation, email invitations, and membership tracking.
- **📊 Follow-Through Pipeline & Metrics**: Interactive kanban-style pipeline displaying commitments in `pending`, `in_progress`, `completed`, and `needs_review` states.
- **🛡️ Secure Token Authentication**: Google OAuth 2.0 and Supabase authentication integration.

---

## 📁 Repository Structure

```
vocab/
├── vocallabs-backend/              # Python FastAPI Backend & AI Agents
│   ├── app/
│   │   ├── agents/                 # LangGraph Multi-Agent Systems
│   │   │   ├── commitment/         # Commitment extraction graph & schemas
│   │   │   ├── verification/       # ReAct verification graph & GitHub tools
│   │   │   └── commitment_agent.py # Standalone runner & DB persistence
│   │   ├── api/                    # API routes & endpoint definitions
│   │   │   ├── endpoints/          # Route handlers: health, meetings, commitments, transcripts
│   │   │   └── router.py           # Combined API router (/api/v1)
│   │   ├── db/                     # SQLAlchemy models, sessions & engine
│   │   ├── integrations/           # Third-party integrations (GitHub API client)
│   │   ├── models/                 # ORM DB schemas (Commitments, Meetings, Verification)
│   │   ├── schemas/                # Pydantic request/response validation
│   │   ├── services/               # DB query utilities & Whisper transcription service
│   │   └── main.py                 # FastAPI application factory & CORS setup
│   ├── main.py                     # Entry point for uvicorn server
│   ├── pyproject.toml              # Python project metadata
│   ├── requirements.txt            # Python dependencies
│   ├── test_commitment_agent.py   # Agent test harness for extraction
│   └── test_verification_agent.py # Agent test harness for verification
│
└── vocallabs-frontend/             # React 19 + TanStack + Vite SPA
    ├── src/
    │   ├── components/             # Reusable UI component library
    │   │   ├── activity/           # Activity timeline components
    │   │   ├── commitments/        # Commitments workspace & drawer
    │   │   ├── dashboard/          # Metrics, Hero & Pipeline views
    │   │   ├── groups/             # Group switcher & invitation modals
    │   │   ├── layout/             # AppLayout, Sidebar & TopBar
    │   │   ├── meetings/           # LiveAudioRoom, MeetingsList, Transcripts
    │   │   └── ui/                 # Radix UI primitives
    │   ├── lib/                    # API client, auth & Supabase helpers
    │   ├── pages/                  # Page containers (Dashboard, Login, Signup)
    │   ├── routes/                 # TanStack file-based routing
    │   └── styles.css              # Tailwind CSS styles & design tokens
    ├── package.json                # Node dependencies and scripts
    └── vite.config.ts              # Vite configuration
```

---

## ⚙️ Prerequisites

Before running the project locally, ensure you have the following installed:

- **Python**: `3.10` or higher (`3.11` / `3.12` / `3.13` recommended)
- **Node.js**: `v18.0.0` or higher (`v20+` LTS recommended) & `npm` / `pnpm`
- **PostgreSQL**: Local instance or remote database (e.g. Supabase, Neon, AWS RDS)
- **FFmpeg**: Required if using local Whisper for audio decoding (`ffmpeg` on system PATH)
- **OpenAI API Key**: For GPT-4o / GPT-4o-mini commitment analysis
- **GitHub Personal Access Token**: (Optional) For GitHub verification agent searches

---

## 🚀 Quick Start Guide

### 1. Backend Setup (FastAPI + LangGraph + Whisper)

1. **Navigate to the backend directory**:
   ```bash
   cd vocallabs-backend
   ```

2. **Create and activate a Python virtual environment**:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Create a `.env` file in `vocallabs-backend/`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vocallabs
   OPENAI_API_KEY=sk-proj-your-openai-api-key
   LLM_MODEL=gpt-4o-mini
   GITHUB_TOKEN=ghp_your_github_token
   LOCAL_WHISPER_MODEL=small
   HOST=0.0.0.0
   PORT=8000
   ```

5. **Start the FastAPI Server**:
   ```bash
   python main.py
   ```
   *The backend will start at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.*

---

### 2. Frontend Setup (React 19 + TanStack + Tailwind)

1. **Navigate to the frontend directory**:
   ```bash
   cd vocallabs-frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in `vocallabs-frontend/`:
   ```env
   # Backend API Endpoint
   VITE_FASTAPI_BACKEND_URL=http://localhost:8000

   # LiveKit WebRTC Cloud
   VITE_LIVEKIT_URL=wss://your-livekit-domain.livekit.cloud

   # Google OAuth 2.0 (Optional)
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_SECRET=your-client-secret
   VITE_GOOGLE_CALLBACK_URL=http://localhost:8080/auth/callback
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   *The frontend dashboard will be available at `http://localhost:5173` or `http://localhost:8080`.*

---

## 🤖 AI Multi-Agent Workflows

### 1. Commitment Extraction Agent
The Commitment Extraction Agent processes meeting transcripts through a compiled **LangGraph `StateGraph`**:

```
[Entry: preprocess] ──► [extract (ChatOpenAI / Heuristics)] ──► [format] ──► [Persist to Postgres & Log Run]
```

- **`preprocess`**: Normalizes transcript text and timestamps from segment payloads.
- **`extract`**: Prompts the LLM with structured schemas (`title`, `description`, `deadline`, `extraction_confidence`). If API limits are reached or LLM is offline, a heuristic pattern extractor guarantees commitment capture.
- **`format`**: Validates fields, associates the `meeting_id`, and writes records to the `commitments` and `agent_runs` database tables.

### 2. Verification Agent (GitHub Search)
The Verification Agent is a stateful LangGraph agent equipped with tool execution nodes:

```
[Agent Reasoner] ◄─── (Tool Calls) ───► [ToolNode (search_github, get_commitment)]
       │
       ▼ (Verification Complete / Max Steps Reached)
  [Output Verdict & Evidence]
```

- **`get_commitment`**: Retrieves the target commitment task, assignee, and contextual metadata.
- **`search_github`**: Queries GitHub issues and PRs matching the commit message or task keywords.
- **Verdict & Scoring**: Computes a follow-through verification confidence score and logs evidence records in PostgreSQL.

---

## 📡 API Reference

### Core Endpoints

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API status and root routing metadata |
| `GET` | `/api/v1/health` | Healthcheck (PostgreSQL connectivity & Whisper STT status) |
| `POST`| `/meetings` or `/meetings/transcribe` | Upload audio file (`multipart/form-data`) & run Whisper STT |
| `GET` | `/meetings/{meeting_id}` | Retrieve meeting metadata |
| `GET` | `/api/v1/transcripts/meeting/{meeting_id}` | Retrieve transcript and all timestamped segments |
| `POST`| `/commitments/analyze` | Trigger LangGraph Commitment Extraction on a meeting |
| `GET` | `/commitments/meeting/{meeting_id}` | List extracted commitments for a meeting |
| `POST`| `/commitments/{commitment_id}/verify` | Run LangGraph Verification Agent on a commitment |

*Complete interactive schema definitions and playground are accessible at `/docs`.*

---

## 🔐 Environment Variables Reference

### Backend (`vocallabs-backend/.env`)

| Variable | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `string` | PostgreSQL connection URI | `postgresql://postgres:postgres@localhost:5432/vocallabs` |
| `HOST` | `string` | Bind host address | `0.0.0.0` |
| `PORT` | `integer`| Bind port | `8000` |
| `OPENAI_API_KEY` | `string` | OpenAI API key for LLM and Whisper | — |
| `OPENAI_BASE_URL`| `string` | Custom OpenAI base URL (optional) | — |
| `LLM_MODEL` | `string` | Model used for extraction and verification | `gpt-4o-mini` |
| `GITHUB_TOKEN` | `string` | GitHub Personal Access Token for PR search | — |
| `LOCAL_WHISPER_MODEL` | `string` | Whisper model size (`tiny`, `base`, `small`, `medium`, `large`) | `small` |
| `LIVEKIT_URL` | `string` | LiveKit Server / Cloud URL | — |
| `LIVEKIT_API_KEY` | `string` | LiveKit API Key | — |
| `LIVEKIT_API_SECRET` | `string` | LiveKit API Secret | — |

### Frontend (`vocallabs-frontend/.env`)

| Variable | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `VITE_FASTAPI_BACKEND_URL` | `string` | FastAPI backend URL | `http://localhost:8000` |
| `VITE_LIVEKIT_URL` | `string` | LiveKit WebRTC Cloud URL | — |
| `VITE_GOOGLE_CLIENT_ID` | `string` | Google OAuth Client ID | — |
| `VITE_GOOGLE_CLIENT_SECRET` | `string` | Google OAuth Client Secret | — |
| `VITE_GOOGLE_CALLBACK_URL` | `string` | Google OAuth Callback URL | `http://localhost:8080/auth/callback` |

---

## 🧪 Testing & Agent Verification

Test scripts are provided in `vocallabs-backend` to test individual agent graphs without starting the frontend:

### Test Commitment Extraction Agent
```bash
cd vocallabs-backend
python test_commitment_agent.py
```
*Extracts commitments from sample transcripts and asserts database insertion.*

### Test Verification Agent with GitHub Search
```bash
cd vocallabs-backend
python test_verification_agent.py
```
*Simulates agent execution searching GitHub for issue/PR evidence and returns the agent's trajectory.*

---

## 👥 Authors & Contributing

- **Lead Developer**: Aaryan Kumar ([@aaryanaks3](mailto:aaryanaks3@gmail.com))
- Contributions, bug reports, and feature suggestions are welcome. Please open an issue or pull request!

---

<div align="center">
  <sub>Built with ❤️ by the VocalLabs Team. Powered by FastAPI, React, and LangGraph.</sub>
</div>
