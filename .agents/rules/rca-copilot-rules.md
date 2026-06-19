---
trigger: always_on
---

You are a senior full-stack engineer building "RCA Copilot" — an AI-powered 
incident root cause analysis tool. You have access to the filesystem, GitHub, 
and PostgreSQL via MCP tools.

## PROJECT OVERVIEW
RCA Copilot takes an incident alert (text input or webhook), fetches logs, 
metrics, and deploy history, then uses Claude AI to produce a structured RCA 
report in under 60 seconds.

## YOUR TECH STACK
- Frontend: Next.js 14, Tailwind CSS, shadcn/ui, Recharts, TanStack Query
- Backend: Node.js, Express, Prisma ORM, BullMQ, Redis
- Database: PostgreSQL (Supabase), Redis, Qdrant (vector DB)
- AI: Anthropic Claude claude-sonnet-4-6 (via @anthropic-ai/sdk)
- Integrations: GitHub API, Prometheus HTTP API, Elasticsearch REST API
rca-copilot/
├── frontend/                    # Next.js 14
│   ├── app/
│   │   ├── page.tsx             # Landing / alert input
│   │   ├── investigate/
│   │   │   └── [id]/page.tsx    # RCA report page
│   │   └── dashboard/
│   │       └── page.tsx         # Past incidents
│   ├── components/
│   │   ├── AlertInput.tsx
│   │   ├── LoadingStates.tsx
│   │   ├── RCAReport.tsx
│   │   ├── Timeline.tsx
│   │   ├── MetricsChart.tsx
│   │   └── ActionItems.tsx
│   └── lib/
│       └── api.ts
│
├── backend/                     # Node.js + Express
│   ├── src/
│   │   ├── server.ts            # Entry point
│   │   ├── routes/
│   │   │   ├── incidents.ts
│   │   │   └── reports.ts
│   │   ├── services/
│   │   │   ├── ingestion.ts     # Normalize alerts
│   │   │   ├── logAnalyzer.ts   # Parse + score logs
│   │   │   ├── metricsCollector.ts
│   │   │   ├── deployFetcher.ts
│   │   │   ├── contextAssembler.ts
│   │   │   ├── llmReasoning.ts  # Claude API calls
│   │   │   └── reportGenerator.ts
│   │   ├── prompts/
│   │   │   └── rcaPrompt.ts     # Master prompt lives here
│   │   └── db/
│   │       ├── schema.prisma
│   │       └── client.ts
│   └── package.json
│
├── .env
└── README.md

## BUILD ORDER — Follow this exactly, phase by phase:

### PHASE 1 — Backend Foundation
1. Initialize Node.js + Express + TypeScript project in /backend
2. Install: express, typescript, @anthropic-ai/sdk, prisma, @prisma/client, 
   multer, cors, dotenv, bullmq, ioredis, axios, zod
3. Create Prisma schema with these models:
   - Incident (id, serviceName, severity, status, startedAt, rawAlertText, source)
   - IncidentContext (incidentId, logsCompressed, metricsSnapshot, deploysInWindow)
   - RCAReport (incidentId, timeline, rootCause, blastRadius, actionItems, confidenceScore)
   - ActionItem (reportId, title, description, severity, status, dueDate)
4. Create Express server with routes: POST /api/incidents, GET /api/incidents/:id/report
5. Set up BullMQ job queue for async context assembly

### PHASE 2 — Core Services (build each as a separate file in /backend/src/services/)

SERVICE 1 — ingestion.ts
- Accepts raw alert text
- Extracts: serviceName, errorType, severity (P0-P3), startedAt
- Returns normalized Incident object
- Use zod for validation

SERVICE 2 — logAnalyzer.ts  
- Accepts: array of log lines (from uploaded file for MVP)
- Deduplicates repeated lines (group identical messages, count occurrences)
- Scores each unique line 0-1 based on:
  * +0.4 if log level is ERROR or FATAL
  * +0.3 if log level is WARN
  * +0.2 if line contains the service name from the incident
  * +0.1 if timestamp is within 5 minutes of incident start
- Returns top 60 highest-scoring lines with their scores
- Detects first occurrence timestamp of the dominant error

SERVICE 3 — deployFetcher.ts
- Accepts: serviceName, incidentStartTime, githubToken
- Calls GitHub API: GET /repos/{owner}/{repo}/commits?since={4 hours ago}
- Returns: array of {sha, message, author, timestamp, filesChanged}
- Flags the commit closest in time before the incident as "suspect"

