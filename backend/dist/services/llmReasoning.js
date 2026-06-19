"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRCA = generateRCA;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const SYSTEM_PROMPT = `You are a senior Site Reliability Engineer with 10+ years 
of incident investigation experience. Analyze incident data and return ONLY valid 
JSON. Never hallucinate. Cite evidence using log line indices like [42].
Every claim must reference actual data provided.`;
async function generateRCA(context) {
    const groq = new groq_sdk_1.default({ apiKey: process.env.GROQ_API_KEY });
    const userPrompt = `
INCIDENT: ${context.incident.serviceName} - ${context.incident.errorType}
SEVERITY: ${context.incident.severity}
STARTED: ${context.incident.startedAt}
RAW ALERT: ${context.incident.rawAlertText}

LOG SUMMARY:
- Total lines: ${context.logSummary.totalLines}
- Errors: ${context.logSummary.errorCount}, Warnings: ${context.logSummary.warnCount}
- First error at: ${context.logSummary.firstErrorAt ?? "unknown"}
- Repeated patterns: ${JSON.stringify(context.logSummary.patterns.slice(0, 5))}

TOP ANOMALOUS LOG LINES:
${context.logSummary.topAnomalousLines.join("\n")}

RECENT DEPLOYS:
${context.deploys.length > 0
        ? JSON.stringify(context.deploys.slice(0, 5), null, 2)
        : "No deploy data available"}

SUSPECT DEPLOY: ${context.suspectDeploy ? JSON.stringify(context.suspectDeploy) : "None identified"}

Return ONLY this JSON:
{
  "timeline": [{"time": "HH:MM", "event": "what happened"}],
  "rootCause": {
    "summary": "one sentence plain English",
    "technical": "detailed technical explanation",
    "evidence": ["[log_index] description"]
  },
  "blastRadius": {
    "servicesAffected": ["service names"],
    "estimatedUsersAffected": "number or percentage",
    "duration": "X minutes"
  },
  "contributingFactors": ["factor1", "factor2"],
  "suspectDeploy": {
    "sha": "hash or null",
    "message": "message or null",
    "confidence": "high/medium/low"
  },
  "actionItems": [
    {
      "title": "short title",
      "description": "what to do",
      "severity": "P0/P1/P2",
      "suggestedOwner": "team name"
    }
  ],
  "confidenceScore": 0-100,
  "confidenceReasoning": "why this confidence level"
}`;
    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
    });
    const raw = response.choices[0].message.content ?? "{}";
    try {
        return JSON.parse(raw);
    }
    catch {
        throw new Error("LLM returned invalid JSON. Raw: " + raw.slice(0, 200));
    }
}
