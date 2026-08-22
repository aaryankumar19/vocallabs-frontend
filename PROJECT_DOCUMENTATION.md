# 📄 VocalLabs — Technical Architecture & Hackathon Submission Document

**Project Name**: VocalLabs (AI-Powered Voice Intelligence & Autonomous Commitment Verification)  
**Hackathon Track**: Generative AI, Multi-Agent Systems & Enterprise Productivity  
**Target Submission**: Placement Drive / Technical Evaluation  
**Author / Candidate**: Aaryan Kumar, Amit Krishna, Arif Khan ([@aaryanaks3](mailto:aaryanaks3@gmail.com))  
**Date**: August 2026  

---

## 📑 Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Business Impact](#2-problem-statement--business-impact)
3. [Proposed Solution & Core Value Proposition](#3-proposed-solution--core-value-proposition)
4. [System Design & Architecture](#4-system-design--architecture)
5. [Deep Dive: AI Multi-Agent Workflows](#5-deep-dive-ai-multi-agent-workflows)
   - [5.1 Agent 1: Commitment Extraction Engine](#51-agent-1-commitment-extraction-engine)
   - [5.2 Overdue & Deadline Management](#52-overdue--deadline-management)
   - [5.3 Agent 2: Autonomous Verification Engine](#53-agent-2-autonomous-verification-engine)
6. [Data Architecture & Database Schemas](#6-data-architecture--database-schemas)
7. [Technology Stack & Architectural Rationale](#7-technology-stack--architectural-rationale)
8. [API Specifications & Contracts](#8-api-specifications--contracts)
9. [Security, Performance & Scalability](#9-security-performance--scalability)
10. [Evaluator & Demo Quickstart Guide](#10-evaluator--demo-quickstart-guide)
11. [Future Roadmap](#11-future-roadmap)

---

## 1. Executive Summary

In fast-paced engineering organizations, over **70% of actionable decisions and verbal commitments** made in voice meetings (standups, sprint plannings, architecture reviews) fail to translate into tracked tasks in project management tools. This disconnect causes missed deadlines, untracked blocker dependencies, and costly miscommunications.

**VocalLabs** is an enterprise-grade, autonomous meeting intelligence platform designed to bridge this gap. VocalLabs combines **LiveKit WebRTC real-time audio rooms**, **OpenAI Whisper speech-to-text**, and **LangGraph Multi-Agent architectures** to:
1. Capture real-time or recorded meeting conversations.
2. Automatically extract structured action items, owners, and deadlines.
3. Autonomously verify whether engineers have completed their commitments by querying external developer systems (e.g., GitHub pull requests and issues).

---

## 2. Problem Statement & Business Impact

| Bottleneck | Traditional Industry Workflow | VocalLabs Solution |
| :--- | :--- | :--- |
| **Manual Note Taking** | Developers take partial notes or forget key deliverables. | Automated, multi-lingual Whisper transcription with timestamped segments. |
| **Commitment Loss** | "I will fix the auth bug by Friday" is forgotten after the call. | LangGraph Agent 1 detects commitments, assigning owners and deadlines. |
| **Manual Follow-Ups** | Project managers spend hours asking "Is this done yet?" | LangGraph Agent 2 cross-references code repositories and GitHub PRs autonomously. |
| **Accountability** | Status updates rely on subjective self-reporting. | Objective confidence scoring and evidence-backed completion verification. |

---

## 3. Proposed Solution & Core Value Proposition

VocalLabs provides an autonomous loop from spoken words to verified code delivery:

1. **Ingest**: Live WebRTC voice meetings or audio file uploads (`.mp3`, `.wav`, `.mp4`).
2. **Transcribe**: Converts speech to clean text partitioned into temporal segments.
3. **Extract (Agent 1)**: Analyzes conversational context to detect commitments, identify assignees, and extract deadlines.
4. **Monitor**: Tracks active commitments against timeline deadlines.
5. **Verify (Agent 2)**: Searches developer tools (GitHub issues, commits, and pull requests) to gather evidence and evaluate status.
6. **Classify & Report**: Categorizes each deliverable into `Completed`, `To be Reviewed`, or `At Risk` with evidence links and audit logs.

---

## 4. System Design & Architecture

### 4.1 System Component & Integration Topology

<div align="center">
  <img src="https://assets.aaryank.me/arh.drawio.png" alt="System Component & Integration Topology" width="800" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin: 16px 0;" />
</div>

### 4.2 End-to-End Multi-Agent Execution Flowchart

<div align="center">
  <img src="https://assets.aaryank.me/729dfc41-a9c7-47a3-80fb-f52de73c384b.jpeg" alt="End-to-End Multi-Agent Execution Flowchart" width="480" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin: 16px 0;" />
</div>

---

## 5. Deep Dive: AI Multi-Agent Workflows

VocalLabs adopts a **decoupled, multi-agent architecture** built on **LangGraph**:

### 5.1 Agent 1: Commitment Extraction Engine

Agent 1 transforms unstructured meeting dialogue into structured relational entities.

```
[Raw Transcript Segments]
          │
          ▼
   ┌──────────────┐
   │  preprocess  │  -> Concatenates & sanitizes segment timestamps
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   extract    │  -> LLM Structured JSON Extraction (with Heuristic Fallback)
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │    format    │  -> Schema normalization & PostgreSQL batch insertion
   └──────────────┘
```

- **Extraction Schema**:
  ```json
  {
    "title": "Fix authentication token expiry bug",
    "description": "Owner: Aaryan | Deadline: Friday",
    "owner": "Aaryan",
    "deadline": "2026-08-28T18:00:00Z",
    "extraction_confidence": 0.95
  }
  ```
- **Fault-Tolerant Heuristic Fallback**: In the event of API rate limits or offline modes, a regex-based linguistic heuristic engine analyzes modality verbs (*will, shall, promise, agree, submit, fix*) to ensure 0% data loss.

---

### 5.2 Overdue & Deadline Management

Every commitment record in PostgreSQL maintains:
- `created_at`: Timestamp when the commitment was voiced.
- `deadline`: Absolute target datetime or relative semantic target.
- `status`: Lifecycle state (`pending`, `in_progress`, `completed`, `at_risk`, `needs_review`).

Background scheduling cycles monitor commitments approaching deadlines and automatically trigger Agent 2 for proactive follow-through verification.

---

### 5.3 Agent 2: Autonomous Verification Engine

Agent 2 is a stateful **ReAct (Reasoning + Acting)** agent implemented with LangGraph and Tool Nodes.

```
  ┌──────────────────────────────────────────────────────────┐
  │                    Agent Reasoner Node                   │
  └──────────────┬────────────────────────────▲──────────────┘
                 │ (Tool Calls)               │ (Tool Results)
                 ▼                            │
  ┌───────────────────────────────────────────┴──────────────┐
  │                      Tool Execution Node                 │
  │  1. get_commitment(commitment_id)                        │
  │  2. search_github(query, user, state)                    │
  └──────────────────────────────────────────────────────────┘
```

1. **Step 1: Context Retrieval (`get_commitment`)**: Fetches the original commitment title, assignee name, and context.
2. **Step 2: External Investigation (`search_github`)**: Searches connected GitHub repositories for PRs, commit messages, and issue resolutions mentioning the feature or author.
3. **Step 3: Evaluation & Evidence Aggregation**: Compares PR status (merged, open, draft) against the commitment scope.
4. **Step 4: Classification**:
   - **`Completed`**: Merged PR or closed issue found matching the deliverable.
   - **`To be Reviewed`**: Open PR exists or partial matches found with confidence `0.50 - 0.79`.
   - **`At Risk`**: No evidence found and current time is past or nearing deadline.

---

## 6. Data Architecture & Database Schemas

The database schema is implemented in **PostgreSQL 15+** with relational integrity and cascade rules:

```
 ┌──────────────┐         ┌────────────────────┐
 │   meetings   │1───────*│   meeting_files    │
 └──────┬───────┘         └────────────────────┘
        │1
        ├─────────────────┐
        │1                │1
 ┌──────▼───────┐  ┌──────▼───────┐
 │ transcripts  │  │ commitments  │1───────*┌──────────────────┐
 └──────┬───────┘  └──────┬───────┘         │verification_runs │
        │1                │1                └────────┬─────────┘
 ┌──────▼───────────┐     │                          │1
 │transcript_segments│    │                 ┌────────▼─────────┐
 └──────────────────┘     │                 │     evidence     │
                          │                 └──────────────────┘
                          │1
                   ┌──────▼───────┐
                   │  agent_runs  │ (Audit Trail)
                   └──────────────┘
```

### Core Schema Highlights:
- **`meetings`**: Stores meeting metadata, titles, and lifecycle status.
- **`transcripts` & `transcript_segments`**: Stores word/phrase-level timestamps (`start_time_seconds`, `end_time_seconds`, `sequence_number`).
- **`commitments`**: Stores extracted action items, `extraction_confidence`, `verification_confidence`, and deadline.
- **`verification_runs` & `evidence`**: Stores agent reasoning steps, matched GitHub PR URLs, relevance scores, and raw JSON payloads.
- **`agent_runs`**: Enterprise audit logging tracking token usage, latency, model versions, and errors.

---

## 7. Technology Stack & Architectural Rationale

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TanStack Router | Modern component architecture, type-safe routing, ultra-fast client-side transitions. |
| **Styling & UI** | Tailwind CSS v4 + Radix UI | Accessible headless primitives styled with sleek dark-mode glassmorphism. |
| **Real-time Audio** | LiveKit WebRTC Cloud | Sub-100ms ultra-low latency WebRTC voice streaming with tokenized room security. |
| **Backend API** | Python FastAPI + Uvicorn | High-throughput asynchronous REST server with native Pydantic OpenAPI docs. |
| **AI Multi-Agent** | LangGraph + LangChain | Deterministic state transitions, cycle support for tool loops, checkpointing, and auditability. |
| **Speech-to-Text** | OpenAI Whisper | Industry-leading word accuracy and multi-lingual audio transcription. |
| **Database** | PostgreSQL + SQLAlchemy ORM | ACID-compliant relational persistence with UUID indexing and JSONB evidence support. |

---

## 8. API Specifications & Contracts

Interactive Swagger API documentation is available at `/docs`. Key contracts include:

### 1. Audio Processing & Transcription
- `POST /meetings` (or `POST /api/v1/meetings/transcribe`)
  - **Payload**: `multipart/form-data` (`file: UploadFile`, `title: string`, `model: string`)
  - **Response**: `201 Created` with `meeting_id`, `transcript_id`, `language`, and `segments[]`.

### 2. Multi-Agent Commitment Extraction
- `POST /commitments/analyze`
  - **Payload**: `{"meeting_id": "uuid"}`
  - **Process**: Executes LangGraph Commitment Extraction Graph.
  - **Response**: `200 OK` with extracted commitment objects and database IDs.

### 3. Autonomous Verification
- `POST /commitments/{commitment_id}/verify`
  - **Process**: Executes LangGraph Verification ReAct Agent with GitHub tools.
  - **Response**: `200 OK` with verification reasoning, evidence URLs, and updated status.

### 4. Health & Subsystem Telemetry
- `GET /api/v1/health`
  - **Response**: Database connection status and Whisper STT engine availability.

---

## 9. Security, Performance & Scalability

1. **Authentication & Access Control**: Support for Google OAuth 2.0 and Supabase authentication tokens passed via `Bearer` and `x-auth-token` headers.
2. **Asynchronous Non-Blocking Execution**: Long-running Whisper model inferencing runs in background executor pools, keeping FastAPI endpoints responsive.
3. **Database Indexing**: Foreign keys, meeting IDs, and transcript sequence numbers are indexed for sub-millisecond retrieval.
4. **Auditability & Observability**: Every LLM execution is persisted in the `agent_runs` table with token consumption telemetry.

---

## 10. Evaluator & Demo Quickstart Guide

To evaluate the platform locally in **under 3 minutes**:

### Step 1: Start Backend
```bash
cd vocallabs-backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1    # or source .venv/bin/activate on Linux/Mac
pip install -r requirements.txt
python main.py
```
*Backend API available at `http://localhost:8000` (Docs: `http://localhost:8000/docs`)*

### Step 2: Start Frontend
```bash
cd vocallabs-frontend
npm install
npm run dev
```
*Frontend interface available at `http://localhost:5173` or `http://localhost:8080`*

### Step 3: Run Standalone Agent Test Suites
```bash
cd vocallabs-backend
# Test Agent 1 (Extraction Graph)
python test_commitment_agent.py

# Test Agent 2 (Verification Graph with GitHub Search)
python test_verification_agent.py
```

---

## 11. Future Roadmap

- **Multi-Platform Verification**: Integrations for Jira, Linear, GitLab, and Slack.
- **Real-Time Mid-Call Alerts**: Live alerts triggered during voice rooms when contradictory commitments are detected.
- **Automated Standup Summaries**: AI-synthesized daily progress reports sent directly to team leads.

---

<div align="center">
  <b>VocalLabs</b> — Transforming Conversations into Verified Engineering Reality.
</div>