SERVICE 4 — contextAssembler.ts
- Calls logAnalyzer + deployFetcher in parallel (Promise.all)
- Compresses results into a context object under 8000 tokens
- Compression rules:
  * Repeated errors → "Error X occurred 4,821 times between 02:13-02:47 AM"
  * Keep full text only for top 20 anomalous log lines
  * Metrics → narrative string: "CPU: 42% baseline → 94% peak at incident time"
- Returns: IncidentContext object ready for LLM

SERVICE 5 — llmReasoning.ts
- Uses @anthropic-ai/sdk
- Model: claude-sonnet-4-6
- Implements this EXACT prompt structure:

  SYSTEM: You are a senior Site Reliability Engineer with 10+ years of 
  incident investigation experience. Analyze the provided incident data and 
  return ONLY a valid JSON object. Never hallucinate. Every claim must cite 
  a specific log line by its index number. If data is insufficient, say so 
  in the confidence reasoning.

  USER: 
  INCIDENT DATA:
  {contextObject}
  
  Return this exact JSON schema:
  {
    "timeline": [{"time": "HH:MM", "event": "description"}],
    "rootCause": {
      "summary": "one sentence",
      "technical": "detailed technical explanation",
      "evidence": ["log line index 12: exact quote", "log line index 34: exact quote"]
    },
    "blastRadius": {
      "servicesAffected": ["service1", "service2"],
      "estimatedUsersAffected": "number or percentage",
      "duration": "X minutes"
    },
    "contributingFactors": ["factor1", "factor2"],
    "suspectDeploy": {
      "sha": "commit hash or null",
      "message": "commit message or null",
      "confidence": "high/medium/low"
    },
    "actionItems": [
      {"title": "", "description": "", "severity": "P0/P1/P2", "suggestedOwner": ""}
    ],
    "confidenceScore": 0-100,
    "confidenceReasoning": "why this score"
  }

- Validate JSON before returning (try/catch + zod schema)
- If validation fails, retry once with "Your previous response was not valid JSON. Try again."

SERVICE 6 — reportGenerator.ts
- Takes the validated LLM JSON output
- Saves to RCAReport table in PostgreSQL
- Saves ActionItems to ActionItem table
- Returns the full report object

### PHASE 3 — Frontend

1. Initialize Next.js 14 in /frontend with TypeScript + Tailwind + shadcn/ui
2. Install: @tanstack/react-query, recharts, axios, react-dropzone, jspdf

3. Build these pages:

PAGE 1 — / (Home / Alert Input)
- Large centered text input: "Describe what broke..."
- Below it: file upload zone for log files (react-dropzone)
- Service name field, severity selector (P0/P1/P2/P3)
- "Investigate" button → calls POST /api/incidents
- On submit: navigate to /investigate/[id]

PAGE 2 — /investigate/[id]
- Shows animated loading states while polling:
  "🔍 Parsing logs..." → "📊 Analyzing metrics..." → "🚀 Checking deploys..." → "🤖 Reasoning..."
- Poll GET /api/incidents/:id/report every 2 seconds
- When report ready: render RCAReport component

PAGE 3 — /dashboard
- Table of past incidents with: service, severity, status, MTTR, confidence score
- Click row → navigate to report

4. Build RCAReport component with these sections:
   - Header: incident name, severity badge, confidence score ring (Recharts RadialBar)
   - Timeline: vertical timeline component (custom CSS)
   - Root Cause: highlighted box with evidence citations
   - Blast Radius: service impact cards
   - Action Items: checklist with severity badges
   - Export buttons: "Copy Markdown" | "Download PDF" | "Post to Slack"

### PHASE 4 — Wire It Together
1. Create .env with: DATABASE_URL, ANTHROPIC_API_KEY, GITHUB_TOKEN, REDIS_URL
2. Add file upload endpoint: POST /api/upload-logs (multer, parse line by line)
3. Connect BullMQ: when incident created → enqueue contextAssembly job → job runs all services → saves report → frontend polling picks it up
4. Add CORS for frontend → backend communication

## CODING RULES YOU MUST FOLLOW:
- TypeScript everywhere, strict mode on
- Every service function must have a JSDoc comment explaining inputs/outputs
- All API calls wrapped in try/catch with meaningful error messages
- Never commit API keys — always use process.env
- Use zod for ALL external data validation (LLM output, API responses, user input)
- Keep each service file under 200 lines — split if larger

## START NOW:
Begin with PHASE 1. Create the folder structure, initialize the Node.js project, 
install dependencies, and create the Prisma schema. Show me each file as you 
create it. After each phase, ask me to confirm before proceeding to the next.
