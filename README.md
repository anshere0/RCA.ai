# RCA Copilot

> AI-Powered Root Cause Analysis for Modern Engineering Teams

RCA Copilot is an intelligent incident investigation platform designed to help engineers identify, understand, and document production failures faster. Instead of manually searching through logs and piecing together timelines, engineers can upload logs, describe an incident, and receive a structured Root Cause Analysis (RCA) report within seconds.

---

## Problem Statement

When production incidents occur, engineering teams often spend hours:

* Searching through thousands of log lines
* Identifying failure patterns
* Correlating events across services
* Understanding impact and blast radius
* Creating post-incident RCA reports manually

This process is repetitive, time-consuming, and slows down incident resolution.

RCA Copilot automates the investigation workflow and transforms raw incident data into actionable insights.

---

## Features

### Incident Investigation

* Incident description input
* Severity classification (P0, P1, P2, P3)
* Service-specific investigations
* GitHub repository context support

### Log Analysis

* Log file upload
* Automated parsing
* Error extraction
* Timeline reconstruction
* Failure event detection

### AI-Powered RCA Generation

* Root cause identification
* Confidence scoring
* Incident summarization
* Evidence-based reasoning

### Blast Radius Analysis

* Affected users estimation
* Impact duration analysis
* Impacted services identification

### Action Item Generation

* Prevention recommendations
* Ownership assignment
* Priority classification
* Post-incident improvement suggestions

### Reporting

* Structured RCA reports
* Markdown export
* Historical incident tracking

---

## Example Workflow

```text
Incident Alert
      ↓
Upload Logs
      ↓
Log Parsing
      ↓
Anomaly Detection
      ↓
Timeline Reconstruction
      ↓
AI Reasoning
      ↓
Root Cause Identification
      ↓
Blast Radius Analysis
      ↓
Action Items Generation
      ↓
Structured RCA Report
```

---

## Example Incident

### Input

```text
Web application experiencing severe slowdowns and deadlock errors due to cache service disconnection.
```

### Output

#### Root Cause

```text
Cache service disconnection caused a cascade of failures.
```

#### Timeline

```text
18:54 Redis connection lost

18:55 Connection timeout and MAX_RETRY_EXCEEDED

18:55 Cache-service connection failed, falling back to direct DB queries

18:55 Database deadlock detected under high traffic volume
```

#### Impact

```text
Affected Users: All Users

Duration: 10 Minutes

Services Impacted:
- Cache Service
- Web Application
```

#### Recommended Actions

```text
1. Investigate Redis connection stability
2. Optimize database queries during cache fallback
3. Improve retry handling mechanisms
4. Add monitoring for cache health checks
```

---

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

### Backend

* Node.js
* Express.js
* Prisma ORM

### Database

* PostgreSQL

### AI Layer

* OpenAI API
* Structured Prompt Engineering

### Deployment

* Vercel (Frontend)
* Railway / Render (Backend)

---

## Architecture

```text
┌──────────────────────┐
│      Frontend        │
│      Next.js         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      API Layer       │
│     Express.js       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Incident Processor  │
├──────────────────────┤
│ Log Parser           │
│ Anomaly Detector     │
│ Timeline Builder     │
│ AI Reasoning Engine  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    PostgreSQL DB     │
└──────────────────────┘
```

---

## Project Structure

```bash
rca-copilot/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── utils/
│   │   └── middleware/
│   │
│   ├── prisma/
│   └── uploads/
│
└── README.md
```

---

## Future Improvements

* GitHub deployment correlation
* Prometheus metrics integration
* Elasticsearch log ingestion
* PagerDuty integration
* Slack notifications
* Jira ticket generation
* Similar incident retrieval
* Vector database powered knowledge base
* Multi-service dependency analysis

---

## Key Learnings

This project provided hands-on experience with:

* AI-powered reasoning systems
* Incident management workflows
* Log analysis and observability
* Root Cause Analysis methodologies
* Full-stack application development
* Product design and engineering

---

## Why RCA Copilot?

Engineering teams should spend less time searching for failures and more time solving them.

RCA Copilot helps transform incident investigation from a manual process into an intelligent, AI-assisted workflow that delivers faster insights, better documentation, and improved reliability.

---

### Author

**Ansh Arora**

B.Tech CSE (AI & ML) | Full Stack & AI Developer

GitHub: `https://github.com/anshere0`

LinkedIn: `https://linkedin.com/in/ansharora` *(replace with your actual profile URL)*

---

⭐ If you found this project interesting, consider starring the repository and sharing feedback.
